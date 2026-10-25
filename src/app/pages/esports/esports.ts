import { AfterViewInit, ChangeDetectorRef, Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin, of, catchError, map, Subscription, timer, switchMap } from 'rxjs';
import { PandaScoreService } from '../../services/pandascore';
import { MotionService } from '../../shared/motion';
import { Icono } from '../../shared/icono';
import { AficheDirective } from '../../shared/afiche.directive';

interface EsportCard {
  id: string;
  titulo: string;
  genero: string;
  descripcion: string;
  color: string;
  ruta: string;
  imagen: string;
}

interface Evento {
  juego: string;
  color: string;
  titulo: string;
  fecha: string;
  desde: string;
  hasta: string;
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

  readonly eventos: (Evento & { estado: string })[] = [
    { juego: 'League of Legends', color: '#c89b3c', titulo: 'Worlds 2026 · Estados Unidos', fecha: 'Oct – Nov 2026', desde: '2026-10-01', hasta: '2026-11-30' },
    { juego: 'Valorant', color: '#ff4655', titulo: 'Champions Tour · Shanghái', fecha: '24 sep – 18 oct 2026', desde: '2026-09-24', hasta: '2026-10-18' },
    { juego: 'Dota 2', color: '#c23c2a', titulo: 'Esports World Cup · Riad', fecha: '7 – 18 jul 2026', desde: '2026-07-07', hasta: '2026-07-18' },
    { juego: 'Counter-Strike 2', color: '#f0a500', titulo: 'IEM Cologne 2026', fecha: '2 – 21 jun 2026', desde: '2026-06-02', hasta: '2026-06-21' },
  ].map((e) => ({ ...e, estado: this.estado(e.desde, e.hasta) }));

  partidos = signal<PartidoVivo[] | null>(null);

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
    // Se pide al entrar y luego cada 60 segundos
    this.sub = timer(0, 60_000).pipe(switchMap(() => this.pedirPartidos())).subscribe((lista) => {
      const anteriores = this.partidos();
      this.partidos.set(lista);
      this.cdr.detectChanges();
      if (anteriores === null) this.motion.entrar(document.querySelectorAll('.vivo-item'), { x: 30, stagger: 0.05 });
    });
  }

  ngAfterViewInit(): void {
    this.motion.entrar(document.querySelectorAll('[data-entra]'), { y: 24, stagger: 0.08 });
    document.querySelectorAll('.juego-afiche').forEach((el, i) =>
      this.motion.alScroll(el, { y: -40, rotate: i % 2 ? 5 : -5, opacity: 0, ease: 'back.out(1.5)', duration: 0.9 })
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.motion.limpiarScroll();
  }

  private pedirPartidos() {
    const juegos = [
      { obs: this.panda.getValorantMatches(), juego: 'Valorant', ruta: '/esports/valorant' },
      { obs: this.panda.getCS2Matches(), juego: 'CS2', ruta: '/esports/counter' },
      { obs: this.panda.getLolMatches(), juego: 'LoL', ruta: '/esports/league' },
      { obs: this.panda.getDota2Matches(), juego: 'Dota 2', ruta: '/esports/dota' },
    ];
    return forkJoin(juegos.map((j) => j.obs.pipe(
      map((ms) => (ms ?? []).filter((m: any) => m?.opponents?.length === 2).map((m: any) => this.aPartido(m, j.juego, j.ruta))),
      catchError(() => of([] as PartidoVivo[]))
    ))).pipe(map((listas) => {
      const todos = listas.flat();
      const vivos = todos.filter((p) => p.enVivo);
      // Si no hay nada en vivo se muestran los próximos
      return (vivos.length ? vivos : todos).slice(0, 8);
    }));
  }

  private aPartido(m: any, juego: string, ruta: string): PartidoVivo {
    const a = m.opponents[0].opponent, b = m.opponents[1].opponent;
    return {
      id: String(m.id), juego, ruta,
      liga: m.league?.name ?? 'Torneo profesional',
      a: a?.acronym || a?.name, b: b?.acronym || b?.name,
      logoA: a?.image_url ?? '', logoB: b?.image_url ?? '',
      enVivo: m.status === 'running',
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

  private estado(desde: string, hasta: string) {
    const hoy = new Date();
    if (hoy < new Date(desde)) return 'Próximo';
    if (hoy > new Date(`${hasta}T23:59:59`)) return 'Terminado';
    return 'En curso';
  }
}
