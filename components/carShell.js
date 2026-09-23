// The shape of a car, as a surface.
//
// The previous version of this file stacked rounded boxes into something
// car-shaped. It read as a toy. This builds the body the way a body actually
// is: one continuous skin, lofted along the length of the car, then cut into
// panels. Panels share their edges, so the shading runs across a door gap the
// way it does on a real car, and the gaps themselves are drawn as shut lines.
//
// No imports on purpose — scripts/car-preview.mjs renders this in plain node
// to check the proportions without a browser.
//
// Axes: +X is the right-hand side of the car, +Y is up, +Z is the front.
// Units are metres, life-sized.

// ---------------------------------------------------------------------------
// Profiles
// ---------------------------------------------------------------------------
// Each body type is four curves down the length of the car —
//
//   top     the upper silhouette: nose, bonnet, screen, roof, back
//   belt    the waistline, where the glass starts
//   floor   the underbody at the centreline
//   rocker  the lower edge at the flank, before the wheel arches cut into it
//   width   half the body width
//
// — plus the z positions of the panel joins. Everything else is derived, so
// changing one number moves the whole car in proportion instead of leaving a
// box behind in the old place.

export const PROFILES = {
  sedan: {
    base: 'sedan',
    label: 'Sedan',
    // Legacy fields: lib/panels.js places its detail boxes in unit car space
    // and needs these to scale them. Keep in step with the curves below.
    halfWidth: 0.90, wheelR: 0.34, zFront: 2.34, zRear: -2.34,
    sillY: 0.30, beltY: 1.04, roofY: 1.465,

    axles: [1.60, -1.22],
    archR: 1.13,                     // wheel arch radius, as a multiple of wheelR
    top: [
      [-2.34, 0.960], [-2.30, 1.045], [-2.20, 1.095], [-2.05, 1.118], [-1.90, 1.125],
      [-1.45, 1.145], [-1.20, 1.180], [-1.02, 1.300], [-0.78, 1.420], [-0.45, 1.455],
      [0.10, 1.465], [0.55, 1.445], [0.80, 1.340], [1.02, 1.170], [1.20, 1.055],
      [1.60, 1.035], [2.00, 1.005], [2.20, 0.975], [2.30, 0.915], [2.34, 0.855],
    ],
    belt: [
      [-2.34, 0.945], [-2.28, 0.990], [-2.10, 1.038], [-1.60, 1.048], [-1.20, 1.032],
      [-0.40, 1.040], [0.40, 1.050], [1.00, 1.040], [1.20, 1.030], [1.70, 1.000],
      [2.08, 0.970], [2.26, 0.905], [2.34, 0.845],
    ],
    floor: [
      [-2.34, 0.490], [-2.24, 0.400], [-2.05, 0.315], [-1.60, 0.270], [0, 0.225],
      [1.60, 0.270], [2.05, 0.315], [2.24, 0.400], [2.34, 0.490],
    ],
    rocker: [
      [-2.34, 0.490], [-2.22, 0.400], [-2.00, 0.330], [-1.50, 0.305], [0, 0.290],
      [1.50, 0.305], [2.00, 0.330], [2.22, 0.400], [2.34, 0.490],
    ],
    width: [
      [-2.34, 0.755], [-2.31, 0.805], [-2.22, 0.845], [-2.05, 0.868], [-1.60, 0.878],
      [-0.20, 0.900], [1.00, 0.895], [1.60, 0.878], [2.05, 0.868], [2.22, 0.845],
      [2.31, 0.805], [2.34, 0.755],
    ],
    // Panel joins, front to back.
    noseBackZ: 2.02,                 // bonnet leading edge / top of the front bar
    cowlZ: 1.18,                     // base of the windscreen
    headerZ: 0.55,                   // top of the windscreen
    guardBackZ: 0.66,                // front door leading edge
    bDoorSplitZ: -0.30,              // B pillar
    rearDoorBackZ: -1.24,            // C pillar
    roofBackZ: -0.55,                // back of the roof panel
    backlightBaseZ: -1.18,           // bottom of the rear glass
    tailZ: -2.02,                    // front face of the rear bar
    closure: 29,                     // BOOTLID
  },

  hatch: {
    base: 'hatch',
    label: 'Hatchback',
    halfWidth: 0.885, wheelR: 0.325, zFront: 2.02, zRear: -2.02,
    sillY: 0.30, beltY: 1.05, roofY: 1.485,

    axles: [1.36, -1.24],
    archR: 1.14,
    top: [
      [-2.02, 0.980], [-1.99, 1.050], [-1.92, 1.160], [-1.80, 1.300], [-1.62, 1.415],
      [-1.45, 1.462], [-1.10, 1.482], [-0.60, 1.485], [0.20, 1.480], [0.50, 1.455],
      [0.75, 1.330], [0.95, 1.160],
      [1.12, 1.045], [1.45, 1.035], [1.80, 1.005], [1.90, 0.975], [1.98, 0.915],
      [2.02, 0.855],
    ],
    belt: [
      [-2.02, 0.900], [-1.97, 0.950], [-1.82, 1.000], [-1.50, 1.020], [-0.50, 1.040],
      [0.40, 1.050], [1.00, 1.040], [1.60, 1.005], [1.84, 0.970], [1.96, 0.905],
      [2.02, 0.845],
    ],
    floor: [
      [-2.02, 0.490], [-1.93, 0.400], [-1.72, 0.315], [-1.40, 0.270], [0, 0.225],
      [1.40, 0.270], [1.76, 0.315], [1.93, 0.400], [2.02, 0.490],
    ],
    rocker: [
      [-2.02, 0.490], [-1.91, 0.400], [-1.70, 0.330], [-1.35, 0.305], [0, 0.290],
      [1.35, 0.305], [1.72, 0.330], [1.91, 0.400], [2.02, 0.490],
    ],
    width: [
      [-2.02, 0.742], [-1.99, 0.792], [-1.92, 0.832], [-1.72, 0.860], [-1.30, 0.875],
      [-0.10, 0.885], [1.00, 0.880], [1.50, 0.865], [1.78, 0.855], [1.92, 0.832],
      [1.99, 0.792], [2.02, 0.742],
    ],
    noseBackZ: 1.78,
    cowlZ: 1.10,
    headerZ: 0.48,
    guardBackZ: 0.60,
    bDoorSplitZ: -0.32,
    rearDoorBackZ: -1.20,
    roofBackZ: -1.38,
    backlightBaseZ: -1.88,
    tailZ: -1.94,
    closure: 28,                     // TAILGATE
  },

  suv: {
    base: 'suv',
    label: 'SUV / Wagon',
    halfWidth: 0.955, wheelR: 0.400, zFront: 2.38, zRear: -2.38,
    sillY: 0.40, beltY: 1.27, roofY: 1.825,

    axles: [1.60, -1.26],
    archR: 1.12,
    top: [
      [-2.38, 1.400], [-2.33, 1.560], [-2.24, 1.670], [-2.04, 1.770], [-1.75, 1.808],
      [-1.20, 1.820], [-0.20, 1.825], [0.55, 1.810], [0.80, 1.760], [1.00, 1.600],
      [1.20, 1.420], [1.38, 1.305], [1.80, 1.290], [2.13, 1.260], [2.26, 1.195],
      [2.38, 1.090],
    ],
    belt: [
      [-2.38, 1.060], [-2.32, 1.125], [-2.12, 1.200], [-1.80, 1.250], [-0.80, 1.262],
      [0.40, 1.270], [1.10, 1.270], [1.38, 1.262], [1.90, 1.235], [2.16, 1.195],
      [2.32, 1.115], [2.38, 1.055],
    ],
    floor: [
      [-2.38, 0.615], [-2.28, 0.515], [-2.10, 0.420], [-1.70, 0.370], [0, 0.325],
      [1.70, 0.370], [2.10, 0.420], [2.28, 0.515], [2.38, 0.615],
    ],
    rocker: [
      [-2.38, 0.615], [-2.26, 0.515], [-2.05, 0.435], [-1.60, 0.405], [0, 0.390],
      [1.60, 0.405], [2.05, 0.435], [2.26, 0.515], [2.38, 0.615],
    ],
    width: [
      [-2.38, 0.810], [-2.35, 0.860], [-2.26, 0.900], [-2.08, 0.925], [-1.50, 0.945],
      [-0.20, 0.955], [1.00, 0.950], [1.60, 0.935], [2.08, 0.925], [2.26, 0.900],
      [2.35, 0.860], [2.38, 0.810],
    ],
    noseBackZ: 2.10,
    cowlZ: 1.36,
    headerZ: 0.56,
    guardBackZ: 0.74,
    bDoorSplitZ: -0.28,
    rearDoorBackZ: -1.32,
    roofBackZ: -1.72,
    backlightBaseZ: -2.16,
    tailZ: -2.26,
    closure: 28,
  },
};

