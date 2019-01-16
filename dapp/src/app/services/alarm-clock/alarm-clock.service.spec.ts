import { TestBed } from '@angular/core/testing';

import { AlarmClockService } from './alarm-clock.service';

describe('AlarmClockService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: AlarmClockService = TestBed.get(AlarmClockService);
    expect(service).toBeTruthy();
  });
});
