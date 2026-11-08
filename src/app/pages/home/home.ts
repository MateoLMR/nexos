import { AfterViewInit, ChangeDetectorRef, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { of, catchError, Subscription, switchMap, timer } from 'rxjs';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { JuegosService, Juego, RecienLlegado, enlaceLlegado, fuenteLlegado } from '../../core/services/juegos';
import { DetalleJuegosService } from '../../core/services/detalle-juegos';
import { PaisService } from '../../core/services/pais';
import { ForumService, Post } from '../../core/services/forum';
import { ClaveEsport, PandaScoreService } from '../../core/services/pandascore';
import { MotionService } from '../../shared/utils/motion';
import { Icono } from '../../shared/ui/icono';
import { AficheDirective } from '../../shared/directives/afiche.directive';
import { ContadorDirective } from '../../shared/directives/contador.directive';

gsap.registerPlugin(TextPlugin);

// Datos de los creadores (credenciales del final)
const CREATORS = [
  { name: 'Andres Parra', role: 'Experto en eSports', avatar: 'Avatars/Parra.png', color: '#FFB020', accent: '#FFB020', badge: 'eSports' },
  { name: 'Mateo Leal', role: 'Creador de Nexos', avatar: 'Avatars/Mateo.jpg', color: '#6D3BD2', accent: '#9A76F0', badge: 'Founder' },
  { name: 'Nicolas Foglea', role: 'Bases de datos', avatar: 'Avatars/Paloma.jpeg', color: '#3DDC84', accent: '#3DDC84', badge: 'Backend' },
];

// Cuántos juegos muestra el tablero "Precios de hoy" (los de mayor descuento)
const FILAS_TABLERO = 4;

interface FilaPrecio { id: string; titulo: string; tienda: string; precio: string; descuento: number; }
interface Partido { liga: string; a: string; b: string; enVivo: boolean; hora: string; juego: string; }

// Cartelera de torneos: los afiches son el arte de cada juego; los torneos llegan de PandaScore
const AFICHE_JUEGO: Record<ClaveEsport, { imagen: string; ruta: string }> = {
  valorant: { imagen: 'Imagenes/valocup.png', ruta: '/esports/valorant' },
  lol: { imagen: 'Imagenes/lolworldcup.png', ruta: '/esports/league' },
  cs2: { imagen: 'Imagenes/cs2cup.png', ruta: '/esports/counter' },
  dota2: { imagen: 'Imagenes/dota2cup.png', ruta: '/esports/dota' },
};
const AFICHES_TORNEO = 4;

interface AficheTorneo { id: string; titulo: string; juego: string; fechas: string; estado: string; imagen: string; logo: string | null; ruta: string; }

const LOGOS = [
  ['Overwatch', 'Overwatch.png'], ['Warcraft', 'Warcraft.png'], ["Assassin's Creed", 'Assasin.png'],
  ['League of Legends', 'lol.png'], ['GTA', 'Gta.png'], ['Rainbow Six', 'Rainbow.png'],
  ['Call of Duty', 'Carlitosduty.png'], ['ARK', 'ark.png'], ['CS:GO', 'CSGO.png'],
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgTemplateOutlet, Icono, AficheDirective, ContadorDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('raiz') raiz!: ElementRef<HTMLElement>;
  @ViewChild('escritura') escritura!: ElementRef<HTMLElement>;

  private juegosSvc = inject(JuegosService);
  private detalleSvc = inject(DetalleJuegosService);
  private paisSvc = inject(PaisService);
  private foroSvc = inject(ForumService);
  private panda = inject(PandaScoreService);
  private motion = inject(MotionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  torneos = signal<AficheTorneo[] | null>(null); // null = cargando
  readonly logos = LOGOS;
  // Página externa (RAWG o IGDB) de los recién llegados que aún no están en el local
  readonly enlaceLlegado = enlaceLlegado;
  readonly fuenteLlegado = fuenteLlegado;

  // Lanzamientos populares del último mes (RAWG, se renuevan cada día); null = cargando
  recienLlegados = signal<RecienLlegado[] | null>(null);

  // Buscador del mostrador
  juegos = signal<Juego[]>([]);
  consulta = signal('');
  abierto = signal(false);
  activo = signal(-1);
  resultados = computed(() => {
    const q = this.consulta().toLowerCase().trim();
    if (!q) return this.juegos().slice(0, 6);
    return this.juegos().filter((j) => j.titulo.toLowerCase().includes(q) || j.tipo.toLowerCase().includes(q)).slice(0, 6);
  });

  // Pared de afiches
  precios = signal<FilaPrecio[] | null>(null);
  partido = signal<Partido | null | undefined>(undefined); // undefined = cargando, null = sin datos
  dudas = signal<Post[] | null>(null);
  totalDudas = signal(0);

  private tlEscritura?: gsap.core.Timeline;
  private subPartido?: Subscription;

  async ngOnInit() {
    this.juegosSvc.getJuegos().then((j) => this.juegos.set(j)).catch(() => this.juegos.set([]));
    this.cargarPrecios();
    this.cargarPartido();
    this.cargarTorneos();
    this.cargarDudas();
    this.cargarRecienLlegados();
  }

  private cargarTorneos() {
    this.panda.torneos().subscribe({
      next: (lista) => {
        const fecha = (s: string) => new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
        const estados = { en_curso: 'En curso', proximo: 'Próximo', terminado: 'Terminado' };
        this.torneos.set(lista.slice(0, AFICHES_TORNEO).map((t) => ({
          id: t.id,
          titulo: t.titulo,
          juego: t.nombreJuego,
          fechas: t.hasta && t.hasta.slice(0, 10) !== t.desde.slice(0, 10) ? `${fecha(t.desde)} – ${fecha(t.hasta)}` : fecha(t.desde),
          estado: estados[t.estado],
          imagen: AFICHE_JUEGO[t.juego].imagen,
          logo: t.imagen,
          ruta: AFICHE_JUEGO[t.juego].ruta,
        })));
        // Los afiches llegan después del primer pintado: se animan cuando ya están en el DOM
        requestAnimationFrame(() => {
          this.raiz?.nativeElement.querySelectorAll('.torneo').forEach((el, i) =>
            this.motion.alScroll(el, { y: -50, rotate: i % 2 ? 6 : -6, opacity: 0, ease: 'back.out(1.4)', duration: 0.9 }));
          this.motion.refrescarScroll();
        });
      },
      error: () => this.torneos.set([]),
    });
  }

  private async cargarRecienLlegados() {
    try {
      this.recienLlegados.set((await this.juegosSvc.getRecienLlegados()).slice(0, 3));
    } catch {
      this.recienLlegados.set([]);
    }
    this.cdr.markForCheck();
    // Las tarjetas llegan después del primer pintado: se animan cuando ya están en el DOM
    requestAnimationFrame(() => {
      this.raiz?.nativeElement.querySelectorAll('.llegado').forEach((el, i) =>
        this.motion.alScroll(el, { x: i % 2 ? 60 : -60, opacity: 0, duration: 1 }));
      this.motion.refrescarScroll();
    });
  }

  fechaCorta(fecha: string | null): string {
    // La API manda "2026-10-15" o "2026-10-15T00:00:00.000Z": se toma solo el día, a mediodía, para no correrlo por la zona horaria
    return fecha ? new Date(`${fecha.slice(0, 10)}T12:00:00`).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  }

  ngAfterViewInit() {
    const r = this.raiz.nativeElement;
    // Entrada del mostrador: el titular y luego los afiches "se pegan" en la pared
    this.motion.entrar(r.querySelectorAll('[data-entra]'), { y: 24, stagger: 0.08 });
    if (!this.motion.reducido()) {
      gsap.from(r.querySelectorAll('.pared .afiche'), {
        opacity: 0, y: -40, rotate: (i: number) => (i % 2 ? 9 : -9), scale: 1.06,
        duration: 0.9, ease: 'back.out(1.6)', stagger: 0.14, delay: 0.35, clearProps: 'opacity,y,scale',
      });
    }
    // Primera visita de la sesión: la lámpara y los afiches de la pared se prenden uno a uno
    this.motion.encenderLocal([
      ...Array.from(document.querySelectorAll('.lampara')),
      ...Array.from(r.querySelectorAll('.pared .afiche')),
    ]);
    this.iniciarEscritura();
    this.iniciarScroll();
    this.iniciarLanyards();
  }

  ngOnDestroy() {
    this.subPartido?.unsubscribe();
    this.tlEscritura?.kill();
    this.motion.limpiarScroll();
  }

  // ---------- buscador ----------
  alEscribir(valor: string) {
    this.consulta.set(valor);
    this.abierto.set(true);
    this.activo.set(-1);
  }

  alTeclear(e: KeyboardEvent) {
    const total = this.resultados().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.abierto.set(true);
      this.activo.set(total ? (this.activo() + 1) % total : -1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.activo.set(total ? (this.activo() - 1 + total) % total : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const elegido = this.resultados()[this.activo() >= 0 ? this.activo() : 0];
      if (elegido) this.irAJuego(elegido.id);
      else this.router.navigate(['/foro']);
    } else if (e.key === 'Escape') {
      this.abierto.set(false);
    }
  }

  cerrarLuego() {
    // deja tiempo al clic sobre una opción antes de cerrar la lista
    setTimeout(() => this.abierto.set(false), 150);
  }

  irAJuego(id: string) {
    this.abierto.set(false);
    this.router.navigate(['/juego', id]);
  }

  // ---------- datos de la pared ----------
  private async cargarPrecios() {
    try {
      const [juegos, hoy] = await Promise.all([this.juegosSvc.getJuegos(), this.detalleSvc.getPreciosDeHoy(this.paisSvc.pais())]);
      // Los juegos con mayor descuento hoy (tienda popular más barata de cada uno)
      const filas = hoy
        .filter((p) => p.masBarato?.precio != null)
        .sort((a, b) => b.masBarato!.descuento - a.masBarato!.descuento)
        .slice(0, FILAS_TABLERO)
        .map((p) => {
          const t = DetalleJuegosService.tiendaDeHoy(hoy, p.juego)!;
          const titulo = juegos.find((j) => j.id === p.juego)?.titulo ?? p.juego;
          return { id: p.juego, titulo, tienda: t.nombre, precio: t.precio, descuento: p.masBarato!.descuento };
        });
      this.precios.set(filas);
    } catch {
      this.precios.set([]);
    }
  }

  private cargarPartido() {
    const nombres: Record<ClaveEsport, string> = { valorant: 'Valorant', cs2: 'CS2', lol: 'League of Legends', dota2: 'Dota 2' };
    // Al entrar y cada minuto; si falla se reintenta al siguiente minuto sin borrar lo que ya se ve
    this.subPartido = timer(0, 60_000).pipe(
      switchMap((n) => this.panda.partidos(n > 0).pipe(catchError(() => of(null)))),
    ).subscribe((r) => {
      if (!r) { if (this.partido() === undefined) this.partido.set(null); return; }
      const todos = (Object.keys(nombres) as ClaveEsport[])
        .flatMap((k) => (r.partidos[k] ?? []).map((m: any) => ({ m, juego: nombres[k] })))
        .filter(({ m }) => m?.opponents?.length === 2);
      const elegido = todos.find(({ m }) => m.status === 'running')
        ?? todos.sort((x, y) => new Date(x.m.begin_at).getTime() - new Date(y.m.begin_at).getTime())[0];
      if (!elegido) { this.partido.set(null); return; }
      const { m, juego } = elegido;
      this.partido.set({
        liga: m.league?.name ?? 'Torneo profesional',
        a: m.opponents[0].opponent?.acronym || m.opponents[0].opponent?.name,
        b: m.opponents[1].opponent?.acronym || m.opponents[1].opponent?.name,
        enVivo: m.status === 'running',
        hora: new Date(m.begin_at).toLocaleString('es-CO', { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
        juego,
      });
      this.cdr.markForCheck();
    });
  }

  private async cargarDudas() {
    try {
      const posts = await this.foroSvc.getPosts();
      this.totalDudas.set(posts.length);
      this.dudas.set(posts.slice(0, 3));
    } catch {
      this.dudas.set([]);
    }
  }

  // ---------- animaciones ----------
  private iniciarEscritura() {
    const el = this.escritura?.nativeElement;
    if (!el) return;
    const frases = ['resolver una duda.', 'encontrar una oferta.', 'comparar dos juegos.', 'ver un partido en vivo.', 'conversar en el foro.'];
    if (this.motion.reducido()) { el.textContent = frases[0]; return; }
    // Un contador de letras: escribe de izquierda a derecha y borra desde el final, letra por letra
    const pintar = (f: string, n: number) => { el.textContent = f.slice(0, Math.round(n)); };
    const escribiendo = (si: boolean) => () => { el.classList.toggle('escribiendo', si); };
    el.textContent = '';
    this.tlEscritura = gsap.timeline({ repeat: -1 });
    frases.forEach((f) => {
      const letras = { n: 0 };
      this.tlEscritura!
        .call(escribiendo(true))
        .to(letras, { n: f.length, duration: f.length * 0.055, ease: 'none', onUpdate: () => pintar(f, letras.n) })
        .call(escribiendo(false))
        .to({}, { duration: 1.8 })
        .call(escribiendo(true))
        .to(letras, { n: 0, duration: f.length * 0.028, ease: 'none', onUpdate: () => pintar(f, letras.n) })
        .call(escribiendo(false))
        .to({}, { duration: 0.35 });
    });
  }

  private iniciarScroll() {
    const r = this.raiz.nativeElement;
    // Los títulos se destapan al bajar. (Los recién llegados y los torneos se animan cuando llegan sus datos)
    const titulos = r.querySelectorAll('.titulo-seccion');
    titulos.forEach((el) => this.motion.alScroll(el, { y: 30, opacity: 0, clipPath: 'inset(0 0 100% 0)' }));
  }

  // Credenciales arrastrables del equipo (script en public/JS)
  private iniciarLanyards() {
    const canvasId = 'nexos-lanyard-canvas';
    if ((window as any).NexosLanyards) {
      new (window as any).NexosLanyards(canvasId, CREATORS);
      return;
    }
    const script = document.createElement('script');
    script.src = 'JS/Animacion_credencial.js';
    script.onload = () => (window as any).NexosLanyards && new (window as any).NexosLanyards(canvasId, CREATORS);
    document.body.appendChild(script);
  }
}
