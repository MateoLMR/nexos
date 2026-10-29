import { TestBed } from '@angular/core/testing';
import { Auth } from '@angular/fire/auth';
import { AuthService } from './auth';
import { ProfileService } from './perfil';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      // Firebase y la API se reemplazan por objetos vacíos: solo se prueba que el servicio se crea
      providers: [
        { provide: Auth, useValue: {} },
        { provide: ProfileService, useValue: {} },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
