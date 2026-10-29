import { Directive, ElementRef, effect, inject, input, OnDestroy } from '@angular/core';
import type Hls from 'hls.js';

// Reproduce en un <video> tanto archivos normales (mp4, webm) como streams HLS (.m3u8, los tráileres de Steam).
// Safari entiende HLS por sí solo; en los demás navegadores se carga hls.js solo cuando hace falta.
//   <video [appVideo]="url" controls></video>
@Directive({ selector: 'video[appVideo]' })
export class VideoDirective implements OnDestroy {
  readonly appVideo = input.required<string>();
  private video = inject(ElementRef<HTMLVideoElement>).nativeElement as HTMLVideoElement;
  private hls?: Hls;

  constructor() {
    effect(() => this.cargar(this.appVideo()));
  }

  private async cargar(url: string) {
    this.hls?.destroy();
    this.hls = undefined;
    const esHls = /\.m3u8(\?|$)/i.test(url);
    if (!esHls || this.video.canPlayType('application/vnd.apple.mpegurl')) {
      this.video.src = url;
      return;
    }
    const { default: HlsJs } = await import('hls.js');
    if (url !== this.appVideo()) return; // cambió de video mientras cargaba la librería
    if (!HlsJs.isSupported()) { this.video.src = url; return; }
    this.hls = new HlsJs({ capLevelToPlayerSize: true });
    this.hls.loadSource(url);
    this.hls.attachMedia(this.video);
  }

  ngOnDestroy() {
    this.hls?.destroy();
  }
}
