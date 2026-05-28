import { Component, OnInit, AfterViewInit, signal, computed, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JuegosService, Juego } from '../../services/juegos';
import { gsap } from 'gsap';

// El catálogo de juegos es un componente normal, tiene funcionalidades de búsqueda, filtro, hero, cargar más y cambiar el gris todo en el juegos.ts

// Constantes para controlar la paginación y el juego destacado
const JUEGOS_POR_PAGINA = 6;
const JUEGO_DESTACADO_ID = 'ag4';

@Component({
  selector: 'app-juegos',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './juegos.html',
  styleUrl: './juegos.css',
})

/*se utiliza Oninit y AfterViewInit para cargar el juego destacado y animar las tarjetas respectivamente,
se inyecta el servicio de juegos para obtener los datos, el router para navegar al juego destacado y el
ChangeDetectorRef para forzar la detección de cambios después de mutaciones dentro de setTimeout  */
export class Juegos implements OnInit, AfterViewInit {
  @ViewChild('heroImgWrapper') heroImgWrapper!: ElementRef<HTMLDivElement>;

  // Signals para controlar la vista actual (grid o lista), el filtro, la búsqueda, el juego destacado y los juegos visibles
  vistaActual = signal<'grid' | 'lista'>('grid');
  filtroActual = signal('todos');
  busqueda = signal('');

  // El juego destacado se carga al inicio y se muestra en el hero, los juegos visibles se cargan según el filtro y la búsqueda
  juegoDestacado: Juego | undefined;
  juegosVisibles: Juego[] = [];

  // Computed para calcular el total de juegos filtrados según el filtro y la búsqueda, se usa en el contador y para saber si hay más juegos para cargar
  totalFiltrados = computed(() =>
    this.svc.filtrar(this.filtroActual(), this.busqueda()).length
  );

  // Getter para saber si hay más juegos para cargar, se usa en el *ngIf del botón de cargar más
  get hayMas(): boolean {
    return this.juegosVisibles.length < this.totalFiltrados();
  }

  cargando = false;

  // ChangeDetectorRef inyectado para forzar la detección de cambios
  // después de mutaciones dentro de setTimeout
  constructor(
    private svc: JuegosService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  // En el ngOnInit se carga el juego destacado y la primera página de juegos visibles, en el ngAfterViewInit se agrega el efecto de tilt al hero
  ngOnInit(): void {
    this.juegoDestacado = this.svc.getJuegoPorId(JUEGO_DESTACADO_ID);
    this.cargarPrimera();
  }

  ngAfterViewInit(): void {
    if (this.heroImgWrapper) {
      const wrapper = this.heroImgWrapper.nativeElement;
      const maxTilt = 10;
      wrapper.addEventListener('mousemove', (e: MouseEvent) => {
        const rect = wrapper.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        wrapper.style.transform = `perspective(800px) rotateY(${x * maxTilt}deg) rotateX(${-y * maxTilt}deg) scale(1.02)`;
      });
      wrapper.addEventListener('mouseleave', () => {
        wrapper.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
      });
    }
  }

  /* Funciones para cargar la primera página de juegos visibles, cargar la siguiente página, animar las tarjetas,
   manejar la búsqueda, el filtro, el cambio de vista, cargar más juegos y navegar al juego destacado. */
  private cargarPrimera(): void {
    const filtrados = this.svc.filtrar(this.filtroActual(), this.busqueda());
    this.juegosVisibles = filtrados.slice(0, JUEGOS_POR_PAGINA);
    this.cdr.detectChanges();
    setTimeout(() => this.animarTarjetas(), 0);
  }

  private cargarSiguiente(): void {
    const filtrados = this.svc.filtrar(this.filtroActual(), this.busqueda());
    const inicio = this.juegosVisibles.length;
    const fin = inicio + JUEGOS_POR_PAGINA;
    const nuevos = filtrados.slice(inicio, fin);
    this.juegosVisibles = [...this.juegosVisibles, ...nuevos];
    // Forzamos la detección de cambios para que Angular
    // repinte el *ngFor y el getter hayMas dentro del setTimeout
    this.cdr.detectChanges();
    setTimeout(() => this.animarTarjetas(), 0);
  }

  private animarTarjetas(): void {
    const tarjetas = document.querySelectorAll('.juego-card, .lista-card');
    if (tarjetas.length === 0) return;
    gsap.fromTo(
      tarjetas,
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 0.42, stagger: 0.07, ease: 'power2.out' }
    );
  }

  // Funciones para manejar la búsqueda, el filtro, el cambio de vista, cargar más juegos y navegar al juego destacado
  onBusqueda(valor: string): void {
    this.busqueda.set(valor);
    this.cargarPrimera();
  }

  filtrar(tipo: string): void {
    this.filtroActual.set(tipo);
    this.busqueda.set('');
    this.cargarPrimera();
  }

  cambiarVista(vista: 'grid' | 'lista'): void {
    this.vistaActual.set(vista);
    this.cargarPrimera();
  }

  cargarMas(): void {
    if (this.cargando || !this.hayMas) return;
    this.cargando = true;
    this.cdr.detectChanges(); // refresca el texto "Cargando..." inmediatamente
    setTimeout(() => {
      this.cargarSiguiente();
      this.cargando = false;
      this.cdr.detectChanges();
    }, 350);
  }

  navegarAlJuego(): void {
    if (this.juegoDestacado?.id) {
      this.router.navigate(['/juego', this.juegoDestacado.id]);
    }
  }

  // Getter para el texto del contador de juegos, se muestra "Mostrando X de Y juegos" o vacío si no hay juegos filtrados
  get contadorTexto(): string {
    const total = this.totalFiltrados();
    const visibles = this.juegosVisibles.length;
    return total > 0 ? `Mostrando ${visibles} de ${total} juegos` : '';
  }

  // Función para resaltar el texto de la búsqueda dentro del título y la descripción de los juegos, se usa en el template con [innerHTML]
  resaltar(texto: string): string {
    const busq = this.busqueda().trim();
    if (!busq) return texto;
    const escaped = busq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return texto.replace(
      new RegExp(`(${escaped})`, 'gi'),
      `<mark style="background:rgba(163,69,250,0.86);color:#f0abfc;border-radius:3px;padding:0 2px;">$1</mark>`
    );
  }
}
