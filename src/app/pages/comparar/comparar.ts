import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DetalleJuegosService, DetalleJuego } from '../../services/detalle-juegos';

interface RatingComparado {
  label: string;
  valorA: number;
  valorB: number;
  anchoA: number;
  anchoB: number;
  ganador: 'a' | 'b' | 'empate';
}

@Component({
  selector: 'app-comparar',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './comparar.html',
  styleUrl: './comparar.css',
})
export class Comparar implements OnInit {
  juegosIds: string[] = [];
  juegosNombres: Record<string, string> = {};

  seleccionA = '';
  seleccionB = '';

  juegoA: DetalleJuego | undefined;
  juegoB: DetalleJuego | undefined;
  mostrandoComparacion = false;
  error = '';

  ratingsComparados: RatingComparado[] = [];
  promedioA = 0;
  promedioB = 0;
  anchoPromedioA = 0;
  anchoPromedioB = 0;

  private animTimeout: any;

  constructor(private svc: DetalleJuegosService, private cdr: ChangeDetectorRef) {}

  /**
   * Inicializa el componente cargando la lista de todos los juegos disponibles
   */
  ngOnInit(): void {
    const todos = this.svc.getTodos();
    this.juegosIds = Object.keys(todos);
    this.juegosIds.forEach((id) => {
      this.juegosNombres[id] = todos[id].titulo;
    });
  }

  /**
   * Compara dos juegos seleccionados y calcula los ratings, promedios y ganador
   */
  comparar(): void {
    if (!this.seleccionA || !this.seleccionB) {
      this.error = 'Selecciona dos juegos para comparar.';
      this.mostrandoComparacion = false;
      return;
    }
    if (this.seleccionA === this.seleccionB) {
      this.error = 'Selecciona dos juegos diferentes.';
      this.mostrandoComparacion = false;
      return;
    }
    this.error = '';
    this.juegoA = this.svc.getPorId(this.seleccionA);
    this.juegoB = this.svc.getPorId(this.seleccionB);

    if (!this.juegoA || !this.juegoB) return;

    this.ratingsComparados = this.juegoA.ratings.map((rA, i) => {
      const rB = this.juegoB!.ratings[i];
      const valorB = rB?.valor ?? 0;
      return {
        label: rA.label,
        valorA: rA.valor,
        valorB: valorB,
        anchoA: 0,
        anchoB: 0,
        ganador: rA.valor > valorB ? 'a' : valorB > rA.valor ? 'b' : 'empate',
      };
    });

    const sumA = this.juegoA.ratings.reduce((s, r) => s + r.valor, 0);
    const sumB = this.juegoB.ratings.reduce((s, r) => s + r.valor, 0);
    this.promedioA = Math.round(sumA / this.juegoA.ratings.length);
    this.promedioB = Math.round(sumB / this.juegoB.ratings.length);
    this.anchoPromedioA = 0;
    this.anchoPromedioB = 0;

    this.mostrandoComparacion = true;
    this.cdr.detectChanges();

    clearTimeout(this.animTimeout);
    this.animTimeout = setTimeout(() => {
      this.ratingsComparados = this.ratingsComparados.map((r) => ({
        ...r,
        anchoA: r.valorA,
        anchoB: r.valorB,
      }));
      this.anchoPromedioA = this.promedioA;
      this.anchoPromedioB = this.promedioB;
      this.cdr.detectChanges();
    }, 80);
  }

  get ganadorGlobal(): 'a' | 'b' | 'empate' {
    if (this.promedioA > this.promedioB) return 'a';
    if (this.promedioB > this.promedioA) return 'b';
    return 'empate';
  }

  trackByIndex(index: number): number {
    return index;
  }
}
