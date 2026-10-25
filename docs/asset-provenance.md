# Asset provenance

| Asset | Origin | Usage |
| --- | --- | --- |
| DM Sans 400/500/600/700 | @expo-google-fonts/dm-sans; SIL Open Font License | Bundled Latin UI typography, loaded locally at runtime |
| Lucide icons | lucide-react-native, ISC license | Native vector UI icons |
| Reference screen PNGs | User-provided Pencil document, final board Qx0SG only | Visual QA; excluded from runtime UI |
| Tool fixture illustrations | Original native SVG in features/tools/PhotoToolScreen.tsx | Three clearly marked demo illustrations; no diagnosis or remote asset |
| Community fixture illustrations | Original native SVG in features/community/components.tsx | Leaf, standing water, young crop; local picker and preview only |

No remote image URL is needed by the demo. Reference screenshots are never rendered as app screens.

## Friendly UI refresh

- UI fonts now use bundled `@expo-google-fonts/dm-sans` (400, 500, 600, 700), licensed under the SIL Open Font License. Fonts load locally through `expo-font`; no remote font request is needed.
- `assets/images/wheat-field.jpg`: initial wheat-only banner generated with the built-in image-generation tool, exported as a 1200 × 400 JPEG (about 204 KB). Preserved as an unused design asset; superseded by the farmer image below.
- Generation prompt: "Create a premium photographic banner asset for Khetify, an Indian farming mobile app. Wide horizontal landscape 3:1 composition. A close-up of golden wheat ears in the foreground, terracotta earth path between small agricultural plots in the middle ground, distant low rural horizon and soft hazy pale blue sky. Warm morning natural light, authentic small Indian farm, tactile realistic photography, restrained editorial color grading: oat, amber, soil brown, muted sage accents and pale blue. Predominantly golden wheat rather than all green. Calm, inviting and useful agriculture context. No text, no badges, no circular graphics, no dots, no logos, no watermarks, no interface, no people. Entire image is the photo; designed to crop nicely into a 340 by 130 mobile card."
- Lucide vectors remain the shared icon system. Soil, crop photo, and market shortcuts pair distinct icons with visible labels and restrained terracotta, blue, and amber surfaces.

## Farmer hero revision

- `assets/images/farmer-phone-magic.jpg`: generated with the built-in image-generation tool. A farmer checking his phone at sunset, with a subtle glowing seedling above the screen. Bundled locally and used on Home and the empty Farm Plan screen with a taller 192-point crop that preserves the farmer's face and hands.
- The full generation prompt and usage notes are in [farmer-image-prompt.md](farmer-image-prompt.md).

- App icon: original Khetify sprout/field/seed SVG artwork, rendered to PNG with sharp by scripts/generate-icon.mjs. Assets in assets/icon/ include opaque app icon, adaptive foreground and monochrome layer.
