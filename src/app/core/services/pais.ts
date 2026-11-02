import { Injectable, signal } from '@angular/core';

export type CodigoPais = 'CO' | 'MX' | 'AR' | 'CL' | 'PE' | 'EC' | 'BR';

export interface Pais { codigo: CodigoPais; nombre: string; bandera: string; }

export const PAISES: Pais[] = [
  { codigo: 'CO', nombre: 'Colombia', bandera: '🇨🇴' },
  { codigo: 'MX', nombre: 'México', bandera: '🇲🇽' },
  { codigo: 'AR', nombre: 'Argentina', bandera: '🇦🇷' },
  { codigo: 'CL', nombre: 'Chile', bandera: '🇨🇱' },
  { codigo: 'PE', nombre: 'Perú', bandera: '🇵🇪' },
  { codigo: 'EC', nombre: 'Ecuador', bandera: '🇪🇨' },
  { codigo: 'BR', nombre: 'Brasil', bandera: '🇧🇷' },
];

// Zona horaria del navegador → país (la primera visita no tiene que elegir nada)
const POR_ZONA: [RegExp, CodigoPais][] = [
  [/Bogota/, 'CO'], [/Mexico|Cancun|Monterrey|Tijuana|Merida|Chihuahua|Hermosillo|Mazatlan/, 'MX'],
  [/Argentina|Buenos_Aires/, 'AR'], [/Santiago|Punta_Arenas/, 'CL'], [/Lima/, 'PE'],
  [/Guayaquil|Galapagos/, 'EC'], [/Sao_Paulo|Bahia|Fortaleza|Recife|Manaus|Belem|Cuiaba|Porto_Velho|Noronha|Araguaina|Maceio|Campo_Grande|Boa_Vista|Rio_Branco/, 'BR'],
];

const CLAVE = 'nexos.pais';
const SIN_DECIMALES = ['COP', 'CLP'];

// País con el que se muestran los precios. Se recuerda en este navegador.
@Injectable({ providedIn: 'root' })
export class PaisService {
  readonly paises = PAISES;
  readonly pais = signal<CodigoPais>(this.inicial());

  cambiar(codigo: CodigoPais) {
    this.pais.set(codigo);
    try { localStorage.setItem(CLAVE, codigo); } catch { /* sin almacenamiento: vale solo por esta visita */ }
  }

  actual(): Pais {
    return PAISES.find((p) => p.codigo === this.pais())!;
  }

  /** "199.000 COP", "3,05 USD", "249,90 BRL" */
  static dinero(valor: number | null | undefined, moneda: string): string {
    if (valor == null) return '—';
    const dec = SIN_DECIMALES.includes(moneda) ? 0 : 2;
    return `${valor.toLocaleString('es-CO', { minimumFractionDigits: dec, maximumFractionDigits: dec })} ${moneda}`;
  }

  private inicial(): CodigoPais {
    try {
      const guardado = localStorage.getItem(CLAVE) as CodigoPais | null;
      if (guardado && PAISES.some((p) => p.codigo === guardado)) return guardado;
    } catch { /* sigue con la zona horaria */ }
    const zona = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
    return POR_ZONA.find(([re]) => re.test(zona))?.[1] ?? 'CO';
  }
}
