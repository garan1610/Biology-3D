# Cell Architecture Studio

![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=111)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=fff)
![Vite](https://img.shields.io/badge/Vite-7.2-646CFF?logo=vite&logoColor=fff)
![Three.js](https://img.shields.io/badge/Three.js-0.181-000000?logo=threedotjs&logoColor=fff)
![3D Assets](https://img.shields.io/badge/GLB-native%20materials-4f8a3f)
![Verification](https://img.shields.io/badge/verification-playwright%20screenshots-2ea44f)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-local%20prototype-f59e0b)
[![Live Demo](https://img.shields.io/badge/live-demo-16a34a)](https://cell-architecture-studio.lanshuagent.com/)

An interactive cell architecture gallery built with React, Vite, Three.js, and staged GLB or procedural 3D cell assets. The project recreates a premium educational biology interface with selectable cell types, organelle details, comparison mode, responsive layout, and visual verification coverage.

## Live Demo

[Open the live deployment](https://cell-architecture-studio.lanshuagent.com/)

[![Cell Architecture Studio demo](docs/media/cell-architecture-studio-demo.gif)](https://cell-architecture-studio.lanshuagent.com/)

[View the MP4 demo file](docs/media/cell-architecture-studio-demo.mp4)

## Highlights

- Seven specimen views: plant cell, white blood cell, neuron, epithelial cell, bacteria cell, animal cell, and muscle cell.
- High fidelity Plant Cell, White Blood Cell, and Muscle Cell GLB rendering with native texture preservation.
- Mesh first experience with 3D canvas rendering as the default view.
- AI Tutor panel with optional server-side OpenAI Responses API support, local fallback answers, learning prompts, lesson focus, and mastery tracking.
- Shareable lesson presets that open a specific cell, organelle, process step, view mode, and language from the URL.
- Biochemical process explorer with playback, speed, scrubber, linked organelle focus, and 3D semantic overlays.
- Model Atlas panel that exposes GLB/PBR/procedural status, source metadata, learning coverage, and next 3D upgrade targets.
- Model loading overlay for large GLB assets on slower networks.
- Procedural fallback geometry for specimens that do not yet have production GLB assets.
- Detail panel for organelles, microscope modes, specimen metadata, and comparison workflow.
- Responsive desktop, compact, and mobile layouts with browser screenshot verification.

## Preview Modes

| Mode | Purpose |
| --- | --- |
| Mesh | Loads available GLB models or procedural Three.js geometry. |
| Focus | Emphasizes selected organelles and supporting biological details. |

## Tech Stack

| Layer | Tools |
| --- | --- |
| App | React 19, TypeScript, Vite |
| 3D | Three.js, React Three Fiber, Drei |
| UI | CSS modules in `src/styles.css`, Lucide icons |
| Tutor API | Cloudflare Pages Function `functions/api/tutor.js` with a legacy-compatible `api/tutor.js` adapter |
| Assets | GLB models, transparent PNG thumbnails, NIH previews |
| Verification | Playwright Core, PNG pixel metrics |

## Project Structure

```text
.
|-- docs/
|   |-- media/
|   `-- ASSETS.md
|-- public/
|   |-- cell-renders/
|   |-- cell-renders-transparent/
|   |-- models/
|   `-- nih-previews/
|-- api/
|   `-- tutor.js
|-- scripts/
|   `-- verify.mjs
`-- src/
    |-- App.tsx
    |-- components/
    |-- data/
    `-- styles.css
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the local development server:

```bash
npm run dev
```

Open the app:

```text
http://127.0.0.1:5173/
```

Optional AI Tutor API:

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

Set these on Cloudflare Pages for the `functions/api/tutor.js` endpoint. Plain `npm run dev` starts Vite only, so local browser sessions fall back to the local concept tutor. The browser never receives the API key.

Build for production:

```bash
npm run build
```

Build for Cloudflare Pages with GLB models served from R2:

```bash
VITE_MODEL_ASSET_BASE_URL=https://assets.example.com VITE_MODEL_ASSET_CACHE_SUFFIX=.bin npm run build:cloudflare
```

See `docs/CLOUDFLARE_DEPLOYMENT.md` for the R2 upload command, Pages environment variables, caching headers, and function routing.

Run visual verification:

```bash
npm run verify
```

## Asset Notes

The highest fidelity specimens are loaded from `public/models/` and configured in `src/data/cells.ts`.
For Cloudflare Pages deployments, set `VITE_MODEL_ASSET_BASE_URL` so these GLB URLs resolve through the R2 asset domain instead of being uploaded as Pages assets.

| Specimen | Current asset |
| --- | --- |
| Plant Cell | `public/models/plant-cell-3d-model-tripo-v3.glb` |
| White Blood Cell | `public/models/white-blood-cell-user.glb` |
| Animal Cell | `public/models/animal-cell-nih.glb` |
| Neuron | `public/models/neuron-nih.glb` |
| Bacteria Wall | `public/models/bacteria-wall-nih.glb` |
| Muscle Cell | `public/models/muscle-cell-tripo-skeletal-fiber-textured-pbr.glb` |

Transparent PNG references in `public/cell-renders-transparent/` are used for thumbnails and model previews. Detailed provenance is tracked in `docs/ASSETS.md`.

## Verification

`npm run verify` launches the local app, captures desktop, compact, mobile, and interaction screenshots, then checks canvas pixel metrics to catch blank renders or major layout regressions.

Current coverage includes:

- Desktop, compact, and mobile smoke checks.
- Plant Cell GLB render check.
- White Blood Cell GLB render check.
- Animal, Muscle, and Bacteria model render checks.
- AI Tutor local fallback and mocked API response checks.
- Library search, process jump, Settings controls, and bilingual search checks.
- Lesson preset deep links, lesson picker state, and demo-to-3D study links.
- Microscope upload, zoom, channel, marker, persisted annotation save/restore, and localization checks.
- Model Atlas coverage, localization, and model open action checks.
- Reaction readouts for biochemical process simulations, including progress-linked values and localization.
- Bacteria mesh interaction check.
- Comparison modal check.

## Roadmap

- Add a production quality Epithelial Cell GLB while keeping the procedural model as fallback.
- Add lazy loading and route level code splitting for 3D bundles.
- Expand lesson presets into teacher-authored classroom sequences for each organelle.
- Turn Model Atlas into an import and QA workflow for future GLB/PBR candidates.

## License

The application code is licensed under the MIT License. Included GLB models and image assets retain their documented provenance in `docs/ASSETS.md`.

## Credits

Special thanks to the original creator [@DilumSanjaya](https://x.com/DilumSanjaya) for the source inspiration and visual direction.

Additional 3D model provenance is documented in `docs/ASSETS.md`.
