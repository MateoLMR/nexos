import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AuthService } from '../../../services/auth/auth';
import { ForumService, Post } from '../../../services/forum/forum';
import { CommentsService, PostComment } from '../../../services/forum/comments';
import { MotionService } from '../../../shared/motion';
import { Icono } from '../../../shared/icono';

// Categorías del foro (mismos valores que ya se guardan en la base)
export const CATEGORIAS = ['General', 'Opiniones', 'Competitivo', 'Esports', 'Ayuda', 'Recomendaciones'];

// El tablero de mensajes del café: publicar, dar like, comentar, filtrar y ordenar.
@Component({
  selector: 'app-foro-home',
  standalone: true,
  imports: [FormsModule, RouterLink, Icono],
  templateUrl: './foro-home.html',
  styleUrl: './foro-home.css'
})
export class ForoHomeComponent implements OnInit, OnDestroy {
  readonly categorias = CATEGORIAS;

  posts: Post[] = [];
  comments: { [postId: string]: PostComment[] } = {};
  commentInputs: { [postId: string]: string } = {};

  // Formulario de publicación
  title = '';
  category = 'General';
  content = '';

  // Vista del tablero
  filtro: string = 'todas';
  orden: 'recientes' | 'queridas' = 'recientes';
  abiertos = new Set<string>();
  cargado = false;
  errorCarga = false;
  errorPublicar = '';

  loadingPost = false;
  loadingLogin = false;
  loadingLike: { [key: string]: boolean } = {};
  loadingComment: { [key: string]: boolean } = {};

  auth = inject(Auth);
  private cdr = inject(ChangeDetectorRef);
  private motion = inject(MotionService);
  private authService = inject(AuthService);
  private forumService = inject(ForumService);
  private commentsService = inject(CommentsService);
  private authUnsubscribe?: () => void;
  private primeraCarga = true;

  user: User | null = null;

