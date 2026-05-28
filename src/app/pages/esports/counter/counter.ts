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
  selector: 'app-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './counter.html',
})
export class Counter implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pixelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private pandaService = inject(PandaScoreService);
  private refreshSub?: Subscription;
  private typeInterval: any = null;

  themeColor = '#f0a500'; // Dorado CS
  private readonly pixelColors = ['#f0a500', '#ffd166', '#ffffff', '#0e0e0e'];

  stats = { lanzamiento: '2012', mundial: 'CS Major Championship' };

  legends: Legend[] = [
    { name: 's1mple', role: 'Rifler / AWPer', desc: 'Considerado el mejor jugador de la historia. Dominio absoluto con cualquier arma.', image: '/Imagenes-esports/s1mple.png' },
    { name: 'ZywOo', role: 'AWPer', desc: 'El genio francés. Consistencia sobrehumana temporada tras temporada con Vitality.', image: '/Imagenes-esports/zywOo.jpg' },
    { name: 'NiKo', role: 'Entry Fragger', desc: 'Mecánicas de otro nivel. El clutch player más famoso de la escena europea.', image: '/Imagenes-esports/niko{.jpg' },
  ];

  historySteps: HistoryStep[] = [
    { year: '2000', title: 'Counter-Strike 1.6', text: 'El mod de Half-Life que cambió los shooters para siempre. Cafés internet llenos en todo el mundo.' },
    { year: '2012', title: 'CS:GO nace', text: 'Valve lanza Global Offensive. Al principio subestimado, se convierte en el FPS competitivo más grande del planeta.' },
    { year: '2018', title: 'Era Dorada', text: 'Astralis domina el mundo con un estilo táctico nunca visto. Los Majors alcanzan millones de espectadores.' },
    { year: '2023', title: 'CS2 — Motor nuevo', text: 'Source 2 reemplaza al motor original. Gráficos, física y subtick system dan una nueva vida al clásico.' },
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
      switchMap(() => this.pandaService.getCS2Matches())
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
            streamUrl: this.pandaService.getStreamByLeague(leagueName, m.live_url, m.serie?.name, m.tournament?.name, 'cs2'),
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
    window.open(url?.startsWith('http') ? url : 'https://www.twitch.tv/eslcs', '_blank');
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
