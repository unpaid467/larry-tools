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

import ExampleTool               from './example-tool/tool.js';
import SecretScratchPad          from './secret-scratch-pad/tool.js';

// ── Ported from Python lookup tools ──────────────────────────────────────────
import Base64CodecTool            from './base64-codec/tool.js';
import ColorPickerTool            from './color-picker/tool.js';
import DateTimeClipboardTool      from './datetime-clipboard/tool.js';
import TextHasherTool             from './text-hasher/tool.js';
import MarkdownViewerTool         from './markdown-viewer/tool.js';
import UnitConverterTool          from './unit-converter/tool.js';
import PyInstallerHelperTool      from './pyinstaller-helper/tool.js';
import SystemInfoTool             from './system-info/tool.js';
import ProjectTemplateCreatorTool from './project-template-creator/tool.js';
import FileTypeStatsTool          from './file-type-stats/tool.js';
import LargeFileFinderTool        from './large-file-finder/tool.js';
import DuplicateFinderTool        from './duplicate-finder/tool.js';
import BulkFileRenamerTool        from './bulk-file-renamer/tool.js';
import ImageRenamerTool           from './image-renamer/tool.js';
import ImageScraperTool           from './image-scraper/tool.js';
import EmptyFolderFinderTool      from './empty-folder-finder/tool.js';

export default [
  // ── Encoding ───────────────────────────────────────────
  Base64CodecTool,

  // ── Design ─────────────────────────────────────────────
  ColorPickerTool,

  // ── Utilities ──────────────────────────────────────────
  DateTimeClipboardTool,
  UnitConverterTool,

  // ── Security ───────────────────────────────────────────
  TextHasherTool,

  // ── Text ───────────────────────────────────────────────
  MarkdownViewerTool,
  ExampleTool,

  // ── Dev ────────────────────────────────────────────────
  PyInstallerHelperTool,
  ProjectTemplateCreatorTool,

  // ── System ─────────────────────────────────────────────
  SystemInfoTool,

  // ── Files ──────────────────────────────────────────────
  FileTypeStatsTool,
  LargeFileFinderTool,
  DuplicateFinderTool,
  BulkFileRenamerTool,
  ImageRenamerTool,
  EmptyFolderFinderTool,

  // ── Network ────────────────────────────────────────────
  ImageScraperTool,

  // ── Secret tools (secret: true) ────────────────────────
  // These only appear when the secret sequence is entered.
  SecretScratchPad,
];
