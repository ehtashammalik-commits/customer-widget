import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "getMediaFromTask"
})
export class getMediaFromTask implements PipeTransform {

  transform(task: any, n: string): any {

    const queuedMedia = task.activeMedia.find((media: { state: string; }) => { return media.state.toLowerCase() == "queued" });

    if (n == "direction") {
      return queuedMedia.type.direction;
    } else if (n == "queueName") {
      return queuedMedia.queue.name;
    }

  }
}
