import { AfterViewInit, ChangeDetectorRef, Component, computed, ElementRef, inject, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgTemplateOutlet } from '@angular/common';
import { JuegosService, Juego, RecienLlegado } from '../../core/services/juegos';
import { DetalleJuegosService, PrecioDeHoy, Tienda } from '../../core/services/detalle-juegos';
import { PaisService } from '../../core/services/pais';
import { MotionService } from '../../shared/utils/motion';
import { Icono } from '../../shared/ui/icono';
import { AficheDirective } from '../../shared/directives/afiche.directive';

// Paginación y juego destacado
const JUEGOS_POR_PAGINA = 6;
const JUEGO_DESTACADO_ID = 'ag4'; // respaldo si no hay datos para la cartelera
const ROTACION_MS = 7000;

/** Una de las caras del afiche destacado: lanzamiento nuevo, el más barato de hoy o el último que llegó al local */
export interface Cartel {
  tipo: 'lanzado' | 'barato' | 'agregado';
  etiqueta: string;
  id: string | null;       // null: juego que aún no está en Nexos (se abre en RAWG)
  enlaceExterno: string | null;
  titulo: string;
  descripcion: string;
  imagen: string;
  precio: Tienda | null;
  rotulo: string;          // texto sobre el precio
  descuento: number;
}

