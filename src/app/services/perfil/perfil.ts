import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Profile {
  uid: string;
  name: string;
  email?: string; // solo viene en el perfil propio (POST /users/me)
  photo: string | null;
  bio: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // Crea el perfil del usuario logueado si no existe (o actualiza nombre y foto) y lo devuelve.
  // Los datos salen del token de Firebase, por eso no se envía nada en el cuerpo.
  createProfile() {
    return firstValueFrom(this.http.post<Profile>(`${this.api}/users/me`, {}));
  }

  // Perfil público de cualquier usuario (sin email). undefined si no existe.
  async getProfile(uid: string): Promise<Profile | undefined> {
    try {
      return await firstValueFrom(this.http.get<Profile>(`${this.api}/users/${encodeURIComponent(uid)}`));
    } catch (error) {
      if (error instanceof HttpErrorResponse && error.status === 404) return undefined;
      throw error;
    }
  }
}
