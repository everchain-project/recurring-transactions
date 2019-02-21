import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RtxFeedComponent } from './rtx-feed.component';

describe('RtxFeedComponent', () => {
  let component: RtxFeedComponent;
  let fixture: ComponentFixture<RtxFeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RtxFeedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RtxFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
