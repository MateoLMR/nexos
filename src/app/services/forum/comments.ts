import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PostComment {
  id: string;
  text: string;
  createdAt: string;
  postId: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
}

//Servicio de comentarios: habla con la API (que guarda en Neon)
@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  //Crear comentario en un post (el autor sale del token)
  createComment(postId: string, text: string) {
    return firstValueFrom(this.http.post<PostComment>(`${this.api}/posts/${postId}/comments`, { text }));
  }

  //Obtener los comentarios de un post, en orden de llegada
  getComments(postId: string) {
    return firstValueFrom(this.http.get<PostComment[]>(`${this.api}/posts/${postId}/comments`));
  }
}
