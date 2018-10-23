import { TestBed } from '@angular/core/testing';

import { NameService } from './name.service';

describe('NameService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NameService = TestBed.get(NameService);
    expect(service).toBeTruthy();
  });
});
