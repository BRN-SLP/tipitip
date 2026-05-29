/**
 * Vanilla entry point: `@tipitip/embed/vanilla`.
 *
 * Importing this module (e.g. via a `<script type="module">` from a CDN)
 * registers the `<tipitip-paragraphs>` custom element as a side effect.
 * No React, no build step on the host site. Requires `viem`, which a CDN
 * like esm.sh resolves automatically.
 */
import { defineTipitipParagraphs } from "./web-component.js";

defineTipitipParagraphs();

export { defineTipitipParagraphs } from "./web-component.js";
