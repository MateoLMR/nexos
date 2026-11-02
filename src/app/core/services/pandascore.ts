import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, retry, shareReplay, timer } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaisService } from './pais';

export type ClaveEsport = 'valorant' | 'cs2' | 'lol' | 'dota2';

/** Partidos en vivo y próximos de los 4 juegos (resumidos por la API) */
export interface PartidosPorJuego {
  partidos: Record<ClaveEsport, any[]>;
  fallaron: ClaveEsport[];
}

/** Un torneo grande (una serie de PandaScore: Worlds 2026, IEM Beijing 2026…) */
export interface Torneo {
  id: string;
  juego: ClaveEsport;
  nombreJuego: string;
  liga: string;
  titulo: string;
  imagen: string | null;
  tier: 's' | 'a';
  desde: string;
  hasta: string | null;
  estado: 'en_curso' | 'proximo' | 'terminado';
}

// Si la primera petición falla (función fría, red lenta) se reintenta antes de rendirse
const REINTENTOS = { count: 2, delay: (_: unknown, n: number) => timer(1500 * n) };

@Injectable({ providedIn: 'root' })
export class PandaScoreService {
  private http = inject(HttpClient);
  private pais = inject(PaisService);
  private readonly PROXY = `${environment.apiUrl}/pandascore`;

  // Caché compartida: el inicio y la cartelera usan la misma respuesta durante 30 s
  private partidos$?: Observable<PartidosPorJuego>;
  private partidosHora = 0;
  private torneos$?: Observable<Torneo[]>;

  /** En vivo y próximos de los 4 juegos en una sola petición */
  partidos(forzar = false): Observable<PartidosPorJuego> {
    if (!this.partidos$ || forzar || Date.now() - this.partidosHora > 30_000) {
      this.partidosHora = Date.now();
      this.partidos$ = this.http.get<PartidosPorJuego>(`${this.PROXY}?vista=partidos`).pipe(retry(REINTENTOS), shareReplay(1));
      // Si falla, la siguiente llamada vuelve a pedir en vez de repetir el error guardado
      this.partidos$.subscribe({ error: () => (this.partidos$ = undefined) });
    }
    return this.partidos$;
  }

  /** Torneos grandes: en curso, próximos y terminados recientes */
  torneos(): Observable<Torneo[]> {
    if (!this.torneos$) {
      this.torneos$ = this.http.get<Torneo[]>(`${this.PROXY}?vista=torneos`).pipe(retry(REINTENTOS), shareReplay(1));
      this.torneos$.subscribe({ error: () => (this.torneos$ = undefined) });
    }
    return this.torneos$;
  }

  // VALORANT
  private valorantStreams: { [key: string]: string } = {
    'americas': 'https://www.twitch.tv/valorant_americas',
    'pacific': 'https://www.twitch.tv/valorant_pacific',
    'emea': 'https://www.twitch.tv/valorant_emea',
    'cn': 'https://www.twitch.tv/valorant_cn',
    'dach': 'https://www.twitch.tv/valorantdach',
    'mena': 'https://www.twitch.tv/valorantesports_ar',
    'france': 'https://www.twitch.tv/valorant_fr',
    'spain': 'https://www.twitch.tv/valorant_es',
    'türkiye': 'https://www.twitch.tv/valorant_tur',
    'turkiye': 'https://www.twitch.tv/valorant_tur',
    'brazil': 'https://www.twitch.tv/valorant_br',
    'brasil': 'https://www.twitch.tv/valorant_br',
    'latin america': 'https://www.twitch.tv/valorant_la',
    'latam': 'https://www.twitch.tv/valorant_la',
    'lan': 'https://www.twitch.tv/valorant_la',
    'las': 'https://www.twitch.tv/valorant_la',
    'north america': 'https://www.twitch.tv/valorant_northamerica',
    'game changers': 'https://www.twitch.tv/valorant',
  };

  // CS2
  private cs2Streams: { [key: string]: string } = {
    'blast': 'https://www.twitch.tv/blastpremier',
    'esl': 'https://www.twitch.tv/eslcs',
    'iem': 'https://www.twitch.tv/eslcs',
    'pgl': 'https://www.twitch.tv/pgl',
    'faceit': 'https://www.twitch.tv/eslcs',
    'esea': 'https://www.twitch.tv/esea',
    'dreamhack': 'https://www.twitch.tv/eslcs',
    'thunderpick': 'https://www.youtube.com/@thunderpickesports/streams',
    'cct': 'https://kick.com/cct_cs2',
    'elite': 'https://www.youtube.com/@fiss_cs2_en/streams',
    'major': 'https://www.twitch.tv/pgl',
  };