// ---------------------------------------------------------------------------
// Named models
// ---------------------------------------------------------------------------
// Same curves, dimensioned to a specific car. Length, width, height, wheelbase,
// overhangs and rolling radius are the published figures; the surfacing between
// those points is drawn to each car's proportions, not traced from CAD, so read
// these as "a Camry-shaped car at Camry dimensions" rather than a replica.
//
//   Camry (XV70, 2024)     4885 x 1840 x 1445, WB 2825, 235/45R18
//   Lexus ES300h (XZ10)    4975 x 1865 x 1445, WB 2870, 235/45R18
//   Kluger (XU70, 2024)    4966 x 1930 x 1755, WB 2850, 235/55R20

PROFILES.camry = {
  label: 'Camry 2024', base: 'sedan',
  halfWidth: 0.920, wheelR: 0.334, zFront: 2.4425, zRear: -2.4425,
  sillY: 0.27, beltY: 1.08, roofY: 1.445,
  axles: [1.4675, -1.3575],          // 2825 wheelbase, 975 / 1085 overhangs
  archR: 1.10,                       // the arches sit close on the tyres
  grilleH: 0.62,                     // the XV70 grille is most of the face
  // Traced off reference photographs of an XV70, not invented: a high waist
  // with a kick over the rear wheel, a roof that peaks forward of centre and
  // falls away, a short boot deck ending in a lip, and a bonnet that drops
  // steeply to the nose.
  top: [
    [-2.4425, 1.0894], [-2.38, 1.1390], [-2.26, 1.1667], [-2.05, 1.1806],
    [-1.8, 1.1885], [-1.55, 1.2004], [-1.42, 1.2202], [-1.2, 1.2875],
    [-0.95, 1.3687], [-0.75, 1.4103], [-0.35, 1.4311], [0.1, 1.4287],
    [0.3, 1.4163], [0.55, 1.3469], [0.8, 1.2400], [0.95, 1.1508],
    [1.3, 1.1192], [1.75, 1.0746], [2.05, 1.0102], [2.22, 0.9409],
    [2.34, 0.8716], [2.4425, 0.7923],
  ],
  belt: [
    [-2.4425, 1.030], [-2.34, 1.062], [-2.16, 1.088], [-1.9, 1.108],
    [-1.55, 1.100], [-1.2, 1.084], [-0.6, 1.074], [0.1, 1.076],
    [0.6, 1.084], [0.95, 1.104], [1.3, 1.098], [1.75, 1.050],
    [2.05, 0.985], [2.22, 0.925], [2.34, 0.858], [2.4425, 0.775],
  ],
  floor: [
    [-2.4425, 0.470], [-2.30, 0.390], [-2.05, 0.300], [-1.60, 0.245],
    [0, 0.205], [1.60, 0.245], [2.05, 0.310], [2.30, 0.405], [2.4425, 0.500],
  ],
  rocker: [
    [-2.4425, 0.470], [-2.28, 0.385], [-2.00, 0.318], [-1.50, 0.288],
    [0, 0.272], [1.50, 0.288], [2.00, 0.325], [2.28, 0.400], [2.4425, 0.500],
  ],
  width: [
    [-2.4425, 0.740], [-2.36, 0.800], [-2.22, 0.850], [-2.00, 0.882],
    [-1.55, 0.898], [-0.20, 0.905], [1.00, 0.900], [1.55, 0.886],
    [2.00, 0.866], [2.18, 0.842], [2.32, 0.790], [2.4425, 0.700],
  ],
  noseBackZ: 2.06, cowlZ: 0.95, headerZ: 0.30, guardBackZ: 0.62,
  bDoorSplitZ: -0.34, rearDoorBackZ: -1.30, roofBackZ: -0.75,
  backlightBaseZ: -1.42, tailZ: -2.06, closure: 29,
};


