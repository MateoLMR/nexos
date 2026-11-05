// Providers comunes de las pruebas unitarias (angular.json → test.options.providersFile).
// Las pruebas no hablan con Firebase ni con la red: el router no tiene rutas, HttpClient usa el backend
// de pruebas y Auth es un doble que permite simular entrar y salir.
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';

type Oyente = (usuario: unknown) => void;

/** Doble de Firebase Auth: sin sesión al empezar; emitirUsuario() simula iniciar o cerrar sesión */
export class AuthFalsa {
  currentUser: unknown = null;
  private oyentes = new Set<Oyente>();
  onAuthStateChanged(siguiente: Oyente | { next: Oyente }) {
    const f: Oyente = typeof siguiente === 'function' ? siguiente : (u) => siguiente.next(u);
    this.oyentes.add(f);
    queueMicrotask(() => f(this.currentUser));
    return () => this.oyentes.delete(f);
  }
  authStateReady() { return Promise.resolve(); }
  signOut() { this.emitirUsuario(null); return Promise.resolve(); }
  emitirUsuario(usuario: unknown) {
    this.currentUser = usuario;
    this.oyentes.forEach((f) => f(usuario));
  }
}

const providers: (Provider | EnvironmentProviders)[] = [
  provideRouter([]),
  provideHttpClient(),
  provideHttpClientTesting(),
  { provide: Auth, useFactory: () => new AuthFalsa() },
];
export default providers;
