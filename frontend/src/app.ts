import { Component, signal } from "@angular/core";
import { InspectionComponent } from "./inspection";
import { IconComponent } from "./icon";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [InspectionComponent, IconComponent],
  templateUrl: "./app.html",
  styleUrl: "./home.css",
})
export class AppComponent {
  skipHref = location.pathname + location.search + "#main";
  workspace = window.location.pathname.replace(/\/$/, "") === "/workspace";
  menu = signal(false);
  example = signal(0);
}
