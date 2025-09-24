import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DeliveryNotificationService {
  constructor() {} // public sdk: SdkService,
  // private typingIndicatorTimer: any;
  // private lastSeenMessageId: any = null;

  // updateMessageStatus(cimMessage: any) {
  //   if (
  //     cimMessage.body.type.toLowerCase() == "deliverynotification" &&
  //     cimMessage.header.sender &&
  //     (cimMessage.header.sender.type.toLowerCase() == "agent" || cimMessage.header.sender.type.toLowerCase() == "bot")
  //   ) {
  //     this.updateStatusOfCustomerMessage(cimMessage, cimMessage.body.messageId, cimMessage.body.status.toLowerCase());
  //   } else if (
  //     cimMessage.body.type.toLowerCase() == "notification" &&
  //     cimMessage.body.notificationType.toLowerCase() == "typing_started"
  //   ) {
  //     if (cimMessage.header.sender.type.toLowerCase() == "agent") {
  //       console.log("Event  received with data  ", cimMessage.body);


  //         this.typingIndicatorTimer = setTimeout(() => {
  //           console.log("timer ended for indicator to show ", cimMessage.body);
  //           this.typingIndicatorTimer = null;
  //         }, 5000);
  //       } else {
  //         clearTimeout(this.typingIndicatorTimer);
  //         this.typingIndicatorTimer = setTimeout(() => {
  //           this.typingIndicatorTimer = null;
  //         }, 5000);
  //       }
  //     }
  //   } else {
  //     if (
  //       cimMessage.body.type.toLowerCase() != "notification" &&
  //       cimMessage.header.sender.type.toLowerCase() == "agent"
  //     ) {
  //       clearTimeout(this.typingIndicatorTimer);
  //       this.typingIndicatorTimer = null;
  //     }
  //   }
  // }

  // public updateStatusOfCustomerMessage(cimMessage: any, messageId: string, status: string) {
  //   // Implement your logic to update the message status
  //   let msgStatus;
  //   if (status.toLowerCase() == "read") {
  //     msgStatus = "seen";
  //     this.markMessageStatusToSeenOrSuccessed(cimMessage, messageId, msgStatus);
  //   } else if (status.toLowerCase() == "failed") {
  //     msgStatus = "failed";
  //     this.changeMessageStatusToFailed(cimMessage, messageId, msgStatus);
  //   }
  // }

  // private markMessageStatusToSeenOrSuccessed(cimMessage: any, msgId: any, msgStatus: string) {
  //    // find index of the message for the delivery notification
  //    let index = cimMessage.findIndex((message: { id: any; }) => message.id == msgId);
  //    // mark all the previous messages as 'seen' or 'successed' before that message except failed messages

  

  // private changeMessageStatusToFailed(cimMessage: any, msgId: any, msgStatus: string) {
  //   // find index of the message for the notification
  //   let index = cimMessage.findIndex((message: { id: any; }) => message.id == msgId);

  

  // public handleMessageReport(cimMessage: { header: { sender: { type: string; }; }; body: { type: string; }; id: any; }, customerData:any) {
  //   if (document.hasFocus() && (cimMessage.header.sender.type.toLowerCase() == "agent" || cimMessage.header.sender.type.toLowerCase() == "bot")) {
  //     if (cimMessage.body.type.toLowerCase() != "notification") {
  //       this.constructAndPublishMessageSeenNotification(cimMessage.id, customerData);
  //     }
  //   }
  // }

  // private constructAndPublishMessageSeenNotification(msgId: any, customerData:any) {
  //   if (this.lastSeenMessageId != msgId) {
  //     let header = { replyToMessageId: null, intent: null };
  //     let body = { markdownText: "", type: "DELIVERYNOTIFICATION", messageId: msgId, status: "READ", reasonCode: 200 };

  

  // public processSeenMessages(cimMessage:any) {
  //   let latestMessage = cimMessage[cimMessage.length - 1];
  //   if (latestMessage) {
  //     // mark all the message Successed
  //     this.markMessageStatusToSeenOrSuccessed(cimMessage, latestMessage.id, "successed");

  

  // private getLatestDeliveryMessage(cimMessage:any) {
  //   for (let i = (cimMessage.length - 1); i >= 0; i--) {
  //     const message = cimMessage[i];
  //     if (
  //       message &&
  //       message.body.type.toLowerCase() == "deliverynotification" &&
  //       message.header.sender &&
  //       (message.header.sender.type.toLowerCase() == "agent" || message.header.sender.type.toLowerCase() == "bot")
  //     ) {
  //       return message;
  //     }
  //   }
  // }

  // private changeMessageStatusToFailedInHistoryMessages(cimMessage:any, msgId: any) {
  //   // find index of the message for the notification
  //   let index = cimMessage.findIndex((message: { id: any; }) => message.id == msgId);
}
