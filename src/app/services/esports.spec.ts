import { TestBed } from '@angular/core/testing';

import { Esports } from './esports';

describe('Esports', () => {
  let service: Esports;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Esports);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
