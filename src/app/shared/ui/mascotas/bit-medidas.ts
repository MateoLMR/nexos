/**
 * Reglas de Bit que no dependen de WebGL: en qué equipos aparece y de qué tamaño se ve.
 * Están aparte para poder probarlas sin navegador.
 */

/** Media query de los equipos donde vive Bit: pantalla de portátil o PC con mouse o touchpad */
export const CONSULTA_PUNTERO = '(hover: hover) and (pointer: fine)';
export const ANCHO_MINIMO = 1024;

/** Mitad del alto visible del mundo 3D (cámara de 30° a 14 unidades) */
export const MEDIO_ALTO_MUNDO = Math.tan((15 * Math.PI) / 180) * 14;

export interface Equipo {
  ancho: number;
  /** El puntero principal es un mouse o touchpad: (hover: hover) and (pointer: fine) */
  punteroFino: boolean;
  reducido: boolean;
  ahorroDatos?: boolean;
  nucleos?: number;
}

/**
 * Bit solo aparece en portátiles y PC: al menos 1024 px de ancho y un mouse o touchpad.
 * Celulares y tablets (incluido un iPad Pro horizontal, que es táctil) quedan fuera,
 * igual que con movimiento reducido, ahorro de datos o menos de 4 núcleos.
 */
export function bitPermitido(e: Equipo): boolean {
  if (e.ancho < ANCHO_MINIMO || !e.punteroFino || e.reducido || e.ahorroDatos) return false;
  return !(e.nucleos && e.nucleos < 4);
}

const interpolar = (x: number, x0: number, x1: number, y0: number, y1: number) =>
  y0 + (y1 - y0) * Math.min(1, Math.max(0, (x - x0) / (x1 - x0)));

/**
 * Escala de Bit en el mundo 3D según la pantalla.
 * El tamaño en píxeles crece con el ancho (de un portátil de 1024 px a un monitor de 1920 o más)
 * y nunca pasa del 13 % del alto, para que en pantallas bajas no ocupe media página.
 */
export function escalaBit(ancho: number, alto: number): number {
  const pxPorUnidad = alto / (2 * MEDIO_ALTO_MUNDO);
  const deseado = Math.min(interpolar(ancho, 1024, 1920, 80, 124), alto * 0.13);
  return Math.min(1.1, Math.max(0.45, deseado / pxPorUnidad));
}

/** Tamaño en píxeles de una unidad de Bit a esa escala (para las pruebas y la depuración) */
export function pxDeBit(escala: number, alto: number): number {
  return (escala * alto) / (2 * MEDIO_ALTO_MUNDO);
}

/**
 * En el duelo los dos van del mismo tamaño: el del hueco más pequeño, para que ambos quepan.
 * Sin hueco del rival, el de Bit; sin ninguno, la escala normal.
 */
export function escalaDuelo(normal: number, huecoBit?: number | null, huecoRival?: number | null): number {
  const tam = [huecoBit, huecoRival].filter((v): v is number => typeof v === 'number' && v > 0);
  return tam.length ? Math.min(...tam) : normal;
}
