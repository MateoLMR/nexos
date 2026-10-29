import { AfterViewInit, ChangeDetectorRef, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of, catchError, map } from 'rxjs';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { JuegosService, Juego } from '../../services/juegos';
import { DetalleJuegosService } from '../../services/detalle-juegos';
import { ForumService, Post } from '../../services/forum/forum';
import { PandaScoreService } from '../../services/pandascore';
import { MotionService } from '../../shared/motion';
import { Icono } from '../../shared/icono';
import { AficheDirective } from '../../shared/afiche.directive';
import { ContadorDirective } from '../../shared/contador.directive';

gsap.registerPlugin(TextPlugin);

// Datos de los creadores (credenciales del final)
const CREATORS = [
  { name: 'Andres Parra', role: 'Experto en eSports', avatar: 'Avatars/Parra.png', color: '#FFB020', accent: '#FFB020', badge: 'eSports' },
  { name: 'Mateo Leal', role: 'Creador de Nexos', avatar: 'Avatars/Mateo.jpg', color: '#6D3BD2', accent: '#9A76F0', badge: 'Founder' },
  { name: 'Nicolas Foglea', role: 'Bases de datos', avatar: 'Avatars/Paloma.jpeg', color: '#3DDC84', accent: '#3DDC84', badge: 'Backend' },
];

// Juegos cuyo mejor precio se muestra en el tablero de la pared
const JUEGOS_TABLERO = ['xc2', 'mnl', 'ck3', 'ag4'];

interface FilaPrecio { id: string; titulo: string; tienda: string; precio: string; }
interface Partido { liga: string; a: string; b: string; enVivo: boolean; hora: string; juego: string; }

// Torneos grandes del año (contenido existente); el estado se calcula con la fecha de hoy
const TORNEOS = [
  { titulo: 'Valorant Champions', lugar: 'Shanghái', fechas: '24 sep – 18 oct 2026', desde: '2026-09-24', hasta: '2026-10-18', imagen: 'Imagenes/valocup.png', url: 'https://valorantesports.com/es-MX/news/first-look-at-valorant-champions-tour-2026-' },
  { titulo: 'LoL Worlds 2026', lugar: 'Estados Unidos', fechas: 'Octubre – noviembre 2026', desde: '2026-10-01', hasta: '2026-11-30', imagen: 'Imagenes/lolworldcup.png', url: 'https://lolesports.com/es-MX/' },
  { titulo: 'CS2 · IEM Cologne', lugar: 'Alemania', fechas: '2 – 21 jun 2026', desde: '2026-06-02', hasta: '2026-06-21', imagen: 'Imagenes/cs2cup.png', url: 'https://esportsworldcup.com/en/competitions/2026/cs2' },
  { titulo: 'Dota 2 · World Cup', lugar: 'Riad', fechas: '7 – 18 jul 2026', desde: '2026-07-07', hasta: '2026-07-18', imagen: 'Imagenes/dota2cup.png', url: 'https://esportsworldcup.com/en/competitions/2026/dota2' },
];

// Juegos recién llegados (contenido existente de "recomendados de la semana")
const RECIEN_LLEGADOS = [
  { titulo: 'Grime II', fecha: '31 mar 2026', imagen: 'Imagenes/grime2.png', texto: 'Acción y aventura metroidvania con una atmósfera surrealista: explora un mundo alienígena oscuro, enfréntate a criaturas grotescas y descubre sus secretos.' },
  { titulo: 'Hozy', fecha: '30 mar 2026', imagen: 'Imagenes/hozy.png', texto: 'Simulador "cozy" para restaurar un vecindario olvidado habitación por habitación: limpiar, pintar y amueblar, sin temporizadores ni presiones.' },
  { titulo: 'Monster Hunter Stories 3: Twisted Reflection', fecha: '12 mar 2026', imagen: 'Imagenes/monsterhunter.png', texto: 'La tercera entrega del RPG spin-off: eres un "Monster Rider" que forma vínculos con los monstruos en lugar de cazarlos.' },
];

