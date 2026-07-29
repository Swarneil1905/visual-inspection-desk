import { Component, Input } from "@angular/core";

@Component({
  selector: "product-art",
  standalone: true,
  template: ` <svg viewBox="0 0 400 360" role="img" [attr.aria-label]="label">
    <defs>
      <filter id="shadow"><feGaussianBlur stdDeviation="10" /></filter>
      <pattern id="weave" patternUnits="userSpaceOnUse" width="5" height="5">
        <path
          d="M0 0h5M0 0v5"
          stroke="#fff"
          stroke-opacity=".14"
          stroke-width="1"
        />
      </pattern>
    </defs>
    <ellipse
      cx="200"
      cy="305"
      rx="98"
      ry="12"
      fill="#282d28"
      opacity=".1"
      filter="url(#shadow)"
    />
    @switch (kind) {
      @case ("bag") {
        <path
          d="M143 109V85c0-76 114-76 114 0v24"
          fill="none"
          [attr.stroke]="color"
          stroke-width="17"
        />
        <path d="m111 105-17 191q107 24 212 0l-17-191Z" [attr.fill]="color" />
        <path d="m111 105-17 191q107 24 212 0l-17-191Z" fill="url(#weave)" />
        <path
          d="m125 118-12 163m162-163 12 163"
          stroke="#fff"
          opacity=".25"
          fill="none"
        />
        <rect x="177" y="205" width="46" height="25" rx="2" fill="#f4f1e6" />
        <path d="M188 217h24" stroke="#3e443d" stroke-width="2" />
      }
      @case ("lamp") {
        <ellipse cx="200" cy="298" rx="57" ry="10" [attr.fill]="color" />
        <path d="M200 280V144" [attr.stroke]="color" stroke-width="12" />
        <path d="M105 157c0-131 190-131 190 0Z" [attr.fill]="color" />
        <ellipse cx="200" cy="157" rx="95" ry="14" fill="#ddd4b8" />
        <path
          d="M144 103q15-39 52-40"
          stroke="#fff"
          stroke-width="5"
          opacity=".25"
          fill="none"
        />
      }
      @case ("bottle") {
        <rect x="168" y="45" width="64" height="35" rx="8" fill="#303c38" />
        <path
          d="M165 82q-18 14-18 42v151q0 24 53 24t53-24V124q0-28-18-42Z"
          [attr.fill]="color"
        />
        <path
          d="M165 120v135"
          stroke="#fff"
          opacity=".3"
          stroke-width="6"
          stroke-linecap="round"
        />
        <path d="M187 200h26" stroke="#fff" opacity=".7" stroke-width="3" />
      }
      @case ("headphones") {
        <path
          d="M110 197v-55a90 90 0 0 1 180 0v55"
          fill="none"
          [attr.stroke]="color"
          stroke-width="27"
        />
        <path
          d="M110 197v-55a90 90 0 0 1 180 0v55"
          fill="none"
          stroke="#fff"
          stroke-opacity=".15"
          stroke-width="10"
        />
        <rect
          x="88"
          y="162"
          width="61"
          height="109"
          rx="28"
          [attr.fill]="color"
        />
        <rect
          x="251"
          y="162"
          width="61"
          height="109"
          rx="28"
          [attr.fill]="color"
        />
        <rect x="131" y="173" width="16" height="88" rx="8" fill="#343937" />
        <rect x="253" y="173" width="16" height="88" rx="8" fill="#343937" />
      }
      @case ("notebook") {
        <path d="m125 61 161 17-16 231-161-17Z" fill="#e8e1d3" />
        <path d="m116 53 160 17-15 229-160-17Z" [attr.fill]="color" />
        <path d="m131 56-15 228" stroke="#fff" opacity=".2" stroke-width="2" />
        <path
          d="m248 67-15 228"
          stroke="#292d2b"
          opacity=".5"
          stroke-width="6"
        />
      }
      @default {
        <path d="M100 139h172v110q0 44-86 44t-86-44V139Z" [attr.fill]="color" />
        <path
          d="M270 155c88-26 88 110 0 87"
          fill="none"
          [attr.stroke]="color"
          stroke-width="20"
        />
        <ellipse cx="186" cy="139" rx="86" ry="19" fill="#e0d1b9" />
        <ellipse cx="186" cy="139" rx="72" ry="11" fill="#655646" />
      }
    }
  </svg>`,
  styles: [
    ":host{display:block;width:100%;height:100%}svg{display:block;width:100%;height:100%}",
  ],
})
export class ProductArtComponent {
  @Input() kind = "bag";
  @Input() color = "#8d957e";
  @Input() label = "Original product illustration";
}
