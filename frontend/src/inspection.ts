import { Component, signal, OnDestroy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IconComponent } from "./icon";
import { ProductArtComponent } from "./art";
import { api } from "./api";

interface Quality {
  width: number;
  height: number;
  brightness: number;
  sharpness: number;
  checks: { label: string; passed: boolean; detail: string }[];
  disclaimer: string;
  prediction: {
    status: string;
    detail: string;
    label?: string;
    score?: number;
  };
}
@Component({
  selector: "inspection-desk",
  standalone: true,
  imports: [FormsModule, IconComponent, ProductArtComponent],
  template: ` <section class="workspace inspection">
    <div class="location-row">
      <span>Inspection desk <app-icon name="chevron" /> New inspection</span
      ><span class="status-label">Human review required</span>
    </div>
    <div class="page-heading">
      <div>
        <p class="eyebrow">LOOK CLOSER. DECIDE WITH CONFIDENCE.</p>
        <h1>Every return has a story.</h1>
        <p class="lede">
          Check the image, document what you see, and keep the evidence with the
          decision.
        </p>
      </div>
      <span class="edition">02 / INSPECTION</span>
    </div>
    <div class="inspection-layout">
      <section class="image-workbench">
        <div class="workbench-toolbar">
          <span
            ><app-icon name="scan" />{{
              imageUrl() ? "Uploaded photograph" : "Sample object"
            }}</span
          ><button
            class="text-button"
            (click)="reset()"
            [disabled]="!imageUrl()"
          >
            <app-icon name="reset" />Reset
          </button>
        </div>
        <div
          class="image-stage"
          (dragover)="$event.preventDefault()"
          (drop)="drop($event)"
        >
          @if (imageUrl()) {
            <img [src]="imageUrl()" alt="Uploaded item for inspection" />
          } @else {
            <product-art
              kind="bag"
              color="#8b957d"
              label="Illustration of a sage canvas tote. This is a sample, not an inspection result."
            />
          }
          <span class="image-label">{{
            imageUrl() ? "YOUR IMAGE" : "ILLUSTRATIVE SAMPLE"
          }}</span>
        </div>
        <div class="upload-row">
          <div>
            <h3>{{ fileName() || "Start with a clear photograph" }}</h3>
            <p>JPEG, PNG or WebP · Up to 10 MB · One item per image</p>
          </div>
          <label class="button secondary upload-button"
            ><app-icon name="upload" />Choose image<input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="onFile($event)"
              aria-label="Upload inspection photograph"
          /></label>
        </div>
        <div class="photo-guidance">
          <span class="index">01</span>
          <p>
            Use even light, show the entire item, and include a closer view if a
            defect is hard to see.
          </p>
        </div>
      </section>
      <aside class="inspection-details">
        <div class="section-label">
          <h3>Inspection record</h3>
          <span class="pill">Draft</span>
        </div>
        <label class="field-label" for="item-name">Item name</label
        ><input
          id="item-name"
          [(ngModel)]="itemName"
          placeholder="e.g. Canvas everyday tote"
          maxlength="120"
        />
        <div class="check-section">
          <h4>Image readiness</h4>
          @if (busy()) {
            <p class="loading" role="status">Checking image quality…</p>
          } @else if (quality()) {
            @for (c of quality()!.checks; track c.label) {
              <div class="quality-check">
                <span [class.good]="c.passed" class="check-badge"
                  ><app-icon [name]="c.passed ? 'check' : 'info'"
                /></span>
                <div>
                  <strong>{{ c.label }}</strong>
                  <p>{{ c.detail }}</p>
                </div>
              </div>
            }
          } @else {
            <p class="muted">
              Upload a photograph to check resolution, exposure, and edge
              detail.
            </p>
          }
        </div>
        @if (quality()) {
          <div class="check-section">
            <h4>Model review</h4>
            <p class="muted">{{ quality()!.prediction.detail }}</p>
            @if (quality()!.prediction.label) {
              <p class="micro">
                Suggestion: {{ quality()!.prediction.label }} · score
                {{ quality()!.prediction.score }}
              </p>
            }
          </div>
        }
        <div class="check-section">
          <h4>Your observations</h4>
          <p class="micro">Select only what you can see in the photograph.</p>
          @for (label of observations; track label) {
            <label class="checkbox-row"
              ><input
                type="checkbox"
                [checked]="checked.has(label)"
                (change)="toggle(label)"
              /><span>{{ label }}</span></label
            >
          }
        </div>
        <label class="field-label" for="inspection-notes">Review notes</label
        ><textarea
          id="inspection-notes"
          [(ngModel)]="notes"
          rows="3"
          maxlength="2000"
          placeholder="Describe the location and extent of any visible damage."
        ></textarea>
        <button
          class="primary green"
          [disabled]="!quality() || !itemName.trim() || busy()"
          (click)="download()"
        >
          <app-icon name="download" />Export review record
        </button>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        @if (exported()) {
          <p class="success" role="status">
            Review record downloaded. The photograph is not included.
          </p>
        }
      </aside>
    </div>
    <div class="honesty-note">
      <app-icon name="info" />
      <div>
        <strong>Image quality is measured. Damage is reviewed by you.</strong>
        <p>
          This version checks photographic readiness. Automated defect detection
          needs a validated model and representative labeled images. Uploaded
          photographs are processed in memory and are not saved by the server.
        </p>
      </div>
    </div>
  </section>`,
})
export class InspectionComponent implements OnDestroy {
  imageUrl = signal("");
  fileName = signal("");
  quality = signal<Quality | null>(null);
  busy = signal(false);
  error = signal("");
  exported = signal(false);
  itemName = "";
  notes = "";
  checked = new Set<string>();
  generation = 0;
  observations = [
    "Visible surface damage",
    "Stain or discoloration",
    "Missing or detached part",
    "No visible defect",
  ];
  toggle(v: string) {
    if (this.checked.has(v)) {
      this.checked.delete(v);
    } else {
      if (v === "No visible defect") this.checked.clear();
      else this.checked.delete("No visible defect");
      this.checked.add(v);
    }
    this.exported.set(false);
  }
  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) void this.load(file);
    input.value = "";
  }
  drop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) void this.load(file);
  }
  async load(file: File) {
    this.error.set("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      this.error.set("Choose a JPEG, PNG or WebP image smaller than 10 MB.");
      return;
    }
    this.reset();
    const generation = ++this.generation;
    this.imageUrl.set(URL.createObjectURL(file));
    this.fileName.set(file.name);
    this.busy.set(true);
    const form = new FormData();
    form.append("image", file);
    try {
      const result = await api<Quality>("inspection/quality", form);
      if (generation === this.generation) this.quality.set(result);
    } catch (e) {
      if (generation === this.generation) this.error.set((e as Error).message);
    } finally {
      if (generation === this.generation) this.busy.set(false);
    }
  }
  reset() {
    this.generation++;
    if (this.imageUrl()) URL.revokeObjectURL(this.imageUrl());
    this.imageUrl.set("");
    this.fileName.set("");
    this.quality.set(null);
    this.error.set("");
    this.exported.set(false);
    this.busy.set(false);
    this.checked.clear();
    this.notes = "";
  }
  download() {
    const record = {
      schema_version: 1,
      item_name: this.itemName.trim(),
      reviewed_at: new Date().toISOString(),
      image_name: this.fileName(),
      image_quality: this.quality(),
      human_observations: [...this.checked],
      notes: this.notes,
      decision_source: "human_review",
      automated_defect_detection:
        this.quality()?.prediction.status === "suggestion",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(record, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "inspection-record.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.exported.set(true);
  }
  ngOnDestroy() {
    this.reset();
  }
}
