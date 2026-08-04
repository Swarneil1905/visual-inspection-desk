import { Component, signal } from "@angular/core";
import { InspectionComponent } from "./inspection";
import { DesignComponent } from "./design";
@Component({
  selector: "app-root",
  standalone: true,
  imports: [InspectionComponent, DesignComponent],
  template: ` <a class="skip-link" href="#workspace">Skip to workspace</a>
    <header class="global-header">
      <a class="wordmark" href="#home" (click)="notes.set(false)"
        ><span class="brand-mark"><i></i><i></i><i></i></span>fieldwork<span
          class="studio-label"
          >INSPECTION</span
        ></a
      >
      <nav aria-label="Workspace navigation">
        <a
          href="#home"
          (click)="notes.set(false)"
          [class.active]="!notes()"
          [attr.aria-current]="!notes() ? 'page' : null"
          >Inspection workspace</a
        ><a
          href="#design"
          (click)="notes.set(true)"
          [class.active]="notes()"
          [attr.aria-current]="notes() ? 'page' : null"
          >Design & system notes</a
        >
      </nav>
      <span class="design-link">LOCAL EDITION</span>
    </header>
    <main id="workspace" tabindex="-1">
      @if (notes()) {
        <design-notes />
      } @else {
        <inspection-desk />
      }
    </main>
    <footer class="global-footer">
      <span>Built by Swarneil Pradhan</span
      ><span>Original interface · Local development</span
      ><a href="#design" (click)="notes.set(true)">Research & implementation</a>
    </footer>`,
})
export class AppComponent {
  notes = signal(location.hash === "#design");
  constructor() {
    window.addEventListener("hashchange", () =>
      this.notes.set(location.hash === "#design"),
    );
  }
}
