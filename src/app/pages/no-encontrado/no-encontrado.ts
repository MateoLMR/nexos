import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icono } from '../../shared/ui/icono';

// Página que no existe: un puesto del local con un papel pegado en el monitor.
@Component({
  selector: 'app-no-encontrado',
  imports: [RouterLink, Icono],
  template: `
    <div class="local py-20 grid place-items-center text-center">
      <div class="puesto" aria-hidden="true">
        <div class="pantalla">
          <span class="ruido"></span>
          <span class="papel">Fuera de<br />servicio</span>
        </div>
        <span class="base"></span>
      </div>
      <h1 class="letrero mt-10 text-[clamp(2.25rem,5vw,3.5rem)] text-monitor">Este puesto no funciona</h1>
      <p class="mt-3 max-w-md text-lg text-monitor-2">La página que buscas no existe o se movió. Hay otros puestos libres.</p>
      <div class="mt-8 flex flex-wrap justify-center gap-3">
        <a routerLink="/" class="boton boton-principal"><app-icono nombre="arrow-left" [tam]="18" /> Volver al inicio</a>
        <a routerLink="/juegos" class="boton boton-linea">Ver los juegos</a>
      </div>
    </div>
  `,
  styles: `
    .puesto { display: flex; flex-direction: column; align-items: center; }
    .pantalla {
      position: relative;
      width: min(18rem, 70vw);
      aspect-ratio: 4 / 3;
      border: 10px solid var(--color-cubiculo-2);
      border-radius: 10px;
      background: var(--color-pared-2);
      overflow: hidden;
    }
    /* estática apagada de un monitor sin señal */
    .ruido {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(to bottom, rgb(232 238 255 / 0.04) 0 2px, transparent 2px 4px);
    }
    .base { width: 5rem; height: 1.6rem; background: var(--color-cubiculo-2); clip-path: polygon(25% 0, 75% 0, 100% 100%, 0 100%); }
    /* el papel pegado con cinta, como el cartel de "abierto" */
    .papel {
      position: absolute;
      left: 50%;
      top: 50%;
      translate: -50% -50%;
      rotate: -5deg;
      padding: 0.9rem 1.2rem;
      background: #f3ecd8;
      color: #2b2318;
      font-family: var(--font-letrero);
      font-size: 1.35rem;
      font-weight: 800;
      line-height: 1.05;
      text-transform: lowercase;
    }
    .papel::before, .papel::after {
      content: "";
      position: absolute;
      top: -6px;
      width: 26px;
      height: 10px;
      background: rgb(232 238 255 / 0.45);
    }
    .papel::before { left: -8px; rotate: -30deg; }
    .papel::after { right: -8px; rotate: 30deg; }
  `,
})
export class NoEncontrado {}
