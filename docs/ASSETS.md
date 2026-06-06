# 3D Asset Provenance

The prototype uses local GLB files for the highest fidelity cell specimens. In local development these files are loaded from `public/models/` and paired with preview images from `public/cell-renders-transparent/` or `public/nih-previews/`.

Cloudflare Pages deployments should serve these GLB files from R2 by setting `VITE_MODEL_ASSET_BASE_URL`. The deployed app will keep the same `/models/<file>.glb` path under the configured asset domain.

| Specimen | Local files | Source |
| --- | --- | --- |
| Plant Cell | `public/models/plant-cell-3d-model-tripo-v3.glb` | Tripo Studio export: `/Users/lank/Downloads/plant+cell+3d+model.glb` |
| White Blood Cell | `public/models/white-blood-cell-user.glb` | Local user-provided GLB: `/Users/lank/Downloads/second.glb` |
| Animal Cell | `public/models/animal-cell-nih.glb`, `public/nih-previews/animal-cell-nih.png` | NIH 3D entry: https://3d.nih.gov/entries/3DPX-015797/2 |
| Neuron | `public/models/neuron-nih.glb`, `public/nih-previews/neuron-nih.png` | NIH 3D entry: https://3d.nih.gov/entries/3DPX-015796/2 |
| Gram Positive Cell Wall | `public/models/bacteria-wall-nih.glb`, `public/nih-previews/bacteria-wall-nih.png` | NIH 3D entry: https://3d.nih.gov/entries/3DPX-010752/2 |
| Muscle Cell | `public/models/muscle-cell-tripo-skeletal-fiber-textured-pbr.glb`, `public/models/muscle-cell-tripo-skeletal-fiber.glb`, `public/texture-references/muscle-fiber-texture-reference.png` | Tripo Studio skeletal muscle fiber export: `/Users/lank/Downloads/skeletal+muscle+fiber+textured+pbr.glb`; texture reference generated locally |

Epithelial Cell still uses procedural Three.js geometry so the experience remains complete while more licensed GLB assets are sourced.

The in-app Model Atlas surfaces this same asset status for learners and maintainers: native GLB/PBR, GLB study mesh, procedural model, source metadata, process-layer coverage, and the next model upgrade target.

## Reference Renders

The app also includes single-subject generated reference images for thumbnails, model previews, and downstream 3D asset experiments.

| Specimen | Local file |
| --- | --- |
| Plant Cell | `public/cell-renders/plant.png` |
| White Blood Cell | `public/cell-renders/white-blood.png` |
| Neuron | `public/cell-renders/neuron.png` |
| Epithelial Cell | `public/cell-renders/epithelial.png` |
| Bacteria Cell | `public/cell-renders/bacteria.png` |
| Animal Cell | `public/cell-renders/animal.png` |
| Muscle Cell | `public/cell-renders/muscle.png` |

Transparent-background versions live in `public/cell-renders-transparent/` and are used by sidebar thumbnails and GLB preview metadata.
