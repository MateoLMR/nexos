import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PandaScoreService {
  private http = inject(HttpClient);
  private readonly PROXY = 'https://nexos-proxy.vercel.app/api/pandascore';

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
    'cct': 'https://www.youtube.com/@CCTCS/streams',
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
  getValorantMatches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.PROXY}?game=valorant`);
  }
  getCS2Matches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.PROXY}?game=cs2`);
  }
  getLolMatches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.PROXY}?game=lol`);
  }
  getDota2Matches(): Observable<any[]> {
    return this.http.get<any[]>(`${this.PROXY}?game=dota2`);
  }

  getMatches(): Observable<any[]> {
    return this.getValorantMatches();
  }

  getStreamByLeague(
    leagueName: string,
    officialUrl: string | null,
    serieName?: string,
    tournamentName?: string,
    game: 'valorant' | 'cs2' | 'lol' | 'dota2' = 'valorant'
  ): string {
    if (officialUrl && officialUrl.includes('twitch.tv')) return officialUrl;

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
