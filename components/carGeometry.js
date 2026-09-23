// Detail-panel placement.
//
// The body itself now lives in components/carShell.js, which lofts a real
// surface and cuts it into the pick list's panels. This file is what remains
// of the older box-stacking version: the one function that places the extended
// catalogue from lib/panels.js in car space.
//
// NOTE: nothing calls buildDetailPanels yet. The catalogue it reads is not
// validated against a parts catalogue (see the warning at the top of
// lib/panels.js), so wiring it into the diagram is a decision still to be made
// rather than something to switch on quietly.

import { panelBoxesFor } from '@/lib/panels';

// The catalogue places its panels in unit car space, so one set of coordinates
// works for every profile:
//
//     x   -1 = left flank, 0 = centreline, +1 = right flank
//     y    0 = sill line,  1 = roof line
//     z    0 = rear face,  1 = front face
export function buildDetailPanels(profile, bodyType = 'sedan') {
  const p = profile;
  const hSpan = p.roofY - p.sillY;
  const lSpan = p.zFront - p.zRear;

  const toMetres = (box) => ({
    pos: [
      box.pos[0] * p.halfWidth,
      p.sillY + box.pos[1] * hSpan,
      p.zRear + box.pos[2] * lSpan,
    ],
    // Guard against a zero dimension: a flat box renders as an invisible
    // sliver that can still be clicked, which reads as a phantom panel.
    size: [
      Math.max(box.size[0] * p.halfWidth, 0.02),
      Math.max(box.size[1] * hSpan, 0.02),
      Math.max(box.size[2] * lSpan, 0.02),
    ],
  });

  return panelBoxesFor(bodyType)
    .filter(panel => panel.box)
    .map(panel => ({
      area: panel.id,
      side: panel.side || null,
      detail: true,
      group: panel.group || 'front',
      ...toMetres(panel.box),
    }));
}
