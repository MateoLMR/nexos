import type * as THREE_NS from 'three';

export type Three = typeof THREE_NS;

/** Patrones de píxel 3×5 para números y signos que muestra el visor */
export const DIG: Record<string, string[]> = {
  0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'], '-': ['000', '000', '111', '000', '000'], '%': ['101', '001', '010', '100', '101'],
  ':': ['0', '1', '0', '1', '0'],
};

/** Dibuja un patrón ('1' = píxel) en un canvas 2D */
export function patron(px: CanvasRenderingContext2D, p: string[], x: number, y: number, color: string) {
  px.fillStyle = color;
  p.forEach((fila, j) => [...fila].forEach((v, i) => { if (v === '1') px.fillRect(x + i, y + j, 1, 1); }));
}

/** Escribe números y signos con la fuente de píxel */
export function textoPixel(px: CanvasRenderingContext2D, s: string, x: number, y: number, color: string) {
  let cx = x;
  for (const c of s) { const p = DIG[c]; if (p) { patron(px, p, cx, y, color); cx += p[0].length + 1; } }
}

/**
 * Materiales y piezas compartidas de Bit: toon de 3 tonos (sombra dura), contorno negro
 * (copia de la malla vista por dentro, un poco más grande) y lienzos de píxel para el visor.
 */
export function crearTaller(T: Three) {
  const tonos = new T.DataTexture(new Uint8Array([90, 90, 90, 255, 180, 180, 180, 255, 255, 255, 255, 255]), 3, 1);
  tonos.minFilter = tonos.magFilter = T.NearestFilter;
  tonos.needsUpdate = true;
  const cache = new Map<string, THREE_NS.Material>();
  const toon = (color: string, doble = false): THREE_NS.MeshToonMaterial => {
    const clave = `t${color}${doble}`;
    if (!cache.has(clave)) cache.set(clave, new T.MeshToonMaterial({ color, gradientMap: tonos, side: doble ? T.DoubleSide : T.FrontSide }));
    return cache.get(clave) as THREE_NS.MeshToonMaterial;
  };
  const plano = (color: string): THREE_NS.MeshBasicMaterial => {
    const clave = `p${color}`;
    if (!cache.has(clave)) cache.set(clave, new T.MeshBasicMaterial({ color }));
    return cache.get(clave) as THREE_NS.MeshBasicMaterial;
  };
  const tinta = new T.MeshBasicMaterial({ color: '#07060b', side: T.BackSide });

  /** Crea una malla con su contorno (c = escala del contorno; 0 = sin contorno) */
  const malla = (geo: THREE_NS.BufferGeometry, mat: THREE_NS.Material | THREE_NS.Material[], padre: THREE_NS.Object3D, pos: [number, number, number] = [0, 0, 0], c = 1.06) => {
    const m = new T.Mesh(geo, mat);
    m.position.set(...pos);
    padre.add(m);
    if (c) { const o = new T.Mesh(geo, tinta); o.scale.setScalar(c); o.userData['contorno'] = true; m.add(o); }
    return m;
  };

  /** Canvas pequeño de píxeles con su textura nítida (sin suavizado) */
  const lienzoPixel = (w: number, h: number) => {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const t = new T.CanvasTexture(cv);
    t.magFilter = t.minFilter = T.NearestFilter;
    t.colorSpace = T.SRGBColorSpace;
    return { cv, px: cv.getContext('2d')!, t };
  };

  const liberar = () => { tonos.dispose(); cache.forEach((m) => m.dispose()); tinta.dispose(); };
  return { toon, plano, tinta, malla, lienzoPixel, liberar };
}
export type Taller = ReturnType<typeof crearTaller>;

/** Interpolación exponencial independiente de los FPS */
export const suave = (dt: number, velocidad: number) => 1 - Math.exp(-dt * velocidad);
