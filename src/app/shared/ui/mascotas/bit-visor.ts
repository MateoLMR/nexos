import { patron, textoPixel } from './bit-base';

export type ModoVisor = 'apagado' | 'normal' | 'feliz' | 'wow' | 'amor' | 'dormido' | 'vivo' | 'precio'
  | 'escribe' | 'reloj' | 'limpia' | 'flecha-izq' | 'flecha-der' | 'igual';

export interface DatosVisor {
  mx?: number; my?: number; cerrado?: boolean;     // mirada y parpadeo
  goles?: string; color?: string;                  // partido en vivo
  descuento?: string;                              // juego con descuento
}

const CIAN = '#7ef2ff';
const CORAZON = ['.11.11.', '1111111', '1111111', '.11111.', '..111..', '...1...'];
// Los modos animados cambian con el tiempo; todos sus parpadeos caen en pasos de 1/20 s
const ANIMADOS = new Set<ModoVisor>(['vivo', 'dormido', 'escribe', 'limpia', 'reloj']);

/** Lo que define el dibujo: si no cambia, no se redibuja ni se sube la textura otra vez */
export function claveVisor(modo: ModoVisor, t: number, d: DatosVisor): string {
  const paso = ANIMADOS.has(modo) ? Math.floor(t * 20) : 0;
  return `${modo}|${paso}|${d.mx ?? 0}|${d.my ?? 0}|${d.cerrado ? 1 : 0}|${d.goles ?? ''}|${d.color ?? ''}|${d.descuento ?? ''}`;
}

/** Pantalla de píxeles 48×24 del visor de Bit. Devuelve true si redibujó. */
export function dibujarVisor(px: CanvasRenderingContext2D, modo: ModoVisor, t: number, d: DatosVisor, anterior: { clave: string }): boolean {
  const clave = claveVisor(modo, t, d);
  if (clave === anterior.clave) return false;
  anterior.clave = clave;
  px.fillStyle = '#0d0b16';
  px.fillRect(0, 0, 48, 24);
  if (modo === 'apagado') return true;

  if (modo === 'vivo') {
    if (Math.floor(t * 2.5) % 2) { px.fillStyle = '#ff3b3b'; px.fillRect(2, 2, 3, 3); }
    px.fillStyle = d.color ?? '#ffb020';
    px.fillRect(8, 3, 32, 18);
    if (d.goles) textoPixel(px, d.goles, 24 - d.goles.length * 2, 9, '#14121c');
    return true;
  }
  if (modo === 'precio') {
    patron(px, ['..111', '.1..1', '1...1', '1..11', '.111.'], 3, 9, '#3ddc84');
    textoPixel(px, `-${d.descuento ?? '0'}%`, 12, 9, '#3ddc84');
    return true;
  }
  if (modo === 'escribe') {
    [0, 1, 2].forEach((i) => { px.fillStyle = Math.floor(t * 4) % 3 === i ? CIAN : '#2a4a66'; px.fillRect(14 + i * 8, 10, 4, 4); });
    return true;
  }
  if (modo === 'reloj') {
    patron(px, ['.111.', '1.1.1', '1.11.', '1...1', '.111.'], 5, 9, '#ffb020');
    textoPixel(px, '01:00', 14, 9, Math.floor(t * 2) % 2 ? CIAN : '#e8ffff');
    return true;
  }
  if (modo === 'flecha-izq' || modo === 'flecha-der' || modo === 'igual') {
    if (modo === 'igual') { px.fillStyle = CIAN; px.fillRect(16, 9, 16, 2); px.fillRect(16, 14, 16, 2); return true; }
    const f = modo === 'flecha-izq'
      ? ['...1......', '..11......', '.111111111', '1111111111', '.111111111', '..11......', '...1......']
      : ['......1...', '......11..', '111111111.', '1111111111', '111111111.', '......11..', '......1...'];
    patron(px, f, 19, 8, '#ffb020');
    return true;
  }

  const ojo = (x: number) => {
    if (modo === 'amor') return patron(px, CORAZON, x - 1, 6, '#ff6b6b');
    if (modo === 'feliz' || modo === 'limpia') return patron(px, ['.111.', '1...1'], x, 9, CIAN);
    if (modo === 'dormido' || d.cerrado) { px.fillStyle = CIAN; px.fillRect(x, 11, 6, 1); return; }
    const alto = modo === 'wow' ? 9 : 7, mx = d.mx ?? 0, my = d.my ?? 0;
    px.fillStyle = CIAN; px.fillRect(x + mx, 13 - alto + my, 6, alto);
    px.fillStyle = '#e8ffff'; px.fillRect(x + mx + 1, 14 - alto + my, 2, 2);
  };
  ojo(12); ojo(30);
  if (modo === 'dormido') patron(px, ['111', '..1', '.1.', '111'], 41, 2 + (Math.floor(t * 2) % 2), '#9a76f0');
  else if (modo === 'wow') { px.fillStyle = CIAN; px.fillRect(22, 17, 4, 4); }
  else { px.fillStyle = CIAN; px.fillRect(20, 18, 8, 1); px.fillRect(19, 17, 1, 1); px.fillRect(28, 17, 1, 1); }
  if (modo === 'limpia') {
    const f = Math.floor(t * 5) % 3;
    patron(px, ['.1.', '111', '.1.'], 38 + f * 2, 2 + f, '#ffffff');
    patron(px, ['1.1', '.1.', '1.1'], 4 + f, 16 - f, '#ffffff');
  }
  return true;
}
