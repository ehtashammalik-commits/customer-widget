import { TestBed } from '@angular/core/testing';

import { PostMessageHandlerService } from './post-message-handler.service';

describe('PostMessageHandlerService', () => {
  let service: PostMessageHandlerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostMessageHandlerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
