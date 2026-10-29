import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService, FilaAdmin, ResultadoRawg, UsoAlmacenamiento } from '../../core/services/admin';
import { Icono } from '../../shared/ui/icono';

// Panel de administración: uso de almacenamiento, agregar juegos desde RAWG y la lista del catálogo.
@Component({
  selector: 'app-admin',
  imports: [RouterLink, Icono],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit {
  private admin = inject(AdminService);
  private router = inject(Router);

  // Catálogo
  juegos = signal<FilaAdmin[] | null>(null);
  filtro = signal('');
  visibles = computed(() => {
    const q = this.filtro().toLowerCase().trim();
    return (this.juegos() ?? []).filter((j) => !q || j.titulo.toLowerCase().includes(q) || j.id.includes(q));
  });
  borrando = signal<string | null>(null);
  confirmarBorrar = signal<FilaAdmin | null>(null);

  // Importar desde RAWG
  busqueda = signal('');
  resultados = signal<ResultadoRawg[] | null>(null);
  buscando = signal(false);
  importando = signal<string | null>(null);

  uso = signal<UsoAlmacenamiento | null>(null);
  actualizandoRecientes = signal(false);
  aviso = signal<{ tipo: 'ok' | 'error'; texto: string } | null>(null);

  ngOnInit() {
    this.cargar();
    this.admin.uso().then((u) => this.uso.set(u), () => this.uso.set(null));
  }

  async cargar() {
    try {
      this.juegos.set(await this.admin.listar());
    } catch (e) {
      this.juegos.set([]);
      this.avisar('error', this.mensaje(e, 'No se pudo cargar el catálogo.'));
    }
  }

  async buscar(evento?: Event) {
    evento?.preventDefault();
    const q = this.busqueda().trim();
    if (q.length < 2) return;
    this.buscando.set(true);
    try {
      this.resultados.set(await this.admin.buscarRawg(q));
    } catch (e) {
      this.avisar('error', this.mensaje(e, 'RAWG no respondió. Intenta de nuevo.'));
    } finally {
      this.buscando.set(false);
    }
  }

  async importar(r: ResultadoRawg) {
    if (r.juegoId) { this.router.navigate(['/admin/juego', r.juegoId]); return; }
    this.importando.set(r.slug);
    try {
      const { id } = await this.admin.importar(r.slug);
      // Se abre la ficha para revisarla (valoración, pros y contras se llenan a mano)
      this.router.navigate(['/admin/juego', id], { queryParams: { nuevo: 1 } });
    } catch (e) {
      this.avisar('error', this.mensaje(e, 'No se pudo importar el juego.'));
      this.importando.set(null);
    }
  }

  async borrar(j: FilaAdmin) {
    this.confirmarBorrar.set(null);
    this.borrando.set(j.id);
    try {
      await this.admin.borrar(j.id);
      this.juegos.update((lista) => (lista ?? []).filter((x) => x.id !== j.id));
      this.avisar('ok', `"${j.titulo}" se eliminó del catálogo.`);
    } catch (e) {
      this.avisar('error', this.mensaje(e, 'No se pudo eliminar.'));
    } finally {
      this.borrando.set(null);
    }
  }

  async actualizarRecientes() {
    this.actualizandoRecientes.set(true);
    try {
      const r = await this.admin.actualizarRecientes();
      this.avisar('ok', `"Recién llegados" se actualizó con ${r.guardados} juegos.`);
    } catch (e) {
      this.avisar('error', this.mensaje(e, 'No se pudo actualizar "Recién llegados".'));
    } finally {
      this.actualizandoRecientes.set(false);
    }
  }

  porcentaje(bytes: number, limite: number) {
    return Math.min(100, Math.round((bytes / limite) * 1000) / 10);
  }

  tamano(bytes: number) {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  private avisar(tipo: 'ok' | 'error', texto: string) {
    this.aviso.set({ tipo, texto });
  }

  private mensaje(e: unknown, porDefecto: string) {
    return (e instanceof HttpErrorResponse && e.error?.error) || porDefecto;
  }
}
