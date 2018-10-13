import { TestBed } from '@angular/core/testing';

import { EverchainService } from './everchain.service';

describe('EverchainService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: EverchainService = TestBed.get(EverchainService);
    expect(service).toBeTruthy();
  });
});