PROFILES.es300h = {
  label: 'Lexus ES300h 2024', base: 'sedan',
  halfWidth: 0.9325, wheelR: 0.334, zFront: 2.4875, zRear: -2.4875,
  sillY: 0.27, beltY: 1.03, roofY: 1.445,
  axles: [1.4875, -1.3825],          // 2870 wheelbase, 1000 / 1105 overhangs
  archR: 1.13,
  grilleH: 0.66,                     // the spindle grille runs most of the face
  top: [
    [-2.4875, 0.9402], [-2.44, 1.0194], [-2.32, 1.0739], [-2.12, 1.1006], [-1.88, 1.1144],
    [-1.52, 1.1303], [-1.30, 1.1629], [-1.10, 1.2817], [-0.88, 1.3807], [-0.50, 1.4212],
    [0.02, 1.4302], [0.46, 1.4133], [0.72, 1.3114], [0.95, 1.1481], [1.14, 1.0372],
    [1.55, 1.0174], [2.00, 0.9858], [2.26, 0.9422], [2.40, 0.8769], [2.4875, 0.8066],
  ],
  belt: [
    [-2.4875, 0.925], [-2.40, 0.972], [-2.20, 1.018], [-1.72, 1.038], [-1.30, 1.022],
    [-0.45, 1.028], [0.35, 1.038], [1.02, 1.028], [1.24, 1.016], [1.74, 0.986],
    [2.18, 0.950], [2.40, 0.882], [2.4875, 0.808],
  ],
  floor: [
    [-2.4875, 0.470], [-2.36, 0.380], [-2.12, 0.302], [-1.62, 0.250], [0, 0.208],
    [1.62, 0.250], [2.12, 0.302], [2.36, 0.380], [2.4875, 0.470],
  ],
  rocker: [
    [-2.4875, 0.470], [-2.34, 0.382], [-2.08, 0.318], [-1.52, 0.290], [0, 0.274],
    [1.52, 0.290], [2.08, 0.318], [2.34, 0.382], [2.4875, 0.470],
  ],
  width: [
    [-2.4875, 0.7599], [-2.45, 0.8113], [-2.34, 0.8568], [-2.12, 0.8885], [-1.62, 0.9003],
    [-0.20, 0.9226], [1.00, 0.9182], [1.62, 0.9003], [2.12, 0.8885], [2.34, 0.8568],
    [2.45, 0.8113], [2.4875, 0.7599],
  ],
  noseBackZ: 2.14, cowlZ: 1.14, headerZ: 0.46, guardBackZ: 0.62,
  bDoorSplitZ: -0.36, rearDoorBackZ: -1.36, roofBackZ: -0.58,
  backlightBaseZ: -1.30, tailZ: -2.14, closure: 29,
};

