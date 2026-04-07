import { Injectable } from '@angular/core';
import { FormGroup, FormArray } from '@angular/forms';

@Injectable({
	providedIn: "root",
})
export class FormMessageTypeService {
	constructor() {}

	patchFromMessageTypeUponRefresh(formGroup: FormGroup, cimMessage: any) {
		const sectionArray = formGroup.get("sections") as FormArray;
		if (!sectionArray || sectionArray.length === 0) return;

		cimMessage.body.sections.forEach(
			(sectionData: any, sectionIndex: number) => {
				const sectionGroup = sectionArray.at(sectionIndex) as FormGroup;
				if (!sectionGroup || !sectionData?.attributes) return;

				sectionData.attributes.forEach((attr) => {
					const controlKey = attr.key;

					if (attr.attributeType?.toUpperCase() === "OPTIONS") {
						this.handleOptionTypeAttribute(attr, sectionGroup, controlKey);
					} else if (
						["INPUT", "TEXTAREA"].includes(attr.attributeType?.toUpperCase())
					) {
						// Text / input type answers
						const value = Array.isArray(attr.answer)
							? attr.answer[0] || ""
							: attr.answer || "";
						const control = sectionGroup.get(controlKey);
						if (control) {
							control.patchValue(value);
						}
					}
				});
			}
		);
	}

	private handleOptionTypeAttribute(
		attr: any,
		sectionGroup: FormGroup,
		controlKey: string
	) {
		if (attr.valueType?.toLowerCase() === "checkbox") {
      this.handleCheckboxAttribute(attr, sectionGroup, controlKey);
		} else {
			// Handle radio / dropdown
			const selectedValues = (attr.answer || [])
				.filter((opt) => opt.isSelected)
				.map((opt) => opt.value);

			const controlValue =
				selectedValues.length <= 1 ? selectedValues[0] || "" : selectedValues;

			const control = sectionGroup.get(controlKey);
			if (control) {
				control.patchValue(controlValue);
			}
		}
	}

  private handleCheckboxAttribute(
    attr: any,
    sectionGroup: FormGroup,
    controlKey: string
  ) {
    const control = sectionGroup.get(controlKey);
    if (!control) return;

    const hasCategory = attr.attributeOptions?.enableCategory;

    if (hasCategory) {
      // Handle categorized checkboxes - build object structure like { categoryName: [values] }
      const selectedByCategory: any = {};

      (attr.answer || []).forEach((opt: any) => {
        if (opt.isSelected) {
          const categoryLabel = opt.category || "default";
          if (!selectedByCategory[categoryLabel]) {
            selectedByCategory[categoryLabel] = [];
          }
          selectedByCategory[categoryLabel].push(opt.value);
        }
      });

      const isEmpty = Object.keys(selectedByCategory).length === 0;
      const controlValue = isEmpty ? "" : selectedByCategory;
      control.patchValue(controlValue);
    } else {
      // Handle simple checkboxes - build array structure like [value1, value2]
      const selectedValues = (attr.answer || [])
        .filter((opt: any) => opt.isSelected)
        .map((opt: any) => opt.value);

      const controlValue = selectedValues.length === 0 ? "" : selectedValues;
      control.patchValue(controlValue);
    }
  }

	getDefaultValue(attribute: any): any {
		switch (attribute.valueType?.toLowerCase()) {
			case "color":
				return "#000000"; // default black
			case "dropdown":
				return (
					attribute.attributeOptions?.attributeData?.[0]?.values?.[0]?.value ||
					null
				);
			case "range":
				return attribute.min ?? 0;
			default:
				return "";
		}
	}
}
