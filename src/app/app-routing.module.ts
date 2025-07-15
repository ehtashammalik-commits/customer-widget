import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WidgetComponent } from './widget/widget.component';
import { TranscriptComponent } from './chat-transcript/chat-transcript.component';

const routes: Routes = [
  { path: 'widget', component: WidgetComponent },
  { path: 'chat-transcript', component: TranscriptComponent },

  // ⬇️ remove the slash so the redirect stays inside the current base‑href
  { path: '', redirectTo: 'widget', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
export const routingComponents = [WidgetComponent];
