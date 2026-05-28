import { ComponentFixture, TestBed } from '@angular/core/testing';

import MapPlayer from './map-player';

describe('MapPlayer', () => {
  let component: MapPlayer;
  let fixture: ComponentFixture<MapPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapPlayer],
    }).compileComponents();

    fixture = TestBed.createComponent(MapPlayer);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
