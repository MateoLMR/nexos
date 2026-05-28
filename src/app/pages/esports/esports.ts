import {
  Component,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

// Interfaces

interface EsportCard {
  id: string;
  titulo: string;
  subtitulo: string;
  descripcion: string;
  color: string;           // color dominante de la card
  glow: string;            // rgba para el box-shadow en hover
  ruta: string;
  tag: string;             // etiqueta de categoría
  imagen: string;
}

interface Noticia {
  juego: string;           // nombre del juego al que pertenece
  color: string;           // color del juego para el acento visual
  titulo: string;          // título de la noticia / evento
  fecha: string;           // fecha del evento
  tipo: 'Torneo' | 'Parche' | 'Próximo';  // badge de tipo
}

// Partícula para el efecto Pixel Blast
interface Pixel {
  x: number;               // posición x actual
  y: number;               // posición y actual
  vx: number;              // velocidad horizontal
  vy: number;              // velocidad vertical
  size: number;            // tamaño del cuadrado (px)
  alpha: number;           // opacidad actual (0-1)
  decay: number;           // velocidad de desvanecimiento
  color: string;           // color CSS
}

@Component({
  selector: 'app-esports',
  imports: [CommonModule, RouterLink],
  templateUrl: './esports.html',
  styleUrl: './esports.css',
})
export class Esports implements OnInit, AfterViewInit, OnDestroy {

  // Referencia al canvas del fondo
  @ViewChild('pixelCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Estado de hover de cards
  cardHover = signal<string | null>(null);

  // Índice activo del carrusel de noticias
  noticiaActiva = signal(0);

  // Loop de canvas y partículas
  private pixels: Pixel[] = [];
  private animFrameId = 0;
  private spawnInterval = 0;
  private ctx!: CanvasRenderingContext2D;

  // Colores de partículas
  private readonly pixelColors = [
    '#7c3aed', '#d946ef', '#6366f1',
    '#a855f7', '#f0abfc', '#c026d3',
    '#4f46e5', '#818cf8',
  ];

  // Cards de eSports
  readonly cards: EsportCard[] = [
    {
      id: 'lol',
      titulo: 'League of Legends',
      subtitulo: 'MOBA',
      descripcion: 'El rey de los MOBA a nivel competitivo. Millones de espectadores cada Worlds.',
      color: '#c89b3c',
      glow: 'rgba(200,155,60,0.55)',
      ruta: '/esports/league',
      tag: 'MOBA',
      imagen: '/Imagenes-esports/League-of-Legends-logo.png'
    },
    {
      id: 'cs2',
      titulo: 'Counter-Strike 2',
      subtitulo: 'FPS',
      descripcion: 'Pura precisión táctica. El FPS que definió el eSport competitivo durante 20 años.',
      color: '#4b3fa8',
      glow: 'rgba(75,63,168,0.55)',
      ruta: '/esports/counter',
      tag: 'FPS',
      imagen: '/Logos-Juegos/CSGO.png'
    },
    {
      id: 'dota2',
      titulo: 'Dota 2',
      subtitulo: 'MOBA',
      descripcion: 'The International: el prize pool más grande de la historia del eSport.',
      color: '#8b0000',
      glow: 'rgba(139,0,0,0.55)',
      ruta: '/esports/dota',
      tag: 'MOBA',
      imagen: '/Imagenes-esports/Dota2.png'
    },
    {
      id: 'valorant',
      titulo: 'Valorant',
      subtitulo: 'FPS',
      descripcion: 'Habilidades tácticas y puntería. El FPS que desafió el trono de CS.',
      color: '#ff4655',
      glow: 'rgba(255,70,85,0.55)',
      ruta: '/esports/valorant',
      tag: 'FPS',
      imagen: '/Imagenes-esports/valorant.png'
    },
  ];

  // Noticias / eventos próximos para el carrusel
  readonly noticias: Noticia[] = [
    {
      juego: 'League of Legends',
      color: '#c89b3c',
      titulo: 'Worlds 2026 · Estados Unidos',
      fecha: 'Oct – Nov 2026',
      tipo: 'Torneo',
    },
    {
      juego: 'Counter-Strike 2',
      color: '#4b3fa8',
      titulo: 'IEM Cologne 2026',
      fecha: '2 – 21 Jun 2026',
      tipo: 'Torneo',
    },
    {
      juego: 'Dota 2',
      color: '#8b0000',
      titulo: 'Esports World Cup · Riyadh',
      fecha: '7 – 18 Jul 2026',
      tipo: 'Próximo',
    },
    {
      juego: 'Valorant',
      color: '#ff4655',
      titulo: 'Champions Tour · Shanghái',
      fecha: '24 Sep – 18 Oct 2026',
      tipo: 'Torneo',
    },
  ];

  // Timer del carrusel
  private carruselTimer = 0;

  ngOnInit(): void {
    // Avanza el carrusel automáticamente cada 4 segundos
    this.carruselTimer = window.setInterval(() => {
      this.noticiaActiva.update(i => (i + 1) % this.noticias.length);
    }, 4000);
  }

  ngAfterViewInit(): void {
    this.iniciarPixelBlast();
  }

  ngOnDestroy(): void {
    // Limpieza de recursos al destruir el componente
    cancelAnimationFrame(this.animFrameId);
    clearInterval(this.spawnInterval);
    clearInterval(this.carruselTimer);
  }

  // PIXEL BLAST: inicialización del canvas
  private iniciarPixelBlast(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Ajustar tamaño al viewport y actualizar en resize
    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generar un "blast" de píxeles desde una posición aleatoria del canvas
    const spawnBlast = () => {
      const cx = Math.random() * canvas.width;
      const cy = Math.random() * canvas.height;
      const count = 18 + Math.floor(Math.random() * 22); // 18-40 partículas por blast

      for (let i = 0; i < count; i++) {
        const angle  = Math.random() * Math.PI * 2;
        const speed  = 0.8 + Math.random() * 3.5;
        const color  = this.pixelColors[Math.floor(Math.random() * this.pixelColors.length)];

        this.pixels.push({
          x:     cx,
          y:     cy,
          vx:    Math.cos(angle) * speed,
          vy:    Math.sin(angle) * speed,
          size:  2 + Math.random() * 5,        // tamaño entre 2px y 7px
          alpha: 0.7 + Math.random() * 0.3,    // opacidad inicial alta
          decay: 0.008 + Math.random() * 0.012, // cuán rápido desaparece
          color,
        });
      }
    };

    // Disparar un blast cada 320ms para mantener la densidad sin sobrecargar
    this.spawnInterval = window.setInterval(spawnBlast, 320);

    // Loop de animación principal
    const loop = () => {
      // Fondo semi-transparente para el efecto de trail (estela)
      this.ctx.fillStyle = 'rgba(6, 6, 14, 0.18)';
      this.ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Actualizar y dibujar cada partícula
      this.pixels = this.pixels.filter(p => p.alpha > 0.01);

      for (const p of this.pixels) {
        // Movimiento con fricción suave
        p.x  += p.vx;
        p.y  += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.alpha -= p.decay;

        // Dibujar el píxel como un rectángulo cuadrado
        this.ctx.globalAlpha = Math.max(0, p.alpha);
        this.ctx.fillStyle   = p.color;
        this.ctx.fillRect(p.x, p.y, p.size, p.size);
      }

      this.ctx.globalAlpha = 1;
      this.animFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  // Helpers de UI

  setHover(id: string | null): void {
    this.cardHover.set(id);
  }

  irNoticia(i: number): void {
    this.noticiaActiva.set(i);
  }

  trackById(_: number, c: EsportCard): string {
    return c.id;
  }

  trackByIndex(i: number): number {
    return i;
  }

  // Color del badge según el tipo de noticia
  getBadgeColor(tipo: Noticia['tipo']): string {
    if (tipo === 'Torneo')  return 'rgba(124,58,237,0.3)';
    if (tipo === 'Parche')  return 'rgba(16,185,129,0.3)';
    return 'rgba(245,158,11,0.3)';
  }

  getBadgeText(tipo: Noticia['tipo']): string {
    if (tipo === 'Torneo')  return '#a78bfa';
    if (tipo === 'Parche')  return '#34d399';
    return '#fcd34d';
  }
}
