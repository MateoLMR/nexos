import { TestBed } from '@angular/core/testing';
import { DetalleJuegos } from './detalle-juegos';

describe('DetalleJuegos', () => {
  let service: DetalleJuegos;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetalleJuegos);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
