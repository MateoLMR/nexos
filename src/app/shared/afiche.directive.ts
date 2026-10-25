import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MotionService } from './motion';

// appAfiche: la tarjeta se inclina en 3D siguiendo el mouse y "se despega" de la pared.
@Directive({ selector: '[appAfiche]' })
export class AficheDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLElement>);
  private motion = inject(MotionService);
  // Se usa sin valor (<div appAfiche>) o con grados de inclinación (<div appAfiche="12">)
  inclinacion = input<number, unknown>(8, { alias: 'appAfiche', transform: (v) => Number(v) || 8 });

  private alMover = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const r = this.el.nativeElement.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const max = this.inclinacion() || 8;
    this.motion.gsap.to(this.el.nativeElement, {
      rotateY: x * max,
      rotateX: -y * max,
      rotateZ: 0,
      y: -6,
      transformPerspective: 900,
      duration: 0.4,
      ease: 'power3.out',
    });
  };

  private alSalir = () => {
    this.motion.gsap.to(this.el.nativeElement, {
      rotateY: 0, rotateX: 0, y: 0, clearProps: 'rotate,rotateX,rotateY,rotateZ,y,transformPerspective',
      duration: 0.6, ease: 'elastic.out(1, 0.6)',
    });
  };

  ngOnInit() {
    if (this.motion.reducido()) return;
    const n = this.el.nativeElement;
    n.addEventListener('pointermove', this.alMover);
    n.addEventListener('pointerleave', this.alSalir);
  }

  ngOnDestroy() {
    const n = this.el.nativeElement;
    n.removeEventListener('pointermove', this.alMover);
    n.removeEventListener('pointerleave', this.alSalir);
    this.motion.gsap.killTweensOf(n);
  }
}
