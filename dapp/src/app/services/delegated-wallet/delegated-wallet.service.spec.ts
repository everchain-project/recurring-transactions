import { TestBed } from '@angular/core/testing';

import { DelegatedWalletService } from './delegated-wallet.service';

describe('DelegatedWalletService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DelegatedWalletService = TestBed.get(DelegatedWalletService);
    expect(service).toBeTruthy();
  });
});
