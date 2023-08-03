import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { SdkService } from "../services/sdk.service";

@Component({
  selector: 'app-widget',
  templateUrl: './widget.component.html',
  styleUrls: ['./widget.component.scss']
})
export class WidgetComponent implements OnInit {
  additionalPanel = false;
  isIconWidget = true;
  preChatForm = false;

  constructor(
    private fb: FormBuilder,
    public sdk: SdkService,
  ) { }

  ngOnInit(): void {

    // Load the pre-chat form or the active chat screen depending on whether the user is already authenticated or not.
    const userAuthenticated = false; // Replace with your own authentication logic
    if (userAuthenticated) {
      this.showActiveChatScreen();
    } else {
      this.showWelcomePanel();
    }

    this.preChatFormGroup = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[\d-+\s()]+$/)]],
      channelIdentifier: ['', Validators.required]
    });
  }

  validationMessages = {
    name: {
      required: "This field is required",
      minlength: "More characters required",
      maxlength: "Max 40 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
    email: {
      required: "This field is required",
      maxlength: "Max 256 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
    phone: {
      required: "This field is required",
      minlength: "More characters required",
      maxlength: "Max 40 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
    channelIdentifier: {
      required: "This field is required",
      maxlength: "Max 256 characters allowed",
      pattern: 'Allowed special characters "[!@#$%^&*()-_=+~`"]+"',
    },
  };

  formErrors = {
    name: "",
    email: "",
    phone: "",
    channelIdentifier: ""
  };

  preChatFormGroup: FormGroup = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    phone: new FormControl('', Validators.required),
    channelIdentifier: new FormControl('', Validators.required)
  });

  onSubmit(): void {
    console.log(this.preChatFormGroup.value);
  }

  closeWrapper() {
    console.log("wrapper closed");
  }

  showWelcomePanel() {
    this.preChatForm = false;
    this.additionalPanel = false;
    this.isIconWidget = true;
  }

  showPreChatForm() {
    this.preChatForm = true;
    this.additionalPanel = false;
    this.isIconWidget = true;
  }

  showActiveChatScreen() {
    this.additionalPanel = false;
    this.preChatForm = false;
  }

  showEndChatScreen() {
    this.preChatForm = false;
  }

}
