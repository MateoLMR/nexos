import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dota } from './dota';

describe('Dota', () => {
  let component: Dota;
  let fixture: ComponentFixture<Dota>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dota],
    }).compileComponents();

    fixture = TestBed.createComponent(Dota);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
