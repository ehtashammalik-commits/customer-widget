import { Pipe, PipeTransform } from '@angular/core';
// @ts-ignore
import { ibsFormat } from 'ibs-format';

@Pipe({
  name: 'tagFormat',
})
export class tagFormatPipe implements PipeTransform {
  transform(value: string | null | undefined, enableDynamicLink: boolean): string {
    if (!value) return '';

    value = value.replace(/&amp;#039;/g, "'").replace(/&amp;quot;/g, '\"'); //NOSONAR

    // Quick check if there are any links to process
    const linkRegex = /\[([^\]]+)\]\s*\((https?:\/\/[^\)]+)\)/g; //NOSONAR
    if (!linkRegex.test(value)) {
      // No links found, just apply formatting and return
      return ibsFormat(
        value,
        [['em', '`'], ['b', '*'], ['i', '_'], ['strike', '~']],
        { detectLinks: enableDynamicLink, target: "_blank" },
        { allowXssEscaping: false }
      );
    }

    // Reset regex for actual processing
    linkRegex.lastIndex = 0;

    // Extract [text] (url) patterns and replace with placeholders
    const linkData: { text: string; url: string; placeholder: string }[] = [];
    let processedValue = value.replace(linkRegex, (match, text, url, offset, string) => {
      const placeholder = `URL-PLACEHOLDER-${linkData.length}`;
      linkData.push({ text: text.trim(), url: url.trim(), placeholder });
      return placeholder;
    });

    // Apply text formatting to content with placeholders
    processedValue = ibsFormat(
      processedValue,
      [['em', '`'], ['b', '*'], ['i', '_'], ['strike', '~']],
      { detectLinks: enableDynamicLink, target: "_blank" },
      { allowXssEscaping: false }
    );

    // Replace placeholders with final link HTML after formatting
    return linkData.reduce((text, { text: linkText, url, placeholder }) => {
      // Apply formatting to the link text
      const formattedLinkText = ibsFormat(
        linkText,
        [['em', '`'], ['b', '*'], ['i', '_'], ['strike', '~']],
        { detectLinks: false, target: "_blank" },
        { allowXssEscaping: false }
      );

      const linkHtml = `<a href="${url}" target="_blank">${formattedLinkText}</a>`;
      return text.replace(placeholder, linkHtml);
    }, processedValue);
  }
}
