import { Directive, ElementRef, effect, inject, input, OnDestroy, output } from '@angular/core';
import type Hls from 'hls.js';

// Reproduce en un <video> tanto archivos normales (mp4, webm) como streams HLS (.m3u8, los tráileres de Steam).
// Safari entiende HLS por sí solo; en los demás navegadores se carga hls.js solo cuando hace falta.
//   <video [appVideo]="url" [autoplay]="true" (sinSonido)="..." controls></video>
// Con autoplay arranca solo con el volumen indicado. Si el navegador no deja reproducir con sonido
// (pasa al abrir un enlace directo sin haber tocado la página), arranca silenciado y avisa con (sinSonido).
@Directive({ selector: 'video[appVideo]', exportAs: 'appVideo' })
export class VideoDirective implements OnDestroy {
  readonly appVideo = input.required<string>();
  readonly autoplay = input(false);
  readonly volumen = input(0.5);
  readonly sinSonido = output<boolean>();

  private video = inject(ElementRef<HTMLVideoElement>).nativeElement as HTMLVideoElement;
  private hls?: Hls;

  constructor() {
    effect(() => this.cargar(this.appVideo()));
  }

  /** Quita el silencio después de que el usuario lo pide */
  activarSonido() {
    this.video.muted = false;
    this.video.volume = this.volumen();
    this.sinSonido.emit(false);
    if (this.video.paused) this.video.play().catch(() => {});
  }

  private async cargar(url: string) {
    this.hls?.destroy();
    this.hls = undefined;
    if (this.autoplay()) this.video.addEventListener('loadedmetadata', () => this.arrancar(), { once: true });
    const esHls = /\.m3u8(\?|$)/i.test(url);
    if (!esHls) {
      this.video.src = url;
      return;
    }
    // hls.js primero en todo navegador que lo soporte: el HLS nativo nuevo de Chrome de escritorio se queda
    // cargando con los tráileres de Steam (el audio viene en una pista aparte). El nativo queda para iPhone.
    const { default: HlsJs } = await import('hls.js');
    if (url !== this.appVideo()) return; // cambió de video mientras cargaba la librería
    if (!HlsJs.isSupported()) { this.video.src = url; return; }
    const hls = new HlsJs({ capLevelToPlayerSize: true });
    this.hls = hls;
    // Errores graves: se intenta recuperar una vez; si no se puede, queda el póster
    let reintentos = 0;
    hls.on(HlsJs.Events.ERROR, (_e, datos) => {
      if (!datos.fatal || reintentos++ > 1) return;
      if (datos.type === HlsJs.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
      else if (datos.type === HlsJs.ErrorTypes.NETWORK_ERROR) hls.startLoad();
    });
    hls.loadSource(url);
    hls.attachMedia(this.video);
  }

  private async arrancar() {
    this.video.muted = false;
    this.video.volume = this.volumen();
    try {
      await this.video.play();
      this.sinSonido.emit(false);
    } catch (e) {
      // Sin permiso para sonido: se intenta silenciado
      if ((e as DOMException)?.name !== 'NotAllowedError') return;
      this.video.muted = true;
      try {
        await this.video.play();
        this.sinSonido.emit(true);
      } catch { /* el navegador no deja ni silenciado: queda el póster y el botón de play */ }
    }
  }

  ngOnDestroy() {
    this.video.pause();
    this.hls?.destroy();
  }
}
