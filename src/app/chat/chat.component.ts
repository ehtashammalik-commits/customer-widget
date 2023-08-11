import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { SdkService } from "../services/sdk.service";

interface Food {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit {
  chatActive = false;
  chatError = false;

  fontSize = new UntypedFormControl("13");

  foods: Food[] = [
    {value: 'steak-0', viewValue: 'Steak'},
    {value: 'pizza-1', viewValue: 'Pizza'},
    {value: 'tacos-2', viewValue: 'Tacos'},
  ];
  constructor(
    public sdk: SdkService,
  ) { }

  ngOnInit(): void {
    // Load the pre-chat form or the active chat screen depending on whether the user is already authenticated or not.
    const userAuthenticated = false; // Replace with your own authentication logic
    if (userAuthenticated) {
      this.showActiveChatScreen();
    } else {
      this.showActiveChatScreen();
    }

  }

  showActiveChatScreen() {
    this.chatActive = true;
    this.chatError = false;
  }

  showEndChatScreen() {
    this.chatActive = false;
    this.chatError = true;
  }

  changeFont(e:any) {
    try {
      localStorage.setItem("fontSize", e.value);
    } catch (error) { }
  }
}
