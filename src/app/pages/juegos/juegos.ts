import { AfterViewInit, ChangeDetectorRef, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { JuegosService, Juego } from '../../services/juegos';
import { DetalleJuegosService, Tienda } from '../../services/detalle-juegos';
import { MotionService } from '../../shared/motion';
import { Icono } from '../../shared/icono';
import { AficheDirective } from '../../shared/afiche.directive';
import { ContadorDirective } from '../../shared/contador.directive';

// Paginación y juego destacado
const JUEGOS_POR_PAGINA = 6;
const JUEGO_DESTACADO_ID = 'ag4';

// Catálogo: estante de cubículos con búsqueda, filtro por género, vista de grilla o lista y "cargar más".
@Component({
  selector: 'app-juegos',
  imports: [RouterLink, Icono, AficheDirective, ContadorDirective],
  templateUrl: './juegos.html',
  styleUrl: './juegos.css',
})
export class Juegos implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('estante') estante?: ElementRef<HTMLElement>;

  private svc = inject(JuegosService);
  private detalleSvc = inject(DetalleJuegosService);
  private motion = inject(MotionService);
  private cdr = inject(ChangeDetectorRef);

  vistaActual = signal<'grid' | 'lista'>('grid');
  filtroActual = signal('todos');
  busqueda = signal('');

  // Lista completa que llega de la base de datos
  todos = signal<Juego[]>([]);
  cargado = false;
  errorCarga = false;
  cargando = false;

  juegoDestacado: Juego | undefined;
  mejorPrecio = signal<Tienda | null>(null);
  juegosVisibles: Juego[] = [];

  // Juego que se está abriendo: su portada "viaja" al detalle con View Transitions
  transicion = signal<string | null>(null);

  // Géneros disponibles, sacados de los datos (no fijos)
  generos = computed(() => Array.from(new Set(this.todos().map((j) => j.tipo))).sort());
  totalFiltrados = computed(() => this.filtrados().length);

  private filtrados(): Juego[] {
    return JuegosService.filtrar(this.todos(), this.filtroActual(), this.busqueda());
  }

  get hayMas(): boolean {
    return this.juegosVisibles.length < this.totalFiltrados();
  }

  async ngOnInit(): Promise<void> {
    try {
      this.todos.set(await this.svc.getJuegos());
    } catch (error) {
      console.error(error);
      this.errorCarga = true;
    }
    this.cargado = true;
    this.juegoDestacado = this.todos().find((j) => j.id === JUEGO_DESTACADO_ID);
    this.juegosVisibles = this.filtrados().slice(0, JUEGOS_POR_PAGINA);
    this.cdr.detectChanges();
    this.entrarTarjetas();
    this.cargarMejorPrecio();
  }

  ngAfterViewInit(): void {
    this.motion.entrar(document.querySelectorAll('[data-entra]'), { y: 20, stagger: 0.08 });
  }

  ngOnDestroy(): void {
    this.motion.limpiarScroll();
  }

  // ---------- filtros con Flip: las tarjetas se reacomodan en vez de aparecer de golpe ----------
  private reacomodar(cambio: () => void) {
    const scope = this.estante?.nativeElement;
    this.motion.flip('.juego-card, .lista-card', () => {
      cambio();
      this.juegosVisibles = this.filtrados().slice(0, Math.max(JUEGOS_POR_PAGINA, Math.min(this.juegosVisibles.length, this.totalFiltrados())));
      this.cdr.detectChanges();
    }, { scope });
  }

  onBusqueda(valor: string): void {
    this.reacomodar(() => this.busqueda.set(valor));
  }

  filtrar(tipo: string): void {
    this.reacomodar(() => this.filtroActual.set(tipo));
  }

  cambiarVista(vista: 'grid' | 'lista'): void {
    if (vista === this.vistaActual()) return;
    this.vistaActual.set(vista);
    this.cdr.detectChanges();
    this.entrarTarjetas();
  }

  cargarMas(): void {
    if (this.cargando || !this.hayMas) return;
    this.cargando = true;
    const antes = this.juegosVisibles.length;
    this.juegosVisibles = this.filtrados().slice(0, antes + JUEGOS_POR_PAGINA);
    this.cargando = false;
    this.cdr.detectChanges();
    // solo entran las tarjetas nuevas
    const tarjetas = this.estante?.nativeElement.querySelectorAll('.juego-card, .lista-card') ?? [];
    this.motion.entrar(Array.from(tarjetas).slice(antes), { y: 30 });
  }

  private entrarTarjetas() {
    const tarjetas = this.estante?.nativeElement.querySelectorAll('.juego-card, .lista-card');
    if (tarjetas) this.motion.entrar(tarjetas, { y: 28, stagger: 0.06 });
  }

  // Mejor precio en pesos del destacado (de game_stores)
  private async cargarMejorPrecio() {
    if (!this.juegoDestacado) return;
    try {
      const d = await this.detalleSvc.getPorId(this.juegoDestacado.id);
      const tiendas = d?.tiendas ?? [];
      const num = (p: string) => Number((p.match(/[\d.]+/)?.[0] ?? '').replace(/\./g, '')) || Infinity;
      const enPesos = tiendas.filter((t) => /COP/i.test(t.precio)).sort((a, b) => num(a.precio) - num(b.precio));
      this.mejorPrecio.set(enPesos[0] ?? tiendas[0] ?? null);
    } catch {
      this.mejorPrecio.set(null);
    }
  }

  get contadorTexto(): string {
    const total = this.totalFiltrados();
    return total > 0 ? `${this.juegosVisibles.length} de ${total} juegos` : '';
  }

  // Resalta lo buscado dentro del título
  resaltar(texto: string): string {
    const busq = this.busqueda().trim();
    const seguro = texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
    if (!busq) return seguro;
    const escaped = busq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return seguro.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="resaltado">$1</mark>');
  }
}
