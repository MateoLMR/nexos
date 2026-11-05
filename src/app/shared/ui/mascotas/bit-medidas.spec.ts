import { bitPermitido, Equipo, escalaBit, escalaDuelo, pxDeBit } from './bit-medidas';

const pc: Equipo = { ancho: 1440, punteroFino: true, reducido: false, nucleos: 8 };

describe('bitPermitido: Bit solo en portátiles y PC', () => {
  it('aparece en portátil y PC con mouse o touchpad', () => {
    expect(bitPermitido({ ...pc, ancho: 1024 })).toBe(true);
    expect(bitPermitido({ ...pc, ancho: 1366 })).toBe(true);
    expect(bitPermitido({ ...pc, ancho: 1920 })).toBe(true);
  });
  it('no aparece en celulares', () => {
    for (const ancho of [320, 360, 375, 390, 414, 430]) expect(bitPermitido({ ...pc, ancho, punteroFino: false })).toBe(false);
  });
  it('no aparece en tablets, ni siquiera un iPad Pro horizontal', () => {
    expect(bitPermitido({ ...pc, ancho: 768, punteroFino: false })).toBe(false);
    expect(bitPermitido({ ...pc, ancho: 820, punteroFino: false })).toBe(false);
    expect(bitPermitido({ ...pc, ancho: 1366, punteroFino: false })).toBe(false);
  });
  it('no aparece en una ventana de PC angosta', () => {
    expect(bitPermitido({ ...pc, ancho: 1000 })).toBe(false);
  });
  it('respeta movimiento reducido, ahorro de datos y equipos lentos', () => {
    expect(bitPermitido({ ...pc, reducido: true })).toBe(false);
    expect(bitPermitido({ ...pc, ahorroDatos: true })).toBe(false);
    expect(bitPermitido({ ...pc, nucleos: 2 })).toBe(false);
    expect(bitPermitido({ ...pc, nucleos: undefined })).toBe(true);
  });
});

describe('escalaBit: tamaño según el equipo', () => {
  it('a igual alto, crece con el ancho de la pantalla', () => {
    const anchos = [1024, 1280, 1366, 1440, 1680, 1920];
    const tam = anchos.map((w) => pxDeBit(escalaBit(w, 900), 900));
    for (let i = 1; i < tam.length; i++) expect(tam[i]).toBeGreaterThanOrEqual(tam[i - 1]);
    expect(tam[tam.length - 1]).toBeGreaterThan(tam[0]);
  });
  it('se ve parecido en un portátil de 768 de alto y en un monitor de 1080', () => {
    const portatil = pxDeBit(escalaBit(1366, 657), 657), monitor = pxDeBit(escalaBit(1920, 1080), 1080);
    expect(portatil).toBeGreaterThan(70);
    expect(monitor).toBeLessThan(130);
  });
  it('nunca pasa del 13 % del alto de la ventana', () => {
    for (const [w, h] of [[1024, 600], [1366, 657], [1440, 900], [1920, 1080], [2560, 1300]]) {
      expect(pxDeBit(escalaBit(w, h), h)).toBeLessThanOrEqual(h * 0.13 + 0.01);
    }
  });
  it('queda dentro de los límites de la escena', () => {
    for (const [w, h] of [[1024, 400], [1024, 768], [3840, 2160], [5120, 1440]]) {
      const s = escalaBit(w, h);
      expect(s).toBeGreaterThanOrEqual(0.45);
      expect(s).toBeLessThanOrEqual(1.1);
    }
  });
});

describe('escalaDuelo: Bit y el rival del mismo tamaño', () => {
  it('usa el hueco más pequeño para los dos', () => {
    expect(escalaDuelo(0.9, 0.9, 0.62)).toBe(0.62);
    expect(escalaDuelo(0.9, 0.52, 0.9)).toBe(0.52);
  });
  it('sin hueco del rival usa el de Bit, y sin ninguno la escala normal', () => {
    expect(escalaDuelo(0.9, 0.7, null)).toBe(0.7);
    expect(escalaDuelo(0.9, null, undefined)).toBe(0.9);
  });
});
