import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth/auth';
import { MotionService } from '../../shared/motion';
import { Icono } from '../../shared/icono';

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

  private reloj?: ReturnType<typeof setInterval>;
  private quitarAuth?: () => void;
  private observador?: ResizeObserver;
  private quitarScroll?: () => void;

  constructor() {
    this.quitarAuth = onAuthStateChanged(this.auth, (u) => {
      this.usuario.set(u);
      if (u) this.iniciarReloj();
      else this.detenerReloj();
      this.cdr.markForCheck();
    });
    // Cierra el menú del celular al cambiar de página
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => this.menuAbierto.set(false));
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
    this.detenerReloj();
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
    try {
      await this.authService.loginWithGoogle();
    } catch {
      // el error ya se registra en AuthService; el botón vuelve a estar disponible
    } finally {
      this.entrando.set(false);
    }
  }

  async levantarse() {
    await this.authService.logout();
    try { sessionStorage.removeItem('nexos-sesion-inicio'); } catch { /* sin storage */ }
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
