# Vehicle Diagnostics Prototype

An interactive web prototype that maps diagnostic recommendations onto a
rotatable, blueprint-style 3D sedan.

## Features

- CC0 Kenney sedan rendered as a translucent gunmetal shell with outline edges
- Fixed-distance mouse and touch rotation with zoom and panning disabled
- Red, yellow, and blue markers for replacement, upcoming replacement, and
  inspection statuses
- One-to-many part mapping, including four wheel markers for brake pads
- Synchronized diagnostic list and 3D marker selection
- Responsive desktop and mobile layouts
- Typed, renderer-independent diagnostic and part-location contracts

## Commands

```bash
npm install
npm run dev
npm test
npm run lint
npm run build
```

## Diagnostic input

The prototype accepts items shaped as:

```ts
interface DiagnosticItem {
  id: string;
  partCode: string;
  severity: "replace_now" | "replace_soon" | "inspect";
  title?: string;
  note?: string;
}
```

Part codes are resolved through the catalog in `lib/diagnostics.ts`. Unknown
codes remain visible in the list without producing a 3D marker.

See `ATTRIBUTION.md` for the third-party model license.
