import { ChangeDetectorRef, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService, JuegoAdmin, MedioAdmin } from '../../core/services/admin';
import { Icono } from '../../shared/ui/icono';
import { VideoDirective } from '../../shared/directives/video.directive';

const ETIQUETAS_VALORACION = ['Dificultad', 'Rejugabilidad', 'Historia', 'Multijugador'];

// Edición completa de un juego del catálogo
@Component({
  selector: 'app-editar-juego',
  imports: [RouterLink, FormsModule, Icono, VideoDirective],
  templateUrl: './editar-juego.html',
  styleUrl: './admin.css',
})
export class EditarJuego implements OnInit {
  private route = inject(ActivatedRoute);
  private admin = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);

  id = '';
  esNuevo = false;
  juego: JuegoAdmin | null = null;
  error = '';
  guardando = signal(false);
  subiendo = signal<string | null>(null); // 'portada' | 'galeria'
  aviso = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  // Pros y contras se editan como texto, una línea por punto
  prosTexto = '';
  contrasTexto = '';
  nuevaUrl = '';

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    this.esNuevo = this.route.snapshot.queryParamMap.has('nuevo');
    try {
      this.juego = await this.admin.obtener(this.id);
      this.prosTexto = this.juego.pros.join('\n');
      this.contrasTexto = this.juego.contras.join('\n');
      if (this.esNuevo) this.avisar('ok', 'Juego agregado. Revisa la ficha y agrega su valoración, pros y contras.');
    } catch (e) {
      this.error = this.mensaje(e, 'No se pudo cargar el juego.');
    }
    this.cdr.markForCheck();
  }

  // ---------- galería ----------
  mover(i: number, paso: -1 | 1) {
    const g = this.juego!.galeria;
    const j = i + paso;
    if (j < 0 || j >= g.length) return;
    [g[i], g[j]] = [g[j], g[i]];
  }

  quitar(i: number) {
    this.juego!.galeria.splice(i, 1);
  }

  usarDePortada(m: MedioAdmin) {
    this.juego!.imagen = m.thumb || m.src;
  }

  agregarUrl() {
    const url = this.nuevaUrl.trim();
    if (!/^https:\/\//.test(url)) { this.avisar('error', 'Pega una dirección que empiece por https://'); return; }
    const tipo = /\.(mp4|webm|m3u8)(\?|$)/i.test(url) ? 'video' : 'image';
    this.juego!.galeria.push({ tipo, src: url, thumb: tipo === 'image' ? url : this.juego!.imagen });
    this.nuevaUrl = '';
  }

  async subir(evento: Event, destino: 'portada' | 'galeria') {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = '';
    if (!archivo) return;
    if (archivo.size > 100 * 1024 * 1024) { this.avisar('error', 'El archivo pesa más de 100 MB.'); return; }
    this.subiendo.set(destino);
    try {
      const url = await this.admin.subirArchivo(archivo);
      if (destino === 'portada') this.juego!.imagen = url;
      else {
        const tipo = archivo.type.startsWith('video/') ? 'video' : 'image';
        this.juego!.galeria.push({ tipo, src: url, thumb: tipo === 'image' ? url : this.juego!.imagen });
      }
      this.avisar('ok', 'Archivo subido. Recuerda guardar los cambios.');
    } catch (e) {
      this.avisar('error', this.mensaje(e, 'No se pudo subir el archivo.'));
    } finally {
      this.subiendo.set(null);
      this.cdr.markForCheck();
    }
  }

  // ---------- valoración ----------
  agregarValoracion() {
    const usadas = this.juego!.ratings.map((r) => r.label);
    const siguiente = ETIQUETAS_VALORACION.find((e) => !usadas.includes(e)) ?? '';
    this.juego!.ratings.push({ label: siguiente, valor: 50 });
  }

  quitarValoracion(i: number) {
    this.juego!.ratings.splice(i, 1);
  }

  // ---------- guardar ----------
  async guardar() {
    if (!this.juego) return;
    if (!this.juego.titulo?.trim()) { this.avisar('error', 'El título es obligatorio.'); return; }
    this.juego.pros = this.lineas(this.prosTexto);
    this.juego.contras = this.lineas(this.contrasTexto);
    this.guardando.set(true);
    try {
      await this.admin.guardar(this.id, this.juego);
      this.avisar('ok', 'Cambios guardados. Los precios se recalculan en la próxima visita a la ficha.');
    } catch (e) {
      this.avisar('error', this.mensaje(e, 'No se pudo guardar.'));
    } finally {
      this.guardando.set(false);
      this.cdr.markForCheck();
    }
  }

  private lineas(texto: string) {
    return texto.split('\n').map((l) => l.trim()).filter(Boolean);
  }

  private avisar(tipo: 'ok' | 'error', texto: string) {
    this.aviso.set({ tipo, texto });
  }

  private mensaje(e: unknown, porDefecto: string) {
    return (e instanceof HttpErrorResponse && e.error?.error) || porDefecto;
  }
}
