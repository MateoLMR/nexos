import { Injectable, signal } from '@angular/core';
import { gsap } from 'gsap';
import { ScrollTrigger, Flip } from 'gsap/all';

// En entornos sin matchMedia (pruebas con jsdom) los plugins no se registran y todo queda estático
const hayMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function';
if (hayMatchMedia) gsap.registerPlugin(ScrollTrigger, Flip);

// Centraliza la animación del sitio y respeta "reducir movimiento" del sistema.
@Injectable({ providedIn: 'root' })
export class MotionService {
  readonly reducido = signal(false);

  constructor() {
    if (!hayMatchMedia) { this.reducido.set(true); return; }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.reducido.set(mq.matches);
    mq.addEventListener('change', (e) => this.reducido.set(e.matches));
  }

  get gsap() {
    return gsap;
  }

  // El letrero se enciende como un tubo de luz (parpadeos irregulares). Una vez por sesión.
  encenderLetrero(el: Element, clave = 'letrero') {
    let yaEncendido: string | null = null;
    try { yaEncendido = sessionStorage.getItem(`nexos-${clave}`); } catch { /* sin storage */ }
    if (this.reducido() || yaEncendido) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    try { sessionStorage.setItem(`nexos-${clave}`, '1'); } catch { /* sin storage: igual se anima */ }
    gsap.timeline()
      .set(el, { opacity: 0.08 })
      .to(el, { opacity: 1, duration: 0.05, delay: 0.25 })
      .to(el, { opacity: 0.15, duration: 0.05, delay: 0.08 })
      .to(el, { opacity: 1, duration: 0.04, delay: 0.12 })
      .to(el, { opacity: 0.3, duration: 0.04, delay: 0.05 })
      .to(el, { opacity: 1, duration: 0.25, ease: 'power2.out', delay: 0.1 });
  }

  // Entrada escalonada (para listas: filas del tablero, tarjetas)
  entrar(elementos: Element[] | NodeListOf<Element>, opciones: { y?: number; x?: number; stagger?: number; delay?: number } = {}) {
    const lista = Array.from(elementos);
    if (!lista.length) return;
    if (this.reducido()) {
      gsap.fromTo(lista, { opacity: 0 }, { opacity: 1, duration: 0.2 });
      return;
    }
    gsap.fromTo(
      lista,
      { opacity: 0, y: opciones.y ?? 18, x: opciones.x ?? 0 },
      { opacity: 1, y: 0, x: 0, duration: 0.6, ease: 'expo.out', stagger: opciones.stagger ?? 0.06, delay: opciones.delay ?? 0, clearProps: 'transform' }
    );
  }

  // Revela al hacer scroll: cada sección elige su propio movimiento para que no todas entren igual
  alScroll(el: Element, desde: gsap.TweenVars, opciones: { start?: string } = {}) {
    if (this.reducido()) return;
    gsap.from(el, {
      ...desde,
      duration: (desde['duration'] as number) ?? 0.8,
      ease: (desde['ease'] as string) ?? 'expo.out',
      scrollTrigger: { trigger: el, start: opciones.start ?? 'top 85%', once: true },
    });
  }

  // Reordenar con Flip: captura estado, aplica el cambio, anima a la nueva posición
  flip(selector: string | Element[], cambio: () => void, opciones: { scope?: Element } = {}) {
    const objetivos = typeof selector === 'string'
      ? Array.from((opciones.scope ?? document).querySelectorAll(selector))
      : selector;
    if (this.reducido() || !objetivos.length) {
      cambio();
      return;
    }
    const estado = Flip.getState(objetivos);
    cambio();
    requestAnimationFrame(() => {
      const nuevos = typeof selector === 'string'
        ? Array.from((opciones.scope ?? document).querySelectorAll(selector))
        : selector;
      Flip.from(estado, {
        targets: nuevos,
        duration: 0.55,
        ease: 'expo.out',
        absolute: false,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.45, ease: 'expo.out' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, duration: 0.2 }),
      });
    });
  }

  refrescarScroll() {
    if (hayMatchMedia) ScrollTrigger.refresh();
  }

  limpiarScroll() {
    if (hayMatchMedia) ScrollTrigger.getAll().forEach((t) => t.kill());
  }
}
