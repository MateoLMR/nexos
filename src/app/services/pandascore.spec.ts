import { TestBed } from '@angular/core/testing';

import { Pandascore } from './pandascore';

describe('Pandascore', () => {
  let service: Pandascore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pandascore);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
