import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExampleFeedComponent } from './example-feed.component';

describe('ExampleFeedComponent', () => {
  let component: ExampleFeedComponent;
  let fixture: ComponentFixture<ExampleFeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExampleFeedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExampleFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
