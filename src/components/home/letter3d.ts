/**
 * Vanilla Three.js letter stage for the home banner.
 * Mount / setLetter / dispose — mirrors corridor3d lifecycle (no R3F).
 * Brand dots: single even Points grid behind the letter (stage-scoped; static).
 */
import * as THREE from "three";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";

const BRAND = 0xff6900;
const STAGE_WHITE = 0xffffff;
const FONT_URL = "/fonts/helvetiker_bold.typeface.json";

/** Single even grid behind the letter — one plane, no drift (avoids dizzy stacking). */
const DOT_COLS = 16;
const DOT_ROWS = 12;
const DOT_SPACING = 0.65;
const DOT_Z = -2.4;

export interface Letter3DHandle {
  setLetter(char: string): void;
  setPaused(value: boolean): void;
  dispose(): void;
}

function buildDotField(): {
  points: THREE.Points;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
} {
  const positions: number[] = [];
  const x0 = -((DOT_COLS - 1) * DOT_SPACING) / 2;
  const y0 = -((DOT_ROWS - 1) * DOT_SPACING) / 2;

  for (let row = 0; row < DOT_ROWS; row++) {
    for (let col = 0; col < DOT_COLS; col++) {
      positions.push(x0 + col * DOT_SPACING, y0 + row * DOT_SPACING, DOT_Z);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );

  const material = new THREE.PointsMaterial({
    color: BRAND,
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.renderOrder = -1;
  points.frustumCulled = false;
  return { points, geometry, material };
}

export function createLetter3D(
  container: HTMLElement,
  options: { reducedMotion?: boolean; initialLetter?: string } = {},
): Letter3DHandle {
  const reducedMotion = Boolean(options.reducedMotion);
  let disposed = false;
  let paused = false;
  let font: Font | null = null;
  let currentChar = "";
  let letterMesh: THREE.Mesh | null = null;
  let pendingChar = options.initialLetter ?? "C";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(STAGE_WHITE);
  scene.fog = null;

  // Slightly tighter FOV + farther cam so the glyph breathes inside the stage.
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
  camera.position.set(0, 0, 4.85);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.className = "banner-letter3d__canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const hemi = new THREE.HemisphereLight(0xfff6ee, 0xc8c2ba, 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.15);
  key.position.set(3.2, 4.5, 5);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xff8a3d, 0.55);
  rim.position.set(-4, 1.5, -2);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffffff, 0.35, 20, 2);
  fill.position.set(-2, -1, 3);
  scene.add(fill);

  const root = new THREE.Group();
  scene.add(root);

  const dotField = buildDotField();
  const dots = dotField.points;
  scene.add(dots);

  const material = new THREE.MeshPhysicalMaterial({
    color: BRAND,
    metalness: 0.28,
    roughness: 0.32,
    clearcoat: 0.55,
    clearcoatRoughness: 0.28,
    reflectivity: 0.4,
  });

  function disposeLetter() {
    if (!letterMesh) return;
    root.remove(letterMesh);
    letterMesh.geometry.dispose();
    letterMesh = null;
  }

  function buildLetter(char: string) {
    if (!font || disposed) return;
    const glyph = char.length ? char[0] : "C";
    if (glyph === currentChar && letterMesh) return;
    currentChar = glyph;
    disposeLetter();

    const geometry = new TextGeometry(glyph, {
      font,
      size: 1.85,
      depth: 0.42,
      curveSegments: 10,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.032,
      bevelOffset: 0,
      bevelSegments: 4,
    });
    geometry.center();

    letterMesh = new THREE.Mesh(geometry, material);
    letterMesh.rotation.x = -0.08;
    letterMesh.rotation.y = -0.22;
    root.add(letterMesh);
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(container);
  resize();

  let t0 = performance.now();
  function animate(now: number) {
    if (disposed) return;
    requestAnimationFrame(animate);
    if (paused) return;

    const elapsed = (now - t0) / 1000;
    if (letterMesh && !reducedMotion) {
      letterMesh.rotation.y = -0.22 + Math.sin(elapsed * 0.55) * 0.18;
      letterMesh.rotation.x = -0.08 + Math.sin(elapsed * 0.35) * 0.05;
      letterMesh.position.y = Math.sin(elapsed * 0.7) * 0.04;
    }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(animate);

  const loader = new FontLoader();
  loader.load(
    FONT_URL,
    (loaded) => {
      if (disposed) return;
      font = loaded;
      buildLetter(pendingChar);
    },
    undefined,
    () => {
      console.warn("Letter3D: font failed to load");
    },
  );

  return {
    setLetter(char: string) {
      pendingChar = char;
      if (font) buildLetter(char);
    },
    setPaused(value: boolean) {
      paused = Boolean(value);
      renderer.domElement.style.visibility = paused ? "hidden" : "visible";
      if (!paused) resize();
    },
    dispose() {
      disposed = true;
      ro.disconnect();
      disposeLetter();
      scene.remove(dots);
      dotField.geometry.dispose();
      dotField.material.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
