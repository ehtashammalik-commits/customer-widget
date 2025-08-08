import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTime'
})
export class FormatTimePipe implements PipeTransform {
  transform(timestamp: string): string {
    const dateTime = new Date(timestamp);
    let hours = dateTime.getHours();
    const minutes = dateTime.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // convert '0' to '12'
    const hoursStr = hours.toString().padStart(2, '0');

    return `${hoursStr}:${minutes} ${ampm}`;
  }
}