const LOGOS = [
  ['Overwatch', 'Overwatch.png'], ['Warcraft', 'Warcraft.png'], ["Assassin's Creed", 'Assasin.png'],
  ['League of Legends', 'lol.png'], ['GTA', 'Gta.png'], ['Rainbow Six', 'Rainbow.png'],
  ['Call of Duty', 'Carlitosduty.png'], ['ARK', 'ark.png'], ['CS:GO', 'CSGO.png'],
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icono, AficheDirective, ContadorDirective],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('raiz') raiz!: ElementRef<HTMLElement>;
  @ViewChild('escritura') escritura!: ElementRef<HTMLElement>;

  private juegosSvc = inject(JuegosService);
  private detalleSvc = inject(DetalleJuegosService);
  private foroSvc = inject(ForumService);
  private panda = inject(PandaScoreService);
  private motion = inject(MotionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly torneos = TORNEOS.map((t) => ({ ...t, estado: this.estadoTorneo(t.desde, t.hasta) }));
  readonly recienLlegados = RECIEN_LLEGADOS;
  readonly logos = LOGOS;

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

  async ngOnInit() {
    this.juegosSvc.getJuegos().then((j) => this.juegos.set(j)).catch(() => this.juegos.set([]));
    this.cargarPrecios();
    this.cargarPartido();
    this.cargarDudas();
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
    this.iniciarEscritura();
    this.iniciarScroll();
    this.iniciarLanyards();
  }

  ngOnDestroy() {
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
      const [detalles, hoy] = await Promise.all([
        Promise.all(JUEGOS_TABLERO.map((id) => this.detalleSvc.getPorId(id))),
        this.detalleSvc.getPreciosDeHoy().catch(() => []),
      ]);
      const filas: FilaPrecio[] = [];
      detalles.forEach((d, i) => {
        if (!d) return;
        // precio de hoy (CheapShark); si no hay, el mejor de referencia en pesos o la primera tienda
        const enPesos = (d.tiendas ?? [])
          .filter((t) => /COP/i.test(t.precio))
          .sort((a, b) => this.aNumero(a.precio) - this.aNumero(b.precio));
        const t = DetalleJuegosService.tiendaDeHoy(hoy, JUEGOS_TABLERO[i]) ?? enPesos[0] ?? d.tiendas?.[0];
        if (!t) return;
        filas.push({ id: JUEGOS_TABLERO[i], titulo: d.titulo, tienda: t.nombre, precio: t.precio });
      });
      this.precios.set(filas);
    } catch {
      this.precios.set([]);
    }
  }

  private cargarPartido() {
    const nombres: Record<string, string> = { valorant: 'Valorant', cs2: 'CS2', lol: 'League of Legends', dota2: 'Dota 2' };
    const pedir = (obs: ReturnType<PandaScoreService['getValorantMatches']>, juego: string) =>
      obs.pipe(map((ms) => (ms ?? []).map((m: any) => ({ m, juego }))), catchError(() => of([])));
    forkJoin([
      pedir(this.panda.getValorantMatches(), nombres['valorant']),
      pedir(this.panda.getCS2Matches(), nombres['cs2']),
      pedir(this.panda.getLolMatches(), nombres['lol']),
      pedir(this.panda.getDota2Matches(), nombres['dota2']),
    ]).subscribe((listas) => {
      const todos = listas.flat().filter(({ m }) => m?.opponents?.length === 2);
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

  private aNumero(precio: string) {
    const m = precio.match(/[\d.,]+/);
    return m ? Number(m[0].replace(/\./g, '').replace(',', '.')) : Infinity;
  }

  private estadoTorneo(desde: string, hasta: string): 'En curso' | 'Próximo' | 'Terminado' {
    const hoy = new Date();
    if (hoy < new Date(desde)) return 'Próximo';
    if (hoy > new Date(`${hasta}T23:59:59`)) return 'Terminado';
    return 'En curso';
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
    // Cada sección entra distinto: los recién llegados se deslizan, los torneos caen como afiches, los creadores aparecen
    r.querySelectorAll('.llegado').forEach((el, i) =>
      this.motion.alScroll(el, { x: i % 2 ? 60 : -60, opacity: 0, duration: 1 })
    );
    r.querySelectorAll('.torneo').forEach((el, i) =>
      this.motion.alScroll(el, { y: -50, rotate: i % 2 ? 6 : -6, opacity: 0, ease: 'back.out(1.4)', duration: 0.9 })
    );
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
