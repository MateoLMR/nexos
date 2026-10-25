import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import {
  ArrowLeft, ArrowRight, Calendar, Check, ChevronDown, Clock, ExternalLink, Gamepad2, Heart,
  Image, LayoutGrid, List, LogIn, LogOut, MessageCircle, Minus, Monitor, Play, Plus, Radio,
  Scale, Search, Send, Store, Tag, Trophy, TriangleAlert, User, X, Swords, Tv, Eye, ArrowLeftRight,
  type IconNode,
} from 'lucide';

// Íconos disponibles (Lucide, trazo de 24px). Se agregan aquí para mantener el bundle pequeño.
const ICONOS: Record<string, IconNode> = {
  'arrow-left': ArrowLeft, 'arrow-right': ArrowRight, calendar: Calendar, check: Check,
  'chevron-down': ChevronDown, clock: Clock, 'external-link': ExternalLink, gamepad: Gamepad2,
  heart: Heart, image: Image, grid: LayoutGrid, list: List, 'log-in': LogIn, 'log-out': LogOut,
  message: MessageCircle, minus: Minus, monitor: Monitor, play: Play, plus: Plus, radio: Radio,
  scale: Scale, search: Search, send: Send, store: Store, tag: Tag, trophy: Trophy,
  alert: TriangleAlert, user: User, x: X, swords: Swords, swap: ArrowLeftRight, tv: Tv, eye: Eye,
};

export type NombreIcono = keyof typeof ICONOS;

// <app-icono nombre="search" /> → SVG en línea que hereda el color del texto.
@Component({
  selector: 'app-icono',
  template: `<span class="contents" [innerHTML]="svg()"></span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-flex;line-height:0;flex-shrink:0' },
})
export class Icono {
  private sanitizer = inject(DomSanitizer);
  nombre = input.required<string>();
  tam = input<number>(20);
  trazo = input<number>(2);
  relleno = input<boolean>(false);

  svg = computed<SafeHtml>(() => {
    const nodos = ICONOS[this.nombre()] ?? [];
    const hijos = nodos
      .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ')}/>`)
      .join('');
    const fill = this.relleno() ? 'currentColor' : 'none';
    return this.sanitizer.bypassSecurityTrustHtml(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.tam()}" height="${this.tam()}" viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="${this.trazo()}" stroke-linecap="round" stroke-linejoin="round">${hijos}</svg>`
    );
  });
}
