import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  constructor() {}

  // ngOnInit lifecycle hook intentionally left empty for now
  ngOnInit(): void {
    console.log('AppComponent initialized');
  }
}
