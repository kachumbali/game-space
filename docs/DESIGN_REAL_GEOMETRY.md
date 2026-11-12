# Real-geometry hulls (plan)

Owner decision 2026-11-12: after Codex brief 5, ship hulls move from voxels to real geometry built from the same authored prims. Prototype: branch `vox-hybrid-proto`, `tools/proto/hybrid_preview.py exeter,falchion`.

## What changes
- **Rendering.** Every `tap`, `ell` and `seg` prim becomes a mesh, mirrored copies included. Tessellation scales with each prim's on-screen size: the prototype's fixed resolution made the Exeter 131k triangles, and adaptive tessellation should roughly halve that.
- **Colour priority.** Ships were authored for voxels, where a later prim covers an earlier one's colour inside their overlap. With real surfaces, buried colours show through or z-fight; the Falchion's orange patch is an example. Each ship gets an overlap audit: a tool that flags prim faces lying inside or coincident with a later prim. Fix the prims, do not hide the problem with offsets.
- **Shading.** The voxels supplied dirt, wear and contact shadows. Real geometry needs generated equivalents: vertex ambient occlusion, a wear and dirt pattern per material, and the existing `col2`/`rust`/`streak` options mapped onto vertex colours or a shared detail texture.
- **Small detail.** Fine voxels are used only for surface detail (vents, plates, seams from `surfaceDetail`), never for whole prims. The prototype's voxelised thin rings broke into dots.
- **Damage.** Scorch and dents become decals or a vertex-colour layer. Holes stay in the voxel grid used for collision. A visible breach shows a dark decal with embers rather than carved geometry.
- **Unchanged.** The voxel grid stays for collision, line of fire (`traceLocal`), shields and damage bookkeeping. Gameplay data, `db.json` positions and the ship-model rules in `AGENTS.md` also stay.

## Order
1. Mesh builder with adaptive tessellation, behind `?vox=mesh`, used in the yard first.
2. Overlap audit tool, then fix every ship.
3. Shading (AO, wear).
4. Damage decals and dents.
5. Make it the default; keep `?vox=smooth|cube|inst` for comparison.

## For designers now
Do not rely on a later prim to hide an earlier prim's colour. Shapes should meet, not be buried in each other with a different colour.
