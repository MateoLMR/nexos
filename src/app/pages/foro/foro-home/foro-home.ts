import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth/auth';
import { ForumService } from '../../../services/forum/forum';
import { CommentsService } from '../../../services/forum/comments';
//Se importaron auth del firestore, servicios como; el auth, foro, comentarios

@Component({
  selector: 'app-foro-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './foro-home.html',
  styleUrl: './foro-home.css'
})

export class ForoHomeComponent implements OnInit, OnDestroy {

  //Aqui se guardaran los posts
  posts: any[] = [];

  //Aqui se guardaran los comentarios
  comments: { [postId: string]: any[] } = {};

  //Aqui se guardaran los nuevos comentarios
  newComments: any = {};

  //Aqui se guardan lo que se ponga en los comentarios
  commentInputs: { [postId: string]: string } = {};

  //Form de la publicacion osea como sera su estructura
  title: string = '';

  category: string = 'General';

  content: string = '';

  //Loadings (pa verificar un error de que no cargaba)
  loadingPost = false;

  loadingLogin = false;

  loadingLike: { [key: string]: boolean } = {};

  loadingComment: { [key: string]: boolean } = {};

  // conexion de la BD (solo los usuarios) and el ts
  auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private authUnsubscribe!: () => void;

  user: User | null = null;

  //Conexion para unir el ts con los servicios
  constructor(
    private authService: AuthService,
    private forumService: ForumService,
    private CommentsService: CommentsService
  ) {}

  //Funcion para iniciar apenas cargar
  ngOnInit() {
    //Detectar usuario logeado
    this.authUnsubscribe = onAuthStateChanged(this.auth, async (user) => {
      //Guarda el usuario actual (logeado)
      this.user = user;
      //carga las publicaciones
      await this.loadPosts();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    if (this.authUnsubscribe) {
      this.authUnsubscribe();
    }
  }

  //Funcion pa cargar los posts
  async loadPosts() {
    try {
      //Trae los post desde la firebase (usando como puente el servicio de foro)
      const rawPosts = await this.forumService.getPosts();
      console.log('🔥 POSTS:', rawPosts);

      //Obtiene los comentarios de estas
      const commentsResults = await Promise.all(
        rawPosts.map(post => this.CommentsService.getComments(post.id))
      );

      const newComments: { [postId: string]: any[] } = {};
      //Recorre todas las publicaciones
      rawPosts.forEach((post, i) => {
        //Guarda los comentarios del post
        newComments[post.id] = commentsResults[i];
      });

      this.posts = [...rawPosts];
      this.comments = { ...newComments };

      this.cdr.markForCheck();

    } catch (error) {
      console.error(error);
    }
  }

  //Funcion login
  async login() {
    //esto es para comprobar un error con el doble click y que no carga con un click
    if (this.loadingLogin) return;
    this.loadingLogin = true;
    this.cdr.markForCheck();

    try {
      //Login con google (con el servicio del auth)
      await this.authService.loginWithGoogle();
    } catch (error) {
      //Para comprobar errores que se hayan dado en la consola
      console.error(error);
    } finally {
      this.loadingLogin = false;
      this.cdr.markForCheck();
    }
  }

  //Funcion de cerrar sesion
  async logout() {
    //Cerrar sesion (cerrando "conexion" con la firebase)
    await this.authService.logout();
  }

  //Funcion de crear publicacion
  async createPost() {
    //Evita crear posts vacios
    if (!this.content.trim()) return;
    //Evita el error de doble click
    if (this.loadingPost) return;
    this.loadingPost = true;
    this.cdr.markForCheck();

    try {
      //Guarda la publicacion
      await this.forumService.createPost({
        title: this.title,
        category: this.category,
        content: this.content,
        userName: this.user?.displayName || 'Usuario',
        userPhoto: this.user?.photoURL || '',
        userId: this.user?.uid || '',
        likes: 0,
        likedBy: []
      });

      // limpiar formulario
      this.title = '';
      this.category = 'General';
      this.content = '';

      // recargar posts
      await this.loadPosts();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingPost = false;
      this.cdr.markForCheck();
    }
  }

  //Funcion like al post
  async likePost(postId: string) {
    //verifica usuario
    if (!this.user) return;
    //Evita el error de doble click
    if (this.loadingLike[postId]) return;

    this.loadingLike = { ...this.loadingLike, [postId]: true };
    this.cdr.markForCheck();

    try {
      //Guarda like (usando el service de forum (la funcion likePost))
      await this.forumService.likePost(postId, this.user.uid);

      // actualizar solo el post en pantalla
      this.posts = this.posts.map(p => {
        if (p.id !== postId) return p;
        const likedBy = Array.isArray(p.likedBy) ? p.likedBy : [];
        if (likedBy.includes(this.user!.uid)) return p;
        return {
          ...p,
          likes: (p.likes || 0) + 1,
          likedBy: [...likedBy, this.user!.uid]
        };
      });

      //forzar un refresh visual
      this.cdr.markForCheck();

    } catch (error) {
      console.error(error);
    } finally {
      this.loadingLike = { ...this.loadingLike, [postId]: false };
      this.cdr.markForCheck();
    }
  }

  //funcion añadir comentario
  async addComment(postId: string) {
    //Evita que hayan comentarios vacios
    if (!this.commentInputs[postId]?.trim()) return;
    //Evita doble click
    if (this.loadingComment[postId]) return;

    this.loadingComment = { ...this.loadingComment, [postId]: true };
    this.cdr.markForCheck();

    try {
      //Guarda comentario (con el servicio de comments)
      await this.CommentsService.createComment({
        postId: postId,
        text: this.commentInputs[postId],
        userName: this.user?.displayName || 'Usuario',
        userPhoto: this.user?.photoURL || '',
        userId: this.user?.uid || ''
      });

      // limpiar input (comentario)
      this.commentInputs = { ...this.commentInputs, [postId]: '' };

      // recargar comentarios
      const updatedComments = await this.CommentsService.getComments(postId);
      this.comments = { ...this.comments, [postId]: updatedComments };

      this.cdr.markForCheck();

    } catch (error) {
      console.error(error);
    } finally {
      this.loadingComment = { ...this.loadingComment, [postId]: false };
      this.cdr.markForCheck();
    }
  }

  hasLiked(post: any): boolean {
    if (!this.user) return false;
    return Array.isArray(post.likedBy) && post.likedBy.includes(this.user.uid);
  }

  trackByPostId(_: number, post: any): string {
    return post.id;
  }

  trackByCommentId(_: number, comment: any): string {
    return comment.id;
  }
}
