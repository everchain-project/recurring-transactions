import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RtxComponent } from './rtx.component';

describe('RtxComponent', () => {
  let component: RtxComponent;
  let fixture: ComponentFixture<RtxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RtxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RtxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
