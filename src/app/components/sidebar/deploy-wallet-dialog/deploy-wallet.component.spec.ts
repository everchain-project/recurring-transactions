import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployWalletComponent } from './deploy-wallet.component';

describe('DeployWalletComponent', () => {
  let component: DeployWalletComponent;
  let fixture: ComponentFixture<DeployWalletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployWalletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
