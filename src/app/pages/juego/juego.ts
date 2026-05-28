/** ts de juego, se encarga de cargar la info del juego segun el id de la url,
manejar la galeria, animacion de barras y el parallax del fondo. La info del juego
 se obtiene de detalle-juegos.ts y la lista de juegos relacionados de juegos.ts */
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
  ElementRef,
  ViewChild,
  HostListener,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DetalleJuegosService, DetalleJuego, MediaItem } from '../../services/detalle-juegos';
import { JuegosService } from '../../services/juegos';

@Component({
  selector: 'app-juego',
  imports: [CommonModule, RouterLink],
  templateUrl: './juego.html',
  styleUrl: './juego.css',
})
/* El componente Juego es la página de detalle de cada juego. Carga la información del juego según el ID en la URL, maneja la galería de imágenes/videos,
 la animación de las barras de rating y el efecto parallax en el fondo.*/
export class Juego implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroBg') heroBg!: ElementRef<HTMLDivElement>;

  // juego es el detalle completo del juego actual, cargado desde DetalleJuegosService según el ID de la URL.
  juego: DetalleJuego | undefined;
  juegoId = '';

  mediaActual = signal<MediaItem | null>(null);
  indexActual = signal(0);

  modalSrc = signal('');
  modalAbierto = signal(false);

  relacionados: { id: string; titulo: string; imagen: string }[] = [];

  // Animación de barras
  /* ratingWidths guarda el ancho ACTUAL de cada barra (arranca en 0, se anima al valor real).
   El índice coincide con juego.ratings[i]. */
  ratingWidths: number[] = [];

  private scrollHandler!: () => void;
  private animTimeout: any;

  /** El constructor inyecta los servicios necesarios: ActivatedRoute para leer el ID del juego desde la URL,
   DetalleJuegosService para obtener la información detallada del juego, */
  constructor(
    private route: ActivatedRoute,
    private detalleSvc: DetalleJuegosService,
    private juegosSvc: JuegosService,
    private cdr: ChangeDetectorRef
  ) {}

  // Al iniciar el componente, se suscribe a los cambios en los parámetros de la ruta para cargar el juego correspondiente.
  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.juegoId = params.get('id') || '';
      this.juego = this.detalleSvc.getPorId(this.juegoId);
      this.indexActual.set(0);
      this.relacionados = [];

      // Resetear barras a 0 para que la animación se dispare de nuevo
      this.ratingWidths = this.juego?.ratings?.map(() => 0) ?? [];

      if (this.juego?.galeria?.length) {
        this.mediaActual.set(this.juego.galeria[0]);
      }

      // Cargar juegos relacionados: mismos tipo pero diferente ID, máximo 4.
      if (this.juego) {
        const todos = this.juegosSvc.getJuegos();
        this.relacionados = todos
          .filter((j) => j.tipo === this.juego!.tipo && j.id !== this.juegoId)
          .slice(0, 4)
          .map((j) => ({ id: j.id, titulo: j.titulo, imagen: j.imagen }));
      }

      this.cdr.detectChanges();

      // Disparar animación: esperar un frame para que el DOM pinte width=0,
      // luego asignar el valor real el transition lo anima.
      clearTimeout(this.animTimeout);
      this.animTimeout = setTimeout(() => {
        this.ratingWidths = this.juego?.ratings?.map((r) => r.valor) ?? [];
        this.cdr.detectChanges();
      }, 80); // 80ms es suficiente para que el navegador pinte el estado inicial
    });
  }

  // Después de que la vista se ha inicializado, se configura el efecto parallax en el fondo del hero.
  ngAfterViewInit(): void {
    this.iniciarParallax();
  }

