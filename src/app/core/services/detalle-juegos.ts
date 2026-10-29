import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { rutaLocal } from '../../shared/utils/rutas';

export interface Rating { label: string; valor: number; }
/** Una tienda con su precio ya formateado ("125.800 COP"), como la muestran Inicio y Comparar */
export interface Tienda { nombre: string; precio: string; url: string; }
export interface MediaItem { tipo: 'video' | 'image'; src: string; thumb: string; }

export interface DetalleJuego {
  id: string;
  titulo: string;
  genero: string;
  lanzamiento: number;
  plataformas: string;
  descripcionLarga: string;
  imagen: string;
  Creador: string;
  tipo: string;
  ratings: Rating[];
  galeria: MediaItem[];
  pros: string[];
  contras: string[];
}

// Precios de PC en vivo (CheapShark vía /api/precios)
export interface OfertaPc {
  tienda: string;
  popular: boolean;
  masBarata: boolean;
  /** 'CO': lo que cobra la tienda en Colombia (Steam, GOG) · 'US': precio de EE. UU. (CheapShark) */
  region: 'CO' | 'US';
  /** El precio en pesos sale de la tienda (Steam); si no, se convirtió con la tasa del día */
  exacto: boolean;
  precioCop: number | null;
  retailCop: number | null;
  precioUsd: number | null;
  retailUsd: number | null;
  descuento: number;
  url: string;
}
export interface PreciosJuego {
  juego: string;
  enVivo: boolean;
  pc: OfertaPc[];
  minimoHistorico: { usd: number; cop: number | null; fecha: string } | null;
  actualizado: string | null;
  desactualizado: boolean;
  tasa: { cop: number; actualizado: string } | null;
}
export interface PrecioDeHoy { juego: string; masBarato: OfertaPc | null; actualizado: string | null; }

// Plataformas y tiendas (RAWG vía /api/plataformas, sin precios)
export interface PlataformasJuego {
  juego: string;
  rawg: string | null;
  plataformas: string[];
  tiendas: { tienda: string; plataforma: string | null; url: string }[];
}

// El detalle de cada juego viene de la base de datos (GET /api/games/:id), con caché por id.
@Injectable({ providedIn: 'root' })
export class DetalleJuegosService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private cache = new Map<string, Promise<DetalleJuego | undefined>>();

  getPorId(id: string): Promise<DetalleJuego | undefined> {
    if (!this.cache.has(id)) {
      const detalle$ = this.http.get<DetalleJuego>(`${this.api}/games/${encodeURIComponent(id)}`).pipe(
        map((j) => ({
          ...j,
          imagen: rutaLocal(j.imagen),
          galeria: (j.galeria ?? []).map((m) => ({ ...m, src: rutaLocal(m.src), thumb: rutaLocal(m.thumb) })),
        }))
      );
      const req = firstValueFrom(detalle$).catch(
        (error: HttpErrorResponse) => {
          this.cache.delete(id);
          // 404: el juego no existe → undefined (la página muestra su estado vacío)
          if (error.status === 404) return undefined;
          throw error;
        }
      );
      this.cache.set(id, req);
    }
    return this.cache.get(id)!;
  }

  // Precios y plataformas se piden aparte del detalle para que la página no espere a CheapShark o RAWG
  private cachePrecios = new Map<string, Promise<PreciosJuego>>();
  private cachePlataformas = new Map<string, Promise<PlataformasJuego>>();
  private cacheHoy: Promise<PrecioDeHoy[]> | null = null;

  getPrecios(id: string): Promise<PreciosJuego> {
    return this.pedirConCache(this.cachePrecios, id, `${this.api}/precios?juego=${encodeURIComponent(id)}`);
  }

  getPlataformas(id: string): Promise<PlataformasJuego> {
    return this.pedirConCache(this.cachePlataformas, id, `${this.api}/plataformas?juego=${encodeURIComponent(id)}`);
  }

  // El más barato de hoy de cada juego con precio en vivo
  getPreciosDeHoy(): Promise<PrecioDeHoy[]> {
    if (!this.cacheHoy) {
      this.cacheHoy = firstValueFrom(this.http.get<PrecioDeHoy[]>(`${this.api}/precios`)).catch((e) => {
        this.cacheHoy = null;
        throw e;
      });
    }
    return this.cacheHoy;
  }

  /** El más barato de hoy de un juego, con la misma forma que una tienda manual ("125.800 COP"); null si no tiene precio en vivo */
  static tiendaDeHoy(hoy: PrecioDeHoy[], id: string): Tienda | null {
    const o = hoy.find((p) => p.juego === id)?.masBarato;
    if (!o || o.precioCop == null) return null;
    return { nombre: o.tienda, precio: `${o.precioCop.toLocaleString('es-CO')} COP`, url: o.url };
  }

  private pedirConCache<T>(cache: Map<string, Promise<T>>, id: string, url: string): Promise<T> {
    if (!cache.has(id)) {
      cache.set(id, firstValueFrom(this.http.get<T>(url)).catch((e) => {
        cache.delete(id); // si falla, se reintenta la próxima vez
        throw e;
      }));
    }
    return cache.get(id)!;
  }

  getClaseTienda(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('steam')) return 'tienda-steam';
    if (n.includes('xbox') || n.includes('microsoft')) return 'tienda-xbox';
    if (n.includes('playstation') || n.includes('ps')) return 'tienda-ps';
    if (n.includes('epic')) return 'tienda-epic';
    if (n.includes('gog')) return 'tienda-gog';
    if (n.includes('eneba') || n.includes('instant') || n.includes('key')) return 'tienda-key';
    if (n.includes('battle')) return 'tienda-battle';
    return 'tienda-otro';
  }
}
