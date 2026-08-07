import { Component } from "@angular/core";
import { IconComponent } from "./icon";
@Component({
  selector: "design-notes",
  standalone: true,
  imports: [IconComponent],
  template: ` <section class="workspace design-notes">
    <div class="location-row">
      <span>Field notes</span><span>Research recorded October 25, 2026</span>
    </div>
    <div class="page-heading">
      <div>
        <p class="eyebrow">THE REASON BEHIND THE DETAILS</p>
        <h1>Made for the work.</h1>
        <p class="lede">
          Three different tasks. A consistent language for reading, deciding,
          and moving forward.
        </p>
      </div>
      <span class="edition">DESIGN / ENGINEERING</span>
    </div>
    <div class="design-intro">
      <h2>Borrow the principle.<br />Design the expression.</h2>
      <p>
        These interfaces are original implementations. Reference products
        informed hierarchy, navigation, and restraint. Their branding,
        proprietary typefaces, icons, and application code were not copied.
      </p>
    </div>
    <section class="design-section">
      <div class="section-label">
        <h3>Reference study</h3>
        <span>Observed evidence and published guidance</span>
      </div>
      <div class="reference-list">
        <a href="https://basecamp.com/" target="_blank" rel="noopener"
          ><span class="index">01</span>
          <div>
            <h4>Basecamp</h4>
            <p>
              Project context comes first. Bring related work together without
              making a permanent sidebar the center of the interface.
            </p>
            <small>REA page structure and viewport capture</small>
          </div>
          <app-icon name="arrow"
        /></a>
        <a
          href="https://blog.superhuman.com/docs-new-visual-identity/"
          target="_blank"
          rel="noopener"
          ><span class="index">02</span>
          <div>
            <h4>Superhuman Docs</h4>
            <p>
              Warm surfaces, readable typography, and a consistent icon language
              make extended work feel considered.
            </p>
            <small
              >Published article. REA browser capture reached a verification
              screen.</small
            >
          </div>
          <app-icon name="arrow"
        /></a>
        <a
          href="https://linear.app/now/behind-the-latest-design-refresh"
          target="_blank"
          rel="noopener"
          ><span class="index">03</span>
          <div>
            <h4>Linear</h4>
            <p>
              Location and view controls have separate roles. Secondary
              navigation recedes, and primary actions stay predictable.
            </p>
            <small>REA page structure and viewport capture</small>
          </div>
          <app-icon name="arrow"
        /></a>
        <a
          href="https://www.framer.com/help/articles/reduced-motion-settings/"
          target="_blank"
          rel="noopener"
          ><span class="index">04</span>
          <div>
            <h4>Framer</h4>
            <p>
              Use motion to explain a state change. Preserve natural scrolling
              and respect the person’s reduced motion preference.
            </p>
            <small
              >REA homepage capture plus published accessibility guidance</small
            >
          </div>
          <app-icon name="arrow"
        /></a>
      </div>
    </section>
    <section class="design-section">
      <div class="section-label">
        <h3>A small visual vocabulary</h3>
        <span>Original SVG symbols · 20 pixel grid</span>
      </div>
      <div class="icon-specimen">
        @for (icon of icons; track icon) {
          <div>
            <app-icon [name]="icon" /><span>{{ icon }}</span>
          </div>
        }
      </div>
      <div class="swatch-row">
        @for (s of swatches; track s.name) {
          <div>
            <span [style.background]="s.color"></span
            ><strong>{{ s.name }}</strong
            ><small>{{ s.color }}</small>
          </div>
        }
      </div>
      <div class="type-specimen">
        <span class="caps">TYPOGRAPHY</span>
        <h2>Clarity is a feature.</h2>
        <p>
          System sans serif for controls and body text. An editorial serif
          reserved for selected headings. Comfortable line lengths and visible
          keyboard focus.
        </p>
      </div>
    </section>
    <section class="design-section">
      <div class="section-label">
        <h3>Interaction rules</h3>
        <span>Implemented in these previews</span>
      </div>
      <div class="principles">
        <article>
          <span>01</span>
          <h4>Task before decoration</h4>
          <p>
            The session, photograph, or catalog occupies the largest useful
            surface. Status is expressed in words, as well as color.
          </p>
        </article>
        <article>
          <span>02</span>
          <h4>Motion with a purpose</h4>
          <p>
            Short transitions on controls. Native scrolling. Reduced motion
            removes transitions and smooth anchor scrolling.
          </p>
        </article>
        <article>
          <span>03</span>
          <h4>Honest system states</h4>
          <p>
            Sample data is labeled. Missing integrations are explicit.
            Similarity is not confidence, and a quality check is not a defect
            diagnosis.
          </p>
        </article>
      </div>
    </section>
    <section class="design-section">
      <div class="section-label">
        <h3>Local architecture</h3>
        <span>No deployment or GitHub push</span>
      </div>
      <div class="architecture-lines">
        <p>
          <strong>Practice</strong>Angular → Django API → rubric review or
          configured AI provider. WebRTC uses LiveKit when configured.
        </p>
        <p>
          <strong>Inspection</strong>Angular → ASP.NET Core → C++ quality
          engine. Python/PyTorch trains an optional ONNX defect model.
        </p>
        <p>
          <strong>Discover</strong>Angular → Java catalog API → Go content
          ranking. Inventory filters remain authoritative.
        </p>
      </div>
      <p class="micro">
        Each codebase has independent local configuration, health checks, tests,
        and CI definitions. External providers are optional and must be
        configured before their live paths can be verified.
      </p>
    </section>
  </section>`,
})
export class DesignComponent {
  icons = [
    "mic",
    "scan",
    "grid",
    "search",
    "clock",
    "book",
    "upload",
    "check",
    "tune",
    "bag",
    "heart",
    "arrow",
  ];
  swatches = [
    { name: "Paper", color: "#f5f3ed" },
    { name: "Ink", color: "#28352e" },
    { name: "Clay", color: "#aa492e" },
    { name: "Sage", color: "#73816a" },
    { name: "Mist", color: "#e9eeeb" },
  ];
}
