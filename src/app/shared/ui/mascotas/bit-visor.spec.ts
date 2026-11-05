import { claveVisor, dibujarVisor, ModoVisor } from './bit-visor';

/** Contexto 2D falso que cuenta cuántas veces se pinta */
function lienzoFalso() {
  let trazos = 0;
  const px = { fillStyle: '', fillRect: () => trazos++ } as unknown as CanvasRenderingContext2D;
  return { px, trazos: () => trazos };
}

describe('Visor de Bit', () => {
  it('una cara quieta no se redibuja en cada cuadro', () => {
    const { px } = lienzoFalso(), ultima = { clave: '' };
    let redibujos = 0;
    for (let i = 0; i < 144; i++) if (dibujarVisor(px, 'normal', i / 144, { mx: 1, my: 0 }, ultima)) redibujos++;
    expect(redibujos).toBe(1);
  });

  it('los modos animados se redibujan como mucho 20 veces por segundo, aunque la pantalla vaya a 144 Hz', () => {
    for (const modo of ['vivo', 'reloj', 'escribe', 'limpia', 'dormido'] as ModoVisor[]) {
      const { px } = lienzoFalso(), ultima = { clave: '' };
      let redibujos = 0;
      for (let i = 0; i < 144; i++) if (dibujarVisor(px, modo, 3 + i / 144, { goles: '1' }, ultima)) redibujos++;
      expect(redibujos).toBeLessThanOrEqual(21);
      expect(redibujos).toBeGreaterThan(1);
    }
  });

  it('cambiar la mirada, el parpadeo o el marcador sí redibuja', () => {
    const base = claveVisor('normal', 1, { mx: 0, my: 0, cerrado: false });
    expect(claveVisor('normal', 1, { mx: 1, my: 0, cerrado: false })).not.toBe(base);
    expect(claveVisor('normal', 1, { mx: 0, my: 0, cerrado: true })).not.toBe(base);
    expect(claveVisor('vivo', 1, { goles: '2' })).not.toBe(claveVisor('vivo', 1, { goles: '3' }));
  });

  it('los parpadeos de los modos animados no se pierden (caen en pasos de 1/20 s)', () => {
    // "escribe" cambia cada 1/4 s y "vivo" cada 0,4 s: cada cambio cae en un paso distinto
    expect(claveVisor('escribe', 0.24, {})).not.toBe(claveVisor('escribe', 0.25, {}));
    expect(claveVisor('vivo', 0.39, {})).not.toBe(claveVisor('vivo', 0.4, {}));
  });
});
