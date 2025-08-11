import { TestBed } from '@angular/core/testing';

import { FormMessageTypeService } from './form-message-type.service';

describe('FormMessageTypeService', () => {
  let service: FormMessageTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FormMessageTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
