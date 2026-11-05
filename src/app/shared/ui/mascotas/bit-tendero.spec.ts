import { BitTendero } from './bit-tendero';

/** Malla y material falsos con lo mínimo que tocan las chispas */
function chispaFalsa() {
  const v = () => ({ x: 0, y: 0, z: 0, set(x: number, y: number, z?: number) { this.x = x; this.y = y; if (z !== undefined) this.z = z; }, setScalar(s: number) { this.x = this.y = this.z = s; } });
  const mat = { opacity: 1, color: { set: vi.fn() } };
  return { m: { visible: false, position: v(), scale: v(), rotation: { z: 0 } }, mat, vx: 0, vy: 0, vida: 0, g: 0, activa: false };
}

/** Un Bit sin WebGL: solo el estado que usan celebrar(), chispazo() y estela() */
function bitSinEscena(tamPool = 96) {
  const c = Object.create(BitTendero.prototype) as any;
  c.chispas = Array.from({ length: tamPool }, chispaFalsa);
  c.activas = 0;
  c.sAct = 0.9;
  c.reloj = 0;
  c.bit = { vgiro: 0, raiz: { position: { x: 1, y: 2, z: 0 } } };
  return c;
}

describe('Bit: chispas recicladas', () => {
  it('celebrar usa chispas del pool sin crear objetos nuevos', () => {
    const c = bitSinEscena(), antes = [...c.chispas];
    c.celebrar();
    expect(c.activas).toBe(16);
    expect(c.chispas).toHaveLength(96);
    c.chispas.forEach((ch: any, i: number) => expect(ch).toBe(antes[i]));
    expect(c.chispas.filter((ch: any) => ch.activa && ch.m.visible)).toHaveLength(16);
    expect(c.bit.vgiro).toBe(20);
  });

  it('si el pool se llena, deja de lanzar chispas en vez de crear más', () => {
    const c = bitSinEscena(20);
    c.chispazo(0, 0, ['#fff'], 50, 0.1);
    expect(c.activas).toBe(20);
    expect(c.chispas).toHaveLength(20);
    c.estela({ x: 0, y: 0 }, 1);
    expect(c.activas).toBe(20);
  });

  it('una chispa apagada vuelve a usarse', () => {
    const c = bitSinEscena(4);
    c.chispazo(0, 0, ['#fff'], 4, 0.1);
    const primera = c.chispas[0];
    primera.activa = false; primera.m.visible = false; c.activas--;
    c.estela({ x: 0, y: 0 }, -1);
    expect(primera.activa).toBe(true);
    expect(primera.mat.opacity).toBeCloseTo(0.8);
    expect(c.activas).toBe(4);
  });

  it('las chispas toman el tamaño actual de Bit', () => {
    const c = bitSinEscena(1);
    c.sAct = 0.5;
    c.chispazo(0, 0, ['#fff'], 1, 0.1);
    expect(c.chispas[0].m.scale.x).toBeCloseTo(0.1 * 0.5 * 1.1);
  });
});
