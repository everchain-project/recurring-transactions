import { TestBed } from '@angular/core/testing';

import { RtxManagerService } from './rtx-manager.service';

describe('RtxManagerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RtxManagerService = TestBed.get(RtxManagerService);
    expect(service).toBeTruthy();
  });
});
