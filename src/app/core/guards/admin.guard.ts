import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';
import { AdminService } from '../services/admin';

// Deja pasar a /admin solo a los administradores. Es una comodidad visual:
// la protección real está en la API, que revisa el token y el correo en cada petición.
export const adminGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const router = inject(Router);
  const admin = inject(AdminService);

  // Espera a que Firebase sepa si hay sesión (al recargar la página tarda un momento)
  const usuario = await new Promise<User | null>((listo) => {
    const quitar = onAuthStateChanged(auth, (u) => { quitar(); listo(u); });
  });
  if (usuario && (await admin.esAdmin())) return true;
  return router.createUrlTree(['/perfil']);
};
