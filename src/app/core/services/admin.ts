import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JuegosService } from './juegos';

// Panel de administración (/api/admin/...). La API exige un token de Firebase de un correo administrador.

export interface ResultadoRawg {
  slug: string;
  titulo: string;
  imagen: string | null;
  lanzamiento: string | null;
  plataformas: string[];
  juegoId: string | null; // si ya está en Nexos
}

export interface FilaAdmin {
  id: string;
  titulo: string;
  imagen: string | null;
  tipo: string | null;
  lanzamiento: number | null;
  actualizado_en: string;
  con_precio: boolean;
  medios: number;
}

export interface MedioAdmin { tipo: 'image' | 'video'; src: string; thumb: string | null; }

export interface JuegoAdmin {
  id: string;
  titulo: string;
  descripcion: string | null;
  descripcion_larga: string | null;
  imagen: string | null;
  tipo: string | null;
  genero: string | null;
  lanzamiento: number | null;
  plataformas: string | null;
  creador: string | null;
  steam_app_id: string | null;
  cheapshark_id: string | null;
  gog_slug: string | null;
  rawg_slug: string | null;
  ratings: { label: string; valor: number }[];
  galeria: MedioAdmin[];
  pros: string[];
  contras: string[];
}

export interface UsoAlmacenamiento {
  juegos: number;
  neon: { bytes: number; limite: number };
  r2: { bytes: number; archivos: number; limite: number } | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private juegosSvc = inject(JuegosService);
  private api = `${environment.apiUrl}/admin`;

  async esAdmin(): Promise<boolean> {
    try {
      return (await firstValueFrom(this.http.get<{ admin: boolean }>(`${this.api}/yo`))).admin;
    } catch {
      return false;
    }
  }

  buscarRawg(q: string) {
    return firstValueFrom(this.http.get<ResultadoRawg[]>(`${this.api}/rawg`, { params: { q } }));
  }

  async importar(slug: string) {
    const r = await firstValueFrom(this.http.post<{ id: string }>(`${this.api}/importar`, { slug }));
    this.juegosSvc.limpiarCache();
    return r;
  }

  listar() {
    return firstValueFrom(this.http.get<FilaAdmin[]>(`${this.api}/juegos`));
  }

  obtener(id: string) {
    return firstValueFrom(this.http.get<JuegoAdmin>(`${this.api}/juegos/${encodeURIComponent(id)}`));
  }

  async guardar(id: string, juego: JuegoAdmin) {
    const r = await firstValueFrom(this.http.put<{ id: string }>(`${this.api}/juegos/${encodeURIComponent(id)}`, juego));
    this.juegosSvc.limpiarCache();
    return r;
  }

  async borrar(id: string) {
    await firstValueFrom(this.http.delete(`${this.api}/juegos/${encodeURIComponent(id)}`));
    this.juegosSvc.limpiarCache();
  }

  uso() {
    return firstValueFrom(this.http.get<UsoAlmacenamiento>(`${this.api}/uso`));
  }

  actualizarRecientes() {
    return firstValueFrom(this.http.post<{ guardados: number }>(`${this.api}/recientes`, {}));
  }

  /** Sube un archivo a R2 (URL firmada por la API) y devuelve su URL pública */
  async subirArchivo(archivo: File): Promise<string> {
    const { subirA, url } = await firstValueFrom(
      this.http.post<{ subirA: string; url: string }>(`${this.api}/subir`, { nombre: archivo.name, tipo: archivo.type }),
    );
    const r = await fetch(subirA, { method: 'PUT', headers: { 'Content-Type': archivo.type }, body: archivo });
    if (!r.ok) throw new Error(`R2 respondió ${r.status}`);
    return url;
  }
}
