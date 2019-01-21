import { TestBed } from '@angular/core/testing';

import { WalletManagerService } from './wallet-manager.service';

describe('WalletManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WalletManagerService = TestBed.get(WalletManagerService);
    expect(service).toBeTruthy();
  });
});
