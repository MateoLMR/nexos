import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Post {
  id: string;
  title: string;
  category: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
}

//Servicio del foro: habla con la API (que guarda en Neon). El autor sale del token, no se envía.
@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  //Obtener publicaciones (más recientes primero)
  getPosts() {
    return firstValueFrom(this.http.get<Post[]>(`${this.api}/posts`));
  }

  //Crear publicación
  createPost(post: { title: string; category: string; content: string }) {
    return firstValueFrom(this.http.post<Post>(`${this.api}/posts`, post));
  }

  //Dar like (el servidor evita likes duplicados) → devuelve el total de likes
  likePost(postId: string) {
    return firstValueFrom(this.http.post<{ likes: number }>(`${this.api}/posts/${postId}/like`, {}));
  }

  //Quitar like → devuelve el total de likes
  unlikePost(postId: string) {
    return firstValueFrom(this.http.delete<{ likes: number }>(`${this.api}/posts/${postId}/like`));
  }
}