  // LEAGUE OF LEGENDS
  private lolStreams: { [key: string]: string } = {
    'lcs': 'https://www.twitch.tv/lcs',
    'lec': 'https://www.twitch.tv/lec',
    'lck': 'https://www.twitch.tv/lck',
    'lpl': 'https://www.twitch.tv/lpl',
    'cblol': 'https://www.twitch.tv/cblol',
    'ljl': 'https://www.twitch.tv/ljlofficial',
    'lla': 'https://www.youtube.com/@lolesportsla/streams',
    'pcs': 'https://www.twitch.tv/projectconquerorstv1',
    'vcs': 'https://www.twitch.tv/vcsenglish',
    'lcp': 'https://www.twitch.tv/lolpacificen',
    'worlds': 'https://www.twitch.tv/riotgames',
    'msi': 'https://www.twitch.tv/riotgames',
    'emea': 'https://www.twitch.tv/lec',
    'north america': 'https://www.twitch.tv/lcs',
    'europe': 'https://www.twitch.tv/lec',
    'korea': 'https://www.twitch.tv/lck',
    'china': 'https://www.twitch.tv/lpl',
    'brazil': 'https://www.twitch.tv/cblol',
    'latin america': 'https://www.youtube.com/@lolesportsla/streams',
  };

  // DOTA 2
  private dota2Streams: { [key: string]: string } = {
    'the international': 'https://www.twitch.tv/dota2ti',
    'dpc': 'https://www.twitch.tv/esl_dota2',
    'esl': 'https://www.twitch.tv/esl_dota2',
    'dreamleague': 'https://www.twitch.tv/esl_dota2',
    'blast': 'https://www.twitch.tv/blastdota',
    'pgl': 'https://www.twitch.tv/pgl_dota2',
    'western europe': 'https://www.twitch.tv/pgl_dota2',
    'eastern europe': 'https://www.twitch.tv/pgl_dota2',
    'north america': 'https://www.youtube.com/@americaesportsdota2/streams',
    'south america': 'https://www.youtube.com/@americaesportsdota2/streams',
    'china': 'https://www.twitch.tv/pgl_dota2',
    'southeast asia': 'https://www.twitch.tv/pgl_dota2',
  };

  //  MÉTODOS PÚBLICOS
  // Las páginas de cada juego usan la misma consulta compartida que el inicio y la cartelera:
  // si ya se pidió hace menos de 30 s, los partidos aparecen al instante.
  private partidosDe(clave: ClaveEsport): Observable<any[]> {
    return this.partidos().pipe(map((r) => r.partidos[clave] ?? []));
  }
  getValorantMatches(): Observable<any[]> { return this.partidosDe('valorant'); }
  getCS2Matches(): Observable<any[]> { return this.partidosDe('cs2'); }
  getLolMatches(): Observable<any[]> { return this.partidosDe('lol'); }
  getDota2Matches(): Observable<any[]> { return this.partidosDe('dota2'); }

  getMatches(): Observable<any[]> {
    return this.getValorantMatches();
  }

  /**
   * Canal donde se ve este partido. PandaScore trae la lista de canales de cada partido
   * (el oficial, los de cada idioma y los co-streams), así que se elige en este orden:
   *  1. el oficial en el idioma del visitante (español; portugués si eligió Brasil)
   *  2. el canal principal del partido (p. ej. ESLCS o ESLCSb en IEM, según el partido)
   *  3. cualquier otro oficial, luego uno en el idioma del visitante
   *  4. si el partido aún no tiene canal: el de su liga o región, y por último el del juego
   */
  canalDe(m: any, juego: ClaveEsport): string {
    const idioma = this.pais.pais() === 'BR' ? 'pt' : 'es';
    const valida = (u: unknown): u is string => typeof u === 'string' && /^https?:\/\//.test(u);
    const lista: { idioma: string; url: string; principal: boolean; oficial: boolean }[] =
      (m?.streams ?? (m?.streams_list ?? []).map((s: any) => ({ idioma: s.language ?? '', url: s.raw_url, principal: !!s.main, oficial: !!s.official })))
        .filter((s: any) => valida(s.url));
    const enIdioma = (s: { idioma: string }) => (s.idioma ?? '').toLowerCase().startsWith(idioma);
    const elegido = lista.find((s) => enIdioma(s) && s.oficial) ?? lista.find((s) => s.principal) ?? lista.find((s) => s.oficial)
      ?? lista.find(enIdioma) ?? lista[0];
    if (elegido) return elegido.url.replace(/^http:/, 'https:');
    const directo = [m?.official_stream_url, m?.live_url].find(valida);
    if (directo) return directo.replace(/^http:/, 'https:');
    return this.getStreamByLeague(m?.league?.name ?? '', null, m?.serie?.full_name ?? m?.serie?.name, m?.tournament?.name, juego);
  }

  getStreamByLeague(
    leagueName: string,
    officialUrl: string | null,
    serieName?: string,
    tournamentName?: string,
    game: 'valorant' | 'cs2' | 'lol' | 'dota2' = 'valorant'
  ): string {
    if (officialUrl && /^https?:\/\//.test(officialUrl)) return officialUrl;

    const dict = {
      valorant: this.valorantStreams,
      cs2: this.cs2Streams,
      lol: this.lolStreams,
      dota2: this.dota2Streams,
    }[game];

    const combined = [serieName, tournamentName, leagueName]
      .filter(s => s && s !== 'undefined')
      .join(' ')
      .toLowerCase()
      .trim();

    const matchedKey = Object.keys(dict).find(key => combined.includes(key));

    const fallbacks = {
      valorant: 'https://www.twitch.tv/valorant',
      cs2: 'https://www.twitch.tv/eslcs',
      lol: 'https://www.twitch.tv/riotgames',
      dota2: 'https://www.twitch.tv/dota2',
    };

    return matchedKey ? dict[matchedKey] : fallbacks[game];
  }
}
