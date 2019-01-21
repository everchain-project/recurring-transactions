import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWalletAlarmsComponent } from './view-wallet-alarms.component';

describe('ViewWalletAlarmsComponent', () => {
  let component: ViewWalletAlarmsComponent;
  let fixture: ComponentFixture<ViewWalletAlarmsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewWalletAlarmsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewWalletAlarmsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
