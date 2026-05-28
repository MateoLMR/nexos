import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { gsap } from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { JuegosService } from '../../services/juegos';

// Registrar el plugin de texto de GSAP
gsap.registerPlugin(TextPlugin);

// Datos de los creadores
const CREATORS = [
  {
    name: 'Andres Parra',
    role: 'Experto en eSports',
    avatar: 'Avatars/Parra.png',
    color: '#ed4f3a',
    accent: '#ed4f3a',
    badge: 'eSports'
  },
  {
    name: 'Mateo Leal',
    role: 'Creador de Nexos',
    avatar: 'Avatars/Mateo.jpg',
    color: '#0EA5E9',
    accent: '#38BDF8',
    badge: 'Founder'
  },
  {
    name: 'Nicolas Foglea',
    role: 'Bases de datos',
    avatar: 'Avatars/Paloma.jpeg',
    color: '#10B981',
    accent: '#34D399',
    badge: 'Backend'
  }
];

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements AfterViewInit, OnDestroy {

  // Estas variables son para mostrar los juegos destacados en la sección de recomendados, se cargan en el ngOnInit usando el servicio de juegos.ts
  juegoTarjeta1: any;
  juegoTarjeta2: any;
  juegoTarjeta3: any

  constructor(private juegoService: JuegosService) { }

  ngOnInit() {
    // Llamamos al servicio usando el ID específico
    this.juegoTarjeta1 = this.juegoService.getJuegoPorId('cv1');
    this.juegoTarjeta2 = this.juegoService.getJuegoPorId('tw3');
    this.juegoTarjeta3 = this.juegoService.getJuegoPorId('ag4');
  }

  private resizeHandler!: () => void;

  // El resto del código de animaciones y funcionalidades de la página se encuentra en el ngAfterViewInit y en funciones privadas para mantener el código organizado.
  ngAfterViewInit(): void {
    this.iniciarEscritura();
    this.iniciarLogoLoop();
    this.iniciarSwapCards();
    this.iniciarLanyards();
  }

  ngOnDestroy(): void {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  // Loop de logos
  private iniciarLogoLoop(): void {
    const track = document.querySelector('.logo-track') as HTMLElement;
    const originalGroup = document.querySelector('.logo-group') as HTMLElement;
    if (!track || !originalGroup) return;

    while (track.scrollWidth < window.innerWidth * 3) {
      const clone = originalGroup.cloneNode(true) as HTMLElement;
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    }

    // Calculamos el offset después de que los logos hayan renderizado para evitar problemas de carga
    setTimeout(() => {
      const offset = originalGroup.getBoundingClientRect().width;
      if (offset > 0) {
        // Solo inyectamos la variable CSS, la animación ya la maneja home.css
        track.style.setProperty('--loop-offset', `-${offset}px`);
      }
    }, 500);

    this.resizeHandler = () => location.reload();
    window.addEventListener('resize', this.resizeHandler);
  }

  // Animación de escritura con GSAP TextPlugin
  private iniciarEscritura(): void {
    const palabras = [
      'analizar estrategias.',
      'comparar juegos.',
      'conocer la historia de los juegos',
      'aportar en el foro.',
      'conocer sobre los Esports.',
    ];

    const masterTl = gsap.timeline({ repeat: -1 });
    palabras.forEach((palabra) => {
      const tl = gsap.timeline({ repeat: 1, yoyo: true, repeatDelay: 2 });
      tl.to('#Escritura', { duration: 1.5, text: palabra, ease: 'power1.inOut' });
      masterTl.add(tl);
    });

    // Cursor parpadeante
    gsap.to('#Escritura', {
      borderRightColor: 'transparent',
      repeat: -1,
      duration: 0.5,
      ease: 'steps(1)',
    });
  }

  // Swap de tarjetas de la sección de esports/torneos
  private iniciarSwapCards(): void {
    const cards = document.querySelectorAll<HTMLElement>('.card-item');
    let currentIndex = 0;

    const updateCards = () => {
      cards.forEach((card, index) => {
        const offset = (index - currentIndex + cards.length) % cards.length;
        const btn = card.querySelector('a'); // Buscamos el link

        if (offset === 0) {
          card.style.transform = 'translateX(0) scale(1) rotate(0deg)';
          card.style.zIndex = '40'; // Subimos el z-index de la carta activa
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
          if (btn) btn.style.pointerEvents = 'auto'; // Habilitamos el botón
        } else if (offset === 1) {
          card.style.transform = 'translateX(15px) translateY(15px) scale(0.95) rotate(2deg)';
          card.style.zIndex = '20';
          card.style.opacity = '0.7';
          card.style.pointerEvents = 'none'; // Desactivamos clicks en cartas atrás
        } else {
          card.style.transform = 'translateX(30px) translateY(30px) scale(0.9) rotate(4deg)';
          card.style.zIndex = '10';
          card.style.opacity = '0';
          card.style.pointerEvents = 'none';
        }
      });
    };

    cards.forEach((card) => {
      card.addEventListener('click', (e: MouseEvent) => {
        // Si el clic viene del botón "Ver Detalles" (o cualquier link), no hacemos el swap
        if ((e.target as HTMLElement).closest('a')) {
          return;
        }

        currentIndex = (currentIndex + 1) % cards.length;
        updateCards();
      });
    });

    updateCards();
  }

  /* Animación de lanyards con funcionalidad de arrastrar y rotar, esta función se encarga de cargar el script externo
   que maneja la animación y pasarle los datos de los creadores para que se muestren en las credenciales. El diseño y la
   funcionalidad específica de la animación están manejados en el JS externo para mantener este archivo organizado.*/
  private iniciarLanyards(): void {
    const canvasId = 'nexos-lanyard-canvas';

    // 1. Verificar si ya existe para evitar duplicados
    if ((window as any).NexosLanyards) {
      new (window as any).NexosLanyards(canvasId, CREATORS);
      return;
    }

    const script = document.createElement('script');
    // 2. Cargar el script externo que contiene la clase NexosLanyards y su funcionalidad
    script.src = '/JS/Animacion_credencial.js';

    script.onload = () => {
      if ((window as any).NexosLanyards) {
        // 3. Pasamos CREATORS que es la constante definida en home.ts
        new (window as any).NexosLanyards(canvasId, CREATORS);
      }
    };
    document.body.appendChild(script);
  }
}