// Catálogo: estante de cubículos con búsqueda, filtro por género, vista de grilla o lista y "cargar más".
@Component({
  selector: 'app-juegos',
  imports: [RouterLink, NgTemplateOutlet, Icono, AficheDirective],
  templateUrl: './juegos.html',
  styleUrl: './juegos.css',
})
export class Juegos implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('estante') estante?: ElementRef<HTMLElement>;

  private svc = inject(JuegosService);
  private detalleSvc = inject(DetalleJuegosService);
  private paisSvc = inject(PaisService);
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

  // Afiche destacado que va cambiando entre las tres caras
  carteles = signal<Cartel[]>([]);
  actual = signal(0);
  pausado = signal(false);
  cartel = computed(() => this.carteles()[this.actual()] ?? null);
  readonly rotacionMs = ROTACION_MS;
  private reloj?: ReturnType<typeof setInterval>;
  juegosVisibles: Juego[] = [];
  /** Descuento de hoy por juego (lo muestra el tendero en su pantalla al pasar por una tarjeta) */
  descuentos = signal<Record<string, number>>({});

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
    this.juegosVisibles = this.filtrados().slice(0, JUEGOS_POR_PAGINA);
    this.cdr.detectChanges();
    this.entrarTarjetas();
    this.armarCarteles();
  }

  ngAfterViewInit(): void {
    this.motion.entrar(document.querySelectorAll('[data-entra]'), { y: 20, stagger: 0.08 });
  }

  ngOnDestroy(): void {
    this.motion.limpiarScroll();
    if (this.reloj) clearInterval(this.reloj);
    document.removeEventListener('visibilitychange', this.alCambiarPestana);
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

  // ---------- afiche destacado: lanzamiento nuevo, el más barato de hoy y el último en llegar ----------
  private async armarCarteles() {
    const juegos = this.todos();
    if (!juegos.length) return;
    const [hoy, recientes] = await Promise.all([
      this.detalleSvc.getPreciosDeHoy(this.paisSvc.pais()).catch((): PrecioDeHoy[] => []),
      this.svc.getRecienLlegados().catch((): RecienLlegado[] => []),
    ]);
    const porId = new Map(juegos.map((j) => [j.id, j]));
    this.descuentos.set(Object.fromEntries(hoy.filter((p) => p.masBarato?.descuento).map((p) => [p.juego, p.masBarato!.descuento])));
    const usados = new Set<string>();
    const precioDe = (id: string) => DetalleJuegosService.tiendaDeHoy(hoy, id);
    const descuentoDe = (id: string) => hoy.find((p) => p.juego === id)?.masBarato?.descuento ?? 0;
    const desdeJuego = (j: Juego, tipo: Cartel['tipo'], etiqueta: string, rotulo: (t: Tienda) => string): Cartel => {
      usados.add(j.id);
      const precio = precioDe(j.id);
      return { tipo, etiqueta, id: j.id, enlaceExterno: null, titulo: j.titulo, descripcion: j.descripcion, imagen: j.imagen,
        precio, rotulo: precio ? rotulo(precio) : '', descuento: precio ? descuentoDe(j.id) : 0 };
    };
    const lista: Cartel[] = [];

    // 1. Lanzamiento nuevo: el más popular del último mes; primero los que ya están en el local
    const lanzado = recientes.find((r) => r.juego_id && porId.has(r.juego_id)) ?? recientes.find((r) => r.imagen);
    if (lanzado?.juego_id && porId.has(lanzado.juego_id)) {
      lista.push(desdeJuego(porId.get(lanzado.juego_id)!, 'lanzado', 'Lanzamiento nuevo', (t) => `Mejor precio · ${t.nombre}`));
    } else if (lanzado?.imagen) {
      const fecha = lanzado.lanzamiento ? new Date(lanzado.lanzamiento).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' }) : null;
      lista.push({ tipo: 'lanzado', etiqueta: 'Lanzamiento nuevo', id: null, enlaceExterno: `https://rawg.io/games/${lanzado.slug}`,
        titulo: lanzado.titulo, imagen: lanzado.imagen, precio: null, rotulo: '', descuento: 0,
        descripcion: [fecha && `Salió el ${fecha}`, lanzado.generos].filter(Boolean).join(' · ') || 'De lo más jugado este mes.' });
    }

    // 2. El más barato de hoy en el país elegido (se comparan solo precios en la misma moneda)
    const conPrecio = hoy.filter((p) => p.masBarato && p.masBarato.precio > 0 && porId.has(p.juego));
    const monedas = new Map<string, number>();
    conPrecio.forEach((p) => monedas.set(p.masBarato!.moneda, (monedas.get(p.masBarato!.moneda) ?? 0) + 1));
    const moneda = [...monedas.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const barato = conPrecio
      .filter((p) => p.masBarato!.moneda === moneda && !usados.has(p.juego))
      .sort((a, b) => a.masBarato!.precio - b.masBarato!.precio || b.masBarato!.descuento - a.masBarato!.descuento)[0];
    if (barato) lista.push(desdeJuego(porId.get(barato.juego)!, 'barato', 'El más barato hoy', (t) => `Hoy en ${t.nombre}`));

    // 3. Recién agregado al local: el último que se sumó al catálogo
    const agregado = [...juegos].filter((j) => !usados.has(j.id))
      .sort((a, b) => (b.creado_en ?? '').localeCompare(a.creado_en ?? ''))[0];
    if (agregado?.creado_en) lista.push(desdeJuego(agregado, 'agregado', 'Recién llegado al local', (t) => `Mejor precio · ${t.nombre}`));

    // Sin datos de nada: el juego de la casa de siempre
    if (!lista.length) {
      const casa = porId.get(JUEGO_DESTACADO_ID) ?? juegos[0];
      lista.push(desdeJuego(casa, 'agregado', 'Juego de la casa', (t) => `Mejor precio · ${t.nombre}`));
    }
    this.carteles.set(lista);
    this.actual.set(0);
    this.iniciarRotacion();
  }

  private alCambiarPestana = () => this.pausado.set(document.hidden);

  private iniciarRotacion() {
    if (this.reloj) clearInterval(this.reloj); // nunca dos relojes a la vez
    this.reloj = undefined;
    if (this.carteles().length < 2 || this.motion.reducido()) return; // con movimiento reducido se cambia a mano
    document.removeEventListener('visibilitychange', this.alCambiarPestana);
    document.addEventListener('visibilitychange', this.alCambiarPestana);
    this.reloj = setInterval(() => {
      if (!this.pausado()) this.actual.update((i) => (i + 1) % this.carteles().length);
    }, ROTACION_MS);
  }

  /** Elegir una cara a mano: el reloj vuelve a contar desde cero */
  verCartel(i: number) {
    this.actual.set(i);
    if (this.reloj) this.iniciarRotacion();
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