  ngOnInit() {
    this.authUnsubscribe = onAuthStateChanged(this.auth, async (user) => {
      this.user = user;
      await this.loadPosts();
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy() {
    this.authUnsubscribe?.();
  }

  // ---------- datos ----------
  async loadPosts() {
    try {
      const rawPosts = await this.forumService.getPosts();
      const commentsResults = await Promise.all(rawPosts.map((post) => this.commentsService.getComments(post.id)));
      const newComments: { [postId: string]: PostComment[] } = {};
      rawPosts.forEach((post, i) => (newComments[post.id] = commentsResults[i]));
      this.posts = [...rawPosts];
      this.comments = { ...newComments };
      this.errorCarga = false;
    } catch (error) {
      console.error(error);
      this.errorCarga = true;
    }
    this.cargado = true;
    this.cdr.detectChanges();
    if (this.primeraCarga) {
      this.primeraCarga = false;
      this.motion.entrar(document.querySelectorAll('.publicacion'), { y: 24, stagger: 0.06 });
    }
  }

  get visibles(): Post[] {
    const lista = this.filtro === 'todas' ? this.posts : this.posts.filter((p) => p.category === this.filtro);
    if (this.orden === 'queridas') return [...lista].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return lista;
  }

  contarCategoria(c: string) {
    return this.posts.filter((p) => p.category === c).length;
  }

  get totalComentarios() {
    return Object.values(this.comments).reduce((s, l) => s + l.length, 0);
  }

  // ---------- sesión ----------
  async login() {
    if (this.loadingLogin) return;
    this.loadingLogin = true;
    this.cdr.markForCheck();
    try {
      await this.authService.loginWithGoogle();
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingLogin = false;
      this.cdr.markForCheck();
    }
  }

  async logout() {
    await this.authService.logout();
  }

  // ---------- publicar ----------
  async createPost() {
    if (!this.content.trim()) {
      this.errorPublicar = 'Escribe algo antes de publicar.';
      return;
    }
    if (this.loadingPost) return;
    this.errorPublicar = '';
    this.loadingPost = true;
    this.cdr.markForCheck();
    try {
      const nuevo = await this.forumService.createPost({ title: this.title, category: this.category, content: this.content });
      this.title = '';
      this.category = 'General';
      this.content = '';
      // La publicación nueva se pega arriba del tablero sin recargar todo
      this.posts = [{ ...nuevo, likedBy: nuevo.likedBy ?? [] }, ...this.posts];
      this.comments = { ...this.comments, [nuevo.id]: [] };
      this.filtro = 'todas';
      this.orden = 'recientes';
      this.cdr.detectChanges();
      this.pegarEnTablero(nuevo.id);
    } catch (error) {
      console.error(error);
      this.errorPublicar = 'No se pudo publicar. Revisa tu conexión e intenta de nuevo.';
    } finally {
      this.loadingPost = false;
      this.cdr.markForCheck();
    }
  }

  // La publicación cae al tablero, se inclina y se asienta
  private pegarEnTablero(id: string) {
    const el = document.querySelector(`[data-post="${id}"]`);
    if (!el || this.motion.reducido()) return;
    this.motion.gsap.fromTo(el,
      { y: -60, rotate: -4, opacity: 0, scale: 1.04 },
      { y: 0, rotate: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(1.7)', clearProps: 'transform' });
  }

  // ---------- like ----------
  async likePost(postId: string, boton?: HTMLElement) {
    if (!this.user || this.loadingLike[postId]) return;
    this.loadingLike = { ...this.loadingLike, [postId]: true };
    const uid = this.user.uid;
    const post = this.posts.find((p) => p.id === postId);
    const yaDioLike = post ? this.hasLiked(post) : false;
    if (boton && !this.motion.reducido() && !yaDioLike) {
      this.motion.gsap.fromTo(boton.querySelector('app-icono'), { scale: 0.6 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    }
    try {
      const { likes } = yaDioLike ? await this.forumService.unlikePost(postId) : await this.forumService.likePost(postId);
      this.posts = this.posts.map((p) => {
        if (p.id !== postId) return p;
        const likedBy: string[] = Array.isArray(p.likedBy) ? p.likedBy : [];
        return { ...p, likes, likedBy: yaDioLike ? likedBy.filter((id) => id !== uid) : [...likedBy, uid] };
      });
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingLike = { ...this.loadingLike, [postId]: false };
      this.cdr.markForCheck();
    }
  }

  hasLiked(post: Post): boolean {
    return !!this.user && Array.isArray(post.likedBy) && post.likedBy.includes(this.user.uid);
  }

  // ---------- comentarios ----------
  alternarComentarios(postId: string) {
    if (this.abiertos.has(postId)) this.abiertos.delete(postId);
    else this.abiertos.add(postId);
    this.abiertos = new Set(this.abiertos);
    this.cdr.detectChanges();
    const lista = document.querySelector(`[data-comentarios="${postId}"]`);
    if (lista && this.abiertos.has(postId)) this.motion.entrar(lista.querySelectorAll('.comentario, form'), { y: 10, stagger: 0.04 });
  }

  async addComment(postId: string) {
    const texto = this.commentInputs[postId]?.trim();
    if (!texto || this.loadingComment[postId]) return;
    this.loadingComment = { ...this.loadingComment, [postId]: true };
    this.cdr.markForCheck();
    try {
      const nuevo = await this.commentsService.createComment(postId, texto);
      this.commentInputs = { ...this.commentInputs, [postId]: '' };
      this.comments = { ...this.comments, [postId]: [...(this.comments[postId] ?? []), nuevo] };
      this.cdr.detectChanges();
      const ultimo = document.querySelector(`[data-comentarios="${postId}"] .comentario:last-of-type`);
      if (ultimo) this.motion.entrar([ultimo], { x: -20 });
    } catch (error) {
      console.error(error);
    } finally {
      this.loadingComment = { ...this.loadingComment, [postId]: false };
      this.cdr.markForCheck();
    }
  }

  // ---------- utilidades de presentación ----------
  inicial(nombre?: string) {
    return (nombre ?? '?').trim().charAt(0).toUpperCase();
  }

  hace(fecha: string | undefined): string {
    if (!fecha) return '';
    const s = Math.max(0, (Date.now() - new Date(fecha).getTime()) / 1000);
    if (s < 60) return 'hace un momento';
    const m = Math.floor(s / 60);
    if (m < 60) return `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return d === 1 ? 'ayer' : `hace ${d} días`;
    return new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  esReciente(fecha: string | undefined) {
    return !!fecha && Date.now() - new Date(fecha).getTime() < 60 * 60 * 1000;
  }

  claseCategoria(c: string) {
        if (c === 'Ayuda') return 'ficha-ambar';
    return 'ficha-nexos';
  }
}
