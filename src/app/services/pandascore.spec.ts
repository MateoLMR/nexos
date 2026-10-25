import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PandaScoreService } from './pandascore';

describe('PandaScoreService', () => {
  let service: PandaScoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PandaScoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
