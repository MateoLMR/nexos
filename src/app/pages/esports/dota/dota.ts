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

@Component({
  selector: 'app-dota',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dota.html',
})
export class Dota implements OnInit, AfterViewInit, OnDestroy {
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
    this.refreshSub = timer(0, 300000).pipe(
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

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const spawnBlast = () => {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.5;
        const color = this.pixelColors[Math.floor(Math.random() * this.pixelColors.length)];
        this.pixels.push({
          x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4, alpha: 0.6 + Math.random() * 0.4, decay: 0.01 + Math.random() * 0.015, color
        });
      }
    };
    this.spawnInterval = window.setInterval(spawnBlast, 400);
    const loop = () => {
      this.ctx.fillStyle = 'rgba(8, 8, 12, 0.2)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);
      this.pixels = this.pixels.filter(p => p.alpha > 0.01);
      for (const p of this.pixels) {
        p.x += p.vx; p.y += p.vy; p.vx *= 0.98; p.vy *= 0.98;
        p.alpha -= p.decay;
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      this.ctx.globalAlpha = 1;
      this.animFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animFrameId);
    clearInterval(this.spawnInterval);
    if (this.typeInterval) clearInterval(this.typeInterval);
    this.refreshSub?.unsubscribe();
  }
}
