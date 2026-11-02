import { AfterViewInit, ChangeDetectorRef, Component, computed, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { catchError, filter, of, Subscription, switchMap, timer } from 'rxjs';
import type { gsap } from 'gsap';
import { AuthService } from '../../core/services/auth';
import { PandaScoreService } from '../../core/services/pandascore';
import { MotionService } from '../../shared/utils/motion';
import { Icono } from '../../shared/ui/icono';

// Inactividad: como en el café, si te paras del cubículo un buen rato, el tendero libera el puesto.
const INACTIVIDAD_MS = 30 * 60_000; // 30 minutos sin tocar nada cierran la sesión
const AVISO_MS = 60_000; // el último minuto se avisa con una cuenta regresiva
const CLAVE_ACTIVIDAD = 'nexos-actividad'; // compartida entre pestañas: actividad en una mantiene viva la sesión en todas

// El mostrador del café: letrero, navegación y el cubículo de sesión con su temporizador.
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Icono],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements AfterViewInit, OnDestroy {
  @ViewChild('letrero') letrero!: ElementRef<HTMLElement>;
  @ViewChild('cartel') cartel!: ElementRef<HTMLElement>;
  @ViewChild('riel') riel!: ElementRef<HTMLElement>;
  @ViewChild('lampara') lampara!: ElementRef<HTMLElement>;

  private auth = inject(Auth);
  private authService = inject(AuthService);
  private motion = inject(MotionService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private panda = inject(PandaScoreService);

  readonly enlaces = [
    { ruta: '/', texto: 'Inicio', exacto: true },
    { ruta: '/juegos', texto: 'Juegos', exacto: false },
    { ruta: '/comparar', texto: 'Comparar', exacto: false },
    { ruta: '/esports', texto: 'eSports', exacto: false },
    { ruta: '/foro', texto: 'Foro', exacto: false },
  ];

  usuario = signal<User | null>(null);
  tiempo = signal('00:00:00');
  menuAbierto = signal(false);
  entrando = signal(false);
  bajo = signal(false);
  // Segundos que quedan antes de cerrar la sesión por inactividad (null: sin aviso)
  avisoInactividad = signal<number | null>(null);
  // Mensaje tras cerrarla, para que no sea un misterio
  sesionCerrada = signal(false);

  // Cartel del local: "abierto" de día y de noche, "abierto 24 h" de madrugada y "hay partido" con uno en vivo
  hayPartido = signal(false);
  private hora = signal(new Date().getHours());
  textoCartel = computed(() => (this.hayPartido() ? 'hay partido' : this.hora() < 6 ? 'abierto 24 h' : 'abierto'));

  private reloj?: ReturnType<typeof setInterval>;
  private quitarAuth?: () => void;
  private observador?: ResizeObserver;
  private quitarScroll?: () => void;
  private subCartel?: Subscription;

  constructor() {
    // Cada 2 minutos: la hora y si hay algún partido en vivo (comparte la caché con el inicio y la cartelera)
    this.subCartel = timer(0, 120_000).pipe(
      switchMap(() => this.panda.partidos().pipe(catchError(() => of(null)))),
    ).subscribe((r) => {
      this.hora.set(new Date().getHours());
      if (r) this.hayPartido.set(Object.values(r.partidos).some((lista) => lista.some((m: any) => m.status === 'running')));
    });
    this.quitarAuth = onAuthStateChanged(this.auth, (u) => {
      this.usuario.set(u);
      if (u) {
        // Si la pestaña estuvo cerrada más tiempo que el límite, la sesión guardada ya venció
        if (Date.now() - this.ultimaActividad() > INACTIVIDAD_MS) { this.cerrarPorInactividad(); return; }
        this.iniciarReloj();
        this.vigilarActividad();
      } else {
        this.detenerReloj();
        this.dejarDeVigilar();
        // Sin sesión no hay actividad que recordar: el próximo inicio de sesión cuenta desde cero
        try { localStorage.removeItem(CLAVE_ACTIVIDAD); } catch { /* sin storage */ }
      }
      this.cdr.markForCheck();
    });
    // Cierra el menú del celular al cambiar de página
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menuAbierto.set(false));
  }

  // El cartel se balancea como un péndulo que se va calmando; mientras se mueve no se reinicia
  private balanceo?: gsap.core.Timeline;
  balancearCartel() {
    if (this.motion.reducido() || this.balanceo?.isActive()) return;
    const g = this.motion.gsap;
    const cartel = this.cartel.nativeElement;
    const bandas = cartel.querySelectorAll('.cartel-bandas i');
    this.balanceo = g.timeline()
      .to(cartel, { rotation: 10, duration: 0.22, ease: 'sine.out' })
      .to(cartel, { rotation: -8, duration: 0.24, ease: 'sine.inOut' })
      .to(cartel, { rotation: 4, duration: 0.2, ease: 'sine.inOut' })
      .to(cartel, { rotation: -2, duration: 0.18, ease: 'sine.inOut' })
      .to(cartel, { rotation: -4, duration: 0.16, ease: 'sine.out' })
      .fromTo(bandas, { skewX: 0 }, {
        keyframes: [{ skewX: -18, duration: 0.25 }, { skewX: 10, duration: 0.3 }, { skewX: 0, duration: 0.3 }],
        ease: 'sine.inOut', stagger: 0.08,
      }, 0);
  }

  tocarCartel() {
    this.balancearCartel();
    if (this.hayPartido()) this.router.navigate(['/esports']);
  }

  // routerLinkActive avisa cuando cambia el enlace activo; se mide en el siguiente cuadro, ya con la clase puesta
  private lamparaPendiente = false;
  alCambiarActivo() {
    if (this.lamparaPendiente) return;
    this.lamparaPendiente = true;
    requestAnimationFrame(() => {
      this.lamparaPendiente = false;
      this.moverLampara();
    });
  }

  ngAfterViewInit() {
    this.motion.encenderLetrero(this.letrero.nativeElement);
    this.motion.encenderLetrero(this.cartel.nativeElement, 'cartel');

    // La lámpara se recoloca si cambia el ancho o cuando terminan de cargar las fuentes
    if (typeof ResizeObserver !== 'undefined') {
      this.observador = new ResizeObserver(() => this.moverLampara(false));
      this.observador.observe(this.riel.nativeElement);
    }
    document.fonts?.ready.then(() => this.moverLampara(false));
    requestAnimationFrame(() => this.moverLampara(false));

    // Al bajar, el header deja ver un desvanecido en vez de una línea
    let pendiente = false;
    const alBajar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        pendiente = false;
        const bajo = window.scrollY > 8;
        if (bajo !== this.bajo()) this.bajo.set(bajo);
      });
    };
    window.addEventListener('scroll', alBajar, { passive: true });
    this.quitarScroll = () => window.removeEventListener('scroll', alBajar);
    alBajar();
  }

  ngOnDestroy() {
    this.subCartel?.unsubscribe();
    this.detenerReloj();
    this.dejarDeVigilar();
    clearTimeout(this.avisoCerrada);
    this.quitarAuth?.();
    this.observador?.disconnect();
    this.quitarScroll?.();
  }

  // Lleva la lámpara sobre el enlace de la página actual; sin enlace activo (p. ej. el perfil) se apaga
  private moverLampara(animar = true) {
    const lampara = this.lampara?.nativeElement;
    const riel = this.riel?.nativeElement;
    if (!lampara || !riel) return;
    const activo = riel.querySelector<HTMLElement>('a.activo');
    if (!activo || !activo.offsetWidth) {
      lampara.classList.add('apagada');
      return;
    }
    const estabaApagada = lampara.classList.contains('apagada');
    // Si estaba apagada o no hay que animar, aparece directo en su sitio
    lampara.classList.toggle('sin-transicion', !animar || estabaApagada);
    lampara.style.width = `${activo.offsetWidth}px`;
    // .riel es el ancestro posicionado, así que offsetLeft ya es relativo a él
    lampara.style.transform = `translateX(${activo.offsetLeft}px)`;
    void lampara.offsetWidth; // fija la posición antes de reactivar la transición
    lampara.classList.remove('sin-transicion', 'apagada');
  }

  async sentarse() {
    if (this.entrando()) return;
    this.entrando.set(true);
    this.sesionCerrada.set(false);
    try { localStorage.removeItem(CLAVE_ACTIVIDAD); } catch { /* sin storage */ }
    try {
      await this.authService.loginWithGoogle();
      // Al entrar, el local se enciende: la sala parpadea y los puestos que se ven se prenden uno a uno
      if (this.auth.currentUser) {
        const visibles = Array.from(document.querySelectorAll('.lampara, .cubiculo-sesion, .afiche, a.cubiculo, .juego-card'))
          .filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; })
          .slice(0, 8);
        this.motion.encenderLocal(visibles, true);
        dispatchEvent(new Event('nexos:sesion')); // el tendero celebra que te sentaste
      }
    } catch {
      // el error ya se registra en AuthService; el botón vuelve a estar disponible
    } finally {
      this.entrando.set(false);
    }
  }

  async levantarse() {
    this.dejarDeVigilar();
    try { localStorage.removeItem(CLAVE_ACTIVIDAD); } catch { /* sin storage */ }
    await this.authService.logout();
    try { sessionStorage.removeItem('nexos-sesion-inicio'); } catch { /* sin storage */ }
  }

  // ---------- inactividad ----------
  private quitarActividad?: () => void;
  private ultimaEscritura = 0;
  private avisoCerrada?: ReturnType<typeof setTimeout>;

  /** Última actividad registrada en cualquier pestaña; sin registro (sesión recién abierta) cuenta como ahora */
  private ultimaActividad(): number {
    try {
      const v = Number(localStorage.getItem(CLAVE_ACTIVIDAD));
      if (v) return v;
    } catch { /* sin storage: solo cuenta esta pestaña */ }
    return this.ultimaEscritura || Date.now();
  }

  /** Anota que estás ahí (como mucho cada 10 s, para no escribir en cada movimiento del mouse) */
  private registrarActividad = () => {
    const ahora = Date.now();
    if (this.avisoInactividad() !== null) this.avisoInactividad.set(null);
    if (ahora - this.ultimaEscritura < 10_000) return;
    this.ultimaEscritura = ahora;
    try { localStorage.setItem(CLAVE_ACTIVIDAD, String(ahora)); } catch { /* sin storage */ }
  };

  private vigilarActividad() {
    if (this.quitarActividad) return;
    this.ultimaEscritura = 0;
    this.registrarActividad();
    const eventos = ['pointerdown', 'pointermove', 'keydown', 'scroll', 'wheel', 'touchstart'];
    eventos.forEach((e) => addEventListener(e, this.registrarActividad, { passive: true }));
    this.quitarActividad = () => eventos.forEach((e) => removeEventListener(e, this.registrarActividad));
  }

  private dejarDeVigilar() {
    this.quitarActividad?.();
    this.quitarActividad = undefined;
    this.avisoInactividad.set(null);
  }

  /** Se llama cada segundo junto al reloj del cubículo */
  private revisarInactividad() {
    if (!this.quitarActividad) return;
    const resta = INACTIVIDAD_MS - (Date.now() - this.ultimaActividad());
    if (resta <= 0) { this.cerrarPorInactividad(); return; }
    this.avisoInactividad.set(resta <= AVISO_MS ? Math.ceil(resta / 1000) : null);
  }

  /** Botón "Sigo aquí" del aviso */
  seguirAqui() {
    this.ultimaEscritura = 0;
    this.registrarActividad();
  }

  private async cerrarPorInactividad() {
    await this.levantarse();
    this.sesionCerrada.set(true);
    clearTimeout(this.avisoCerrada);
    this.avisoCerrada = setTimeout(() => this.sesionCerrada.set(false), 8000);
  }

  alternarMenu() {
    this.menuAbierto.update((v) => !v);
  }

  // Temporizador de sesión, como cuando pagabas la hora en el café
  private iniciarReloj() {
    let inicio = Date.now();
    try {
      const guardado = Number(sessionStorage.getItem('nexos-sesion-inicio'));
      if (guardado) inicio = guardado;
      else sessionStorage.setItem('nexos-sesion-inicio', String(inicio));
    } catch { /* sin storage: cuenta desde ahora */ }

    const pintar = () => {
      const s = Math.floor((Date.now() - inicio) / 1000);
      const hh = String(Math.floor(s / 3600)).padStart(2, '0');
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      this.tiempo.set(`${hh}:${mm}:${ss}`);
      this.revisarInactividad();
    };
    pintar();
    this.detenerReloj();
    this.reloj = setInterval(pintar, 1000);
  }

  private detenerReloj() {
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = undefined;
  }
}
