// ---------------------------------------------------------------------------
// PANEL CATALOGUE
// ---------------------------------------------------------------------------
// ACCURACY WARNING — READ BEFORE TRUSTING THIS FILE.
//
// This catalogue was assembled from general knowledge of 2025/26 model-year
// vehicles, NOT from a licensed parts catalogue. Panel naming and part splits
// differ between Audatex, Mitchell, and each manufacturer's own EPC, and they
// differ again between model years. Nothing here has been checked against a
// live catalogue.
//
// It is a working starting point, not a source of truth. Before quoting real
// jobs off it, validate against Audatex/Thatcham or the manufacturer EPC with
// an estimator who quotes these cars weekly. Entries carrying `unverified: true`
// are the ones most likely to be wrong for a given model.
//
// ---------------------------------------------------------------------------
// Two id ranges, one column
// ---------------------------------------------------------------------------
// 10–39   Legacy pick-list areas (PICK_AREAS in lib/picklist.js). These are
//         damage *zones*, not panels — "FRONT BAR" covers what is now a twelve
//         piece assembly. Every pick-list row carries one, so lines chosen from
//         the pick list land on these automatically.
//
// 100+    Panels this catalogue adds. The pick list has no rows for them, so
//         they can only be chosen deliberately. They share quote_lines.area_id
//         with the legacy range — a smallint holds both comfortably and one
//         namespace beats keeping two columns in step.
//
// Each new panel names the legacy `zone` it sits inside, so a coarse pick-list
// line and a precise panel line can still be grouped together on a report.
//
// ---------------------------------------------------------------------------
// Sides
// ---------------------------------------------------------------------------
// Paired panels are stored ONCE with `sides: ['L','R']` and expanded at read
// time. The legacy range duplicates them by name (17 L/H/F GUARD, 18 R/H/F
// GUARD); doing that again for ninety panels would double the catalogue and
// double the chance of the two halves drifting apart.
//
// ---------------------------------------------------------------------------
// Where they sit
// ---------------------------------------------------------------------------
// `box` is [x, y, z] position and [w, h, d] size in UNIT CAR SPACE:
//
//     x   -1 = left flank, 0 = centreline, +1 = right flank
//     y    0 = sill line,  1 = roof line
//     z    0 = rear face,  1 = front face
//
// Unit space rather than metres so one placement works for all three body
// profiles — components/carGeometry.js scales it onto whichever is selected.
// A left-side panel is written once at negative x and mirrored for the right.

// ---------------------------------------------------------------------------
// Core panels — the legacy pick-list zones, drawn as the main body of the car.
// ---------------------------------------------------------------------------
export const CORE_PANELS = [
  { id: 10, label: 'Front bar',        short: 'F/BAR',    group: 'front' },
  { id: 11, label: 'Grille',           short: 'GRILLE',   group: 'front' },
  { id: 12, label: 'Front lights',     short: 'F/LAMPS',  group: 'front' },
  { id: 14, label: 'Bonnet',           short: 'BONNET',   group: 'front', material: 'aluminium-often' },
  { id: 17, label: 'L/H/F guard',      short: 'LF GUARD', group: 'side' },
  { id: 18, label: 'R/H/F guard',      short: 'RF GUARD', group: 'side' },
  { id: 19, label: 'L/H/F door',       short: 'LF DOOR',  group: 'side' },
  { id: 20, label: 'R/H/F door',       short: 'RF DOOR',  group: 'side' },
  { id: 21, label: 'L/H/R door',       short: 'LR DOOR',  group: 'side' },
  { id: 22, label: 'R/H/R door',       short: 'RR DOOR',  group: 'side' },
  { id: 23, label: 'L/H body side',    short: 'LH SIDE',  group: 'side', material: 'boron' },
  { id: 24, label: 'R/H body side',    short: 'RH SIDE',  group: 'side', material: 'boron' },
  { id: 25, label: 'L/H/R qtr panel',  short: 'LR QTR',   group: 'side' },
  { id: 26, label: 'R/H/R qtr panel',  short: 'RR QTR',   group: 'side' },
  { id: 27, label: 'Turret (roof)',    short: 'ROOF',     group: 'roof' },
  { id: 28, label: 'Tailgate',         short: 'TAILGATE', group: 'rear', bodies: ['hatch', 'suv'] },
  { id: 29, label: 'Bootlid',          short: 'BOOTLID',  group: 'rear', bodies: ['sedan'] },
  { id: 30, label: 'Rear bumper',      short: 'R/BAR',    group: 'rear' },
  { id: 31, label: 'Rear lights',      short: 'R/LAMPS',  group: 'rear' },
];

