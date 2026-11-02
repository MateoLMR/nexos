import type * as THREE_NS from 'three';
import { patron, Taller, textoPixel, Three } from './bit-base';
import { crearMano, Mano } from './bit-mano';

type RoundedBox = new (w: number, h: number, d: number, seg: number, r: number) => THREE_NS.BufferGeometry;

export interface Bit {
  raiz: THREE_NS.Group;
  cuerpo: THREE_NS.Group;
  visor: { px: CanvasRenderingContext2D; t: THREE_NS.CanvasTexture; ultima: { clave: string } };
  llama: THREE_NS.Mesh;
  manoI: Mano;
  manoD: Mano;
  lapizBolsillo?: THREE_NS.Object3D;
  // física
  x: number; y: number; vx: number; vy: number;
  giro: number; vgiro: number;
  pop: number; vpop: number;
}

/**
 * Bit, el robot tendero del café: cuerpo morado, visor de píxeles, audífonos, propulsor
 * y manos flotantes. Con delantal = el tendero; sin delantal = el rival de los partidos.
 */
export function crearBit(T: Three, taller: Taller, RB: RoundedBox, c: { cuerpo: string; audif: string; audif2: string }, tendero: boolean): Bit {
  const { malla, toon, plano, lienzoPixel } = taller;
  const visor = lienzoPixel(48, 24);
  const raiz = new T.Group();
  const cuerpo = new T.Group();
  raiz.add(cuerpo);
  malla(new T.SphereGeometry(0.55, 28, 20), toon(c.cuerpo), cuerpo).scale.set(1, 0.95, 0.9);

  let lapizBolsillo: THREE_NS.Object3D | undefined;
  if (tendero) {
    // Delantal: falda que envuelve el frente de abajo, con ribete, tirantes, bolsillo con lápiz y gafete
    const falda = new T.CylinderGeometry(0.5, 0.64, 0.62, 28, 3, true, -Math.PI * 0.42, Math.PI * 0.84);
    const delantal = malla(falda, toon('#efe3c6', true), cuerpo, [0, -0.36, 0.03], 0);
    const borde = new T.Mesh(falda, new T.MeshBasicMaterial({ color: '#07060b', side: T.BackSide }));
    borde.scale.set(1.04, 1.03, 1.04);
    borde.userData['contorno'] = true;
    delantal.add(borde);
    malla(new T.TorusGeometry(0.6, 0.022, 5, 32, Math.PI * 0.84), toon('#ffb020'), cuerpo, [0, -0.665, 0.03], 0).rotation.set(Math.PI / 2, 0, -Math.PI * 0.08);
    const bolsillo = malla(new RB(0.34, 0.2, 0.05, 3, 0.04), toon('#ffb020'), cuerpo, [0.1, -0.44, 0.6], 1.08);
    bolsillo.rotation.x = -0.25;
    malla(new T.BoxGeometry(0.3, 0.025, 0.01), plano('#b7862c'), bolsillo, [0, 0.05, 0.03], 0);
    lapizBolsillo = malla(new T.CylinderGeometry(0.022, 0.022, 0.24, 8), toon('#6d3bd2'), bolsillo, [0.09, 0.12, 0], 1.1);
    lapizBolsillo.rotation.z = 0.25;
    lapizBolsillo.name = 'lapiz'; // se esconde cuando lo saca para escribir
    const gaf = lienzoPixel(24, 10);
    gaf.px.fillStyle = '#ffffff'; gaf.px.fillRect(0, 0, 24, 10);
    gaf.px.fillStyle = '#6d3bd2'; gaf.px.fillRect(0, 0, 24, 3);
    patron(gaf.px, ['111.111.111', '1.1..1...1.', '11...1...1.', '1.1..1...1.', '111.111..1.'], 6, 4, '#14121c');
    const blanco = plano('#ffffff');
    const gafete = malla(new RB(0.3, 0.13, 0.03, 2, 0.02), [blanco, blanco, blanco, blanco, new T.MeshBasicMaterial({ map: gaf.t }), blanco], cuerpo, [-0.22, -0.2, 0.58], 1.1);
    gafete.rotation.set(-0.15, -0.35, 0.06);
    [-1, 1].forEach((l) => malla(new T.TubeGeometry(new T.CatmullRomCurve3([
      new T.Vector3(l * 0.36, -0.08, 0.42), new T.Vector3(l * 0.5, 0.12, 0.3), new T.Vector3(l * 0.55, 0.3, 0.05),
    ]), 12, 0.028, 6), toon('#efe3c6'), cuerpo, [0, 0, 0], 0));
  }

  malla(new RB(0.78, 0.42, 0.3, 4, 0.14), toon('#14121c'), cuerpo, [0, 0.18, 0.36]);
  const pantalla = new T.Mesh(new T.PlaneGeometry(0.68, 0.32), new T.MeshBasicMaterial({ map: visor.t }));
  pantalla.position.set(0, 0.18, 0.515);
  pantalla.name = 'pantalla';
  cuerpo.add(pantalla);
  malla(new T.TorusGeometry(0.6, 0.055, 8, 32, Math.PI), toon(c.audif), cuerpo, [0, 0.08, -0.02]);
  [-1, 1].forEach((l) => {
    const o = malla(new T.CylinderGeometry(0.21, 0.21, 0.18, 24), toon(c.audif), cuerpo, [l * 0.6, 0.06, 0]);
    o.rotation.z = Math.PI / 2;
    malla(new T.CylinderGeometry(0.13, 0.13, 0.04, 18), toon(c.audif2), o, [0, l * 0.1, 0], 0);
  });
  malla(new T.CylinderGeometry(0.16, 0.22, 0.16, 18), toon('#b7862c'), raiz, [0, -0.66, -0.05]);
  const llama = new T.Mesh(new T.ConeGeometry(0.15, 0.5, 14), new T.MeshBasicMaterial({ color: '#ffb020', transparent: true, opacity: 0.85 }));
  llama.rotation.x = Math.PI;
  llama.position.set(0, -0.98, -0.05);
  raiz.add(llama);

  const manoI = crearMano(T, taller, -1), manoD = crearMano(T, taller, 1);
  raiz.add(manoI.g, manoD.g);
  manoI.g.position.set(-0.8, -0.3, 0.2);
  manoD.g.position.set(0.8, -0.3, 0.2);
  return { raiz, cuerpo, visor: { px: visor.px, t: visor.t, ultima: { clave: '' } }, llama, manoI, manoD, lapizBolsillo, x: 0, y: 0, vx: 0, vy: 0, giro: 0, vgiro: 0, pop: 1, vpop: 0 };
}