// Al destruir el componente, se limpia el event listener del scroll y cualquier timeout pendiente para evitar fugas de memoria.
  ngOnDestroy(): void {
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
    }
    clearTimeout(this.animTimeout);
  }

  // El método iniciarParallax configura un event listener para el scroll que ajusta la posición de fondo del hero para crear un efecto parallax.
  private iniciarParallax(): void {
    this.scrollHandler = () => {
      if (this.heroBg?.nativeElement) {
        const scrollY = window.scrollY;
        this.heroBg.nativeElement.style.backgroundPosition = `center calc(30% + ${scrollY * 0.4}px)`;
      }
    };
    window.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  // El getter heroBgStyle devuelve el estilo de fondo para el hero, utilizando la imagen del juego si está disponible.
  get heroBgStyle(): string {
    return this.juego ? `url('${this.juego.imagen}')` : '';
  }

  // Para poder pasar Las imagenes del juego
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName)) return;
    if (e.key === 'ArrowLeft') this.navegarGaleria(-1);
    if (e.key === 'ArrowRight') this.navegarGaleria(1);
    if (e.key === 'Escape') this.cerrarModal();
  }

  // navegar entre la galeria del juego
  navegarGaleria(dir: number): void {
    if (!this.juego?.galeria?.length) return;
    const size = this.juego.galeria.length;
    const nuevo = (this.indexActual() + dir + size) % size;
    this.indexActual.set(nuevo);
    this.mediaActual.set(this.juego.galeria[nuevo]);
  }

  // para poder ver los videos de la galeria
  seleccionarMedia(index: number): void {
    if (!this.juego?.galeria) return;
    this.indexActual.set(index);
    this.mediaActual.set(this.juego.galeria[index]);
  }

  // cuenta el numero de imagenes y videos que tenga el juego
  get contadorMedia(): string {
    const total = this.juego?.galeria?.length ?? 0;
    return `${this.indexActual() + 1} / ${total}`;
  }

  /** Abre el modal de ampliación de imagen.
   * Recibe la URL de la imagen/video a mostrar, actualiza el signal modalSrc,
   * establece modalAbierto en true y oculta el scroll del body para evitar interacciones fuera del modal. */
  abrirModal(src: string): void {
    this.modalSrc.set(src);
    this.modalAbierto.set(true);
    document.body.style.overflow = 'hidden';
  }

  /** Cierra el modal de ampliación de imagen/video.
   * Establece modalAbierto en false y restaura el scroll del body para permitir interacciones normales en la página. */
  cerrarModal(): void {
    this.modalAbierto.set(false);
    document.body.style.overflow = '';
  }

  /** Retorna el gradiente de color para la barra de rating según su valor.
   * @param valor - El valor del rating (0-100)
   * @returns Un string con el gradiente CSS: morado para valores >= 50, naranja para valores menores. */

  getRatingColor(valor: number): string {
    if (valor >= 80) return 'linear-gradient(to right, #d946ef, #a855f7)';
    if (valor >= 50) return 'linear-gradient(to right, #d946ef, #a855f7)';
    return 'linear-gradient(to right, #f59e0b, #fb923c)';
  }

  /** Función trackBy para optimizar la detección de cambios en los bucles *ngFor.
   * Mejora el rendimiento al utilizar el índice como identificador único del elemento.
   * @param index - El índice del elemento en el array
   * @returns El índice sin cambios */

  trackByIndex(index: number): number {
    return index;
  }

  /** Retorna las clases CSS dinámicas de Tailwind para los botones de tienda según el nombre de la plataforma.
   * Asigna estilos específicos de color y hover para cada tienda (Steam, Xbox, PlayStation, Epic, GOG, Battle.net, Eneba, etc).
   * @param nombre - El nombre de la tienda a identificar
   * @returns Un objeto con las clases CSS aplicables (clave-valor donde el valor es true) */

  getTiendaClases(nombre: string): Record<string, boolean> {
    const n = nombre.toLowerCase();
    if (n.includes('steam')) {
      return { 'bg-[#1b2838] border-[#1b2838] text-[#c7d5e0] hover:bg-[#2a475e]': true };
    }
    if (n.includes('xbox') || n.includes('microsoft')) {
      return { 'bg-[#107c10]/20 border-[#107c10]/50 text-green-300 hover:bg-[#107c10]/40': true };
    }
    if (n.includes('playstation') || n.includes('ps store')) {
      return { 'bg-[#003087]/20 border-[#003087]/50 text-blue-300 hover:bg-[#003087]/40': true };
    }
    if (n.includes('epic')) {
      return { 'bg-white/5 border-white/20 text-white hover:bg-white/10': true };
    }
    if (n.includes('gog')) {
      return { 'bg-[#86328a]/20 border-[#86328a]/50 text-purple-300 hover:bg-[#86328a]/40': true };
    }
    if (n.includes('battle')) {
      return { 'bg-[#009ae4]/20 border-[#009ae4]/50 text-sky-300 hover:bg-[#009ae4]/40': true };
    }
    if (n.includes('eneba') || n.includes('instant') || n.includes('key')) {
      return { 'bg-fuchsia-900/20 border-fuchsia-500/30 text-fuchsia-300 hover:bg-fuchsia-900/40': true };
    }
    return { 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10': true };
  }
}
