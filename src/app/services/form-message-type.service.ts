import { Injectable } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormMessageTypeService {

  constructor() { }
    patchFromMessageTypeUponRefresh(formGroup: FormGroup, cimMessage: any) {
      const sectionArray = formGroup.get('sections') as FormArray;
      if (!sectionArray || sectionArray.length === 0) return;

      cimMessage.body.sections.forEach((sectionData: any, sectionIndex: number) => {
        const sectionGroup = sectionArray.at(sectionIndex) as FormGroup;
        if (!sectionGroup || !sectionData?.attributes) return;

        sectionData.attributes.forEach(attr => {
          const controlKey = attr.key;

          if (attr.attributeType?.toUpperCase() === 'OPTIONS') {


              if (attr.valueType?.toLowerCase() === 'checkbox') {
                const selectedValues = (attr.answer || [])
                .filter((opt: any) => opt.isSelected && opt.label === opt.value) // match label with value
                .map((opt: any) => opt.value);

                const controlValue =
                selectedValues.length <= 1 ? selectedValues[0] || '' : selectedValues;
                console.log("OKAY attriute key", attr)
                console.log("OKAY selected Values", selectedValues)
                console.log("OKAY section groups", sectionGroup)
                if (sectionGroup.get(controlKey)) {

                console.log("OKAY",sectionGroup.get(controlKey))
                console.log("OKAY consition isfulfilled..")
                sectionGroup.get(controlKey)?.patchValue(controlValue);
                
              }
            } else {
              // 🎯 PATCH RADIO / DROPDOWN
              const selectedValues = (attr.answer || [])
                .filter(opt => opt.isSelected)
                .map(opt => opt.value);

              const controlValue =
                selectedValues.length <= 1 ? selectedValues[0] || '' : selectedValues;

              if (sectionGroup.get(controlKey)) {
                sectionGroup.get(controlKey)?.patchValue(controlValue);
              }
            }
          }
          else if (['INPUT', 'TEXTAREA'].includes(attr.attributeType?.toUpperCase())) {
            // Text / input type answers
            const value = Array.isArray(attr.answer) ? attr.answer[0] || '' : attr.answer || '';
            if (sectionGroup.get(controlKey)) {
              sectionGroup.get(controlKey)?.patchValue(value);
            }
          }
        });
      });
    }
}
