import {
  Component, OnInit, AfterViewInit, OnDestroy,
  ElementRef, ViewChild, signal, effect, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PandaScoreService } from '../../../services/pandascore';
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

interface Match {
  id: string; teamA: string; logoA: string;
  teamB: string; logoB: string;
  status: 'LIVE' | 'UPCOMING'; time: string;
  streamUrl: string; league: string;
}
interface Legend { name: string; role: string; desc: string; image: string; }
interface HistoryStep { year: string; title: string; text: string; }
interface Pixel {
  x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; decay: number; color: string;
}

import { EsportsVista } from '../esports-vista';

@Component({
  selector: 'app-dota',
  standalone: true,
  imports: [CommonModule, EsportsVista],
  templateUrl: './dota.html',
})
export class Dota implements OnInit, OnDestroy {
  @ViewChild('pixelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private pandaService = inject(PandaScoreService);
  private refreshSub?: Subscription;
  private typeInterval: any = null;

  themeColor = '#c23c2a';
  private readonly pixelColors = ['#c23c2a', '#ff6b5b', '#ffffff', '#0a0a0f'];

  stats = { lanzamiento: '2013', mundial: 'The International' };

  legends: Legend[] = [
    {
      name: 'Miracle-',
      role: 'Mid / Carry',
      desc: 'El primer jugador en alcanzar los 9000 MMR. Famoso por sus jugadas imposibles con Invoker y su capacidad de ganar partidas solo.',
      image: '/Imagenes-esports/miracle.jpg'
    },
    {
      name: 'Puppey',
      role: 'Support / Captain',
      desc: 'Leyenda absoluta de Team Secret. Ha estado presente en casi todos los The International, ganando el primero de la historia.',
      image: '/Imagenes-esports/puppey.jpg'
    },
    {
      name: 'N0tail',
      role: 'Support / Captain',
      desc: 'Fundador de OG y el primer bicampeón consecutivo de TI. Su mentalidad positiva revolucionó el liderazgo en los esports.',
      image: '/Imagenes-esports/n0tail.jpg'
    },
  ];

  historySteps: HistoryStep[] = [
    {
      year: '2003',
      title: 'Defensa de los Ancestros',
      text: 'Nace Dota como un mapa personalizado de Warcraft III: The Frozen Throne. El género MOBA empieza a tomar forma.'
    },
    {
      year: '2011',
      title: 'El primer International',
      text: 'Valve presenta Dota 2 en la Gamescom con un premio de 1.6 millones de dólares, una cifra nunca antes vista en la época.'
    },
    {
      year: '2015',
      title: 'Source 2: Reborn',
      text: 'Dota 2 se traslada por completo al motor Source 2, mejorando gráficos, rendimiento y permitiendo juegos personalizados.'
    },
    {
      year: '2019',
      title: 'La Dinastía de OG',
      text: 'OG se convierte en el primer equipo en defender el Aegis of Champions exitosamente, ganando el TI8 y el TI9 de forma consecutiva.'
    },
    {
      year: '2024',
      title: 'Era de la Corona Real',
      text: 'El juego evoluciona con parches masivos que cambian el mapa, introducen facetas y habilidades innatas, expandiendo la complejidad táctica.'
    },
  ];

  currentSlide = signal(0);
  displayText = signal('');
  matches = signal<Match[]>([]);
  isLoadingMatches = signal<boolean>(true);

  constructor() {
    effect(() => {
      const fullText = this.historySteps[this.currentSlide()].text;
      this.typeText(fullText);
    });
  }

  ngOnInit(): void { this.iniciarTracker(); }

  iniciarTracker() {
    this.isLoadingMatches.set(true);
    this.refreshSub = timer(0, 60_000).pipe(
      switchMap(() => this.pandaService.getDota2Matches())
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
            logoA: opponentA?.image_url || '',
            teamB: opponentB?.name || 'TBD',
            logoB: opponentB?.image_url || '',
            status: (m.status === 'running' ? 'LIVE' : 'UPCOMING') as 'LIVE' | 'UPCOMING',
            time: new Date(m.begin_at).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(m.begin_at).getTime(),
            streamUrl: this.pandaService.getStreamByLeague(leagueName, m.live_url, m.serie?.name, m.tournament?.name, 'dota2'),
            league: leagueName,
          };
        })
          .filter((m: any) => m.status === 'LIVE' || m.timestamp > (now - 10800000))
          .slice(0, 6);
        this.matches.set(mapped);
        this.isLoadingMatches.set(false);
      },
      error: () => this.isLoadingMatches.set(false)
    });
  }

  nextSlide() { this.currentSlide.update(v => (v + 1) % this.historySteps.length); }
  prevSlide() { this.currentSlide.update(v => (v - 1 + this.historySteps.length) % this.historySteps.length); }

  private typeText(text: string) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this.displayText.set(text);
      return;
    }
    if (this.typeInterval) { clearInterval(this.typeInterval); this.typeInterval = null; }
    this.displayText.set('');
    let i = 0;
    this.typeInterval = setInterval(() => {
      this.displayText.update(v => v + text.charAt(i));
      i++;
      if (i >= text.length) { clearInterval(this.typeInterval); this.typeInterval = null; }
    }, 30);
  }

  redirigirStream(url: string) {
    window.open(url?.startsWith('http') ? url : 'https://www.twitch.tv/dota2ti', '_blank');
  }

  private pixels: Pixel[] = [];
  private animFrameId = 0;
  private spawnInterval = 0;
  private ctx!: CanvasRenderingContext2D;


  ngOnDestroy(): void {
    if (this.typeInterval) clearInterval(this.typeInterval);
    this.refreshSub?.unsubscribe();
  }
}
