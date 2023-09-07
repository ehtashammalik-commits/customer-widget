import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WidgetComponent } from './widget/widget.component';

const routes: Routes = [
  { path: 'widget', component: WidgetComponent },
  { path: '', redirectTo: '/widget', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
export const routingComponents = [WidgetComponent];