PROFILES.kluger = {
  label: 'Kluger 2024', base: 'suv',
  halfWidth: 0.965, wheelR: 0.383, zFront: 2.483, zRear: -2.483,
  sillY: 0.37, beltY: 1.22, roofY: 1.735,
  axles: [1.483, -1.367],            // 2850 wheelbase, 1000 / 1116 overhangs
  archR: 1.13,
  grilleH: 0.50,
  top: [
    [-2.483, 1.3855], [-2.44, 1.5361], [-2.34, 1.6365], [-2.12, 1.7068], [-1.80, 1.7289],
    [-1.20, 1.7409], [-0.20, 1.7419], [0.50, 1.7289], [0.78, 1.6867], [1.00, 1.5462],
    [1.22, 1.3855], [1.42, 1.2771], [1.85, 1.2630], [2.20, 1.2309], [2.36, 1.1646],
    [2.483, 1.0642],
  ],
  belt: [
    [-2.483, 1.040], [-2.42, 1.100], [-2.22, 1.170], [-1.85, 1.205], [-0.80, 1.218],
    [0.40, 1.228], [1.10, 1.228], [1.42, 1.220], [1.92, 1.196], [2.22, 1.155],
    [2.40, 1.080], [2.483, 1.020],
  ],
  floor: [
    [-2.483, 0.580], [-2.36, 0.480], [-2.12, 0.400], [-1.70, 0.348], [0, 0.302],
    [1.70, 0.348], [2.12, 0.400], [2.36, 0.480], [2.483, 0.580],
  ],
  rocker: [
    [-2.483, 0.580], [-2.34, 0.482], [-2.08, 0.412], [-1.60, 0.384], [0, 0.368],
    [1.60, 0.384], [2.08, 0.412], [2.34, 0.482], [2.483, 0.580],
  ],
  width: [
    [-2.483, 0.7914], [-2.45, 0.8428], [-2.34, 0.8883], [-2.12, 0.9200], [-1.55, 0.9398],
    [-0.20, 0.9546], [1.00, 0.9497], [1.60, 0.9338], [2.12, 0.9200], [2.34, 0.8883],
    [2.45, 0.8428], [2.483, 0.7914],
  ],
  noseBackZ: 2.16, cowlZ: 1.40, headerZ: 0.52, guardBackZ: 0.76,
  bDoorSplitZ: -0.30, rearDoorBackZ: -1.38, roofBackZ: -1.80,
  backlightBaseZ: -2.26, tailZ: -2.34, closure: 28,
};

// ---------------------------------------------------------------------------
// Curves
// ---------------------------------------------------------------------------

// Shape-preserving cubic interpolation (PCHIP). A plain spline overshoots, and
// an overshoot on a roofline shows up as a bubble over the driver's head.
function curve(points) {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const n = xs.length;
  const h = [], d = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(xs[i + 1] - xs[i]);
    d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  }
  // Fritsch-Carlson slopes: zero at every local extreme, so the curve can
  // never rise above a control point that both neighbours sit below.
  const m = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const w1 = 2 * h[i] + h[i - 1];
    const w2 = h[i] + 2 * h[i - 1];
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
    return ys[i] * (2 * t3 - 3 * t2 + 1)
      + h[i] * m[i] * (t3 - 2 * t2 + t)
      + ys[i + 1] * (-2 * t3 + 3 * t2)
      + h[i] * m[i + 1] * (t3 - t2);
  };
}

// Centripetal Catmull-Rom through one segment of the cross-section ring.
// Centripetal rather than uniform because uniform loops on itself where the
// control points bunch up, which happens on every bonnet (the greenhouse
// collapses to nothing there).
function crPoint(p0, p1, p2, p3, t) {
  const knot = (ti, a, b) => ti + Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])) || ti + 1e-6;
  const t0 = 0, t1 = knot(t0, p0, p1), t2 = knot(t1, p1, p2), t3 = knot(t2, p2, p3);
  const x = t1 + (t2 - t1) * t;
  const at = (a, b, ta, tb) => {
    if (tb - ta < 1e-9) return [a[0], a[1]];
    const w = (x - ta) / (tb - ta);
    return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
  };
  const A1 = at(p0, p1, t0, t1), A2 = at(p1, p2, t1, t2), A3 = at(p2, p3, t2, t3);
  const B1 = at(A1, A2, t0, t2), B2 = at(A2, A3, t1, t3);
  return at(B1, B2, t1, t2);
}

// ---------------------------------------------------------------------------
// The cross-section ring
// ---------------------------------------------------------------------------
// Eight control points up one side of the car, mirrored to close the ring.
// Each gap between them is a named band, and every station is sampled the same
// way — so vertex 41 is on the side glass at every point along the car, and a
// panel edge lands on the same ring index the whole way down. That is what
// keeps the shut lines straight instead of stepping in and out by a vertex.
const BANDS = [
  ['floor', 3], ['floorEdge', 4], ['lower', 5],
  ['flankLow', 4], ['flankHigh', 4],
  ['shoulder', 3], ['upper', 6], ['crown', 7],
];

