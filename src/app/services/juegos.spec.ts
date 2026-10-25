import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { JuegosService } from './juegos';

describe('JuegosService', () => {
  let service: JuegosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(JuegosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
