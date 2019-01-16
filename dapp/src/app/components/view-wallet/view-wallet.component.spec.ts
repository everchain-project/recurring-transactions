import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewWalletComponent } from './view-wallet.component';

describe('ViewWalletComponent', () => {
  let component: ViewWalletComponent;
  let fixture: ComponentFixture<ViewWalletComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewWalletComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewWalletComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