const RING = (() => {
  const band = [], side = [];
  for (const [name, k] of BANDS) {
    for (let i = 0; i < k; i++) { band.push(name); side.push(1); }
  }
  const half = band.length;
  // Mirrored half, walked back down the other side.
  for (let i = BANDS.length - 1; i >= 0; i--) {
    const [name, k] = BANDS[i];
    for (let j = 0; j < k; j++) { band.push(name); side.push(-1); }
  }
  return { band, side, half, n: band.length };
})();

// Control points for one station, bottom centre to top centre.
function sectionControls(hw, hwRoof, yFloor, yRock, yBelt, yTop, flare = 0) {
  const gh = Math.max(yTop - yBelt, 0.012);
  // Over an axle the body stands a little proud of itself — the arch flare.
  // Without it the wheel openings read as holes punched in a smooth tube.
  const lw = hw * (1 + 0.020 * flare);
  const dy = yBelt - yRock;
  // The break between the two flank points is the character line: every panel
  // on a modern car has one, and a flank without it is the main thing that
  // makes a render look inflated.
  return [
    [0.000 * hw, yFloor],
    [0.640 * hw, yFloor + 0.004],
    [0.955 * lw, yRock],
    [0.994 * lw, yRock + dy * 0.30],
    [1.000 * lw, yRock + dy * 0.60],
    [0.982 * hw, yBelt],
    [1.000 * hwRoof, yBelt + gh * 0.18],
    [0.900 * hwRoof, yBelt + gh * 0.90],
    [0.000, yTop],
  ];
}

