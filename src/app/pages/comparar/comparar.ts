import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DetalleJuegosService, DetalleJuego, Tienda } from '../../services/detalle-juegos';
import { JuegosService, Juego } from '../../services/juegos';
import { MotionService } from '../../shared/motion';
import { Icono } from '../../shared/icono';
import { ContadorDirective } from '../../shared/contador.directive';

interface RatingComparado {
  label: string;
  valorA: number;
  valorB: number;
  ganador: 'a' | 'b' | 'empate';
}

// Comparar: dos cubículos frente a frente. Se compara apenas hay dos juegos elegidos.
@Component({
  selector: 'app-comparar',
  imports: [RouterLink, Icono, ContadorDirective],
  templateUrl: './comparar.html',
  styleUrl: './comparar.css',
})
export class Comparar implements OnInit, OnDestroy {
  private svc = inject(DetalleJuegosService);
  private juegosSvc = inject(JuegosService);
  private motion = inject(MotionService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  juegos: Juego[] = [];
  seleccionA = '';
  seleccionB = '';

  juegoA: DetalleJuego | undefined;
  juegoB: DetalleJuego | undefined;
  comparando = false;
  mostrandoComparacion = false;
  error = '';

  ratingsComparados: RatingComparado[] = [];
  promedioA = 0;
  promedioB = 0;
  precioA: Tienda | null = null;
  precioB: Tienda | null = null;

  async ngOnInit(): Promise<void> {
    try {
      this.juegos = await this.juegosSvc.getJuegos();
    } catch (error) {
      console.error(error);
      this.error = 'No pudimos cargar los juegos. Recarga la página.';
    }
    // Llega desde el detalle de un juego: /comparar?a=xc2
    const a = this.route.snapshot.queryParamMap.get('a');
    const b = this.route.snapshot.queryParamMap.get('b');
    if (a && this.juegos.some((j) => j.id === a)) this.seleccionA = a;
    if (b && this.juegos.some((j) => j.id === b)) this.seleccionB = b;
    this.cdr.detectChanges();
    this.motion.entrar(document.querySelectorAll('[data-entra]'), { y: 20 });
    if (this.seleccionA && this.seleccionB) this.comparar();
  }

  ngOnDestroy(): void {}

  titulo(id: string) {
    return this.juegos.find((j) => j.id === id)?.titulo ?? '';
  }

  elegir(lado: 'a' | 'b', id: string) {
    if (lado === 'a') this.seleccionA = id;
    else this.seleccionB = id;
    this.router.navigate([], { queryParams: { a: this.seleccionA || null, b: this.seleccionB || null }, replaceUrl: true });
    this.comparar();
  }

  intercambiar() {
    [this.seleccionA, this.seleccionB] = [this.seleccionB, this.seleccionA];
    this.router.navigate([], { queryParams: { a: this.seleccionA || null, b: this.seleccionB || null }, replaceUrl: true });
    this.comparar();
  }

  async comparar(): Promise<void> {
    if (!this.seleccionA || !this.seleccionB) {
      this.mostrandoComparacion = false;
      this.error = '';
      return;
    }
    if (this.seleccionA === this.seleccionB) {
      this.error = 'Elige dos juegos diferentes.';
      this.mostrandoComparacion = false;
      return;
    }
    this.error = '';
    this.comparando = true;
    this.cdr.detectChanges();
    try {
      [this.juegoA, this.juegoB] = await Promise.all([this.svc.getPorId(this.seleccionA), this.svc.getPorId(this.seleccionB)]);
    } catch (error) {
      console.error(error);
      this.error = 'No se pudo cargar la comparación. Intenta de nuevo.';
      this.mostrandoComparacion = false;
      this.comparando = false;
      this.cdr.detectChanges();
      return;
    }
    this.comparando = false;
    if (!this.juegoA || !this.juegoB) return;

    this.ratingsComparados = this.juegoA.ratings.map((rA) => {
      const valorB = this.juegoB!.ratings.find((r) => r.label === rA.label)?.valor ?? 0;
      return { label: rA.label, valorA: rA.valor, valorB, ganador: rA.valor > valorB ? 'a' : valorB > rA.valor ? 'b' : 'empate' };
    });
    const prom = (j: DetalleJuego) => (j.ratings.length ? Math.round(j.ratings.reduce((s, r) => s + r.valor, 0) / j.ratings.length) : 0);
    this.promedioA = prom(this.juegoA);
    this.promedioB = prom(this.juegoB);
    this.precioA = this.masBarato(this.juegoA.tiendas);
    this.precioB = this.masBarato(this.juegoB.tiendas);

    this.mostrandoComparacion = true;
    this.cdr.detectChanges();
    this.animar();
  }

  get ganadorGlobal(): 'a' | 'b' | 'empate' {
    if (this.promedioA > this.promedioB) return 'a';
    if (this.promedioB > this.promedioA) return 'b';
    return 'empate';
  }

  get masBaratoGlobal(): 'a' | 'b' | 'empate' | null {
    if (!this.precioA || !this.precioB) return null;
    const a = this.aNumero(this.precioA.precio), b = this.aNumero(this.precioB.precio);
    return a < b ? 'a' : b < a ? 'b' : 'empate';
  }

  private masBarato(tiendas: Tienda[]): Tienda | null {
    const enPesos = tiendas.filter((t) => /COP/i.test(t.precio)).sort((x, y) => this.aNumero(x.precio) - this.aNumero(y.precio));
    return enPesos[0] ?? null;
  }

  private aNumero(precio: string) {
    const m = precio.match(/[\d.]+/)?.[0] ?? '';
    return Number(m.replace(/\./g, '')) || Infinity;
  }

  // Barras enfrentadas: crecen desde el centro hacia cada lado
  private animar() {
    const g = this.motion.gsap;
    const barras = document.querySelectorAll<HTMLElement>('.barra-relleno');
    if (this.motion.reducido()) {
      barras.forEach((b) => (b.style.transform = `scaleX(${Number(b.dataset['valor']) / 100})`));
      return;
    }
    barras.forEach((b, i) =>
      g.fromTo(b, { scaleX: 0 }, { scaleX: Number(b.dataset['valor']) / 100, duration: 1.1, ease: 'expo.out', delay: 0.1 + Math.floor(i / 2) * 0.09 })
    );
    g.from('.veredicto', { y: 24, opacity: 0, duration: 0.7, ease: 'expo.out', delay: 0.5, stagger: 0.1 });
    g.from('.cara', { y: -20, opacity: 0, rotate: (i: number) => (i ? 3 : -3), duration: 0.7, ease: 'back.out(1.5)', stagger: 0.1 });
  }
}