// ---------------------------------------------------------------------------
// Detail panels — everything the 30 legacy zones lump together or omit.
// ---------------------------------------------------------------------------
// This is where 2025/26 repair cost actually concentrates: glass and ADAS,
// separated lighting, flush handles, and the pressed-boron structure that can't
// be straightened at any price.
const DETAIL = [
  // ---- Front: bumper assembly ---------------------------------------------
  { id: 100, label: 'Bumper energy absorber', short: 'F/ABSORB', zone: 10, group: 'front',
    paint: false, box: { pos: [0, 0.30, 0.955], size: [1.5556, 0.2315, 0.0214] },
    note: 'Foam or honeycomb behind the cover. Replaced, never repaired.' },
  { id: 101, label: 'Front bumper reinforcement', short: 'F/REINF', zone: 10, group: 'front',
    paint: false, material: 'aluminium-often', box: { pos: [0, 0.30, 0.935], size: [1.6667, 0.1111, 0.0192] } },
  { id: 102, label: 'Crush can', short: 'CRUSH', zone: 16, group: 'front', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.55, 0.30, 0.90], size: [0.1333, 0.1111, 0.0427] },
    note: 'Deforms before the rail. Bent = replace; a straightened one is worthless.' },
  { id: 103, label: 'Lower grille', short: 'L/GRILLE', zone: 11, group: 'front',
    box: { pos: [0, 0.13, 0.965], size: [1.2778, 0.1852, 0.015] } },
  { id: 104, label: 'Active grille shutter', short: 'AGS', zone: 11, group: 'front',
    paint: false, box: { pos: [0, 0.22, 0.905], size: [0.9444, 0.2315, 0.0128] },
    note: 'Motorised vanes behind the grille. Toyota, Hyundai and Honda widely.' },
  { id: 105, label: 'Fog lamp / bezel', short: 'FOG', zone: 12, group: 'front', sides: ['L', 'R'],
    box: { pos: [-0.70, 0.14, 0.955], size: [0.2, 0.1111, 0.0171] } },
  { id: 106, label: 'DRL light bar', short: 'DRL', zone: 12, group: 'front',
    paint: false, box: { pos: [0, 0.50, 0.965], size: [1.7778, 0.0556, 0.0107] },
    note: 'Separate from the headlamp on Toyota hammerhead and Hyundai pixel fronts.' },
  { id: 107, label: 'Air curtain duct', short: 'A/CURT', zone: 10, group: 'front', sides: ['L', 'R'],
    box: { pos: [-0.86, 0.22, 0.945], size: [0.1, 0.2778, 0.0214] } },
  { id: 108, label: 'Lower valance / air dam', short: 'VALANCE', zone: 10, group: 'front',
    box: { pos: [0, 0.02, 0.955], size: [1.7222, 0.1204, 0.0214] } },
  { id: 109, label: 'Front skid plate', short: 'SKID', zone: 10, group: 'front',
    box: { pos: [0, -0.03, 0.925], size: [1.2222, 0.0463, 0.0534] }, bodies: ['suv'] },
  { id: 110, label: 'Tow hook cover', short: 'TOW', zone: 10, group: 'front',
    box: { pos: [0.62, 0.26, 0.985], size: [0.1333, 0.1111, 0.0064] } },

  // ---- Front: structure and bonnet ----------------------------------------
  { id: 111, label: 'Active bonnet actuator', short: 'A/BONNET', zone: 14, group: 'front', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.55, 0.60, 0.70], size: [0.1, 0.0926, 0.0214] },
    note: 'Pyrotechnic pedestrian-protection lifter. Fires once, then replace.' },
  { id: 112, label: 'Cowl / wiper plenum', short: 'COWL', zone: 15, group: 'front',
    box: { pos: [0, 0.68, 0.635], size: [1.6111, 0.0833, 0.047] } },
  { id: 113, label: 'Rad support upper tie bar', short: 'RAD/UP', zone: 13, group: 'front',
    paint: false, box: { pos: [0, 0.58, 0.875], size: [1.5556, 0.0833, 0.0171] } },
  { id: 114, label: 'Rad support lower', short: 'RAD/LO', zone: 13, group: 'front',
    paint: false, box: { pos: [0, 0.06, 0.875], size: [1.5556, 0.0833, 0.0171] } },
  { id: 115, label: 'Inner guard / apron', short: 'APRON', zone: 15, group: 'front', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.70, 0.42, 0.760], size: [0.0889, 0.3704, 0.0684] } },
  { id: 116, label: 'Strut tower', short: 'STRUT', zone: 15, group: 'front', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.58, 0.62, 0.720], size: [0.2444, 0.1389, 0.047] } },
  { id: 117, label: 'Front rail', short: 'F/RAIL', zone: 16, group: 'front', sides: ['L', 'R'],
    paint: false, material: 'boron', box: { pos: [-0.44, 0.20, 0.770], size: [0.1333, 0.1389, 0.0962] },
    note: 'Structural. Sectioning limits are manufacturer-specific.' },
  { id: 118, label: 'Guard liner / splash shield', short: 'LINER', zone: 17, group: 'front', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.80, 0.18, 0.760], size: [0.0667, 0.2963, 0.0769] } },

  // ---- Sides ---------------------------------------------------------------
  { id: 140, label: 'Front wheel arch flare', short: 'F/FLARE', zone: 17, group: 'side', sides: ['L', 'R'],
    box: { pos: [-0.96, 0.12, 0.745], size: [0.0667, 0.2037, 0.0897] },
    note: 'Separate cladding on RAV4, Outlander, Haval, Triton.' },
  { id: 141, label: 'Front door shell', short: 'FD/SHELL', zone: 19, group: 'side', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.90, 0.32, 0.545], size: [0.0667, 0.463, 0.2009] },
    note: 'The frame behind the skin. Priced apart from the skin on most makes.' },
  { id: 142, label: 'Rear door shell', short: 'RD/SHELL', zone: 21, group: 'side', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.90, 0.32, 0.375], size: [0.0667, 0.463, 0.188] } },
  { id: 143, label: 'Front door handle', short: 'FD/HDL', zone: 19, group: 'side', sides: ['L', 'R'],
    box: { pos: [-0.97, 0.46, 0.520], size: [0.0444, 0.0556, 0.0427] },
    note: 'Motorised flush handle on BYD Seal/Sealion and some Hyundai. Costly.' },
  { id: 144, label: 'Rear door handle', short: 'RD/HDL', zone: 21, group: 'side', sides: ['L', 'R'],
    box: { pos: [-0.97, 0.46, 0.350], size: [0.0444, 0.0556, 0.0427] } },
  { id: 145, label: 'Rocker / sill cover', short: 'SILL/CVR', zone: 23, group: 'side', sides: ['L', 'R'],
    box: { pos: [-0.97, 0.02, 0.455], size: [0.0556, 0.1204, 0.4167] },
    note: 'The plastic cover. The structural rocker underneath is area 23/24.' },
  { id: 146, label: 'A-pillar', short: 'A/PILLAR', zone: 27, group: 'roof', sides: ['L', 'R'],
    box: { pos: [-0.84, 0.80, 0.620], size: [0.1, 0.4167, 0.0897] } },
  { id: 147, label: 'B-pillar', short: 'B/PILLAR', zone: 23, group: 'side', sides: ['L', 'R'],
    material: 'boron', box: { pos: [-0.88, 0.5, 0.432], size: [0.0778, 0.9259, 0.0321] },
    note: 'Hot-stamped boron. Replace only — it cannot be straightened.' },
  { id: 148, label: 'B-pillar applique', short: 'B/APPL', zone: 23, group: 'side', sides: ['L', 'R'],
    box: { pos: [-0.96, 0.62, 0.432], size: [0.0333, 0.5741, 0.0278] },
    note: 'Gloss black trim over the pillar. Scratches on its own, replaced on its own.' },
  { id: 149, label: 'C-pillar', short: 'C/PILLAR', zone: 25, group: 'roof', sides: ['L', 'R'],
    box: { pos: [-0.84, 0.80, 0.270], size: [0.1, 0.4167, 0.0897] } },
  { id: 150, label: 'D-pillar', short: 'D/PILLAR', zone: 25, group: 'roof', sides: ['L', 'R'],
    bodies: ['suv'], box: { pos: [-0.82, 0.82, 0.130], size: [0.1, 0.3704, 0.0726] } },
  { id: 151, label: 'Rear wheel arch flare', short: 'R/FLARE', zone: 25, group: 'side', sides: ['L', 'R'],
    box: { pos: [-0.96, 0.12, 0.225], size: [0.0667, 0.2037, 0.0897] } },
  { id: 152, label: 'Mirror assembly', short: 'MIRROR', zone: 19, group: 'side', sides: ['L', 'R'],
    box: { pos: [-1.06, 0.62, 0.615], size: [0.1667, 0.1019, 0.0406] } },
  { id: 153, label: 'Mirror cap', short: 'MIR/CAP', zone: 19, group: 'side', sides: ['L', 'R'],
    box: { pos: [-1.10, 0.63, 0.615], size: [0.0556, 0.0926, 0.0385] },
    note: 'Painted, kerbed constantly, replaced on its own more than any other panel.' },
  { id: 154, label: 'Mirror glass', short: 'MIR/GLS', zone: 19, group: 'side', sides: ['L', 'R'],
    material: 'glass', paint: false, box: { pos: [-1.03, 0.63, 0.615], size: [0.0222, 0.0741, 0.0299] } },
  { id: 155, label: 'Fuel filler flap', short: 'FUEL', zone: 25, group: 'side',
    box: { pos: [-0.95, 0.36, 0.250], size: [0.0333, 0.1759, 0.0406] },
    note: 'Side varies by model — shown left. Check before quoting.' },
  { id: 156, label: 'Charge port door', short: 'CHARGE', zone: 26, group: 'side',
    box: { pos: [0.95, 0.36, 0.230], size: [0.0333, 0.1759, 0.0406] },
    note: 'EV/PHEV. Position varies wildly: bZ4X front left guard, Ioniq 5 right rear quarter, BYD often two ports on opposite quarters.' },

  // ---- Roof and glass ------------------------------------------------------
  { id: 180, label: 'Roof rail', short: 'RAIL', zone: 27, group: 'roof', sides: ['L', 'R'],
    bodies: ['suv'], box: { pos: [-0.72, 1.02, 0.450], size: [0.0778, 0.0463, 0.2671] } },
  { id: 181, label: 'Windscreen', short: 'W/SCREEN', zone: 27, group: 'glass',
    material: 'glass', paint: false, box: { pos: [0, 0.82, 0.625], size: [1.6111, 0.463, 0.0962] },
    note: 'ADAS camera bracket is bonded to it. Replacement almost always drags in a calibration sublet.' },
  { id: 183, label: 'Rear screen', short: 'BACKLIGHT', zone: 28, group: 'glass',
    material: 'glass', paint: false, box: { pos: [0, 0.82, 0.175], size: [1.5556, 0.3889, 0.0748] } },
  { id: 184, label: 'Front door glass', short: 'FD/GLASS', zone: 19, group: 'glass', sides: ['L', 'R'],
    material: 'glass', paint: false, box: { pos: [-0.94, 0.78, 0.545], size: [0.0333, 0.3148, 0.1816] } },
  { id: 185, label: 'Rear door glass', short: 'RD/GLASS', zone: 21, group: 'glass', sides: ['L', 'R'],
    material: 'glass', paint: false, box: { pos: [-0.94, 0.78, 0.375], size: [0.0333, 0.2963, 0.1538] } },
  { id: 186, label: 'Quarter glass', short: 'QTR/GLS', zone: 25, group: 'glass', sides: ['L', 'R'],
    material: 'glass', paint: false, box: { pos: [-0.92, 0.80, 0.245], size: [0.0333, 0.2407, 0.0855] } },
  { id: 187, label: 'Sunroof glass', short: 'SUNROOF', zone: 27, group: 'glass',
    material: 'glass', paint: false, box: { pos: [0, 1.01, 0.500], size: [1.0556, 0.0278, 0.1923] } },
  { id: 188, label: 'Fixed panoramic roof', short: 'PANO', zone: 27, group: 'glass',
    material: 'glass-bonded', paint: false, box: { pos: [0, 1.01, 0.450], size: [1.4444, 0.0278, 0.2885] },
    note: 'One bonded sheet, no opening panel. BYD Seal/Sealion and many EVs. Not interchangeable with a sunroof.' },
  { id: 189, label: 'Roof spoiler', short: 'SPOILER', zone: 28, group: 'rear',
    bodies: ['hatch', 'suv'], box: { pos: [0, 0.99, 0.135], size: [1.4444, 0.0833, 0.0534] } },
  { id: 190, label: 'High-mount stop lamp', short: 'HMSL', zone: 28, group: 'rear',
    paint: false, box: { pos: [0, 0.95, 0.150], size: [0.3889, 0.0463, 0.0128] } },

  // ---- Rear ----------------------------------------------------------------
  { id: 210, label: 'Tailgate inner', short: 'TG/INNER', zone: 28, group: 'rear',
    bodies: ['hatch', 'suv'], paint: false, box: { pos: [0, 0.55, 0.095], size: [1.5556, 0.6481, 0.0128] } },
  { id: 211, label: 'Tailgate garnish', short: 'TG/GARN', zone: 28, group: 'rear',
    bodies: ['hatch', 'suv'], box: { pos: [0, 0.44, 0.035], size: [1.6111, 0.1389, 0.0107] },
    note: 'The panel spanning between the tail lamps.' },
  { id: 212, label: 'Tail lamp (tailgate)', short: 'TL/GATE', zone: 31, group: 'rear', sides: ['L', 'R'],
    bodies: ['hatch', 'suv'], paint: false, box: { pos: [-0.50, 0.48, 0.040], size: [0.3333, 0.1389, 0.0128] },
    note: 'Inner half of a split lamp. Two pieces per side is normal on SUVs — quoting one misses half the job.' },
  { id: 213, label: 'Full-width rear light bar', short: 'R/BAR/LT', zone: 31, group: 'rear',
    paint: false, box: { pos: [0, 0.50, 0.030], size: [1.8889, 0.0648, 0.0107] },
    note: 'BYD, Ioniq, Haval. Replaces the pair of discrete lamps.' },
  { id: 214, label: 'Rear bumper reinforcement', short: 'R/REINF', zone: 30, group: 'rear',
    paint: false, box: { pos: [0, 0.24, 0.055], size: [1.6667, 0.1111, 0.0192] } },
  { id: 215, label: 'Rear diffuser / valance', short: 'DIFFUSER', zone: 30, group: 'rear',
    box: { pos: [0, 0.00, 0.020], size: [1.6667, 0.1389, 0.0256] } },
  { id: 216, label: 'Rear bumper step pad', short: 'STEP', zone: 30, group: 'rear',
    bodies: ['suv'], box: { pos: [0, 0.26, 0.005], size: [1.1111, 0.0648, 0.0342] } },
  { id: 217, label: 'Rear rail', short: 'R/RAIL', zone: 33, group: 'rear', sides: ['L', 'R'],
    paint: false, material: 'boron', box: { pos: [-0.44, 0.16, 0.130], size: [0.1333, 0.1389, 0.0769] } },

  // ---- ADAS ----------------------------------------------------------------
  // Not panels and never painted, but they sit inside panels, are separately
  // priced, and each one drags a calibration sublet behind it. Kept in the
  // catalogue so removing a bumper can't quietly lose the radar behind it.
  { id: 250, label: 'Front radar (ACC)', short: 'RADAR/F', zone: 10, group: 'adas',
    paint: false, box: { pos: [0, 0.24, 0.900], size: [0.2, 0.1296, 0.015] } },
  { id: 251, label: 'Front ADAS camera', short: 'CAM/F', zone: 27, group: 'adas',
    paint: false, box: { pos: [0, 0.88, 0.610], size: [0.1333, 0.0648, 0.0192] },
    note: 'Windscreen-mounted on most; behind the grille badge on some Toyota and Hyundai/Kia.' },
  { id: 252, label: 'Blind-spot radar', short: 'BSM', zone: 30, group: 'adas', sides: ['L', 'R'],
    paint: false, box: { pos: [-0.76, 0.24, 0.045], size: [0.1333, 0.0926, 0.0128] },
    note: 'Inside the rear bumper corners. A bumper R&R disturbs both.' },
  { id: 253, label: 'Front parking sensors', short: 'PDC/F', zone: 10, group: 'adas',
    paint: false, box: { pos: [0, 0.16, 0.975], size: [1.4444, 0.0463, 0.0064] } },
  { id: 254, label: 'Rear parking sensors', short: 'PDC/R', zone: 30, group: 'adas',
    paint: false, box: { pos: [0, 0.18, 0.010], size: [1.4444, 0.0463, 0.0064] } },
  { id: 255, label: '360° camera (mirror)', short: 'CAM/360', zone: 19, group: 'adas', sides: ['L', 'R'],
    paint: false, box: { pos: [-1.05, 0.55, 0.615], size: [0.0556, 0.037, 0.0107] } },
  { id: 256, label: '360° camera (front)', short: 'CAM/FR', zone: 11, group: 'adas',
    paint: false, box: { pos: [0, 0.34, 0.980], size: [0.0556, 0.037, 0.0064] } },
  { id: 257, label: '360° camera (rear)', short: 'CAM/RR', zone: 28, group: 'adas',
    paint: false, box: { pos: [0, 0.42, 0.015], size: [0.0556, 0.037, 0.0064] } },
  { id: 258, label: 'Lidar', short: 'LIDAR', zone: 27, group: 'adas',
    paint: false, box: { pos: [0, 0.98, 0.620], size: [0.3111, 0.0556, 0.0235] },
    note: 'Roof leading edge or grille top. High-spec Lexus and BYD.' },
];

