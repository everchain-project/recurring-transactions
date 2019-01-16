import { TestBed } from '@angular/core/testing';

import { PaymentDelegateService } from './payment-delegate.service';

describe('PaymentDelegateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PaymentDelegateService = TestBed.get(PaymentDelegateService);
    expect(service).toBeTruthy();
  });
});
