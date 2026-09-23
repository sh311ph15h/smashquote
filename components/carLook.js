// How the car is finished and lit.
//
// Shared by the live diagram (components/CarDiagram.jsx) and the offline
// screenshot harness, so what gets checked is what gets shipped. three.js is
// passed in rather than imported: the diagram loads it on demand, and this
// module has to stay importable from a plain <script type="module">.

// Mid tone on purpose. A pale body under a bright environment blows out to
// flat white and every curve in it disappears — the single biggest reason the
// early versions of this read as a toy. Real vehicle colour overrides it.
export const BODY_COLOR = 0x78818f;

// Exposure lives here so the screenshot harness and the live diagram agree.
// At 1.0 a light body clips to flat white and every crease in it disappears.
export const EXPOSURE = 0.88;

// Automotive paint is a coloured base under a clear lacquer. The clearcoat
// layer does the sharp reflection; the base stays mostly diffuse. Pushing
// metalness up instead is what makes a render look like milled aluminium.
export const FINISH = {
  paint: {
    metalness: 0.28, roughness: 0.34,
    clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.0,
  },
  // An unlit headlight is dark and very glossy, not white. White lenses are
  // what make a model read as a toy.
  lamp: {
    color: 0x2b333f, metalness: 0.55, roughness: 0.10,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4,
  },
  grille: { color: 0x0e1116, metalness: 0.70, roughness: 0.45 },
  // Nearly opaque. Car glass reflects far more than it transmits from outside,
  // and anything you can see through shows the inside of the far panel, which
  // reads as a hole in the car.
  glass: {
    color: 0x070b12, metalness: 0.0, roughness: 0.045,
    clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.93, envMapIntensity: 1.6,
  },
  trim: { color: 0x0b0e13, metalness: 0.35, roughness: 0.55 },
  under: { color: 0x08090c, metalness: 0.10, roughness: 0.95 },
};

export const SHUT_LINE = { color: 0x39424f, opacity: 0.30 };

// Kinds the estimate is allowed to recolour. Glass, trim and the underbody are
// scenery — nobody quotes a windscreen off a body diagram.
export const PAINTABLE = new Set(['paint', 'lamp', 'grille', 'trim']);

/** Environment, lights and the shadow floor. Returns what needs disposing. */
export function setupStage(THREE, { RoomEnvironment }, renderer, scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.02);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.9;

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(4.5, 7.5, 5.0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 26;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.45);
  fill.position.set(-5.5, 2.5, -4.5);
  scene.add(fill);

  // A shadow-only floor: grounds the car without drawing a slab under it.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ opacity: 0.32 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  return { pmrem, envRT };
}

/** The car itself. Returns the group and the meshes the estimate can colour. */
export function buildCar(THREE, { RoundedBoxGeometry }, shell, carColour) {
  const group = new THREE.Group();
  const panelMeshes = [];

  const materialOf = (kind) => new THREE.MeshPhysicalMaterial({
    color: carColour, side: THREE.FrontSide, ...FINISH[kind],
  });
  const track = (mesh, kind, area) => {
    if (area == null || !PAINTABLE.has(kind)) return;
    mesh.userData.area = area;
    mesh.userData.base = kind === 'paint' ? carColour : FINISH[kind].color;
    panelMeshes.push(mesh);
  };

  for (const g of shell.groups) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
    geo.setIndex(new THREE.BufferAttribute(g.index, 1));
    const mesh = new THREE.Mesh(geo, materialOf(g.kind));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    track(mesh, g.kind, g.area);
    group.add(mesh);
  }

  for (const p of shell.props) {
    const [sx, sy, sz] = p.size;
    const r = Math.min(0.03, Math.min(sx, sy, sz) * 0.35);
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(sx, sy, sz, 2, r), materialOf(p.kind));
    mesh.position.set(...p.pos);
    if (p.rot) mesh.rotation.set(...p.rot);
    mesh.castShadow = true;
    track(mesh, p.kind, p.area);
    group.add(mesh);
  }

  if (shell.shutLines.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(shell.shutLines, 3));
    group.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      ...SHUT_LINE, transparent: true, depthWrite: false,
    })));
  }

  buildWheels(THREE, shell, group);
  return { group, panelMeshes };
}

function buildWheels(THREE, shell, group) {
  const tyreMat = new THREE.MeshPhysicalMaterial({ color: 0x131519, roughness: 0.86, metalness: 0.0 });
  const rimMat = new THREE.MeshPhysicalMaterial({ color: 0xa9b2bf, roughness: 0.24, metalness: 0.95 });
  const hubMat = new THREE.MeshPhysicalMaterial({ color: 0x23272e, roughness: 0.55, metalness: 0.5 });

  for (const w of shell.wheels) {
    const outward = Math.sign(w.pos[0]);
    const wheel = new THREE.Group();
    wheel.position.set(...w.pos);
    const half = w.w / 2;

    // A lathed tyre rather than a cylinder, so the shoulders are round and the
    // sidewall catches light the way rubber does.
    const prof = [
      [w.r * 0.60, -half], [w.r * 0.90, -half], [w.r * 0.99, -half + w.r * 0.09],
      [w.r, 0], [w.r * 0.99, half - w.r * 0.09], [w.r * 0.90, half], [w.r * 0.60, half],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    const tyre = new THREE.Mesh(new THREE.LatheGeometry(prof, 34), tyreMat);
    tyre.rotation.z = Math.PI / 2;
    tyre.castShadow = true;
    wheel.add(tyre);

    const dish = new THREE.Mesh(
      new THREE.CylinderGeometry(w.r * 0.62, w.r * 0.62, w.w * 0.60, 30), hubMat);
    dish.rotation.z = Math.PI / 2;
    wheel.add(dish);

    // The face of the rim, set into the tyre rather than flush with it.
    const face = new THREE.Mesh(
      new THREE.CylinderGeometry(w.r * 0.60, w.r * 0.60, w.w * 0.06, 30), rimMat);
    face.rotation.z = Math.PI / 2;
    face.position.x = outward * (half - w.r * 0.10);
    wheel.add(face);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(w.r * 0.17, w.r * 0.17, w.w * 0.24, 20), rimMat);
    cap.rotation.z = Math.PI / 2;
    cap.position.x = outward * (half - w.r * 0.02);
    wheel.add(cap);

    const SPOKES = 10;
    for (let i = 0; i < SPOKES; i++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(w.w * 0.09, w.r * 0.86, w.r * 0.115), rimMat);
      spoke.position.x = outward * (half - w.r * 0.10);
      spoke.rotation.x = (i / SPOKES) * Math.PI * 2;
      wheel.add(spoke);
    }
    // The polished lip around the outside of the rim.
    const lip = new THREE.Mesh(
      new THREE.TorusGeometry(w.r * 0.60, w.r * 0.035, 8, 34), rimMat);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = outward * (half - w.r * 0.09);
    wheel.add(lip);

    group.add(wheel);
  }
}
