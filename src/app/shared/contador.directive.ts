import { Directive, ElementRef, effect, inject, input } from '@angular/core';
import { MotionService } from './motion';

// appContador: el número "rueda" desde 0 (o el valor anterior) hasta el valor final.
// Acepta números o textos con número ("157.600 COP" → rueda 157600 y conserva el formato).
@Directive({ selector: '[appContador]' })
export class ContadorDirective {
  private el = inject(ElementRef<HTMLElement>);
  private motion = inject(MotionService);
  valor = input<string | number | null | undefined>(null, { alias: 'appContador' });
  retraso = input<number>(0, { alias: 'contadorRetraso' });

  private anterior = 0;

  constructor() {
    effect(() => {
      const v = this.valor();
      const texto = v === null || v === undefined ? '' : String(v);
      this.animar(texto);
    });
  }

  private animar(texto: string) {
    const nodo = this.el.nativeElement;
    // Separa prefijo, número y sufijo: "157.600 COP", "8.99 US", "92"
    const m = texto.match(/^(\D*?)(\d[\d.,]*)(.*)$/);
    if (!m || this.motion.reducido()) {
      nodo.textContent = texto;
      return;
    }
    const [, pre, num, suf] = m;
    // Decide si "." es separador de miles (157.600) o decimal (8.99)
    const usaMilesConPunto = /^\d{1,3}(\.\d{3})+$/.test(num);
    const decimales = !usaMilesConPunto && num.includes('.') ? num.split('.')[1].length : 0;
    const objetivo = usaMilesConPunto ? Number(num.replace(/\./g, '')) : Number(num.replace(/,/g, ''));
    if (!isFinite(objetivo)) {
      nodo.textContent = texto;
      return;
    }
    const fmt = (n: number) =>
      usaMilesConPunto
        ? Math.round(n).toLocaleString('es-CO')
        : decimales ? n.toFixed(decimales) : String(Math.round(n));

    const estado = { n: this.anterior };
    this.motion.gsap.to(estado, {
      n: objetivo,
      duration: 1.1,
      delay: this.retraso(),
      ease: 'expo.out',
      onUpdate: () => { nodo.textContent = `${pre}${fmt(estado.n)}${suf}`; },
      onComplete: () => { nodo.textContent = texto; },
    });
    this.anterior = objetivo;
  }
}
