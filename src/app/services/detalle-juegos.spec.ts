import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DetalleJuegosService } from './detalle-juegos';

describe('DetalleJuegosService', () => {
  let service: DetalleJuegosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DetalleJuegosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
