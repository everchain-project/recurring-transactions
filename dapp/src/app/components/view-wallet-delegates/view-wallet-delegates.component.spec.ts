import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWalletDelegatesComponent } from './view-wallet-delegates.component';

describe('ViewWalletDelegatesComponent', () => {
  let component: ViewWalletDelegatesComponent;
  let fixture: ComponentFixture<ViewWalletDelegatesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewWalletDelegatesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewWalletDelegatesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
