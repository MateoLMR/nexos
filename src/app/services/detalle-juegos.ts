import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { rutaLocal } from '../shared/rutas';

export interface Rating { label: string; valor: number; }
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
  tiendas: Tienda[];
  galeria: MediaItem[];
  pros: string[];
  contras: string[];
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
