import { AfterViewInit, Component, ElementRef, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MotionService } from '../../shared/utils/motion';
import { Icono } from '../../shared/ui/icono';
import { AficheDirective } from '../../shared/directives/afiche.directive';

export interface PartidoVista {
  id: number | string;
  teamA: string;
  logoA: string;
  teamB: string;
  logoB: string;
  status: 'LIVE' | 'UPCOMING';
  time: string;
  streamUrl: string;
  league: string;
}
export interface LeyendaVista { name: string; role: string; desc: string; image: string; }
export interface HitoVista { year: string; title: string; text: string; }

// Vista común de cada juego de eSports (Valorant, CS2, LoL, Dota 2): cartel, cronología, partidos y leyendas.
@Component({
  selector: 'app-esports-vista',
  imports: [RouterLink, Icono, AficheDirective],
  templateUrl: './esports-vista.html',
  styleUrl: './esports-vista.css',
})
export class EsportsVista implements AfterViewInit {
  private motion = inject(MotionService);
  private el = inject(ElementRef<HTMLElement>);

  titulo = input.required<string>();
  descripcion = input.required<string>();
  color = input.required<string>();
  lanzamiento = input<string>('');
  mundial = input<string>('');
  hitos = input<HitoVista[]>([]);
  hitoActual = input<number>(0);
  textoHito = input<string>('');
  partidos = input<PartidoVista[]>([]);
  cargando = input<boolean>(true);
  leyendas = input<LeyendaVista[]>([]);

  anterior = output<void>();
  siguiente = output<void>();
  irA = output<number>();
  verStream = output<string>();

  ngAfterViewInit() {
    const raiz = this.el.nativeElement;
    this.motion.entrar(raiz.querySelectorAll('[data-entra]'), { y: 24, stagger: 0.08 });
    raiz.querySelectorAll('.leyenda').forEach((l: Element, i: number) =>
      this.motion.alScroll(l, { y: 40, rotate: i % 2 ? 3 : -3, opacity: 0, ease: 'back.out(1.4)' })
    );
  }

  enVivo() {
    return this.partidos().filter((p) => p.status === 'LIVE').length;
  }

  logoPorDefecto(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'Imagenes/usuario.png';
  }
}