// Expand the L/R pairs into one entry per side. A paired panel keeps the same
// id — like the legacy headlights, both halves are the same part number and the
// same line — but each gets its own box so the diagram can light up the side
// that was actually hit.
function expand(list) {
  const out = [];
  for (const p of list) {
    if (!p.sides) { out.push({ ...p, side: null }); continue; }
    for (const side of p.sides) {
      const flip = side === 'R' ? -1 : 1;
      out.push({
        ...p,
        side,
        label: `${side === 'L' ? 'L/H' : 'R/H'} ${p.label.toLowerCase()}`,
        short: `${side}${p.short}`,
        box: p.box && {
          pos: [p.box.pos[0] * flip, p.box.pos[1], p.box.pos[2]],
          size: p.box.size,
        },
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Two lists, one catalogue
// ---------------------------------------------------------------------------
// PANELS is the list you *choose from*: one entry per part, because a left and
// a right mirror cap are the same part number and the same line — the side is
// recorded by which one was hit, not by inventing two catalogue entries.
//
// PANEL_BOXES is the list you *draw*: paired panels appear twice, once per
// side, so the diagram can light up the corner that was actually damaged.
//
// Keeping them apart matters: a selector built off the drawing list would show
// every pair twice and collide on the shared id.
export const PANELS = [...CORE_PANELS, ...DETAIL];
export const PANEL_BOXES = [...expand(DETAIL)];

// Real areas that aren't on the outside of the car. They still take lines —
// they're just chosen from a list instead of clicked on the body.
export const OTHER_AREAS = [
  { id: 13, label: 'Radiator support' },
  { id: 15, label: 'Engine bay' },
  { id: 16, label: 'Chassis front' },
  { id: 32, label: 'Beaver panel' },
  { id: 33, label: 'Boot floor' },
  { id: 34, label: 'Front mechanical' },
  { id: 35, label: 'Rear mechanical' },
  { id: 36, label: 'Interior' },
  { id: 37, label: 'Miscellaneous' },
  { id: 38, label: 'Truck' },
  { id: 39, label: 'Sublets' },
];

// One entry per id for label lookups. Paired panels collapse back to a single
// entry here — a line records the panel, and which side is already in the name
// of the legacy area or in the panel's own label.
const ALL = new Map();
for (const p of [...CORE_PANELS, ...DETAIL, ...OTHER_AREAS]) {
  if (!ALL.has(p.id)) ALL.set(p.id, p);
}

export const areaLabel = id => (id == null ? '' : ALL.get(Number(id))?.label || `Area ${id}`);
export const areaShort = id => (id == null ? '' : ALL.get(Number(id))?.short || ALL.get(Number(id))?.label || `#${id}`);
export const isPanel = id => ALL.has(Number(id)) && !OTHER_AREAS.some(o => o.id === Number(id));
export const areaMeta = id => (id == null ? null : ALL.get(Number(id)) || null);

// The legacy zone a panel belongs to, so a precise panel line and a coarse
// pick-list line on the same corner of the car can still be grouped together.
export const zoneOf = (id) => {
  const m = ALL.get(Number(id));
  if (!m) return null;
  return m.zone ?? m.id;
};

// Material drives repair-vs-replace more than damage size does: boron cannot be
// straightened at any price, aluminium needs an isolated bay and its own tools,
// bonded glass is a sublet.
export const MATERIALS = {
  'boron':           { label: 'Hot-stamped boron', warn: 'Replace only — cannot be straightened or heated.' },
  'aluminium':       { label: 'Aluminium',         warn: 'Isolated tooling and a separate bay.' },
  'aluminium-often': { label: 'Often aluminium',   warn: 'Check the build — many are aluminium from 2024 on.' },
  'composite':       { label: 'Composite / SMC',   warn: 'Cannot be beaten out.' },
  'glass':           { label: 'Glass',             warn: 'Usually a sublet.' },
  'glass-bonded':    { label: 'Bonded glass',      warn: 'Bonded to the body. Sublet, and often an ADAS recalibration with it.' },
};
export const materialWarning = id => MATERIALS[ALL.get(Number(id))?.material]?.warn || null;

// ---------------------------------------------------------------------------
// Body types
// ---------------------------------------------------------------------------
// `base` is the shape a body type behaves as. A named model is drawn to its
// own dimensions but panels the same way as the generic shape it belongs to,
// so nothing downstream has to learn about individual cars.
export const BODY_TYPES = [
  { key: 'sedan',  label: 'Sedan',      base: 'sedan' },
  { key: 'hatch',  label: 'Hatchback',  base: 'hatch' },
  { key: 'suv',    label: 'SUV / Wagon', base: 'suv' },
  { key: 'camry',  label: 'Camry 24',   base: 'sedan', model: true },
  { key: 'es300h', label: 'ES300h 24',  base: 'sedan', model: true },
  { key: 'kluger', label: 'Kluger 24',  base: 'suv',   model: true },
];

export const baseBody = (key) => BODY_TYPES.find(b => b.key === key)?.base || 'sedan';

const fitsBody = (p, bodyType) => !p.bodies || p.bodies.includes(baseBody(bodyType));

// Every panel on this shape of car, trim included — one entry per part, safe to
// key a list or a <select> on.
export const panelsFor = (bodyType = 'sedan') => PANELS.filter(p => fitsBody(p, bodyType));

// The same set expanded per side, for anything drawing the car.
export const panelBoxesFor = (bodyType = 'sedan') => PANEL_BOXES.filter(p => fitsBody(p, bodyType));

// Just the main body panels — the nineteen legacy zones. For anywhere the full
// catalogue would be noise rather than detail.
export const corePanelsFor = (bodyType = 'sedan') => CORE_PANELS.filter(p => fitsBody(p, bodyType));

export const panelsByGroup = (bodyType = 'sedan') => {
  const groups = ['front', 'side', 'roof', 'glass', 'rear', 'adas'];
  const labels = {
    front: 'Front', side: 'Sides', roof: 'Roof & pillars',
    glass: 'Glass', rear: 'Rear', adas: 'ADAS sensors',
  };
  const all = panelsFor(bodyType);
  return groups
    .map(g => ({ key: g, label: labels[g], panels: all.filter(p => (p.group || 'front') === g) }))
    .filter(g => g.panels.length);
};

// vehicles.body_type is free text — an import, a rego lookup or something an
// estimator typed. Map whatever's there onto a shape we can draw, and fall back
// to a sedan rather than refusing to show a diagram at all.
const BODY_HINTS = [
  [/\b(suv|wagon|estate|4wd|awd|van|ute|truck|cab)\b/i, 'suv'],
  [/\b(hatch|hatchback|liftback|5\s*door|3\s*door)\b/i, 'hatch'],
  [/\b(sedan|saloon|coupe|convertible|4\s*door)\b/i,    'sedan'],
];

// Cars we have a dimensioned model for. Matched against make and model, so a
// quote on a Camry opens on the Camry rather than on a generic sedan.
const MODEL_HINTS = [
  [/\bcamry\b/i, 'camry'],
  [/\bes\s*-?\s*300\s*h?\b/i, 'es300h'],
  [/\b(kluger|highlander)\b/i, 'kluger'],
];

export function normaliseBodyType(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  if (BODY_TYPES.some(b => b.key === s)) return s;
  for (const [re, key] of MODEL_HINTS) if (re.test(s)) return key;
  for (const [re, key] of BODY_HINTS) if (re.test(s)) return key;
  return null;
}

// What to draw for a vehicle. Its make and model win over its body type: both
// say "sedan", but only one of them says which sedan.
export function bodyTypeForVehicle(vehicle) {
  const name = [vehicle?.make, vehicle?.model].filter(Boolean).join(' ');
  for (const [re, key] of MODEL_HINTS) if (re.test(name)) return key;
  return normaliseBodyType(vehicle?.body_type);
}

// ---------------------------------------------------------------------------
// What's been done to each panel
// ---------------------------------------------------------------------------
// Derived from the line items, never stored separately. The diagram is a view
// of the estimate: colour a panel and you're reading the lines on it, so the
// two can't drift apart.
export const OPS = [
  { key: 'part',   label: 'Replace', color: '#f87171' },
  { key: 'repair', label: 'Repair',  color: '#fbbf24' },
  { key: 'paint',  label: 'Paint',   color: '#22d3ee' },
  { key: 'rr',     label: 'R&R',     color: '#a78bfa' },
];

export const OP_ORDER = OPS.map(o => o.key);
export const opColor = key => OPS.find(o => o.key === key)?.color || '#2f3a55';

// { [areaId]: Set of section keys present on that panel }
export function panelOps(lines = []) {
  const map = new Map();
  for (const l of lines) {
    const id = Number(l.area_id);
    if (!Number.isFinite(id) || !l.area_id) continue;
    if (!map.has(id)) map.set(id, new Set());
    map.get(id).add(l.line_type);
  }
  return map;
}

// The one colour a panel is drawn in: the most significant thing happening to
// it. The full set is listed beside the diagram, so nothing is hidden by this.
export function primaryOp(ops) {
  if (!ops) return null;
  return OP_ORDER.find(k => ops.has(k)) || null;
}
