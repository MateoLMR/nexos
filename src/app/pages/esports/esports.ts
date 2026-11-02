import { AfterViewInit, ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { of, catchError, map, Subscription, timer, switchMap } from 'rxjs';
import { ClaveEsport, PandaScoreService, PartidosPorJuego, Torneo } from '../../core/services/pandascore';
import { MotionService } from '../../shared/utils/motion';
import { Icono } from '../../shared/ui/icono';
import { AficheDirective } from '../../shared/directives/afiche.directive';

interface EsportCard {
  id: string;
  titulo: string;
  genero: string;
  descripcion: string;
  color: string;
  ruta: string;
  imagen: string;
}

interface PartidoVivo {
  id: string;
  juego: string;
  ruta: string;
  liga: string;
  a: string;
  b: string;
  logoA: string;
  logoB: string;
  enVivo: boolean;
  inicio: number;
  hora: string;
}

// Cartelera de eSports: los cuatro juegos, lo que está en vivo ahora y el calendario del año.
@Component({
  selector: 'app-esports',
  imports: [RouterLink, Icono, AficheDirective],
  templateUrl: './esports.html',
  styleUrl: './esports.css',
})
export class Esports implements OnInit, AfterViewInit, OnDestroy {
  private panda = inject(PandaScoreService);
  private motion = inject(MotionService);
  private cdr = inject(ChangeDetectorRef);
  private sub?: Subscription;

  readonly cards: EsportCard[] = [
    { id: 'lol', titulo: 'League of Legends', genero: 'MOBA', descripcion: 'El rey de los MOBA a nivel competitivo. Millones de espectadores cada Worlds.', color: '#c89b3c', ruta: '/esports/league', imagen: 'Imagenes-esports/League-of-Legends-logo.png' },
    { id: 'cs2', titulo: 'Counter-Strike 2', genero: 'FPS', descripcion: 'Pura precisión táctica. El FPS que definió el eSport competitivo durante 20 años.', color: '#f0a500', ruta: '/esports/counter', imagen: 'Logos-Juegos/CSGO.png' },
    { id: 'dota2', titulo: 'Dota 2', genero: 'MOBA', descripcion: 'The International: el prize pool más grande de la historia del eSport.', color: '#c23c2a', ruta: '/esports/dota', imagen: 'Imagenes-esports/Dota2.png' },
    { id: 'valorant', titulo: 'Valorant', genero: 'FPS', descripcion: 'Habilidades tácticas y puntería. El FPS que desafió el trono de CS.', color: '#ff4655', ruta: '/esports/valorant', imagen: 'Imagenes-esports/valorant.png' },
  ];

  // Torneos grandes que trae PandaScore (en curso, próximos y terminados recientes); null = cargando
  torneos = signal<Torneo[] | null>(null);
  torneosError = signal(false);

  partidos = signal<PartidoVivo[] | null>(null);
  // La última consulta falló: se muestra "reintentando" en vez de "no hay partidos"
  partidosError = signal(false);

  // Juegos (ids de las tarjetas) que tienen un partido en vivo ahora mismo
  enVivoIds = computed(() => {
    const ids: Record<string, string> = { Valorant: 'valorant', CS2: 'cs2', LoL: 'lol', 'Dota 2': 'dota2' };
    return new Set((this.partidos() ?? []).filter((p) => p.enVivo).map((p) => ids[p.juego]));
  });

  // El juego con partido en vivo va primero (afiche grande)
  cardsOrdenadas = computed(() => {
    const vivos = this.enVivoIds();
    return [...this.cards].sort((a, b) => Number(vivos.has(b.id)) - Number(vivos.has(a.id)));
  });

  ngOnInit(): void {
    // Se pide al entrar y luego cada 60 segundos. Un error no apaga el ciclo: el siguiente minuto reintenta.
    this.sub = timer(0, 60_000).pipe(
      switchMap((n) => this.panda.partidos(n > 0).pipe(
        map((r) => this.aLista(r)),
        catchError(() => of(null)),
      )),
    ).subscribe((lista) => {
      if (lista === null) {
        this.partidosError.set(true);
        return; // se dejan los partidos que ya había, si había
      }
      const anteriores = this.partidos();
      this.partidosError.set(false);
      this.partidos.set(lista);
      this.cdr.markForCheck();
      if (anteriores === null) requestAnimationFrame(() => this.motion.entrar(document.querySelectorAll('.vivo-item'), { x: 30, stagger: 0.05 }));
    });

    this.panda.torneos().subscribe({
      next: (t) => this.torneos.set(t),
      error: () => { this.torneos.set([]); this.torneosError.set(true); },
    });
  }

  ngAfterViewInit(): void {
    this.motion.entrar(document.querySelectorAll('[data-entra]'), { y: 24, stagger: 0.08 });
    // Un solo disparador para toda la pared: los afiches cambian de lugar cuando hay un partido en vivo,
    // y un disparador por afiche se quedaría con la posición vieja (el afiche movido no aparecía)
    const pared = document.querySelector('.pared-juegos');
    const afiches = document.querySelectorAll('.juego-afiche');
    if (pared && afiches.length && !this.motion.reducido()) {
      this.motion.gsap.from(afiches, {
        y: -40, rotate: (i: number) => (i % 2 ? 5 : -5), opacity: 0, ease: 'back.out(1.5)', duration: 0.9, stagger: 0.1,
        clearProps: 'opacity,transform',
        scrollTrigger: { trigger: pared, start: 'top 85%', once: true },
      });
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.motion.limpiarScroll();
  }

  private aLista(r: PartidosPorJuego): PartidoVivo[] {
    const juegos: { clave: ClaveEsport; juego: string; ruta: string }[] = [
      { clave: 'valorant', juego: 'Valorant', ruta: '/esports/valorant' },
      { clave: 'cs2', juego: 'CS2', ruta: '/esports/counter' },
      { clave: 'lol', juego: 'LoL', ruta: '/esports/league' },
      { clave: 'dota2', juego: 'Dota 2', ruta: '/esports/dota' },
    ];
    const todos = juegos.flatMap((j) => (r.partidos[j.clave] ?? [])
      .filter((m: any) => m?.opponents?.length === 2)
      .map((m: any) => this.aPartido(m, j.juego, j.ruta)));
    const vivos = todos.filter((p) => p.enVivo);
    // Si no hay nada en vivo se muestran los próximos, del más cercano al más lejano
    return (vivos.length ? vivos : todos.sort((a, b) => a.inicio - b.inicio)).slice(0, 8);
  }

  /** "15 oct – 15 nov 2026" a partir de las fechas del torneo */
  fechasTorneo(t: Torneo): string {
    const f = (s: string, conAnio: boolean) => new Date(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', ...(conAnio ? { year: 'numeric' } : {}) });
    return t.hasta && t.hasta.slice(0, 10) !== t.desde.slice(0, 10) ? `${f(t.desde, false)} – ${f(t.hasta, true)}` : f(t.desde, true);
  }

  estadoTorneo(t: Torneo): string {
    return { en_curso: 'En curso', proximo: 'Próximo', terminado: 'Terminado' }[t.estado];
  }

  private aPartido(m: any, juego: string, ruta: string): PartidoVivo {
    const a = m.opponents[0].opponent, b = m.opponents[1].opponent;
    return {
      id: String(m.id), juego, ruta,
      liga: m.league?.name ?? 'Torneo profesional',
      a: a?.acronym || a?.name, b: b?.acronym || b?.name,
      logoA: a?.image_url ?? '', logoB: b?.image_url ?? '',
      enVivo: m.status === 'running',
      inicio: new Date(m.begin_at).getTime(),
      hora: new Date(m.begin_at).toLocaleString('es-CO', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
  }

  hayEnVivo() {
    return (this.partidos() ?? []).some((p) => p.enVivo);
  }

  logoPorDefecto(e: Event) {
    const img = e.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'Imagenes/usuario.png';
  }
}