function ringAt(hw, hwRoof, yFloor, yRock, yBelt, yTop, flare) {
  const h = sectionControls(hw, hwRoof, yFloor, yRock, yBelt, yTop, flare);
  // Close the ring: up the right side, across the roof, down the left.
  const ctrl = h.concat(h.slice(1, -1).reverse().map(p => [-p[0], p[1]]));
  const n = ctrl.length;
  const out = [];
  for (let s = 0; s < n; s++) {
    const k = s < BANDS.length ? BANDS[s][1] : BANDS[n - 1 - s][1];
    const p0 = ctrl[(s - 1 + n) % n], p1 = ctrl[s], p2 = ctrl[(s + 1) % n], p3 = ctrl[(s + 2) % n];
    for (let i = 0; i < k; i++) out.push(crPoint(p0, p1, p2, p3, i / k));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Which panel is this bit of skin?
// ---------------------------------------------------------------------------
// Everything above is shape. This is the part that has to agree with the pick
// list: every triangle gets the area id an estimator would write on it, or no
// id at all if it is glass or underbody.
const L = { guard: 17, door: 19, rdoor: 21, side: 23, qtr: 25 };
const R = { guard: 18, door: 20, rdoor: 22, side: 24, qtr: 26 };

function classify(P, band, side, cap, x, y, z, yBelt, yRock) {
  const S = side < 0 ? L : R;
  const isFlank = band === 'flankLow' || band === 'flankHigh';
  const HW = P.halfWidth;
  const ax = Math.abs(x);
  const paint = (area) => ({ area, kind: 'paint' });
  const glass = { area: null, kind: 'glass' };

  // The flat face at each end of the car. It is one panel: the lamps and the
  // grille are separate parts set into it (see `props` below) rather than
  // carved out of the surface, because the fan that closes the ring radiates
  // from the middle and would cut them into wedges.
  if (cap) return paint(cap === 'front' ? 10 : 30);

  // Bumpers wrap right under the car, so they come before the underbody rule.
  if (z >= P.noseBackZ) return paint(10);
  if (z <= P.tailZ) return paint(30);
  if (band === 'floor' || band === 'floorEdge') return { area: null, kind: 'under' };

  // Sides, sill to waist.
  if (band === 'lower' || isFlank) {
    if (band === 'lower' && z < P.guardBackZ && z >= P.rearDoorBackZ) return paint(S.side);
    if (z >= P.guardBackZ) return paint(S.guard);
    if (z >= P.bDoorSplitZ) return paint(S.door);
    if (z >= P.rearDoorBackZ) return paint(S.rdoor);
    return paint(S.qtr);
  }

  // Bonnet and nose top.
  if (z >= P.cowlZ) return paint(14);

  // Windscreen and the A pillars either side of it.
  if (z >= P.headerZ) {
    if (band === 'shoulder') return ax > 0.55 * HW ? paint(S.side) : glass;
    return ax > 0.58 * HW && band === 'upper' ? paint(S.side) : glass;
  }

  // The cabin: roof on top, side glass down the flanks, pillars between.
  if (z >= P.roofBackZ) {
    if (band === 'crown') return paint(27);
    if (band === 'shoulder') {
      // The waist band is part of whichever door or quarter it runs along.
      if (z >= P.bDoorSplitZ) return paint(S.door);
      if (z >= P.rearDoorBackZ) return paint(S.rdoor);
      return paint(S.qtr);
    }
    // Black B pillar: still the body side on a quote, just not body colour.
    if (Math.abs(z - P.bDoorSplitZ) < 0.055) return { area: S.side, kind: 'trim' };
    if (z < P.rearDoorBackZ) return paint(S.qtr);                     // C pillar
    return glass;
  }

  // Behind the cabin. A sedan has a rear window, then a separate bootlid; a
  // hatch and an SUV have one tailgate with the glass set into it.
  if (P.closure === 29) {
    if (band === 'crown') return z >= P.backlightBaseZ ? glass : paint(29);
    if (z >= P.backlightBaseZ) return ax > 0.58 * HW ? paint(S.qtr) : glass;
    return ax < 0.72 * HW ? paint(29) : paint(S.qtr);
  }
  if (band === 'crown') return paint(P.closure);
  if (band === 'upper' && z >= P.backlightBaseZ && ax < 0.66 * HW) return glass;
  return ax < 0.72 * HW ? paint(P.closure) : paint(S.qtr);
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

const STATIONS = 108;

function stationList(P) {
  const zs = new Set();
  for (let i = 0; i <= STATIONS; i++) {
    zs.add(P.zRear + (P.zFront - P.zRear) * (i / STATIONS));
  }
  // Force a station exactly on every panel join and either side of it, or a
  // door gap lands wherever the uniform sampling happened to fall and steps.
  const joins = [P.noseBackZ, P.cowlZ, P.headerZ, P.guardBackZ, P.bDoorSplitZ,
    P.rearDoorBackZ, P.roofBackZ, P.backlightBaseZ, P.tailZ];
  for (const j of joins) { zs.add(j); zs.add(j - 0.006); zs.add(j + 0.006); }
  for (const a of P.axles) {
    const r = P.wheelR * P.archR;
    zs.add(a - r); zs.add(a + r); zs.add(a);
  }
  const list = [...zs].filter(z => z >= P.zRear && z <= P.zFront).sort((a, b) => a - b);
  // Drop anything that landed on top of a join.
  return list.filter((z, i) => i === 0 || z - list[i - 1] > 0.0025);
}

/**
 * The whole car as renderable data.
 *
 * Returns groups of triangles keyed by material and panel area, the shut lines
 * between them, and the wheels and mirrors that hang off the body. Nothing in
 * here knows about three.js — CarDiagram turns it into meshes.
 */
export function buildCarShell(bodyType) {
  const P = PROFILES[bodyType] || PROFILES.sedan;
  const topF = curve(P.top), beltF = curve(P.belt), floorF = curve(P.floor);
  const rockF = curve(P.rocker), widthF = curve(P.width);
  const archR = P.wheelR * P.archR;

  const zs = stationList(P);
  const S = zs.length, N = RING.n;

  // --- Vertices ------------------------------------------------------------
  const pos = new Float32Array(S * N * 3);
  const meta = new Array(S);                 // per-station scalars the classifier needs
  for (let i = 0; i < S; i++) {
    const z = zs[i];
    const yTop = topF(z);
    let yBelt = Math.min(beltF(z), yTop - 0.012);
    const yFloor = floorF(z);
    // The arches are cut out of the rocker line rather than modelled as holes:
    // over an axle the bottom edge of the body is the arch.
    let arch = 0, flare = 0;
    for (const a of P.axles) {
      const dz = z - a;
      if (Math.abs(dz) < archR * 1.35) {
        flare = Math.max(flare, Math.cos((dz / (archR * 1.35)) * Math.PI / 2) ** 2);
      }
      if (Math.abs(dz) < archR) arch = Math.max(arch, P.wheelR + Math.sqrt(archR * archR - dz * dz) * 0.92);
    }
    const yRock = Math.min(Math.max(rockF(z), arch), yBelt - 0.055);
    const hw = widthF(z);
    // The greenhouse tucks in above the waist — the tumblehome. Only where
    // there is a greenhouse at all; over the bonnet this has to stay at 1.
    const cabin = Math.max(0, Math.min(1, (yTop - yBelt) / 0.30));
    const hwRoof = hw * (1 - 0.21 * cabin);

    const ring = ringAt(hw, hwRoof, yFloor, yRock, yBelt, yTop, flare);
    for (let j = 0; j < N; j++) {
      const o = (i * N + j) * 3;
      pos[o] = ring[j][0]; pos[o + 1] = ring[j][1]; pos[o + 2] = z;
    }
    meta[i] = { z, yBelt, yRock };
  }

  // --- Triangles, tagged with the panel they belong to ----------------------
  const tris = [];                            // [a, b, c, key]
  const keyOf = new Map();                    // key -> { area, kind }
  const quadKey = new Array((S - 1) * N);

  for (let i = 0; i < S - 1; i++) {
    for (let j = 0; j < N; j++) {
      const j2 = (j + 1) % N;
      const a = i * N + j, b = i * N + j2, c = (i + 1) * N + j2, d = (i + 1) * N + j;
      const cx = (pos[a * 3] + pos[b * 3] + pos[c * 3] + pos[d * 3]) / 4;
      const cy = (pos[a * 3 + 1] + pos[b * 3 + 1] + pos[c * 3 + 1] + pos[d * 3 + 1]) / 4;
      const cz = (meta[i].z + meta[i + 1].z) / 2;
      const g = classify(P, RING.band[j], RING.side[j], null, cx, cy, cz,
        (meta[i].yBelt + meta[i + 1].yBelt) / 2, (meta[i].yRock + meta[i + 1].yRock) / 2);
      const key = `${g.kind}:${g.area ?? 'x'}`;
      if (!keyOf.has(key)) keyOf.set(key, g);
      quadKey[i * N + j] = key;
      tris.push(a, b, c, key, a, c, d, key);
    }
  }

  // --- End caps ------------------------------------------------------------
  // Flat faces at the nose and the tail. Fanned to the middle of the ring
  // rather than smoothed into the body, so the front of the bumper keeps a
  // crisp edge instead of melting into the guards.
  // The cap gets its own copies of the ring vertices. Sharing them would drag
  // the body's smooth normals round to face forwards, which turned the nose
  // into a starburst of facets.
  const extra = [];
  const capTris = [];
  const capCentre = (i) => {
    let x = 0, y = 0;
    for (let j = 0; j < N; j++) { x += pos[(i * N + j) * 3]; y += pos[(i * N + j) * 3 + 1]; }
    return [x / N, y / N, zs[i]];
  };
  for (const [i, front] of [[0, false], [S - 1, true]]) {
    const c = capCentre(i);
    const base = S * N + extra.length / 3;
    extra.push(c[0], c[1], c[2]);
    for (let j = 0; j < N; j++) {
      extra.push(pos[(i * N + j) * 3], pos[(i * N + j) * 3 + 1], pos[(i * N + j) * 3 + 2]);
    }
    for (let j = 0; j < N; j++) {
      const a = base + 1 + j, b = base + 1 + (j + 1) % N;
      const mx = (pos[(i * N + j) * 3] + pos[(i * N + (j + 1) % N) * 3] + c[0]) / 3;
      const my = (pos[(i * N + j) * 3 + 1] + pos[(i * N + (j + 1) % N) * 3 + 1] + c[1]) / 3;
      const g = classify(P, RING.band[j], RING.side[j], front ? 'front' : 'rear', mx, my,
        front ? P.zFront + 0.01 : P.zRear - 0.01, meta[i].yBelt, meta[i].yRock);
      const key = `${g.kind}:${g.area ?? 'x'}`;
      if (!keyOf.has(key)) keyOf.set(key, g);
      if (front) capTris.push(a, b, base, key);
      else capTris.push(b, a, base, key);
    }
  }

  const allPos = new Float32Array(pos.length + extra.length);
  allPos.set(pos, 0);
  allPos.set(extra, pos.length);

  // --- Normals -------------------------------------------------------------
  // Averaged over the whole skin before it is split, so the shading is
  // continuous across a panel join. Split first and every door would have its
  // own hard edge.
  const nrm = new Float32Array(allPos.length);
  for (let t = 0; t < tris.length; t += 4) {
    const a = tris[t] * 3, b = tris[t + 1] * 3, c = tris[t + 2] * 3;
    const ux = allPos[b] - allPos[a], uy = allPos[b + 1] - allPos[a + 1], uz = allPos[b + 2] - allPos[a + 2];
    const vx = allPos[c] - allPos[a], vy = allPos[c + 1] - allPos[a + 1], vz = allPos[c + 2] - allPos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const o of [a, b, c]) { nrm[o] += nx; nrm[o + 1] += ny; nrm[o + 2] += nz; }
  }
  for (let o = 0; o < nrm.length; o += 3) {
    const l = Math.hypot(nrm[o], nrm[o + 1], nrm[o + 2]) || 1;
    nrm[o] /= l; nrm[o + 1] /= l; nrm[o + 2] /= l;
  }
  // Caps face straight out. A flat face and a hard edge, like a bumper.
  for (let v = S * N; v < allPos.length / 3; v++) {
    nrm[v * 3] = 0; nrm[v * 3 + 1] = 0;
    nrm[v * 3 + 2] = allPos[v * 3 + 2] > 0 ? 1 : -1;
  }
  tris.push(...capTris);

  // --- Split into one mesh per panel ---------------------------------------
  const groups = new Map();
  for (let t = 0; t < tris.length; t += 4) {
    const key = tris[t + 3];
    let g = groups.get(key);
    if (!g) {
      const m = keyOf.get(key);
      g = { area: m.area, kind: m.kind, remap: new Map(), position: [], normal: [], index: [] };
      groups.set(key, g);
    }
    for (let k = 0; k < 3; k++) {
      const v = tris[t + k];
      let idx = g.remap.get(v);
      if (idx === undefined) {
        idx = g.position.length / 3;
        g.remap.set(v, idx);
        g.position.push(allPos[v * 3], allPos[v * 3 + 1], allPos[v * 3 + 2]);
        g.normal.push(nrm[v * 3], nrm[v * 3 + 1], nrm[v * 3 + 2]);
      }
      g.index.push(idx);
    }
  }

  // --- Shut lines ----------------------------------------------------------
  // Where two different panels meet, that join is a gap you can see from ten
  // metres away. Drawn as lines on the surface, lifted just off it.
  const lines = [];
  const edge = (a, b) => {
    for (const v of [a, b]) {
      lines.push(
        allPos[v * 3] + nrm[v * 3] * 0.006,
        allPos[v * 3 + 1] + nrm[v * 3 + 1] * 0.006,
        allPos[v * 3 + 2] + nrm[v * 3 + 2] * 0.006,
      );
    }
  };
  const drawn = (k) => k && !k.startsWith('under');
  for (let i = 0; i < S - 1; i++) {
    for (let j = 0; j < N; j++) {
      const j2 = (j + 1) % N;
      const here = quadKey[i * N + j];
      const along = quadKey[i * N + j2];                        // next around the ring
      const ahead = i + 2 < S ? quadKey[(i + 1) * N + j] : null; // next down the car
      if (along !== here && (drawn(here) || drawn(along))) edge(i * N + j2, (i + 1) * N + j2);
      if (ahead && ahead !== here && (drawn(here) || drawn(ahead))) edge((i + 1) * N + j, (i + 1) * N + j2);
    }
  }

  // --- Wheels and mirrors --------------------------------------------------
  const wheels = [];
  const trackHalf = P.halfWidth - P.wheelR * 0.34;
  for (const z of P.axles) {
    for (const x of [-1, 1]) {
      wheels.push({ pos: [x * trackHalf, P.wheelR, z], r: P.wheelR, w: P.wheelR * 0.74 });
    }
  }

  // --- Parts ---------------------------------------------------------------
  // Bolt-on pieces, each tagged with the panel it is quoted under. They sit
  // proud of the surface by a couple of centimetres, which is about right and
  // also keeps them out of a z-fight with the skin behind them.
  const face = (zEnd, dir) => {
    const y0 = Math.max(rockF(zEnd), floorF(zEnd));
    const y1 = beltF(zEnd);
    return { w: widthF(zEnd), y0, h: Math.max(y1 - y0, 0.2), z: zEnd - dir * 0.015 };
  };
  const props = [];
  // Just proud of the bumper face. There is no recess cut into the skin for
  // them to sit in, and anything placed level with the face disappears behind
  // it, so they stand a centimetre off and stay dark enough not to read as
  // stickers.
  const part = (kind, area, size, x, upFrac, f, zEnd, dir) => props.push({
    area, kind, size,
    pos: [x, f.y0 + f.h * upFrac, zEnd + dir * (0.012 - size[2] / 2)],
  });

  const fr = face(P.zFront, 1);
  const gh = P.grilleH ?? 0.40;
  part('grille', 11, [fr.w * 0.88, fr.h * gh, 0.10], 0, 0.12 + gh / 2, fr, P.zFront, 1);
  for (const x of [-1, 1]) {
    part('lamp', 12, [fr.w * 0.62, fr.h * 0.20, 0.14], x * fr.w * 0.70, 0.86, fr, P.zFront, 1);
  }
  const re = face(P.zRear, -1);
  for (const x of [-1, 1]) {
    part('lamp', 31, [re.w * 0.56, re.h * 0.26, 0.12], x * re.w * 0.64, 0.80, re, P.zRear, -1);
  }

  // Number plates. Australian plates are 372 x 134.
  part('trim', 10, [0.372, 0.134, 0.03], 0, 0.13 + gh * 0.55, fr, P.zFront, 1);
  part('trim', 30, [0.372, 0.134, 0.03], 0, 0.36, re, P.zRear, -1);

  // Door handles. Small, but a flank without them never looks like a door.
  const handle = (area, z) => {
    const y = beltF(z) - 0.075;
    for (const x of [-1, 1]) {
      props.push({
        area: x < 0 ? area[0] : area[1], kind: 'paint',
        size: [0.035, 0.042, 0.155],
        pos: [x * (widthF(z) + 0.012), y, z],
      });
    }
  };
  handle([L.door, R.door], P.bDoorSplitZ + 0.19);
  handle([L.rdoor, R.rdoor], P.rearDoorBackZ + 0.21);

  // Mirrors sit on the front doors, and belong to them on a quote.
  const mirrorZ = P.guardBackZ - 0.05;
  const mirrorY = beltF(mirrorZ) + 0.045;
  for (const x of [-1, 1]) {
    props.push({
      area: x < 0 ? L.door : R.door, kind: 'paint',
      size: [0.10, 0.09, 0.20], pos: [x * (widthF(mirrorZ) + 0.055), mirrorY, mirrorZ],
      rot: [0, 0, x * 0.12],
    });
  }

  return {
    profile: P,
    groups: [...groups.values()].map(g => ({
      area: g.area,
      kind: g.kind,
      position: new Float32Array(g.position),
      normal: new Float32Array(g.normal),
      index: new Uint32Array(g.index),
    })),
    shutLines: new Float32Array(lines),
    props,
    wheels,
  };
}
