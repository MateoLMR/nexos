import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  signal,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PandaScoreService } from './../../../services/pandascore';// Ajusta la ruta
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// Interfaces para la información dinámica
interface Match {
  id: string;
  teamA: string;
  logoA: string;
  teamB: string;
  logoB: string;
  status: 'LIVE' | 'UPCOMING';
  time: string; // 'Ahora' o fecha/hora
  streamUrl: string; // Enlace oficial
  league: string;
}

interface Legend {
  name: string;
  role: string;
  desc: string;
  image: string;
}

interface HistoryStep {
  year: string;
  title: string;
  text: string;
}

interface Pixel {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; decay: number; color: string;
}

import { EsportsVista } from '../esports-vista';

@Component({
  selector: 'app-valorant',
  standalone: true,
  imports: [CommonModule, EsportsVista],
  templateUrl: './valorant.html',
})
export class Valorant implements OnInit, OnDestroy {
  @ViewChild('pixelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private pandaService = inject(PandaScoreService);
  private refreshSub?: Subscription;

  // CONFIGURACIÓN VISUAL DEL JUEGO
  themeColor = '#ff4655'; // Color principal para glows y acentos
  private readonly pixelColors = ['#ff4655', '#ff8fa3', '#ffffff', '#111111'];

  // DATOS DEL JUEGO
  stats = {
    lanzamiento: '2020',
    genero: 'Tactical Hero Shooter',
    creador: 'Riot Games',
    mundial: 'Valorant Champions'
  };

  // LEYENDAS
  legends: Legend[] = [
    {
      name: 'TenZ',
      role: 'Duelista',
      desc: 'Mecánicas inigualables. Elevó el techo de habilidad desde la beta.',
      image: '/Imagenes-esports/tenz.jpg'
    },
    {
      name: 'Boaster',
      role: 'IGL',
      desc: 'La mente maestra de FNATIC. Estrategia pura y carisma.',
      image: '/Imagenes-esports/boaster.jpg'
    },
    {
      name: 'aspas',
      role: 'Duelista',
      desc: 'El terror de Brasil. MVP constante y campeón del mundo con LOUD.',
      image: '/Imagenes-esports/aspas.webp'
    }
  ];

  // HISTORIA RESUMIDA
  historySteps: HistoryStep[] = [
    { year: '2014', title: 'Project A', text: 'Riot Games inicia el desarrollo de un shooter táctico que busca combinar habilidades con precisión pura.' },
    { year: '2020', title: 'Beta Global', text: 'El juego rompe récords en Twitch. Jugadores de todo el mundo intentan conseguir un "drop" para probarlo.' },
    { year: '2021', title: 'Champions Berlin', text: 'Se celebra el primer mundial oficial, consolidando a Valorant como el nuevo gigante de los eSports.' },
    { year: 'Actualidad', title: 'Evolución Constante', text: 'Con más de 20 agentes y mapas diversos, el sistema sigue redefiniendo el género FPS.' }
  ];

  currentSlide = signal(0);
  // Signal para el texto que se está escribiendo
  displayText = signal('');

  // SEÑALES DE ESTADO
  matches = signal<Match[]>([]);
  isLoadingMatches = signal<boolean>(true);

  ngOnInit(): void {
    this.iniciarTrackerAutomatico();
  }

  iniciarTrackerAutomatico() {
    // I Solo ponemos el loading en true la primera vez
    this.isLoadingMatches.set(true);

    // ya ejecuta la primera carga inmediatamente
    this.refreshSub = timer(0, 60_000).pipe(
      switchMap(() => this.pandaService.getMatches())
    ).subscribe({
      next: (data) => {
        const now = new Date().getTime();

        const mapped: Match[] = data.map(m => {
          const opponentA = m.opponents?.[0]?.opponent;
          const opponentB = m.opponents?.[1]?.opponent;
          const leagueName = m.league?.name || 'Torneo Profesional';

          return {
            id: m.id.toString(),
            teamA: opponentA?.name || 'TBD',
            logoA: opponentA?.image_url || 'https://cdn.pandascore.co/images/team/image/default.png',
            teamB: opponentB?.name || 'TBD',
            logoB: opponentB?.image_url || 'https://cdn.pandascore.co/images/team/image/default.png',
            status: (m.status === 'running' ? 'LIVE' : 'UPCOMING') as 'LIVE' | 'UPCOMING',
            time: new Date(m.begin_at).toLocaleString('es-CO', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            }),
            timestamp: new Date(m.begin_at).getTime(),
            // Usamos el servicio para obtener el link correcto
            streamUrl: this.pandaService.getStreamByLeague(
              leagueName,
              m.live_url,
              m.serie?.name,
              m.tournament?.name
            ),
            league: leagueName
          };
        })
          .filter(m => m.status === 'LIVE' || m.timestamp > (now - 10800000))
          .slice(0, 6);

        this.matches.set(mapped);
        this.isLoadingMatches.set(false);
      },
      error: (err) => {
        console.error('Error en Tracker:', err);
        this.isLoadingMatches.set(false);
      }
    });
  }

  nextSlide() {
    this.currentSlide.update(v => (v + 1) % this.historySteps.length);
  }

  prevSlide() {
    this.currentSlide.update(v => (v - 1 + this.historySteps.length) % this.historySteps.length);
  }

  // Variables de Canvas
  private pixels: Pixel[] = [];
  private animFrameId = 0;
  private spawnInterval = 0;
  private ctx!: CanvasRenderingContext2D;
  /*private esportsService = inject(EsportsService);*/


  ngOnDestroy(): void {
    if (this.typeInterval) clearInterval(this.typeInterval);
    this.refreshSub?.unsubscribe();
  }

  redirigirStream(url: string) {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      // Si por alguna razón llega vacío, mandamos al general
      window.open('https://www.twitch.tv/valorant', '_blank');
    }
  }

  constructor() {
    // Este efecto se dispara cada vez que currentSlide cambia
    effect(() => {
      const fullText = this.historySteps[this.currentSlide()].text;
      this.typeText(fullText);
    });
  }

  private typeInterval: any = null;

  private typeText(text: string) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.displayText.set(text);
      return;
    }
    // Cancela el intervalo anterior antes de iniciar uno nuevo
    if (this.typeInterval) {
      clearInterval(this.typeInterval);
      this.typeInterval = null;
    }

    this.displayText.set('');
    let i = 0;
    this.typeInterval = setInterval(() => {
      this.displayText.update(v => v + text.charAt(i));
      i++;
      if (i >= text.length) {
        clearInterval(this.typeInterval);
        this.typeInterval = null;
      }
    }, 30);
  }

}
