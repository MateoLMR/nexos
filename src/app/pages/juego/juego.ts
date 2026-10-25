/** Página de detalle de cada juego: carga el juego según el id de la URL, su galería, valoración,
 tablero de precios por tienda y juegos relacionados. */
import {
  Component, OnInit, AfterViewInit, OnDestroy, signal, ElementRef, ViewChild, HostListener, ChangeDetectorRef, inject,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { DetalleJuegosService, DetalleJuego, MediaItem, Tienda } from '../../services/detalle-juegos';
import { JuegosService } from '../../services/juegos';
import { MotionService } from '../../shared/motion';
import { Icono } from '../../shared/icono';
import { ContadorDirective } from '../../shared/contador.directive';
import { AficheDirective } from '../../shared/afiche.directive';

@Component({
  selector: 'app-juego',
  imports: [RouterLink, Icono, ContadorDirective, AficheDirective],
  templateUrl: './juego.html',
  styleUrl: './juego.css',
})
export class Juego implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('hero') hero?: ElementRef<HTMLElement>;
  @ViewChild('cerrarLightbox') cerrarLightbox?: ElementRef<HTMLButtonElement>;

  private route = inject(ActivatedRoute);
  private detalleSvc = inject(DetalleJuegosService);
  private juegosSvc = inject(JuegosService);
  private motion = inject(MotionService);
  private cdr = inject(ChangeDetectorRef);

  juego: DetalleJuego | undefined;
  juegoId = '';
  cargando = true;

  mediaActual = signal<MediaItem | null>(null);
  indexActual = signal(0);
  modalSrc = signal('');
  modalAbierto = signal(false);

  relacionados: { id: string; titulo: string; imagen: string; tipo: string }[] = [];
  tiendasOrdenadas: (Tienda & { masBarata: boolean })[] = [];

  private sub?: Subscription;
  private tweens: gsap.core.Tween[] = [];

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe(async (params) => {
      const id = params.get('id') || '';
      this.juegoId = id;
      this.cargando = true;
      this.juego = undefined;
      this.relacionados = [];
      this.cdr.detectChanges();

      let todos: { id: string; titulo: string; imagen: string; tipo: string }[] = [];
      try {
        const [detalle, lista] = await Promise.all([this.detalleSvc.getPorId(id), this.juegosSvc.getJuegos()]);
        if (id !== this.juegoId) return; // se cambió de juego mientras cargaba
        this.juego = detalle;
        todos = lista;
      } catch (error) {
        console.error(error);
        if (id !== this.juegoId) return;
      }
      this.cargando = false;
      this.indexActual.set(0);
      this.mediaActual.set(this.juego?.galeria?.[0] ?? null);
      this.tiendasOrdenadas = this.ordenarTiendas(this.juego?.tiendas ?? []);
      if (this.juego) {
        this.relacionados = todos.filter((j) => j.tipo === this.juego!.tipo && j.id !== this.juegoId).slice(0, 4);
      }
      this.cdr.detectChanges();
      this.animarContenido();
    });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.tweens.forEach((t) => t.kill());
    this.motion.limpiarScroll();
    document.body.style.overflow = '';
  }

  // ---------- animación ----------
  private animarContenido() {
    const g = this.motion.gsap;
    this.tweens.forEach((t) => t.kill());
    this.tweens = [];
    this.motion.limpiarScroll();
    if (!this.juego) return;

    // Medidores: se llenan desde 0
    const barras = document.querySelectorAll<HTMLElement>('.medidor-relleno');
    if (this.motion.reducido()) {
      barras.forEach((b) => (b.style.transform = `scaleX(${Number(b.dataset['valor']) / 100})`));
    } else {
      barras.forEach((b, i) => {
        this.tweens.push(g.fromTo(b, { scaleX: 0 }, {
          scaleX: Number(b.dataset['valor']) / 100, duration: 1.2, ease: 'expo.out', delay: 0.15 + i * 0.08,
          scrollTrigger: { trigger: b, start: 'top 92%', once: true },
        }));
      });

      // Parallax por capas: el arte baja más lento que el título
      const heroEl = this.hero?.nativeElement;
      if (heroEl) {
        this.tweens.push(g.to(heroEl.querySelector('.hero-arte'), {
          yPercent: 18, scale: 1.08, ease: 'none',
          scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
        }));
        this.tweens.push(g.to(heroEl.querySelector('.hero-texto'), {
          yPercent: -30, opacity: 0.2, ease: 'none',
          scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
        }));
        g.from(heroEl.querySelectorAll('.hero-texto > *'), { y: 30, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08, delay: 0.15 });
      }
      // El tablero de precios entra fila por fila
      this.motion.entrar(document.querySelectorAll('.fila-tienda'), { x: 24, stagger: 0.07, delay: 0.3 });
      document.querySelectorAll('.bloque').forEach((el) => this.motion.alScroll(el, { y: 40, opacity: 0 }));
    }
    requestAnimationFrame(() => this.motion.refrescarScroll());
  }

  // ---------- tiendas ----------
  private ordenarTiendas(tiendas: Tienda[]) {
    const num = (p: string) => {
      const m = p.match(/[\d.,]+/)?.[0] ?? '';
      return /^\d{1,3}(\.\d{3})+$/.test(m) ? Number(m.replace(/\./g, '')) : Number(m.replace(',', '.'));
    };
    const enPesos = tiendas.filter((t) => /COP/i.test(t.precio));
    const minimo = enPesos.length ? Math.min(...enPesos.map((t) => num(t.precio))) : null;
    return [...tiendas]
      .sort((a, b) => {
        const ap = /COP/i.test(a.precio), bp = /COP/i.test(b.precio);
        if (ap !== bp) return ap ? -1 : 1; // primero los precios en pesos
        return num(a.precio) - num(b.precio);
      })
      .map((t) => ({ ...t, masBarata: minimo !== null && /COP/i.test(t.precio) && num(t.precio) === minimo }));
  }

  claseTienda(nombre: string): string {
    return this.detalleSvc.getClaseTienda(nombre);
  }

  // ---------- galería ----------
  @HostListener('window:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName)) return;
    if (e.key === 'Escape' && this.modalAbierto()) { this.cerrarModal(); return; }
    if (e.key === 'ArrowLeft') this.navegarGaleria(-1);
    if (e.key === 'ArrowRight') this.navegarGaleria(1);
  }

  navegarGaleria(dir: number): void {
    const galeria = this.juego?.galeria;
    if (!galeria?.length) return;
    const nuevo = (this.indexActual() + dir + galeria.length) % galeria.length;
    this.seleccionarMedia(nuevo);
  }

  seleccionarMedia(index: number): void {
    if (!this.juego?.galeria) return;
    this.indexActual.set(index);
    this.mediaActual.set(this.juego.galeria[index]);
    if (!this.motion.reducido()) {
      requestAnimationFrame(() => {
        const media = document.querySelector('.media-principal > img, .media-principal > video');
        if (media) this.motion.gsap.fromTo(media, { opacity: 0, scale: 1.03 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' });
      });
    }
  }

  get contadorMedia(): string {
    return `${this.indexActual() + 1} / ${this.juego?.galeria?.length ?? 0}`;
  }

  abrirModal(src: string): void {
    this.modalSrc.set(src);
    this.modalAbierto.set(true);
    document.body.style.overflow = 'hidden';
    setTimeout(() => this.cerrarLightbox?.nativeElement.focus());
  }

  cerrarModal(): void {
    this.modalAbierto.set(false);
    document.body.style.overflow = '';
  }
}
