import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RtxsComponent } from './rtxs.component';

describe('RtxsComponent', () => {
  let component: RtxsComponent;
  let fixture: ComponentFixture<RtxsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RtxsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RtxsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
