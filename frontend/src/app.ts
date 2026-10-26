import { Component } from "@angular/core";
import { InspectionComponent } from "./inspection";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [InspectionComponent],
  template: `<a class="skip-link" href="#workspace">Skip to workspace</a>
    <main id="workspace"><inspection-desk /></main>`,
})
export class AppComponent {}
