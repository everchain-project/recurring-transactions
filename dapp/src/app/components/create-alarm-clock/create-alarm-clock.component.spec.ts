import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAlarmClockComponent } from './create-alarm-clock.component';

describe('CreateAlarmClockComponent', () => {
  let component: CreateAlarmClockComponent;
  let fixture: ComponentFixture<CreateAlarmClockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAlarmClockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAlarmClockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
