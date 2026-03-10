/**
 * Larry Tools — Tool Registry
 *
 * To add a new tool:
 *   1. Create your tool file (e.g. tools/my-tool/tool.js)
 *   2. Import it below
 *   3. Add it to the exported array
 *
 * The order here controls the order tools appear in the sidebar.
 */

import ExampleTool      from './example-tool/tool.js';
import SecretScratchPad from './secret-scratch-pad/tool.js';

export default [
  // ── Regular tools ──────────────────────────────────────
  ExampleTool,

  // ── Secret tools (secret: true) ────────────────────────
  // These only appear when the secret sequence is entered.
  // Add secret tools here in the same way as regular ones.
  SecretScratchPad,
];
