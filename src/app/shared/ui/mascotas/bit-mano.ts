import type * as THREE_NS from 'three';
import { suave, Taller, Three } from './bit-base';

/** Cuánto se dobla cada dedo (d) y el pulgar (p) en cada postura. 0 = estirado */
export const POSES = {
  relajada: { d: [0.35, 0.45, 0.55], p: 0.2 },
  abierta: { d: [0.02, 0.02, 0.05], p: 0.05 },
  senalar: { d: [0, 1.45, 1.5], p: 0.9 },
  agarrar: { d: [0.95, 1.0, 1.05], p: 0.5 },
  pinza: { d: [0.55, 1.3, 1.4], p: 0.6 },
  puno: { d: [1.5, 1.5, 1.5], p: 1.0 },
  plana: { d: [0.08, 0.1, 0.12], p: 0.2 },
} as const;
export type Pose = keyof typeof POSES;

export interface Mano {
  g: THREE_NS.Group;
  dedos: { base: THREE_NS.Group; c: number }[];
  pulgar: { base: THREE_NS.Group; c: number };
  pose: Pose;
  fase: number;
  lado: 1 | -1;
  q: THREE_NS.Quaternion;
  e: THREE_NS.Euler;
}

/**
 * Guante de caricatura sin brazo: puño acampanado, palma, 3 dedos gorditos de una pieza
 * bien separados y el pulgar del lado de adentro. lado = 1 para la mano que queda a la derecha.
 */
export function crearMano(T: Three, taller: Taller, lado: 1 | -1): Mano {
  const { malla, toon, plano } = taller;
  const g = new T.Group();
  const blanco = toon('#fffdf6');
  malla(new T.CylinderGeometry(0.1, 0.135, 0.09, 20), blanco, g, [0, -0.045, 0], 1.08);
  malla(new T.TorusGeometry(0.12, 0.038, 8, 22), blanco, g, [0, 0.005, 0], 1.08).rotation.x = Math.PI / 2;
  malla(new T.SphereGeometry(0.145, 20, 14), blanco, g, [0, 0.14, 0], 1.06).scale.set(1.15, 1.0, 0.68);
  const dedos = [0.1, 0.115, 0.1].map((largo, i) => {
    const base = new T.Group();
    base.position.set((-0.1 + i * 0.1) * lado, 0.215, 0);
    base.rotation.z = (i - 1) * 0.42 * lado;
    g.add(base);
    malla(new T.CapsuleGeometry(0.056, largo, 6, 14), blanco, base, [0, largo / 2 + 0.04, 0], 1.09).scale.z = 0.92;
    return { base, c: 0.4 };
  });
  const pb = new T.Group();
  pb.position.set(-0.14 * lado, 0.1, 0.01);
  pb.rotation.z = 0.85 * lado;
  g.add(pb);
  malla(new T.CapsuleGeometry(0.052, 0.07, 6, 14), blanco, pb, [0, 0.07, 0], 1.09);
  // las tres costuras del dorso
  [-0.05, 0, 0.05].forEach((x) => malla(new T.CapsuleGeometry(0.008, 0.07, 3, 6), plano('#14121c'), g, [x, 0.145, 0.095], 0));
  return { g, dedos, pulgar: { base: pb, c: 0.2 }, pose: 'relajada', fase: Math.random() * 6, lado, q: new T.Quaternion(), e: new T.Euler(0, 0, 0, 'ZYX') };
}

/** Dobla los dedos hacia la postura actual; en reposo "respiran" con un leve desfase */
export function moverMano(m: Mano, dt: number, t: number) {
  const P = POSES[m.pose], k = suave(dt, 12);
  m.dedos.forEach((d, i) => {
    const vivo = m.pose === 'senalar' && i === 0 ? 0 : Math.sin(t * 2 + m.fase + i * 0.8) * 0.09;
    d.c += (P.d[i] + vivo - d.c) * k;
    d.base.rotation.x = -d.c * 1.05;
  });
  m.pulgar.c += (P.p - m.pulgar.c) * k;
  m.pulgar.base.rotation.x = -m.pulgar.c * 0.9;
}

/**
 * Lleva la mano a una posición y orientación. La orientación se interpola con cuaterniones
 * (camino más corto), así el cambio de postura es un giro natural de muñeca.
 * voltear = 1 muestra la palma; 0 muestra el dorso.
 */
export function ponerMano(m: Mano, x: number, y: number, z: number, rz: number, pose: Pose, dt: number, v = 10, voltear = 0) {
  const k = suave(dt, v);
  m.g.position.x += (x - m.g.position.x) * k;
  m.g.position.y += (y - m.g.position.y) * k;
  m.g.position.z += (z - m.g.position.z) * k;
  m.e.set(0, voltear * Math.PI, rz, 'ZYX');
  m.q.setFromEuler(m.e);
  m.g.quaternion.slerp(m.q, k);
  m.pose = pose;
}

/** Mano relajada colgando: dedos hacia abajo y la palma al frente */
export function colgar(m: Mano, x: number, y: number, inclinar: number, dt: number, v = 7) {
  ponerMano(m, x, y, 0.2, Math.PI - inclinar * m.lado, 'relajada', dt, v, 1);
}
