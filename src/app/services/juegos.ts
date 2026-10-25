import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs';
import { environment } from '../../environments/environment';
import { rutaLocal } from '../shared/rutas';

export interface Juego {
  id: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  tipo: string;
}

// Los juegos vienen de la base de datos (GET /api/games). Se piden una sola vez y se guardan en caché.
@Injectable({ providedIn: 'root' })
export class JuegosService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;
  private cache: Promise<Juego[]> | null = null;

  getJuegos(): Promise<Juego[]> {
    if (!this.cache) {
      const juegos$ = this.http
        .get<Juego[]>(`${this.api}/games`)
        .pipe(map((lista) => lista.map((j) => ({ ...j, imagen: rutaLocal(j.imagen) }))));
      this.cache = firstValueFrom(juegos$).catch((error) => {
        // Si falla, se borra la caché para reintentar la próxima vez
        this.cache = null;
        throw error;
      });
    }
    return this.cache;
  }

  async getJuegoPorId(id: string): Promise<Juego | undefined> {
    const juegos = await this.getJuegos();
    return juegos.find((j) => j.id === id);
  }

  getJuegoDestacado(): Promise<Juego | undefined> {
    return this.getJuegoPorId('ag4');
  }

  // Filtra en el navegador sobre la lista ya cargada (evita una petición por cada tecla en la búsqueda)
  static filtrar(juegos: Juego[], tipo: string, busqueda: string): Juego[] {
    const term = busqueda.toLowerCase().trim();
    return juegos.filter((j) => {
      const pasaTipo = tipo === 'todos' || j.tipo === tipo;
      const pasaBusqueda = !term || j.titulo.toLowerCase().includes(term);
      return pasaTipo && pasaBusqueda;
    });
  }

  async filtrar(tipo: string, busqueda: string): Promise<Juego[]> {
    return JuegosService.filtrar(await this.getJuegos(), tipo, busqueda);
  }
}
