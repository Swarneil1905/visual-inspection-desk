import { Component, Input } from "@angular/core";

const paths: Record<string, string> = {
  arrow: "M4 10h12m-5-5 5 5-5 5",
  chevron: "m7 4 6 6-6 6",
  mic: "M7 4a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0V4Zm-3 5v1a6 6 0 0 0 12 0V9m-6 7v3m-3 0h6",
  scan: "M7 2H2v5m11-5h5v5M2 13v5h5m11-5v5h-5M5 10h10",
  grid: "M3 3h5v5H3Zm9 0h5v5h-5ZM3 12h5v5H3Zm9 0h5v5h-5Z",
  search: "M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Zm4.5 10.5L18 18",
  clock: "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3v5l3 2",
  plus: "M10 3v14M3 10h14",
  check: "m4 10 4 4 8-8",
  close: "m4 4 12 12M16 4 4 16",
  play: "m6 3 10 7-10 7V3Z",
  book: "M3 3h6l1 2 1-2h6v14h-6l-1 1-1-1H3V3Zm7 2v13",
  upload: "M10 13V2m-4 4 4-4 4 4M3 12v6h14v-6",
  tune: "M3 5h14M3 15h14M7 2v6m6 4v6",
  bag: "M4 6h12l1 12H3L4 6Zm3 0V4a3 3 0 0 1 6 0v2",
  heart: "M10 17 3 10C-2 4 5-1 10 5 15-1 22 4 17 10l-7 7Z",
  info: "M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 7v5m0-9v1",
  download: "M10 2v11m-4-4 4 4 4-4M3 14v4h14v-4",
  reset: "M3 8a7 7 0 1 1 1 7M3 3v5h5",
  volume: "M3 7h4l4-4v14l-4-4H3V7Zm11-1a6 6 0 0 1 0 8",
};
@Component({
  selector: "app-icon",
  standalone: true,
  template:
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="path"/></svg>',
  styles: [
    ":host{display:inline-flex;width:20px;height:20px;flex-shrink:0}svg{width:100%;height:100%}",
  ],
})
export class IconComponent {
  @Input() name = "arrow";
  get path() {
    return paths[this.name] || paths["info"];
  }
}
