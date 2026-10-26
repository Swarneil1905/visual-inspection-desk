import { Component, signal, OnDestroy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { IconComponent } from "./icon";
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
interface Inspection {
  id: string;
  file: File;
  url: string;
  name: string;
  notes: string;
  observations: string[];
  decision: string;
  quality: Quality | null;
  busy: boolean;
  error: string;
  reviewedAt: string;
}
@Component({
  selector: "inspection-desk",
  standalone: true,
  imports: [FormsModule, IconComponent],
  templateUrl: "./inspection.html",
})
export class InspectionComponent implements OnDestroy, OnInit {
  entries = signal<Inspection[]>([]);
  private disposed = false;
  ngOnInit() {
    if (new URLSearchParams(location.search).get("sample") === "1")
      void this.loadSample();
  }
  async loadSample() {
    try {
      const response = await fetch("/images/sample-bracket.png");
      if (!response.ok)
        throw new Error(
          "The sample image could not be loaded. Try uploading your own image.",
        );
      const blob = await response.blob();
      if (!this.disposed)
        this.add([
          new File([blob], "Sample bracket (generated).png", {
            type: "image/png",
          }),
        ]);
    } catch (e) {
      if (!this.disposed) this.error.set((e as Error).message);
    }
  }
  activeId = signal("");
  zoom = signal(1);
  error = signal("");
  notice = signal("");
  observations = [
    "Visible surface damage",
    "Stain or discoloration",
    "Missing or detached part",
    "No visible defect",
  ];
  active() {
    return this.entries().find((x) => x.id === this.activeId());
  }
  reviewed() {
    return this.entries().filter((x) => !!x.reviewedAt).length;
  }
  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    this.add(Array.from(input.files || []));
    input.value = "";
  }
  drop(event: DragEvent) {
    event.preventDefault();
    this.add(Array.from(event.dataTransfer?.files || []));
  }
  add(files: File[]) {
    this.error.set("");
    this.notice.set("");
    const added: Inspection[] = [];
    let invalid = 0;
    for (const file of files) {
      if (
        !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024 ||
        file.size === 0
      ) {
        invalid++;
        continue;
      }
      if (this.entries().length + added.length >= 10) {
        this.error.set(
          "The queue holds 10 images. Remove an image before adding more.",
        );
        break;
      }
      added.push({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        name: file.name.replace(/\.[^.]+$/, "").slice(0, 120),
        notes: "",
        observations: [],
        decision: "",
        quality: null,
        busy: false,
        error: "",
        reviewedAt: "",
      });
    }
    this.entries.update((rows) => [...rows, ...added]);
    if (invalid)
      this.error.set(
        invalid + " file(s) skipped. Use JPEG, PNG or WebP, up to 10 MB each.",
      );
    if (added.length) void this.select(added[0].id);
  }
  async select(id: string) {
    this.activeId.set(id);
    this.zoom.set(1);
    this.notice.set("");
    const row = this.active();
    if (row && !row.quality && !row.busy) await this.analyze(row);
  }
  async analyze(row: Inspection) {
    row.busy = true;
    row.error = "";
    this.entries.update((rows) => [...rows]);
    const form = new FormData();
    form.append("image", row.file);
    try {
      row.quality = await api<Quality>("inspection/quality", form);
    } catch (e) {
      row.error = (e as Error).message;
    } finally {
      row.busy = false;
      this.entries.update((rows) => [...rows]);
    }
  }
  changeZoom(delta: number) {
    this.zoom.update((z) =>
      Math.max(0.5, Math.min(3, Math.round((z + delta) * 100) / 100)),
    );
  }
  toggle(row: Inspection, value: string) {
    if (row.observations.includes(value))
      row.observations = row.observations.filter((x) => x !== value);
    else {
      if (value === "No visible defect") row.observations = [];
      else
        row.observations = row.observations.filter(
          (x) => x !== "No visible defect",
        );
      row.observations.push(value);
    }
    this.dirty(row);
  }
  dirty(row: Inspection) {
    row.reviewedAt = "";
    this.notice.set("");
    this.entries.update((rows) => [...rows]);
  }
  complete(row: Inspection) {
    if (
      !row.quality ||
      row.busy ||
      !row.name.trim() ||
      !row.decision ||
      (!row.observations.length && row.decision !== "retake")
    )
      return;
    row.reviewedAt = new Date().toISOString();
    this.entries.update((rows) => [...rows]);
    this.notice.set("Review completed. Export the queue to keep your records.");
  }
  remove(row: Inspection) {
    URL.revokeObjectURL(row.url);
    this.entries.update((rows) => rows.filter((x) => x.id !== row.id));
    if (this.activeId() === row.id) {
      this.activeId.set("");
      const next = this.entries()[0];
      if (next) void this.select(next.id);
    }
    this.notice.set("");
  }
  download() {
    const records = this.entries()
      .filter((x) => x.reviewedAt)
      .map((row) => ({
        schema_version: 2,
        item_name: row.name.trim(),
        reviewed_at: row.reviewedAt,
        image_name: row.file.name,
        image_quality: row.quality,
        human_observations: row.observations,
        notes: row.notes,
        decision: row.decision,
        decision_source: "human_review",
        automated_defect_detection:
          row.quality?.prediction.status === "suggestion",
      }));
    if (!records.length) return;
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ records }, null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "inspection-reviews.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.notice.set(
      records.length + " review record(s) exported. Photos are not included.",
    );
  }
  ngOnDestroy() {
    this.disposed = true;
    this.entries().forEach((row) => URL.revokeObjectURL(row.url));
  }
}
