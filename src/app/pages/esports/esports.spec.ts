import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Esports } from './esports';

describe('Esports', () => {
  let component: Esports;
  let fixture: ComponentFixture<Esports>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Esports],
    }).compileComponents();

    fixture = TestBed.createComponent(Esports);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
