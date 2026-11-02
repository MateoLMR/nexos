import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';

// Agrega "Authorization: Bearer <ID token de Firebase>" a las peticiones hacia nuestra API.
// Solo a nuestra API: el token no se envía a otros dominios (PandaScore, etc.).
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) return next(req);
  // Rutas públicas: no necesitan sesión y así no esperan a Firebase
  if (/\/api\/(pandascore|precios|plataformas)\b/.test(req.url)) return next(req);

  const user = inject(Auth).currentUser;
  if (!user) return next(req);

  return from(user.getIdToken()).pipe(
    switchMap((token) => next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })))
  );
};
