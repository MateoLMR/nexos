import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { AuthFalsa } from '../../../test-providers';
import { AuthService } from '../../core/services/auth';
import { esPaginaPrivada, Navbar } from './navbar';

const espera = () => new Promise((r) => setTimeout(r, 0));

describe('Navbar', () => {
  let fixture: ComponentFixture<Navbar>;
  let auth: AuthFalsa;
  let router: Router;
  let ir: ReturnType<typeof vi.spyOn>;

  const enRuta = (url: string) => vi.spyOn(router, 'url', 'get').mockReturnValue(url);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Navbar],
      // El cierre de sesión real llama a Firebase; aquí solo avisa que ya no hay usuario
      providers: [{ provide: AuthService, useFactory: () => ({ logout: () => (TestBed.inject(Auth) as unknown as AuthFalsa).signOut() }) }],
    }).compileComponents();
    auth = TestBed.inject(Auth) as unknown as AuthFalsa;
    router = TestBed.inject(Router);
    ir = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(Navbar);
    await espera();
  });

  afterEach(() => fixture.destroy());

  it('se crea sin sesión', () => {
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.usuario()).toBeNull();
  });

  it('al cerrar sesión en el cubículo (/perfil) lleva al inicio', async () => {
    enRuta('/perfil');
    auth.emitirUsuario({ uid: 'u1' });
    await fixture.componentInstance.levantarse();
    expect(ir).toHaveBeenCalledWith('/');
  });

  it('al cerrar sesión en el panel de administración lleva al inicio', () => {
    enRuta('/admin/juego/elden-ring');
    auth.emitirUsuario({ uid: 'u1' });
    auth.emitirUsuario(null);
    expect(ir).toHaveBeenCalledWith('/');
  });

  it('al cerrar sesión en una página pública se queda donde está', () => {
    enRuta('/juegos');
    auth.emitirUsuario({ uid: 'u1' });
    auth.emitirUsuario(null);
    expect(ir).not.toHaveBeenCalled();
  });

  it('entrar a /perfil sin sesión no redirige (ahí se ofrece iniciarla)', () => {
    enRuta('/perfil');
    auth.emitirUsuario(null);
    expect(ir).not.toHaveBeenCalled();
  });
});

describe('esPaginaPrivada', () => {
  it('reconoce el cubículo y el panel', () => {
    expect(esPaginaPrivada('/perfil')).toBe(true);
    expect(esPaginaPrivada('/perfil?x=1')).toBe(true);
    expect(esPaginaPrivada('/admin')).toBe(true);
    expect(esPaginaPrivada('/admin/juego/hades')).toBe(true);
  });
  it('deja quietas las públicas', () => {
    for (const url of ['/', '/juegos', '/foro', '/perfiles', '/esports/league']) expect(esPaginaPrivada(url)).toBe(false);
  });
});
