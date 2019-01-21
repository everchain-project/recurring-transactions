import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWalletTransferComponent } from './view-wallet-transfer.component';

describe('ViewWalletTransferComponent', () => {
  let component: ViewWalletTransferComponent;
  let fixture: ComponentFixture<ViewWalletTransferComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewWalletTransferComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewWalletTransferComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
