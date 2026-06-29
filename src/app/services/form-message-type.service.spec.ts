import { TestBed } from '@angular/core/testing';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms'; // Import FormBuilder

import { FormMessageTypeService } from './form-message-type.service';

describe('FormMessageTypeService', () => {
  let service: FormMessageTypeService;
  let fb: FormBuilder; // Declare FormBuilder

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule], // Import ReactiveFormsModule
      providers: [FormMessageTypeService, FormBuilder], // Provide FormBuilder
    });
    service = TestBed.inject(FormMessageTypeService);
    fb = TestBed.inject(FormBuilder); // Inject FormBuilder
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDefaultValue', () => {
    it('should return default color for type "color"', () => {
      const attribute = { valueType: 'color' };
      expect(service.getDefaultValue(attribute)).toBe('#000000');
    });

    it('should return the first option value for type "dropdown" if available', () => {
      const attribute = {
        valueType: 'dropdown',
        attributeOptions: {
          attributeData: [
            { values: [{ value: 'Option1' }, { value: 'Option2' }] },
          ],
        },
      };
      expect(service.getDefaultValue(attribute)).toBe('Option1');
    });

    it('should return null for type "dropdown" if no options available', () => {
      const attribute = {
        valueType: 'dropdown',
        attributeOptions: {
          attributeData: [{ values: [] }],
        },
      };
      expect(service.getDefaultValue(attribute)).toBe(null);
    });

    it('should return null for type "dropdown" if attributeData is empty', () => {
      const attribute = {
        valueType: 'dropdown',
        attributeOptions: {
          attributeData: [],
        },
      };
      expect(service.getDefaultValue(attribute)).toBe(null);
    });

    it('should return null for type "dropdown" if attributeOptions is undefined', () => {
      const attribute = {
        valueType: 'dropdown',
        attributeOptions: undefined,
      };
      expect(service.getDefaultValue(attribute)).toBe(null);
    });

    it('should return min value for type "range" if present', () => {
      const attribute = { valueType: 'range', min: 5 };
      expect(service.getDefaultValue(attribute)).toBe(5);
    });

    it('should return 0 for type "range" if min is not present', () => {
      const attribute = { valueType: 'range' };
      expect(service.getDefaultValue(attribute)).toBe(0);
    });

    it('should return empty string for unknown type', () => {
      const attribute = { valueType: 'unknown' };
      expect(service.getDefaultValue(attribute)).toBe('');
    });

    it('should return empty string if valueType is undefined', () => {
      const attribute = {};
      expect(service.getDefaultValue(attribute)).toBe('');
    });
  });

  describe('patchFromMessageTypeUponRefresh', () => {
    it('should not patch if sectionArray is empty or null', () => {
      const formGroup = fb.group({
        sections: fb.array([]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                { key: 'test', attributeType: 'INPUT', answer: 'value' },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      expect(formGroup.get('sections')?.value).toEqual([]);
    });

    it('should patch INPUT and TEXTAREA types correctly', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            inputField: new FormControl(''),
            textareaField: new FormControl(''),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'inputField',
                  attributeType: 'INPUT',
                  answer: 'Input Value',
                },
                {
                  key: 'textareaField',
                  attributeType: 'TEXTAREA',
                  answer: ['Textarea Value'],
                }, // Array for TEXTAREA
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('inputField')?.value).toBe('Input Value');
      expect(sectionGroup.get('textareaField')?.value).toBe('Textarea Value');
    });

    it('should handle undefined or null answer for INPUT/TEXTAREA', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            inputField: new FormControl('initial'),
            textareaField: new FormControl('initial'),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'inputField',
                  attributeType: 'INPUT',
                  answer: undefined,
                },
                {
                  key: 'textareaField',
                  attributeType: 'TEXTAREA',
                  answer: null,
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('inputField')?.value).toBe('');
      expect(sectionGroup.get('textareaField')?.value).toBe('');
    });

    it('should patch OPTIONS type (radio/dropdown) correctly with single selection', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            selectField: new FormControl(''),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'selectField',
                  attributeType: 'OPTIONS',
                  valueType: 'radio',
                  answer: [
                    { value: 'Option1', isSelected: false },
                    { value: 'Option2', isSelected: true },
                  ],
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('selectField')?.value).toBe('Option2');
    });

    it('should patch OPTIONS type (radio/dropdown) correctly with no selection', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            selectField: new FormControl('initial'),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'selectField',
                  attributeType: 'OPTIONS',
                  valueType: 'radio',
                  answer: [
                    { value: 'Option1', isSelected: false },
                    { value: 'Option2', isSelected: false },
                  ],
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('selectField')?.value).toBe('');
    });

    it('should patch OPTIONS type (checkbox) correctly with simple multiple selection', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            checkboxField: new FormControl([]),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'checkboxField',
                  attributeType: 'OPTIONS',
                  valueType: 'checkbox',
                  attributeOptions: { enableCategory: false },
                  answer: [
                    { value: 'Check1', isSelected: true },
                    { value: 'Check2', isSelected: false },
                    { value: 'Check3', isSelected: true },
                  ],
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('checkboxField')?.value).toEqual([
        'Check1',
        'Check3',
      ]);
    });

    it('should patch OPTIONS type (checkbox) correctly with categorized multiple selection', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            categorizedCheckboxField: new FormControl({}),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'categorizedCheckboxField',
                  attributeType: 'OPTIONS',
                  valueType: 'checkbox',
                  attributeOptions: { enableCategory: true },
                  answer: [
                    {
                      value: 'Cat1_Item1',
                      isSelected: true,
                      category: 'Category1',
                    },
                    {
                      value: 'Cat1_Item2',
                      isSelected: false,
                      category: 'Category1',
                    },
                    {
                      value: 'Cat2_Item1',
                      isSelected: true,
                      category: 'Category2',
                    },
                    {
                      value: 'Cat2_Item2',
                      isSelected: true,
                      category: 'Category2',
                    },
                    { value: 'NoCat_Item', isSelected: true }, // Should go to 'default'
                  ],
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('categorizedCheckboxField')?.value).toEqual({
        Category1: ['Cat1_Item1'],
        Category2: ['Cat2_Item1', 'Cat2_Item2'],
        default: ['NoCat_Item'],
      });
    });

    it('should handle empty answers for simple checkboxes', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            checkboxField: new FormControl(['initial']),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'checkboxField',
                  attributeType: 'OPTIONS',
                  valueType: 'checkbox',
                  attributeOptions: { enableCategory: false },
                  answer: [],
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('checkboxField')?.value).toEqual('');
    });

    it('should handle empty answers for categorized checkboxes', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            categorizedCheckboxField: new FormControl({ initial: 'value' }),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'categorizedCheckboxField',
                  attributeType: 'OPTIONS',
                  valueType: 'checkbox',
                  attributeOptions: { enableCategory: true },
                  answer: [],
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('categorizedCheckboxField')?.value).toEqual('');
    });

    it('should not patch if control does not exist in formGroup', () => {
      const formGroup = fb.group({
        sections: fb.array([
          fb.group({
            existingField: new FormControl('initial'),
          }),
        ]),
      });
      const cimMessage = {
        body: {
          sections: [
            {
              attributes: [
                {
                  key: 'nonExistingField',
                  attributeType: 'INPUT',
                  answer: 'value',
                },
              ],
            },
          ],
        },
      };
      service.patchFromMessageTypeUponRefresh(formGroup, cimMessage);
      const sectionGroup = (formGroup.get('sections') as FormArray).at(
        0,
      ) as FormGroup;
      expect(sectionGroup.get('existingField')?.value).toBe('initial');
      expect(sectionGroup.get('nonExistingField')).toBeNull(); // Ensure it wasn't added
    });
  });
});
