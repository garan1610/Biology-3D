# Fan Feature Roadmap

This plan turns the fan request into a practical product direction for Cell Architecture Studio.

## Product Direction

The app should feel like a biology workbench: a 3D specimen in the center, focused observation tools around it, and learning panels that connect anatomy to living processes. The strongest near-term path is to make each selected organelle trigger a visible learning state, so exploration feels guided without hiding the 3D model behind explanations.

## First Release Slice

1. Isolate Lens
   - Selecting an organelle and pressing Isolate should zoom the specimen, dim the surrounding view, and show a small magnified callout.
   - The callout should reuse the selected organelle color, name, role, and process links.

2. Redesigned Information Boxes
   - Organelle details, biological notes, comparison, and microscope cards should look less like generic panels.
   - Information should be easier to scan: visual preview, short label, one strong statement, then supporting metadata.

3. Biochemical Processes
   - Add a process module for photosynthesis, protein biosynthesis, cell respiration, membrane transport, and cell cycle.
   - Each process needs steps, signals, linked organelles, and bilingual copy.
   - Clicking a process step should guide the user back to the relevant organelle when the current cell contains it.

## Later Releases

1. AI Tutor API
   - Status: first API-ready slice implemented.
   - `api/tutor.js` provides a server-side OpenAI Responses API proxy when `OPENAI_API_KEY` is configured.
   - The browser keeps a local tutor fallback when the API route is unavailable.
   - Tutor requests stay grounded in current cell, organelle, process, active step, comparison cell, and language.

2. Microscope Mode
   - Status: first interactive microscope stage and annotation-set slice implemented.
   - Uploaded and built-in specimens now render inside a zoomable microscope viewport.
   - Added channel toggles, stain/magnification metadata, grid overlay, focus marker, and cell-boundary annotation.
   - Annotation sets now persist in local storage and restore specimen, organelle focus, uploaded reference data, channel, zoom, and marker visibility after reload.
   - Remaining: higher fidelity generated micrograph references and export/share workflows for annotation sets.

3. Library and Settings
   - Status: first interactive slice implemented.
   - Library: searchable bilingual cell/process catalogue, favorites filter, cell open action, process jump into linked organelle.
   - Settings: language, motion, view mode, cross-section, label density, and render quality controls.
   - Shareable lesson presets now open a matching cell, organelle, process step, view mode, and language from the URL.
   - Demo gallery images now link into the matching 3D lesson preset when a corresponding workflow exists.
   - Remaining: saved comparisons, teacher-authored lesson authoring, and deeper accessibility controls.

4. Model Atlas and 3D Asset Enrichment
   - Status: first asset coverage panel implemented.
   - The UI now shows GLB/PBR/procedural status, source metadata, learning coverage, and next 3D upgrade targets for every specimen.
   - Model cards can open the matching specimen directly, so asset QA is connected to the learning workflow.
   - Remaining: production epithelial GLB, organelle-level submesh selection, and candidate import review.

5. Full Process Simulations
   - Status: first interactive simulation slice implemented.
   - Process panels now include play, reset, speed, and progress controls.
   - Added reaction readouts for compartment, inputs, outputs, energy carrier, and progress-linked biochemical values.
   - Progress controls update the active process step, linked organelle, Isolate Lens text, and 3D semantic overlay pulse.
   - Covered processes: photosynthesis, protein biosynthesis, cell respiration, membrane transport, and cell cycle.
   - Remaining: richer particle choreography, teacher-authored presets, and more rigorous pathway equations.
