import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

@Component({ selector: 'app-root', template: '' })
class MockAppComponent {}

describe('AppModule', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MockAppComponent], // use mock
    }).compileComponents();
  });

  it('should create AppComponent', () => {
    const fixture = TestBed.createComponent(MockAppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
