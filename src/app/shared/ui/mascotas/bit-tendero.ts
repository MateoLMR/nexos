import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, viewChild } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import type * as THREE_NS from 'three';
import { crearTaller, suave, Taller, Three } from './bit-base';
import { colgar, moverMano, ponerMano } from './bit-mano';
import { ANCHO_MINIMO, bitPermitido, CONSULTA_PUNTERO, escalaBit, escalaDuelo, MEDIO_ALTO_MUNDO } from './bit-medidas';
import { Accesorios, Bit, crearAccesorios, crearBit, fusionar } from './bit-modelo';
import { DatosVisor, dibujarVisor, ModoVisor } from './bit-visor';

/** Orden de las páginas en el menú: Bit viaja a la derecha o a la izquierda según este orden */
const ORDEN_RUTAS: [RegExp, number][] = [
  [/^\/?$/, 0], [/^\/juegos/, 1], [/^\/juego\//, 1.5], [/^\/comparar/, 2], [/^\/esports\/./, 3.5], [/^\/esports/, 3], [/^\/foro/, 4], [/^\/perfil/, 5], [/^\/admin/, 6],
];
const RUTINAS = ['tiquete', 'pasear', 'tinto', 'pasear', 'limpiar', 'pasear'] as const;
type Rutina = (typeof RUTINAS)[number];
type Estado = Rutina | 'seguir' | 'dormir' | 'viaje' | 'tele' | 'precios' | 'mejor-precio' | 'vivo' | 'dudas' | 'juego' | 'post' | 'comparar';
const INTERACTIVO = 'a, button, input, textarea, select, label, video, summary, [role="button"], [contenteditable="true"]';

/** Chispa del pool: se arma una vez al abrir y se recicla; mientras Bit se mueve no se crean ni se liberan materiales */
interface Chispa { m: THREE_NS.Mesh; mat: THREE_NS.MeshBasicMaterial; vx: number; vy: number; vida: number; g: number; activa: boolean }
const TAM_POOL = 96;
/** Un espacio libre de la página donde Bit hace su acción sin quedar detrás de tarjetas o textos */
interface Hueco { x: number; y: number; sc: number; tapado: number; ok: boolean; clave: string; ref: unknown; hasta: number; d: number }
// Etiquetas que siempre tapan con toda su caja
const SOLIDO = /^(IMG|VIDEO|IFRAME|CANVAS|PICTURE|INPUT|TEXTAREA|SELECT|BUTTON|A|LABEL)$/;

/**
 * Bit, el tendero de Nexos: un robot gamer que vive en el fondo de todo el sitio.
 * Pasea, se toma un tinto, limpia su pantalla y entrega el tiquete del café; te acompaña con el mouse,
 * reacciona a los elementos marcados con data-bit y viaja contigo entre páginas.
 * Va detrás del contenido y no recibe clics: nunca le quita una interacción a la página.
 */
@Component({
  selector: 'app-bit-tendero',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `<canvas #lienzo></canvas>`,
  styles: `
    :host { position: fixed; inset: 0; z-index: -1; pointer-events: none; display: block; }
    canvas { display: block; width: 100%; height: 100%; opacity: 0; transition: opacity .6s; }
    canvas.listo { opacity: 1; }
  `,
})
export class BitTendero implements AfterViewInit, OnDestroy {
  private lienzo = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private router = inject(Router);
  private vivo = true;
  private limpiar: (() => void)[] = [];
  private sub?: Subscription;
  private cuadro = 0;

  private T!: Three;
  private renderer?: THREE_NS.WebGLRenderer;
  private escena?: THREE_NS.Scene;
  private camara?: THREE_NS.PerspectiveCamera;
  private taller?: Taller;
  private bit!: Bit;
  private rival?: Bit;
  private acc!: Accesorios;
  private crearRival?: () => Bit;
  private chispas: Chispa[] = [];
  private activas = 0;
  private rayo?: THREE_NS.Raycaster;
  private datosVisor: DatosVisor = {};

  // Equipo: Bit solo vive en portátiles y PC; si la ventana se achica o cambia el puntero, se esconde y se pausa
  private mqPuntero?: MediaQueryList;
  private mqReducido?: MediaQueryList;
  private mqAncho?: MediaQueryList;
  private iniciado = false;
  private iniciando = false;
  private pausado = false;

  // Mundo visible y límites
  private mw = 4; private mh = 3; private tope = 0; private escala = 0.9;
  // Estado
  private reloj = 0; private ultimo = 0;
  // mov: segundos desde que se movió el mouse (arranca en 5: quieto, pero no dormido)
  private ptr = { x: 0, y: 0, sx: 0, sy: 0, mov: 5, dentro: false };
  private objetivo: Element | null = null;
  private video: HTMLVideoElement | null = null;
  private rutina: Rutina = 'pasear'; private rutinaHasta = 4; private iRutina = 0; private inicioRutina = 0;
  private saludoHasta = 2.6; private exprHasta = 0; private expr: ModoVisor = 'normal';
  private parpadeo = 2; private lado = 1; private tiqueteVolo = false;
  private viaje: { fase: 'salir' | 'entrar' | null; dir: number; desde: number } = { fase: null, dir: 1, desde: 0 };
  private rivalActivo = false;
  private rutaAnterior = -1;
  // Espacios seguros: dónde hace su acción Bit (y el rival en el duelo) y a qué escala
  private estado: Estado = 'pasear';
  private hueco: Hueco | null = null;
  private huecoR: Hueco | null = null;
  private sAct = 0.9;
  private puntos = new Map<number, boolean>();
  private clase = new WeakMap<Element, true | Element | null>();
  private renglones = new Map<Element, DOMRect[]>();

  ngAfterViewInit() {
    if (typeof window === 'undefined' || typeof matchMedia !== 'function') return;
    if (!('WebGLRenderingContext' in window)) return;
    this.mqPuntero = matchMedia(CONSULTA_PUNTERO);
    this.mqReducido = matchMedia('(prefers-reduced-motion: reduce)');
    // El ancho también se vigila con matchMedia: avisa siempre que se cruza el límite, aunque no llegue un "resize"
    this.mqAncho = matchMedia(`(min-width: ${ANCHO_MINIMO}px)`);
    const alCambiar = () => this.revisarEquipo();
    const consultas = [this.mqPuntero, this.mqReducido, this.mqAncho];
    consultas.forEach((q) => q.addEventListener('change', alCambiar));
    addEventListener('resize', alCambiar);
    this.limpiar.push(() => {
      consultas.forEach((q) => q.removeEventListener('change', alCambiar));
      removeEventListener('resize', alCambiar);
    });
    this.revisarEquipo();
  }

  /** En un celular o tablet Bit ni se descarga; si la ventana de un PC se achica, se esconde y se pausa */
  private permitido(): boolean {
    const nav = navigator as any;
    return bitPermitido({
      ancho: this.mqAncho?.matches ? Math.max(innerWidth, ANCHO_MINIMO) : Math.min(innerWidth, ANCHO_MINIMO - 1), punteroFino: !!this.mqPuntero?.matches, reducido: !!this.mqReducido?.matches,
      ahorroDatos: !!nav.connection?.saveData, nucleos: nav.hardwareConcurrency,
    });
  }

  private revisarEquipo() {
    if (!this.vivo) return;
    const si = this.permitido();
    if (si && !this.iniciado && !this.iniciando) {
      this.iniciando = true;
      const arrancar = () => {
        if (!this.vivo) return;
        this.iniciar().catch((e) => console.warn('Bit no pudo abrir el local', e)).finally(() => (this.iniciando = false));
      };
      if ('requestIdleCallback' in window) (window as any).requestIdleCallback(arrancar, { timeout: 2500 });
      else setTimeout(arrancar, 800);
      return;
    }
    if (!this.iniciado) return;
    const lienzo = this.lienzo().nativeElement;
    if (!si && !this.pausado) {
      this.pausado = true;
      cancelAnimationFrame(this.cuadro); this.cuadro = 0;
      lienzo.classList.remove('listo');
    } else if (si && this.pausado) {
      this.pausado = false;
      this.medir();
      lienzo.classList.add('listo');
      this.reanudar();
    }
  }

  private reanudar() {
    if (this.vivo && !this.pausado && !this.cuadro && !document.hidden && this.iniciado) { this.ultimo = performance.now(); this.bucle(); }
  }

  ngOnDestroy() {
    this.vivo = false;
    cancelAnimationFrame(this.cuadro);
    this.sub?.unsubscribe();
    this.limpiar.forEach((f) => f());
    this.escena?.traverse((o: any) => {
      o.geometry?.dispose?.();
      (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: any) => { m?.map?.dispose?.(); m?.dispose?.(); });
    });
    this.taller?.liberar();
    this.renderer?.dispose();
  }

  private async iniciar() {
    const [T, { RoundedBoxGeometry }, { mergeGeometries }] = await Promise.all([
      import('three'),
      import('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
      import('three/examples/jsm/utils/BufferGeometryUtils.js'),
    ]);
    if (!this.vivo) return;
    this.T = T;
    const lienzo = this.lienzo().nativeElement;
    const renderer = new T.WebGLRenderer({ canvas: lienzo, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    this.renderer = renderer;
    const escena = new T.Scene();
    this.escena = escena;
    this.camara = new T.PerspectiveCamera(30, 1, 0.1, 100);
    this.camara.position.set(0, 0, 14);
    escena.add(new T.HemisphereLight(0xfff1d6, 0x2a1f45, 1.3));
    const sol = new T.DirectionalLight(0xffffff, 2.3); sol.position.set(-3, 5, 6); escena.add(sol);
    const contra = new T.DirectionalLight(0x9a76f0, 2.5); contra.position.set(4, 1, -5); escena.add(contra);
    this.rayo = new T.Raycaster();
    // Pool de chispas: todas comparten la geometría y cada una guarda su material para siempre
    const geoChispa = new T.PlaneGeometry(1, 1);
    for (let i = 0; i < TAM_POOL; i++) {
      const mat = new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false });
      const m = new T.Mesh(geoChispa, mat);
      m.visible = false;
      escena.add(m);
      this.chispas.push({ m, mat, vx: 0, vy: 0, vida: 0, g: 0, activa: false });
    }

    const taller = crearTaller(T);
    this.taller = taller;
    const fundir = (b: Bit) => { fusionar(T, b.cuerpo, mergeGeometries); fusionar(T, b.manoI.g, mergeGeometries); fusionar(T, b.manoD.g, mergeGeometries); };
    this.bit = crearBit(T, taller, RoundedBoxGeometry, { cuerpo: '#6d3bd2', audif: '#ffb020', audif2: '#b7862c' }, true);
    this.acc = crearAccesorios(T, taller, RoundedBoxGeometry, this.bit, escena);
    fundir(this.bit);
    escena.add(this.bit.raiz);
    // El rival solo se arma la primera vez que hay un partido en vivo
    this.crearRival = () => {
      const r = crearBit(T, taller, RoundedBoxGeometry, { cuerpo: '#ff6b6b', audif: '#3ddc84', audif2: '#1f8a52' }, false);
      fundir(r);
      r.pop = 0; r.raiz.visible = false;
      escena.add(r.raiz);
      return r;
    };

    this.medir();
    this.sAct = this.escala;
    this.bit.x = -this.mw * 0.4; this.bit.y = 0;

    // Shaders y texturas listos antes del primer cuadro: así la primera voltereta o el primer "puf" no dan tirón
    await this.precompilar();
    if (!this.vivo) return;

    // El fondo del body se vuelve transparente para que Bit, que va detrás, se vea (el html ya tiene el color de pared)
    const fondo = document.body.style.background;
    document.body.style.background = 'transparent';
    this.limpiar.push(() => (document.body.style.background = fondo));
    this.escuchar();
    // Para pruebas: localStorage 'bit-depurar' expone el estado en window.__bit
    try { if (localStorage.getItem('bit-depurar')) (window as any).__bit = { c: this, T }; } catch { /* sin storage */ }
    this.iniciado = true;
    // Si mientras cargaba la ventana dejó de ser de PC, queda en pausa hasta que vuelva
    if (!this.permitido()) { this.pausado = true; return; }
    lienzo.classList.add('listo');
    this.ultimo = performance.now();
    this.bucle();
  }

  /** Compila todos los materiales (también los de accesorios y chispas, que empiezan ocultos) y sube sus texturas */
  private async precompilar() {
    const r = this.renderer!, escena = this.escena!, ocultos: THREE_NS.Object3D[] = [];
    escena.traverse((o) => { if (!o.visible) { ocultos.push(o); o.visible = true; } });
    try {
      await (r.compileAsync ? r.compileAsync(escena, this.camara!) : Promise.resolve(r.compile(escena, this.camara!)));
      escena.traverse((o: any) => {
        (Array.isArray(o.material) ? o.material : o.material ? [o.material] : []).forEach((m: any) => { if (m.map) r.initTexture(m.map); });
      });
    } catch { /* si falla, se compila al primer uso como antes */ }
    ocultos.forEach((o) => (o.visible = false));
  }

  // ---------- medidas y límites ----------
  private medir() {
    const w = innerWidth, h = innerHeight;
    this.renderer!.setSize(w, h, false);
    this.camara!.aspect = w / h;
    this.camara!.updateProjectionMatrix();
    this.mh = MEDIO_ALTO_MUNDO;
    this.mw = this.mh * this.camara!.aspect;
    // El tamaño en píxeles depende del equipo: más grande en un monitor que en un portátil
    this.escala = escalaBit(w, h);
    this.medirTope();
  }
  /**
   * Borde de abajo del header en coordenadas del mundo: Bit no se mete debajo de la barra.
   * Se mide al redimensionar, al hacer scroll y al cambiar de página, no en cada cuadro.
   */
  private medirTope() {
    const header = document.querySelector('app-navbar header');
    const px = Math.max(0, header?.getBoundingClientRect().bottom ?? 0);
    this.tope = (px / innerHeight) * this.mh * 2;
  }
  private limites(s: number) {
    // Medio ancho y alto de Bit con las manos abiertas, contando la inclinación al volar
    // y la perspectiva (lo que queda cerca de la cámara se ve un poco más grande)
    const rx = 1.5 * s, abajo = 1.05 * s, arriba = 1.4 * s;
    return { x0: -this.mw + rx, x1: this.mw - rx, y0: -this.mh + abajo + 0.15, y1: this.mh - this.tope - arriba };
  }
  private aMundo(el: Element) {
    const r = el.getBoundingClientRect();
    const X = (v: number) => ((v / innerWidth) * 2 - 1) * this.mw, Y = (v: number) => -((v / innerHeight) * 2 - 1) * this.mh;
    return { x: X(r.left + r.width / 2), y: Y(r.top + r.height / 2), izq: X(r.left), der: X(r.right), arriba: Y(r.top), abajo: Y(r.bottom), visible: r.bottom > 0 && r.top < innerHeight };
  }

  // ---------- espacios seguros ----------
  /**
   * ¿Qué hay en este elemento? true: una caja que tapa (tarjeta con fondo o borde, imagen, botón, enlace);
   * un elemento: texto suelto, que solo tapa donde están sus letras; null: fondo libre.
   */
  private esSolido(el: Element | null): true | Element | null {
    const vistos: Element[] = [], esTexto: boolean[] = [];
    let caja = false, heredado: true | Element | null = null;
    for (let e = el; e && e !== document.body && e !== document.documentElement; e = e.parentElement) {
      const c = this.clase.get(e);
      if (c !== undefined) { heredado = c; break; }
      vistos.push(e); esTexto.push(false);
      if (e instanceof SVGElement || SOLIDO.test(e.tagName)) { caja = true; break; }
      const st = getComputedStyle(e);
      if (st.visibility === 'hidden' || +st.opacity === 0) continue;
      const fondo = st.backgroundColor;
      if (st.backgroundImage !== 'none' || !(fondo === 'transparent' || /,\s*0\)$/.test(fondo))) { caja = true; break; }
      const bordes = [st.borderTopWidth, st.borderRightWidth, st.borderBottomWidth, st.borderLeftWidth].filter((w) => parseFloat(w) > 0).length;
      if (bordes >= 2) { caja = true; break; }
      if (/^(H[1-6]|P)$/.test(e.tagName) || [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent!.trim())) esTexto[esTexto.length - 1] = true;
    }
    // Dentro de una tarjeta todo es tarjeta; si no, cada uno guarda el texto más cercano hacia arriba
    if (caja || heredado === true) { vistos.forEach((e) => this.clase.set(e, true)); return true; }
    let acc = heredado;
    for (let i = vistos.length - 1; i >= 0; i--) { if (esTexto[i]) acc = vistos[i]; this.clase.set(vistos[i], acc); }
    return acc;
  }
  /** ¿El punto cae sobre las letras del texto (no sobre el resto de su renglón vacío)? */
  private enTexto(el: Element, px: number, py: number) {
    let rs = this.renglones.get(el);
    if (!rs) { const r = document.createRange(); r.selectNodeContents(el); rs = [...r.getClientRects()]; this.renglones.set(el, rs); }
    return rs.some((q) => px >= q.left - 12 && px <= q.right + 12 && py >= q.top - 8 && py <= q.bottom + 8);
  }
  /** Punto de la pantalla (px) libre de contenido; Bit no recibe clics, así que elementFromPoint ve la página */
  private libre(px: number, py: number) {
    const k = ((px >> 3) << 12) | (py >> 3);
    let v = this.puntos.get(k);
    if (v === undefined) {
      const r = this.esSolido(document.elementFromPoint(px, py));
      v = r === null ? true : r === true ? false : !this.enTexto(r, px, py);
      this.puntos.set(k, v);
    }
    return v;
  }
  /** Qué parte de Bit (0 a 1) quedaría detrás de contenido en (x, y) a escala sc; deja de contar al pasar de "max" */
  private tapado(x: number, y: number, sc: number, max = 0) {
    const k = innerWidth / (2 * this.mw);
    const cx = (x / this.mw + 1) / 2 * innerWidth, cy = (1 - y / this.mh) / 2 * innerHeight;
    const w = 1.15 * sc * k, arriba = 1.25 * sc * k, abajo = 1.05 * sc * k;
    let n = 0;
    for (let j = 0; j <= 6; j++) for (let i = 0; i <= 3; i++) {
      if (!this.libre(cx - w + (2 * w * i) / 3, cy - arriba + ((arriba + abajo) * j) / 6) && ++n / 28 > max) return n / 28;
    }
    return n / 28;
  }
  private limpiarCache() { this.puntos.clear(); this.renglones.clear(); this.clase = new WeakMap(); }
  /**
   * El espacio libre más cercano al ancla: prefiere la misma altura y su tamaño normal, y se encoge si el margen es angosto.
   * Si no hay ninguno limpio, el lugar de los bordes donde quede menos tapado. Se limita a unos milisegundos.
   */
  private buscarHueco(ax: number, ay: number, evitar?: { x: number; y: number; r: number }, base = this.escala) {
    this.limpiarCache();
    const t0 = performance.now();
    const lejos = (x: number, y: number) => !!evitar && Math.hypot(x - evitar.x, y - evitar.y) < evitar.r;
    const cand: { x: number; y: number; sc: number; p: number }[] = [];
    // No se encoge por debajo de un tamaño que aún se lea
    const minimo = Math.min(base, 0.4);
    for (const f of [1, 0.85, 0.7, 0.58]) {
      const sc = Math.max(minimo, base * f), L = this.limites(sc);
      if (L.y1 < L.y0 || L.x1 < L.x0) continue;
      for (let i = 0; i <= 14; i++) for (let j = 0; j <= 8; j++) {
        const x = L.x0 + ((L.x1 - L.x0) * i) / 14, y = L.y0 + ((L.y1 - L.y0) * j) / 8;
        cand.push({ x, y, sc, p: Math.hypot(x - ax, (y - ay) * 1.4) / this.mw + (1 - f) * 0.9 });
      }
    }
    cand.sort((a, b) => a.p - b.p);
    for (const c of cand) {
      if (lejos(c.x, c.y)) continue;
      if (this.tapado(c.x, c.y, c.sc) === 0) return { x: c.x, y: c.y, sc: c.sc, tapado: 0 };
      if (performance.now() - t0 > 4) break;
    }
    // Respaldo: en los bordes, empezando por los más cercanos al ancla, el lugar menos tapado.
    // Todo cabe en ~7 ms para no saltarse un cuadro de 60 fps
    const bordes: { x: number; y: number; sc: number; d: number }[] = [];
    for (const f of [0.7, 0.58]) {
      const sc = Math.max(minimo, base * f), L = this.limites(sc);
      if (L.y1 < L.y0) continue;
      for (const x of [L.x0, L.x1]) for (let j = 0; j <= 6; j++) {
        const y = L.y0 + ((L.y1 - L.y0) * j) / 6;
        if (!lejos(x, y)) bordes.push({ x, y, sc, d: Math.hypot(x - ax, (y - ay) * 1.4) / this.mw });
      }
    }
    bordes.sort((a, b) => a.d - b.d);
    let mejor: { x: number; y: number; sc: number; tapado: number } | null = null, mejorP = Infinity;
    for (const c of bordes) {
      if (performance.now() - t0 > 7) break;
      const t = this.tapado(c.x, c.y, c.sc, 0.45);
      const p = t * 3 + c.d;
      if (t <= 0.45 && p < mejorP) { mejor = { x: c.x, y: c.y, sc: c.sc, tapado: t }; mejorP = p; }
    }
    return mejor;
  }
  /** Mantiene el hueco elegido mientras siga libre y cerca del ancla; si no, busca otro (como mucho cada 0,7 s) */
  private huecoPara(actual: Hueco | null, clave: string, ref: unknown, ax: number, ay: number, evitar?: { x: number; y: number; r: number }, base = this.escala): Hueco {
    const h = actual, mismo = !!h && h.clave === clave && h.ref === ref && h.sc <= base + 1e-6;
    if (h && mismo && this.reloj < h.hasta) return h;
    if (h && mismo && h.ok && h.tapado === 0 && Math.hypot(h.x - ax, h.y - ay) < h.d + 0.25 * this.mw) {
      this.limpiarCache();
      if (this.tapado(h.x, h.y, h.sc) === 0) { h.hasta = this.reloj + 0.7; return h; }
    }
    const n = this.buscarHueco(ax, ay, evitar, base);
    // Sin hueco limpio se vuelve a intentar con más calma
    const espera = n && n.tapado === 0 ? 0.7 : 1.5;
    return n ? { ...n, ok: true, clave, ref, hasta: this.reloj + espera, d: Math.hypot(n.x - ax, n.y - ay) }
      : { x: 0, y: 0, sc: base, tapado: 1, ok: false, clave, ref, hasta: this.reloj + espera, d: 0 };
  }

  // ---------- eventos ----------
  private escuchar() {
    const alMover = (e: PointerEvent) => {
      this.ptr.x = ((e.clientX / innerWidth) * 2 - 1) * this.mw;
      this.ptr.y = -((e.clientY / innerHeight) * 2 - 1) * this.mh;
      this.ptr.mov = 0; this.ptr.dentro = true;
      if (e.pointerType === 'mouse') this.objetivo = (e.target as Element | null)?.closest?.('[data-bit]') ?? null;
    };
    const alSalir = (e: PointerEvent) => { if (!e.relatedTarget) { this.ptr.dentro = false; this.objetivo = null; } };
    const ndc = new this.T.Vector2();
    const alTocar = (e: PointerEvent) => {
      const el = e.target as Element | null;
      if (this.pausado || el?.closest?.(INTERACTIVO) || !this.rayo) return;
      ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
      this.rayo.setFromCamera(ndc, this.camara!);
      if (this.rayo.intersectObject(this.bit.raiz, true).length) this.celebrar();
    };
    const alRedimensionar = () => this.medir();
    // El header es sticky: su borde solo cambia con el scroll cerca del inicio de la página
    let topePendiente = false;
    const alScroll = () => {
      if (topePendiente) return;
      topePendiente = true;
      requestAnimationFrame(() => { topePendiente = false; this.medirTope(); });
    };
    const alCambiarPestana = () => { if (!document.hidden) this.reanudar(); };
    const alPlay = (e: Event) => { if (e.target instanceof HTMLVideoElement) this.video = e.target; };
    const alPausa = (e: Event) => { if (e.target === this.video) this.video = null; };
    const alEntrar = () => { if (!this.pausado) this.celebrar(); };
    addEventListener('pointermove', alMover, { passive: true });
    document.addEventListener('pointerout', alSalir, { passive: true });
    addEventListener('pointerdown', alTocar, { passive: true });
    addEventListener('resize', alRedimensionar);
    addEventListener('scroll', alScroll, { passive: true });
    document.addEventListener('visibilitychange', alCambiarPestana);
    document.addEventListener('play', alPlay, true);
    document.addEventListener('pause', alPausa, true);
    document.addEventListener('ended', alPausa, true);
    addEventListener('nexos:sesion', alEntrar);
    this.limpiar.push(() => {
      removeEventListener('pointermove', alMover);
      document.removeEventListener('pointerout', alSalir);
      removeEventListener('pointerdown', alTocar);
      removeEventListener('resize', alRedimensionar);
      removeEventListener('scroll', alScroll);
      document.removeEventListener('visibilitychange', alCambiarPestana);
      document.removeEventListener('play', alPlay, true);
      document.removeEventListener('pause', alPausa, true);
      document.removeEventListener('ended', alPausa, true);
      removeEventListener('nexos:sesion', alEntrar);
    });
    this.rutaAnterior = this.indiceRuta(this.router.url);
    this.sub = this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe((e) => {
      const nueva = this.indiceRuta(e.urlAfterRedirects);
      const dir = Math.sign(nueva - this.rutaAnterior);
      this.rutaAnterior = nueva;
      this.objetivo = null; this.video = null;
      if (dir) this.viaje = { fase: 'salir', dir, desde: this.reloj };
      requestAnimationFrame(() => this.medirTope());
    });
  }

  private indiceRuta(url: string) {
    const ruta = url.split(/[?#]/)[0];
    return ORDEN_RUTAS.find(([re]) => re.test(ruta))?.[1] ?? this.rutaAnterior;
  }

  private celebrar() {
    this.bit.vgiro = 20;
    this.expr = 'amor'; this.exprHasta = this.reloj + 1.6;
    const p = this.bit.raiz.position;
    this.chispazo(p.x, p.y, ['#ff6b6b', '#9a76f0', '#ffb020'], 16, 0.09);
  }

  // ---------- partículas (pool fijo) ----------
  private tomarChispa(): Chispa | null {
    if (this.activas >= this.chispas.length) return null;
    for (const c of this.chispas) if (!c.activa) { c.activa = true; c.m.visible = true; this.activas++; return c; }
    return null;
  }
  private chispazo(x: number, y: number, colores: string[], n: number, tam: number, fuerza = 1) {
    const s = this.sAct;
    for (let i = 0; i < n; i++) {
      const c = this.tomarChispa();
      if (!c) return;
      c.mat.color.set(colores[i % colores.length]); c.mat.opacity = 1;
      c.m.scale.setScalar(tam * s * 1.1); c.m.position.set(x, y, 0.6); c.m.rotation.z = 0;
      const a = Math.random() * Math.PI * 2, v = (1.8 + Math.random() * 3) * fuerza * s;
      c.vx = Math.cos(a) * v; c.vy = Math.sin(a) * v + 1.2; c.vida = 1; c.g = 7;
    }
  }
  private estela(pos: THREE_NS.Vector3, dir: number) {
    const c = this.tomarChispa();
    if (!c) return;
    const s = this.sAct;
    c.mat.color.set(Math.random() > 0.5 ? '#e8eeff' : '#9a76f0'); c.mat.opacity = 0.8;
    c.m.scale.set((0.5 + Math.random() * 0.4) * s, 0.03, 1); c.m.rotation.z = 0;
    c.m.position.set(pos.x - dir * 0.6 * s, pos.y + (Math.random() - 0.5) * 0.9 * s, 0.3);
    c.vx = -dir * 2; c.vy = 0; c.vida = 0.6; c.g = 0;
  }

  // ---------- física ----------
  private volar(b: Bit, tx: number, ty: number, dt: number, s: number, rig = 3.2, am = 2.8, estira = 1) {
    // El "pop" al reaparecer rebota por encima de 1: los límites cuentan ese tamaño extra
    const L = this.limites(s * Math.max(1, b.pop) * estira);
    tx = Math.min(L.x1, Math.max(L.x0, tx)); ty = Math.min(L.y1, Math.max(L.y0, ty));
    b.vx += ((tx - b.x) * rig - b.vx * am) * dt; b.vy += ((ty - b.y) * rig - b.vy * am) * dt;
    b.x += b.vx * dt; b.y += b.vy * dt;
    // Nunca sale de la pantalla: si el resorte lo empuja afuera, rebota suave hacia adentro
    if (b.x < L.x0 || b.x > L.x1) { b.x = Math.min(L.x1, Math.max(L.x0, b.x)); b.vx *= -0.3; }
    if (b.y < L.y0 || b.y > L.y1) { b.y = Math.min(L.y1, Math.max(L.y0, b.y)); b.vy *= -0.3; }
    // Voltereta con freno; luego un resorte lo deja derecho (nunca queda boca abajo)
    if (Math.abs(b.vgiro) > 0.8) { b.vgiro -= b.vgiro * 2.4 * dt; b.giro += b.vgiro * dt; }
    else { const meta = Math.round(b.giro / (Math.PI * 2)) * Math.PI * 2; b.giro += (meta - b.giro) * suave(dt, 6); b.vgiro = 0; if (Math.abs(b.giro - meta) < 0.002) b.giro = 0; }
    b.raiz.scale.set(s * b.pop * estira, (s * b.pop) / Math.sqrt(estira), s * b.pop);
    b.raiz.position.set(b.x, b.y + Math.sin(this.reloj * 3 + b.x) * 0.05 * s, 0);
    b.raiz.rotation.z = Math.min(0.25, Math.max(-0.25, -b.vx * 0.05)) + b.giro;
    b.llama.scale.set(1, 0.7 + Math.random() * 0.4 + Math.min(Math.hypot(b.vx, b.vy) * 0.15, 0.8), 1);
  }

  // ---------- bucle ----------
  private bucle = () => {
    this.cuadro = 0;
    if (!this.vivo || this.pausado || document.hidden) return; // pestaña oculta o ventana de celular: no gasta batería
    this.cuadro = requestAnimationFrame(this.bucle);
    const ahora = performance.now();
    const dt = Math.min((ahora - this.ultimo) / 1000, 0.05);
    const ocupado = this.ptr.mov < 3 || !!this.objetivo || !!this.viaje.fase || this.activas > 0 || this.rivalActivo || this.video;
    if (!ocupado && dt < 1 / 30 - 0.002) return; // en reposo basta con 30 fps
    this.ultimo = ahora;
    this.reloj += dt;
    this.animar(dt);
    this.renderer!.render(this.escena!, this.camara!);
  };

  private animar(dt: number) {
    const bit = this.bit, acc = this.acc, ptr = this.ptr, s = this.escala;
    ptr.mov += dt;
    const kp = suave(dt, 8);
    ptr.sx += (ptr.x - ptr.sx) * kp; ptr.sy += (ptr.y - ptr.sy) * kp;
    const L = this.limites(s);
    if (this.objetivo && !this.objetivo.isConnected) this.objetivo = null;

    if (this.reloj > this.rutinaHasta) {
      this.rutina = RUTINAS[this.iRutina++ % RUTINAS.length];
      this.inicioRutina = this.reloj;
      this.rutinaHasta = this.reloj + (this.rutina === 'pasear' ? 5 : 8);
    }
    const siguiendo = ptr.dentro && ptr.mov < 1.2;
    const marca = this.objetivo?.getAttribute('data-bit') as Estado | null;
    const card = this.objetivo ? this.aMundo(this.objetivo) : null;
    const vid = this.video && !this.video.paused ? this.aMundo(this.video) : null;
    const estado: Estado = this.viaje.fase ? 'viaje' : marca && card?.visible ? marca : vid?.visible ? 'tele' : ptr.mov > 16 ? 'dormir' : siguiendo ? 'seguir' : this.rutina;
    const enVivo = estado === 'vivo' && !!card;
    this.estado = estado;

    // ----- espacio seguro: cuando hace algo, Bit se aparta a un hueco libre para que se vea; libre o siguiéndote va donde quiera -----
    const ancla = card ?? (estado === 'tele' ? vid : null);
    let h: Hueco | null = null;
    if (estado !== 'viaje' && estado !== 'pasear' && estado !== 'seguir') {
      const ref = estado === 'tele' ? this.video : card ? this.objetivo : estado === 'dormir' ? 'dormir' : this.inicioRutina;
      // Las rutinas parten de donde está; dormir, de la esquina de abajo; las reacciones, de su elemento
      const ax = ancla ? ancla.x : estado === 'dormir' ? L.x0 : bit.x, ay = ancla ? ancla.y : estado === 'dormir' ? L.y0 : bit.y;
      this.hueco = this.huecoPara(this.hueco, estado, ref, ax, ay);
      h = this.hueco.ok ? this.hueco : null;
    }
    let rt: Hueco | null = null;
    if (enVivo && h) {
      // El rival busca un hueco de su mismo tamaño (nunca más grande que Bit)
      const hacia = h.x < 0 ? 1 : -1;
      this.huecoR = this.huecoPara(this.huecoR, 'rival', this.objetivo, h.x + hacia * 2.8 * h.sc, h.y, { x: h.x, y: h.y, r: 2.4 * h.sc }, h.sc);
      rt = this.huecoR.ok ? this.huecoR : null;
    }
    // En el duelo los dos van del tamaño del hueco más pequeño; el rival usa esta misma escala
    const meta = enVivo ? escalaDuelo(s, h?.sc, rt?.sc) : h ? h.sc : s;
    this.sAct += (meta - this.sAct) * suave(dt, 3);

    // ----- a dónde va -----
    let tx = bit.x, ty = bit.y, mirar = 0, rig = 3.2, am = 2.8, estira = 1;
    if (estado === 'viaje') {
      const borde = this.viaje.dir > 0 ? L.x1 : L.x0;
      if (this.viaje.fase === 'salir') {
        tx = borde; rig = 9; am = 3.2; mirar = 0.7 * this.viaje.dir;
        estira = 1 + Math.min(Math.abs(bit.vx) * 0.03, 0.15);
        if (Math.random() < 0.6) this.estela(bit.raiz.position, this.viaje.dir);
        if (Math.abs(bit.x - borde) < 0.15 || this.reloj - this.viaje.desde > 1.1) {
          // Sale por un borde con un "puf" y entra por el otro
          this.chispazo(bit.raiz.position.x, bit.raiz.position.y, ['#9a76f0', '#e8eeff', '#ffb020'], 18, 0.1, 0.8);
          bit.x = this.viaje.dir > 0 ? L.x0 : L.x1; bit.vx = this.viaje.dir * 7; bit.pop = 0.2; bit.vpop = 0;
          this.chispazo(bit.x, bit.y, ['#9a76f0', '#e8eeff', '#ffb020'], 18, 0.1, 0.8);
          this.viaje = { fase: 'entrar', dir: this.viaje.dir, desde: this.reloj };
        }
      } else {
        tx = this.viaje.dir > 0 ? L.x0 + this.mw * 0.5 : L.x1 - this.mw * 0.5; mirar = 0.4 * this.viaje.dir;
        if (this.reloj - this.viaje.desde > 0.9) { this.viaje.fase = null; this.saludoHasta = this.reloj + 2; }
      }
    } else if (estado === 'pasear') { tx = Math.sin(this.reloj * 0.21) * this.mw; ty = Math.sin(this.reloj * 0.33 + 1) * this.mh * 0.6; mirar = Math.max(-0.5, Math.min(0.5, bit.vx * 0.3)); }
    else if (estado === 'seguir') { tx = ptr.sx - 1.5 * s * Math.sign(ptr.sx - bit.x || 1); ty = ptr.sy + 0.7 * s; mirar = Math.max(-0.6, Math.min(0.6, (ptr.sx - bit.x) * 0.25)); }
    else if (h) {
      tx = h.x; ty = h.y;
      if (ancla) {
        // Señala hacia su elemento desde el lado donde quedó: derecha, izquierda, abajo o arriba
        const ladoX = tx < ancla.izq ? 1 : tx > ancla.der ? -1 : 0;
        this.lado = ladoX || (ty > ancla.y ? 0 : 2);
        mirar = ladoX * 0.45;
      }
      if (enVivo) { const rx = rt ? rt.x : this.mw * 0.45; mirar = rx > bit.x ? 0.55 : -0.55; }
    }
    else if (estado === 'dormir') { tx = L.x0; ty = L.y0; }
    else if (estado === 'tele' && vid) { tx = vid.izq + 0.9 * s; ty = vid.abajo - 0.9 * s; mirar = 0.35; }
    else if (enVivo) { tx = -this.mw * 0.45; ty = L.y0; mirar = 0.55; }
    else if (card && (estado === 'precios' || estado === 'mejor-precio' || estado === 'juego' || estado === 'post')) {
      const izq = card.izq - 1.1 * s > L.x0;
      tx = izq ? card.izq - 1.1 * s : card.der + 1.1 * s; ty = card.y; mirar = izq ? 0.45 : -0.45; this.lado = izq ? 1 : -1;
      if (estado === 'juego' && !izq && !(card.der + 1.1 * s < L.x1)) { tx = card.x; ty = card.arriba + 0.9 * s; this.lado = 0; }
    } else if (card && estado === 'comparar') { tx = card.x; ty = card.arriba + 1.0 * s; }
    else if (card && (estado === 'dudas' || estado === 'vivo')) { tx = card.izq - 1.1 * s; ty = card.y + 0.2; mirar = 0.3; }

    // Viendo el tráiler se voltea hacia la pantalla, como si lo vieras con él: de lado y de medio espaldas
    if (estado === 'tele' && vid) mirar = (vid.x > tx ? 1 : -1) * 1.05;
    bit.vpop += (1 - bit.pop) * 200 * dt - bit.vpop * 12 * dt; bit.pop += bit.vpop * dt;
    this.volar(bit, tx, ty, dt, this.sAct, rig, am, estira);
    bit.cuerpo.rotation.y += (mirar - bit.cuerpo.rotation.y) * suave(dt, 5);
    // Con el tráiler alza o baja la cabeza según dónde quedó la pantalla
    const inclina = estado === 'post' ? 0.12 : estado === 'tele' && vid ? Math.max(-0.3, Math.min(0.3, -(vid.y - bit.y) * 0.12)) : siguiendo ? Math.max(-0.25, Math.min(0.25, -(ptr.sy - bit.y) * 0.1)) : 0;
    bit.cuerpo.rotation.x += (inclina - bit.cuerpo.rotation.x) * suave(dt, 5);
    bit.llama.visible = estado !== 'dormir' && estado !== 'tele';

    // ----- manos y accesorios -----
    const mI = bit.manoI, mD = bit.manoD, t = this.reloj, b1 = Math.sin(t * 2.4) * 0.04, b2 = Math.sin(t * 2.4 + 1.3) * 0.04;
    acc.taza.visible = estado === 'tinto'; acc.trapo.visible = estado === 'limpiar';
    acc.libreta.visible = acc.lapiz.visible = estado === 'post';
    if (bit.lapizBolsillo) bit.lapizBolsillo.visible = estado !== 'post';
    acc.tiquete.visible = false;
    let sorbo = 0, fTiq = 99;
    const lado = this.lado;
    if (estado === 'viaje') {
      colgar(mI, -0.78, -0.2, 0.5 * this.viaje.dir, dt, 12); colgar(mD, 0.78, -0.2, 0.5 * this.viaje.dir, dt, 12);
    } else if (estado === 'tinto') {
      sorbo = Math.max(0, Math.sin(t * 1.3)) ** 3;
      const cy = -0.36 + sorbo * 0.28;
      acc.taza.position.set(0, cy, 0.62); acc.taza.rotation.x = -sorbo * 0.45;
      ponerMano(mI, -0.11, cy - 0.24, 0.84, -0.35, 'agarrar', dt); ponerMano(mD, 0.11, cy - 0.24, 0.84, 0.35, 'agarrar', dt);
      acc.vapor.forEach((v, i) => {
        const f = (t * 0.6 + i / 3) % 1;
        v.position.set(Math.sin(f * 6 + i) * 0.05, 0.22 + f * 0.5, 0); v.scale.setScalar(0.6 + f);
        (v.material as THREE_NS.MeshBasicMaterial).opacity = (1 - f) * 0.55 * (1 - sorbo);
      });
    } else if (estado === 'limpiar') {
      const a = t * 3.2;
      ponerMano(mD, 0.1 + Math.cos(a) * 0.14, 0.12 + Math.sin(a * 2) * 0.05, 0.7, 0.12 + Math.cos(a) * 0.12, 'plana', dt, 14);
      acc.trapo.position.set(mD.g.position.x - 0.01, mD.g.position.y + 0.12, 0.6); acc.trapo.rotation.z = 0.08;
      acc.ondear(t);
      colgar(mI, -0.8, -0.32 + b1, 0.15, dt);
    } else if (estado === 'tiquete') {
      fTiq = (t - this.inicioRutina) % 8;
      const tq = acc.tiquete;
      if (fTiq < 1.2) {
        // sale impreso del visor
        tq.visible = true; tq.position.set(-0.23, -0.06, 0.56); tq.scale.set(Math.min(1, fTiq), 1, 1); tq.rotation.set(0, 0, 0);
        ponerMano(mD, 0.32, -0.1, 0.6, Math.PI / 2, 'abierta', dt);
      } else if (fTiq < 5.6) {
        // te lo ofrece
        tq.visible = true; tq.scale.set(1, 1, 1);
        const o = Math.min(1, (fTiq - 1.2) / 0.6);
        ponerMano(mD, 0.32 + 0.23 * o, -0.1 + 0.05 * o, 0.6 + 0.4 * o, 0.15, 'pinza', dt, 10, 1);
        tq.position.set(mD.g.position.x - 0.25, mD.g.position.y + 0.22, mD.g.position.z + 0.06); tq.rotation.set(0, 0, Math.sin(t * 3) * 0.06);
      } else if (fTiq < 6.4) {
        // vuela hacia ti
        tq.visible = true; const v = (fTiq - 5.6) / 0.8; tq.position.z = 1 + v * 1.4; tq.scale.setScalar(1 + v * 0.6);
        if (!this.tiqueteVolo) { this.tiqueteVolo = true; this.chispazo(bit.raiz.position.x + 0.4 * this.sAct, bit.raiz.position.y, ['#ffb020', '#efe3c6'], 14, 0.09); }
        ponerMano(mD, 0.86, 0.42, 0.2, -0.2 + Math.sin(t * 10) * 0.4, 'abierta', dt, 16, 0);
      } else { this.tiqueteVolo = false; colgar(mD, 0.82, -0.3 + b2, 0.18, dt); }
      colgar(mI, -0.82, -0.3 + b1, 0.18, dt);
    } else if (estado === 'post') {
      acc.libreta.position.set(-0.32, -0.3, 0.72); acc.libreta.rotation.set(-0.3, 0.25, 0.1);
      ponerMano(mI, -0.42, -0.5, 0.66, 0.35, 'agarrar', dt, 10, 1);
      const a = t * 9, renglon = Math.floor((t * 0.8) % 4);
      ponerMano(mD, -0.25 + Math.sin(a) * 0.05 + ((t * 0.8) % 1) * 0.1, -0.32 + Math.cos(a * 0.5) * 0.02 - renglon * 0.06, 0.86, 0.5, 'pinza', dt, 18, 0);
      acc.lapiz.position.set(mD.g.position.x - 0.03, mD.g.position.y + 0.1, mD.g.position.z + 0.06); acc.lapiz.rotation.set(0.3, 0, 0.55);
      acc.renglones.forEach((r, i) => (r.scale.x = Math.min(1, Math.max(0.05, ((t * 0.8) % 4) - i))));
    } else if ((estado === 'precios' || estado === 'mejor-precio' || estado === 'juego') && (lado === 1 || lado === -1)) {
      const m = lado > 0 ? mD : mI, o = lado > 0 ? mI : mD;
      ponerMano(m, 0.98 * lado, 0.04, 0.3, (-Math.PI / 2) * lado, 'senalar', dt);
      colgar(o, -0.8 * lado, -0.32 + b1, 0.15, dt);
    } else if ((estado === 'precios' || estado === 'mejor-precio' || estado === 'juego') && lado === 2) {
      // el elemento quedó arriba: señala hacia arriba
      ponerMano(mD, 0.4, 0.95, 0.35, 0, 'senalar', dt); colgar(mI, -0.8, -0.32 + b1, 0.15, dt);
    } else if (estado === 'precios' || estado === 'mejor-precio' || estado === 'juego') {
      ponerMano(mD, 0.25, -0.8, 0.35, Math.PI, 'senalar', dt, 10, 1); colgar(mI, -0.8, -0.32 + b1, 0.15, dt);
    } else if (estado === 'dudas' || t < this.saludoHasta) {
      ponerMano(mD, 0.86, 0.42, 0.2, -0.2 + Math.sin(t * 10) * 0.4, 'abierta', dt, 16, 0); colgar(mI, -0.8, -0.32 + b1, 0.15, dt);
    } else if (enVivo) {
      // levanta el puño del lado del rival
      const hacia = (rt ? rt.x : this.mw * 0.45) > bit.x ? 1 : -1, m = hacia > 0 ? mD : mI, o = hacia > 0 ? mI : mD;
      ponerMano(m, 0.8 * hacia, 0.15 + Math.max(0, Math.sin(t * 3)) * 0.35, 0.2, -0.2 * hacia, 'puno', dt, 14); colgar(o, -0.8 * hacia, -0.32 + b1, 0.15, dt);
    } else if (estado === 'dormir' || estado === 'tele') {
      colgar(mI, -0.62, -0.6, 0.35, dt, 4); colgar(mD, 0.62, -0.6, 0.35, dt, 4);
    } else {
      colgar(mI, -0.82 - bit.vx * 0.03, -0.3 + b1, 0.18 - bit.vx * 0.05, dt); colgar(mD, 0.82 - bit.vx * 0.03, -0.3 + b2, 0.18 + bit.vx * 0.05, dt);
    }
    moverMano(mI, dt, t); moverMano(mD, dt, t);

    this.animarRival(enVivo, dt, s, L, rt);

    // ----- visor -----
    if (t > this.parpadeo + 0.12) this.parpadeo = t + 2.5 + Math.random() * 2.5;
    const goles = enVivo ? this.objetivo?.getAttribute('data-bit-goles') ?? '' : '';
    const guion = goles.indexOf('-');
    const gA = guion < 0 ? goles : goles.slice(0, guion), gB = guion < 0 ? '' : goles.slice(guion + 1);
    const ganador = estado === 'comparar' ? this.objetivo?.getAttribute('data-bit-ganador') : null;
    const modo: ModoVisor = t < 0.7 ? (Math.sin(t * 45) > 0 ? 'normal' : 'apagado')
      : t < this.exprHasta ? this.expr
      : enVivo ? 'vivo' : fTiq < 6.4 ? 'reloj' : estado === 'dormir' ? 'dormido' : estado === 'precios' || estado === 'mejor-precio' ? 'wow'
      : estado === 'juego' ? 'precio' : estado === 'post' ? 'escribe' : estado === 'limpiar' ? 'limpia'
      : estado === 'comparar' ? (ganador === 'a' ? 'flecha-izq' : ganador === 'b' ? 'flecha-der' : 'igual')
      : estado === 'dudas' || estado === 'tele' || estado === 'viaje' || sorbo > 0.3 ? 'feliz' : 'normal';
    // Un solo objeto de datos que se reutiliza: nada de basura por cuadro
    const datos = this.datosVisor;
    datos.mx = Math.round(Math.max(-2, Math.min(2, (ptr.sx - bit.x) * 0.6)));
    datos.my = Math.round(Math.max(-2, Math.min(2, -(ptr.sy - bit.y) * 0.6)));
    datos.cerrado = t > this.parpadeo; datos.goles = gA; datos.color = '#ffb020';
    datos.descuento = estado === 'juego' ? this.objetivo?.getAttribute('data-bit-descuento') ?? '0' : '0';
    if (dibujarVisor(bit.visor.px, modo, t, datos, bit.visor.ultima)) bit.visor.t.needsUpdate = true;
    if (this.rival?.raiz.visible && dibujarVisor(this.rival.visor.px, 'vivo', t, { goles: gB, color: '#3ddc84' }, this.rival.visor.ultima)) this.rival.visor.t.needsUpdate = true;

    // ----- chispas -----
    if (this.activas) for (const c of this.chispas) {
      if (!c.activa) continue;
      c.vy -= c.g * dt; c.m.position.x += c.vx * dt; c.m.position.y += c.vy * dt;
      if (c.g) c.m.rotation.z += dt * 6;
      c.vida -= dt * 1.3;
      c.mat.opacity = Math.max(c.vida, 0);
      if (c.vida <= 0) { c.activa = false; c.m.visible = false; this.activas--; }
    }
  }

  /** El rival aparece de la nada con un "puf" de píxeles y se planta frente a Bit con un "VS" en medio */
  private animarRival(enVivo: boolean, dt: number, s: number, L: ReturnType<BitTendero['limites']>, rt: Hueco | null) {
    // Con espacio libre, el rival aparece en su propio hueco; si no, abajo a la derecha como antes.
    // Va exactamente del tamaño de Bit: uno nunca se ve más grande que el otro
    const sr = this.sAct, Lr = this.limites(sr);
    const mx = rt ? rt.x : this.mw * 0.45, my = rt ? rt.y : Lr.y0;
    if (enVivo && !this.rival) this.rival = this.crearRival!();
    const r = this.rival;
    if (!r) return;
    if (enVivo && !this.rivalActivo) {
      this.rivalActivo = true;
      r.x = mx; r.y = my; r.vx = r.vy = 0; r.pop = 0; r.vpop = 0; r.raiz.visible = true;
      this.chispazo(r.x, r.y, ['#3ddc84', '#ff6b6b', '#e8eeff', '#9a76f0'], 26, 0.12);
    }
    if (!enVivo && this.rivalActivo) { this.rivalActivo = false; this.chispazo(r.x, r.y, ['#3ddc84', '#ff6b6b', '#e8eeff'], 20, 0.12); }
    r.vpop += ((this.rivalActivo ? 1 : 0) - r.pop) * 220 * dt - r.vpop * (this.rivalActivo ? 13 : 30) * dt;
    r.pop = Math.max(0, r.pop + r.vpop * dt);
    if (!this.rivalActivo && r.pop < 0.02) { r.pop = 0; r.raiz.visible = false; }
    if (r.raiz.visible) {
      this.volar(r, mx, my + Math.sin(this.reloj * 3 + 1) * 0.04, dt, sr, 3.5, 3);
      // mira a Bit y levanta el puño de ese lado
      const hacia = this.bit.x > r.x ? 1 : -1, m = hacia > 0 ? r.manoD : r.manoI, o = hacia > 0 ? r.manoI : r.manoD;
      r.cuerpo.rotation.y += (0.55 * hacia - r.cuerpo.rotation.y) * suave(dt, 5);
      ponerMano(m, 0.8 * hacia, 0.15 + Math.max(0, Math.sin(this.reloj * 3 + Math.PI)) * 0.35, 0.2, -0.2 * hacia, 'puno', dt, 14);
      colgar(o, -0.8 * hacia, -0.32, 0.15, dt);
      moverMano(r.manoI, dt, this.reloj); moverMano(r.manoD, dt, this.reloj);
    }
    const vs = this.acc.vs;
    vs.visible = this.rivalActivo && r.pop > 0.8;
    // el "VS" va entre los dos
    vs.position.set((this.bit.x + r.x) / 2, (rt ? (this.bit.y + r.y) / 2 : L.y0) + Math.sin(this.reloj * 6) * 0.05, 0.5);
    vs.scale.setScalar(sr * (1 + Math.max(0, Math.sin(this.reloj * 6)) * 0.12));
  }
}
