import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateRtxComponent } from './create-rtx.component';

describe('CreateRtxComponent', () => {
  let component: CreateRtxComponent;
  let fixture: ComponentFixture<CreateRtxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateRtxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateRtxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
