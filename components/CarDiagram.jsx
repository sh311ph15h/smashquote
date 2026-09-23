'use client';

import { useEffect, useRef } from 'react';
import { buildCarShell } from './carShell';
import { BODY_COLOR, EXPOSURE, buildCar, setupStage } from './carLook';
import { opColor, primaryOp, areaLabel } from '@/lib/panels';

// ---------------------------------------------------------------------------
// The car, in 3D. Click a panel to work on it.
//
// The body is one lofted skin (components/carShell.js) cut into panels, lit by
// an image-based environment and finished in clearcoat, so it reads as a car
// under workshop lights rather than as a diagram. What it still has to get
// right first is that every panel an estimator needs is there, in the right
// place, and can be hit with a thumb.
//
// Panel colour comes from the line items, so this is a view of the estimate
// rather than a second place to record the same thing.
// ---------------------------------------------------------------------------

export default function CarDiagram({ bodyType, ops, selected, onSelect, colour }) {
  const hostRef = useRef(null);
  // Everything three.js owns lives here: React never re-renders the canvas, it
  // just hands the scene new instructions through these refs.
  const sceneRef = useRef(null);
  const stateRef = useRef({ ops, selected, onSelect });

  // The scene's event handlers outlive any one render, so they read the latest
  // props through this ref rather than closing over stale ones. Written in an
  // effect, not during render — and declared before the repaint effect below,
  // so the ref is already current by the time that runs.
  useEffect(() => {
    stateRef.current.ops = ops;
    stateRef.current.selected = selected;
    stateRef.current.onSelect = onSelect;
  });

  // --- Build the scene once, then rebuild only when the body shape changes ---
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let cleanup = () => {};

    // three is ~600KB. Loading it with the page would slow down every quote,
    // including the ones nobody opens the diagram on, so it arrives on demand.
    (async () => {
      const THREE = await import('three');
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
      const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
      const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
      if (disposed) return;

      const shell = buildCarShell(bodyType);

      const scene = new THREE.Scene();
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      // Filmic response and a real exposure, or the highlights on a metallic
      // paint clip to flat white and the whole car looks like plastic.
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = EXPOSURE;
      host.appendChild(renderer.domElement);

      const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      camera.position.set(5.0, 2.5, 6.2);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0.72, 0);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.enablePan = false;
      // Stop the camera going under the floor or straight down the roof.
      controls.minPolarAngle = 0.15;
      controls.maxPolarAngle = Math.PI / 2 - 0.03;
      controls.minDistance = 4.2;
      controls.maxDistance = 15;

      const stage = setupStage(THREE, { RoomEnvironment }, renderer, scene);

      const carColour = safeColour(THREE, colour) ?? BODY_COLOR;
      const { group: carGroup, panelMeshes } =
        buildCar(THREE, { RoundedBoxGeometry }, shell, carColour);
      scene.add(carGroup);

      // --- Colouring --------------------------------------------------------
      let hovered = null;
      const tmp = new THREE.Color();

      // Called on every change worth a frame rather than rebuilt: repainting
      // materials is cheap, rebuilding the body is not.
      const paint = () => {
        const { ops: opMap, selected: sel } = stateRef.current;
        const anyWork = opMap && opMap.size > 0;
        for (const mesh of panelMeshes) {
          const area = mesh.userData.area;
          const op = primaryOp(opMap?.get(area));
          const isSel = sel === area;
          const isHover = hovered === area;

          tmp.set(op ? opColor(op) : mesh.userData.base);
          // A panel nobody has touched shouldn't compete with the ones that
          // have been — knock it back, but only once there is a comparison to
          // make. Darkening rather than fading: a see-through guard on a car
          // with reflections looks like a rendering error, not an emphasis.
          if (!op && anyWork) tmp.multiplyScalar(0.62);
          mesh.material.color.copy(tmp);
          mesh.material.emissive.set(isSel ? 0xffffff : (isHover ? 0x6d7c98 : 0x000000));
          mesh.material.emissiveIntensity = isSel ? 0.22 : (isHover ? 0.32 : 0);
        }
      };

      // --- Picking ----------------------------------------------------------
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      let downAt = null;

      const pick = (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(panelMeshes, false)[0];
        return hit ? hit.object.userData.area : null;
      };

      const onMove = (e) => {
        const area = pick(e);
        if (area !== hovered) {
          hovered = area;
          renderer.domElement.style.cursor = area ? 'pointer' : 'grab';
          renderer.domElement.title = area ? areaLabel(area) : '';
          paint();
        }
      };
      // Distinguish a click from an orbit drag: releasing more than a few
      // pixels from where the pointer went down was a camera move, not a pick.
      const onDown = (e) => { downAt = { x: e.clientX, y: e.clientY }; };
      const onUp = (e) => {
        if (!downAt) return;
        const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
        downAt = null;
        if (moved > 6) return;
        const area = pick(e);
        if (area) stateRef.current.onSelect?.(area);
      };
      const onLeave = () => { if (hovered !== null) { hovered = null; paint(); } };

      const el = renderer.domElement;
      el.style.cursor = 'grab';
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerdown', onDown);
      el.addEventListener('pointerup', onUp);
      el.addEventListener('pointerleave', onLeave);

      // --- Size to the container -------------------------------------------
      const resize = () => {
        const w = host.clientWidth;
        const h = host.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      const ro = new ResizeObserver(resize);
      ro.observe(host);
      resize();

      let raf = 0;
      const tick = () => {
        controls.update();
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      paint();
      tick();

      sceneRef.current = { paint };

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointerleave', onLeave);
        controls.dispose();
        // WebGL contexts are a limited resource — a few undisposed renderers
        // and the browser starts dropping the oldest one.
        scene.traverse(o => {
          if (o.geometry) o.geometry.dispose();
          if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
        });
        stage.envRT.dispose();
        stage.pmrem.dispose();
        renderer.dispose();
        el.remove();
        sceneRef.current = null;
      };
    })();

    return () => { disposed = true; cleanup(); };
  }, [bodyType, colour]);

  // Repaint when the estimate changes, without touching the scene graph.
  useEffect(() => { sceneRef.current?.paint(); }, [ops, selected]);

  return <div ref={hostRef} className="car3d" />;
}

// The vehicle's own colour, when it's something a browser understands. Free
// text like "Pearl White Mica" won't parse — fall back rather than throw.
function safeColour(THREE, text) {
  const s = String(text || '').trim();
  if (!s) return null;
  try {
    const c = new THREE.Color(s);
    // Near-black reads as an unlit blob; keep the default in that case.
    return c.getHSL({}).l < 0.12 ? null : c.getHex();
  } catch {
    return null;
  }
}