/** Accesorios del tendero: tinto, tiquete de tiempo, libreta con lápiz, paño y el "VS" del duelo */
export function crearAccesorios(T: Three, taller: Taller, RB: RoundedBox, bit: Bit, escena: THREE_NS.Scene) {
  const { malla, toon, plano, lienzoPixel } = taller;

  const taza = new T.Group();
  malla(new T.LatheGeometry([[0, 0], [0.15, 0], [0.16, 0.02], [0.19, 0.34], [0, 0.34]].map(([a, b]) => new T.Vector2(a, b)), 24), toon('#ffb020'), taza, [0, -0.17, 0]);
  malla(new T.CylinderGeometry(0.188, 0.172, 0.1, 24), toon('#6d3bd2'), taza, [0, -0.02, 0], 1.04);
  malla(new T.CylinderGeometry(0.21, 0.21, 0.045, 24), toon('#efe3c6'), taza, [0, 0.19, 0], 1.04);
  const vapor = [0, 1, 2].map(() => {
    const v = new T.Mesh(new T.SphereGeometry(0.05, 8, 6), new T.MeshBasicMaterial({ color: '#e8eeff', transparent: true, opacity: 0 }));
    taza.add(v);
    return v;
  });

  // Tiquete de una hora del café: papiro con talón ámbar perforado y "01:00"
  const tq = lienzoPixel(40, 20);
  tq.px.fillStyle = '#efe3c6'; tq.px.fillRect(0, 0, 40, 20);
  tq.px.fillStyle = '#ffb020'; tq.px.fillRect(0, 0, 9, 20);
  tq.px.fillStyle = '#14121c'; for (let y = 1; y < 20; y += 3) tq.px.fillRect(9, y, 1, 1);
  textoPixel(tq.px, '01:00', 13, 4, '#14121c');
  tq.px.fillStyle = '#6d3bd2'; tq.px.fillRect(13, 13, 22, 2);
  patron(tq.px, ['.1.', '111', '.1.'], 3, 8, '#14121c');
  const tiquete = new T.Group();
  const papiro = plano('#efe3c6');
  malla(new T.BoxGeometry(0.46, 0.23, 0.012), [papiro, papiro, papiro, papiro, new T.MeshBasicMaterial({ map: tq.t }), papiro], tiquete, [0.23, 0, 0], 1.05);

  const libreta = new T.Group();
  malla(new RB(0.34, 0.42, 0.04, 2, 0.02), toon('#efe3c6'), libreta);
  malla(new T.BoxGeometry(0.34, 0.06, 0.05), plano('#6d3bd2'), libreta, [0, 0.19, 0.005], 0);
  const renglones = [0, 1, 2, 3].map((i) => malla(new T.BoxGeometry(0.22, 0.012, 0.01), plano('#9a76f0'), libreta, [-0.02, 0.08 - i * 0.07, 0.025], 0));
  const lapiz = malla(new T.CylinderGeometry(0.025, 0.025, 0.28, 8), toon('#6d3bd2'), new T.Group(), [0, 0, 0], 1.1);
  malla(new T.ConeGeometry(0.025, 0.06, 8), toon('#efe3c6'), lapiz, [0, -0.17, 0], 0).rotation.z = Math.PI;

  // Paño de cocina a cuadros: una tela que cuelga y ondea
  const pc = lienzoPixel(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { pc.px.fillStyle = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 ? '#e8eeff' : '#7ef2ff'; pc.px.fillRect(x, y, 1, 1); }
  pc.px.fillStyle = '#6d3bd2'; pc.px.fillRect(0, 13, 16, 2);
  const telaGeo = new T.PlaneGeometry(0.36, 0.36, 8, 8);
  const telaBase = (telaGeo.attributes['position'].array as Float32Array).slice();
  const trapo = new T.Mesh(telaGeo, new T.MeshToonMaterial({ color: '#ffffff', map: pc.t, side: T.DoubleSide }));
  const trapoBorde = new T.Mesh(telaGeo, new T.MeshBasicMaterial({ color: '#07060b', side: T.BackSide }));
  trapoBorde.scale.setScalar(1.05);
  trapo.add(trapoBorde);
  const ondear = (t: number) => {
    const a = telaGeo.attributes['position'];
    for (let i = 0; i < a.count; i++) {
      const x = telaBase[i * 3], y = telaBase[i * 3 + 1], caida = Math.max(0, -y - 0.02);
      a.setZ(i, -caida * caida * 2.2 + Math.sin(t * 7 + x * 12) * 0.012 * (0.4 + caida * 4));
      a.setY(i, y - caida * caida * 0.8);
    }
    a.needsUpdate = true;
    telaGeo.computeVertexNormals();
  };

  const vsL = lienzoPixel(32, 16);
  patron(vsL.px, ['1...1.11111', '1...1.1....', '.1.1..11111', '.1.1......1', '..1...11111'], 10, 5, '#ffb020');
  const vs = new T.Mesh(new T.PlaneGeometry(1.4, 0.7), new T.MeshBasicMaterial({ map: vsL.t, transparent: true }));

  for (const o of [taza, tiquete, libreta, lapiz, trapo]) { o.visible = false; bit.raiz.add(o); }
  vs.visible = false;
  escena.add(vs);
  return { taza, vapor, tiquete, libreta, renglones, lapiz, trapo, ondear, vs };
}
export type Accesorios = ReturnType<typeof crearAccesorios>;

/**
 * Junta en una sola malla las piezas fijas que comparten material dentro de un grupo
 * (el cuerpo, la palma de cada mano). Baja mucho los dibujos por cuadro sin cambiar el aspecto.
 * No toca grupos animados (dedos, pulgar) ni mallas con varios materiales o con nombre.
 */
export function fusionar(T: Three, grupo: THREE_NS.Object3D, merge: (g: THREE_NS.BufferGeometry[]) => THREE_NS.BufferGeometry | null) {
  grupo.updateMatrixWorld(true);
  const inversa = grupo.matrixWorld.clone().invert();
  const porMaterial = new Map<THREE_NS.Material, THREE_NS.Mesh[]>();
  const fundidas = new Set<THREE_NS.Object3D>();
  // Solo mallas sueltas de un solo material y sin nombre (las que tienen nombre se animan aparte);
  // los grupos (dedos, pulgar) se quedan como están
  const recorrer = (o: THREE_NS.Object3D) => {
    for (const h of [...o.children]) {
      const m = h as THREE_NS.Mesh;
      if (m.isMesh && !Array.isArray(m.material) && !m.name) {
        const mat = m.material as THREE_NS.Material;
        if (!porMaterial.has(mat)) porMaterial.set(mat, []);
        porMaterial.get(mat)!.push(m);
        fundidas.add(m);
        recorrer(m);
      }
    }
  };
  recorrer(grupo);
  // Lo que cuelga de una pieza fundida y no se funde (lápiz, pantalla) pasa al grupo sin moverse
  for (const m of fundidas) for (const h of [...m.children]) if (!fundidas.has(h)) grupo.attach(h);
  for (const [mat, mallas] of porMaterial) {
    if (mallas.length < 2) continue;
    const geos = mallas.map((m) => {
      const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone());
      for (const nombre of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(nombre)) g.deleteAttribute(nombre);
      if (!g.attributes['uv']) g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(g.attributes['position'].count * 2), 2));
      g.applyMatrix4(inversa.clone().multiply(m.matrixWorld));
      return g;
    });
    const unida = merge(geos);
    geos.forEach((g) => g.dispose());
    if (!unida) continue;
    for (const m of mallas) m.removeFromParent();
    const nueva = new T.Mesh(unida, mat);
    grupo.add(nueva);
  }
}
