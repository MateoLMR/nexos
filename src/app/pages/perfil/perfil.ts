import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ProfileService, Profile } from '../../core/services/perfil';
import { AuthService } from '../../core/services/auth';
import { MotionService } from '../../shared/utils/motion';
import { Icono } from '../../shared/ui/icono';

// Tu cubículo: el perfil del usuario con sesión iniciada.
@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [RouterLink, Icono],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit, OnDestroy {
  auth = inject(Auth);
  profileService = inject(ProfileService);
  private authService = inject(AuthService);
  private motion = inject(MotionService);
  private cdr = inject(ChangeDetectorRef);

  profileData: Profile | null = null;
  estado: 'cargando' | 'listo' | 'sin-sesion' | 'error' = 'cargando';
  entrando = false;
  tiempo = signal('00:00:00');
  private reloj?: ReturnType<typeof setInterval>;

  async ngOnInit() {
    // Espera a que Firebase restaure la sesión (al recargar, currentUser empieza en null)
    await this.auth.authStateReady();
    await this.cargar();
  }

  ngOnDestroy() {
    if (this.reloj) clearInterval(this.reloj);
  }

  private async cargar() {
    if (!this.auth.currentUser) {
      this.estado = 'sin-sesion';
      this.cdr.markForCheck();
      return;
    }
    try {
      // POST /users/me devuelve el perfil propio con email (y lo crea si aún no existe)
      this.profileData = await this.profileService.createProfile();
      this.estado = 'listo';
      this.iniciarReloj();
    } catch (error) {
      console.error(error);
      this.estado = 'error';
    }
    this.cdr.detectChanges();
    this.encender();
  }

  async sentarse() {
    if (this.entrando) return;
    this.entrando = true;
    try {
      await this.authService.loginWithGoogle();
      await this.cargar();
    } catch {
      /* el error ya se registra en AuthService */
    } finally {
      this.entrando = false;
      this.cdr.markForCheck();
    }
  }

  async levantarse() {
    await this.authService.logout();
    try { sessionStorage.removeItem('nexos-sesion-inicio'); } catch { /* sin storage */ }
    this.profileData = null;
    this.estado = 'sin-sesion';
    if (this.reloj) clearInterval(this.reloj);
    this.cdr.markForCheck();
  }

  miembroDesde(fecha?: string) {
    return fecha ? new Date(fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  }

  // El cubículo "se enciende": la pantalla pasa de apagada a encendida
  private encender() {
    const pantalla = document.querySelector('.pantalla');
    if (!pantalla || this.motion.reducido()) return;
    this.motion.gsap.fromTo(pantalla,
      { clipPath: 'inset(49% 0 49% 0)', filter: 'brightness(2.2)' },
      { clipPath: 'inset(0% 0 0% 0)', filter: 'brightness(1)', duration: 0.7, ease: 'expo.out' });
    this.motion.entrar(document.querySelectorAll('[data-entra]'), { y: 16, delay: 0.3 });
  }

  // Mismo temporizador de la barra: cuánto llevas sentado en el café
  private iniciarReloj() {
    let inicio = Date.now();
    try {
      const guardado = Number(sessionStorage.getItem('nexos-sesion-inicio'));
      if (guardado) inicio = guardado;
      else sessionStorage.setItem('nexos-sesion-inicio', String(inicio));
    } catch { /* sin storage */ }
    const pintar = () => {
      const s = Math.floor((Date.now() - inicio) / 1000);
      this.tiempo.set([Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0')).join(':'));
    };
    pintar();
    if (this.reloj) clearInterval(this.reloj);
    this.reloj = setInterval(pintar, 1000);
  }
}
