/**
 * First-person WebGL timeline road — own Three.js scene (not ChronoFlo proprietary JS).
 * Visual SoT: ChronoFlo official preview (preview-english-monarchs.jpg) —
 * opaque cards (colored house strip + portrait + dark copy), white ruler road,
 * three horizontal lanes (no proprietary band JS), right-side year labels,
 * steeper vanishing stack + floor reflections.
 */
import * as THREE from "three";

export interface Corridor3DItem {
  id: string;
  title: string;
  year: number;
  endYear?: number;
  house?: string;
  intro?: string;
  accent?: string;
  image?: string;
}

export interface Corridor3DHandle {
  setItems(nextItems: Corridor3DItem[]): void;
  setActiveIndex(index: number): void;
  setDepthZoom(z: number): void;
  setPaused(value: boolean): void;
  dispose(): void;
}

/** Bump when paintCard chrome changes so React rebuilds textures. */
export const CARD_TEXTURE_REV = 4;


const SPACING = 6.0;
const CARD_W = 2.15;
const CARD_H = 2.95;
const ROAD_HALF = 4.35;
const LANE_COUNT = 3;
/** World X for lanes L / C / R — separation > CARD_W so adjacent reigns clear. */
const LANE_X = [-2.55, 0, 2.55] as const;
const VISIBLE_AHEAD = 12;
const VISIBLE_BEHIND = 1;
const CARD_CANVAS_W = 512;
const CARD_CANVAS_H = 688;
const RULER_TICK_STEP = 0.4;
const ROAD_Z_NEAR = 14;
const ROAD_Z_FAR = -280;

function laneX(index: number): number {
  return LANE_X[((index % LANE_COUNT) + LANE_COUNT) % LANE_COUNT];
}

function parseAccent(accent: string | undefined, fallback = 0x386cd2) {
  if (!accent || typeof accent !== "string") return fallback;
  if (accent.startsWith("#")) {
    const n = Number.parseInt(accent.slice(1), 16);
    return Number.isFinite(n) ? n : fallback;
  }
  const m = accent.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!m) return fallback;
  return (Number(m[1]) << 16) | (Number(m[2]) << 8) | Number(m[3]);
}

function accentCss(accentHex: number) {
  return `#${accentHex.toString(16).padStart(6, "0")}`;
}

function initials(title: string | undefined) {
  const stop = new Set(["the", "of", "and", "a", "an"]);
  const words = String(title || "")
    .replace(/\(.*?\)/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => w && !stop.has(w.toLowerCase()));
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string | undefined,
  maxWidth: number,
  maxLines: number,
) {
  const words = String(text || "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length >= maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let last = lines[maxLines - 1];
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

function yearRangeLabel(item: Corridor3DItem) {
  const start = item.year;
  const end = item.endYear;
  if (end && end !== start) return `${start} - ${end}`;
  return String(start ?? "");
}

function proxiedImageUrl(src: string) {
  if (!src) return src;
  if (src.startsWith("/")) return src;
  try {
    const host = new URL(src).hostname;
    if (host === "upload.wikimedia.org" || host.endsWith(".wikimedia.org")) {
      return `/api/img?url=${encodeURIComponent(src)}`;
    }
  } catch {
    return src;
  }
  return src;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rad: number,
) {
  const r = Math.min(rad, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Clickr card: brand strip + portrait + white copy block. */
function paintCard(
  ctx: CanvasRenderingContext2D,
  item: Corridor3DItem,
  portrait: CanvasImageSource | null,
  accentHex: number,
) {
  const W = CARD_CANVAS_W;
  const H = CARD_CANVAS_H;
  const r = 18;
  const stripH = 42;
  const mediaH = 300;
  const pad = 26;
  const color = accentCss(accentHex);

  ctx.clearRect(0, 0, W, H);

  // Soft drop shadow (white corridor needs a bit more lift)
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  roundRect(ctx, 10, 14, W - 20, H - 36, r);
  ctx.fill();

  // Opaque white card body
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 0, 0, W, H - 24, r);
  ctx.fill();

  // Colored year strip + white label
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(W - r, 0);
  ctx.quadraticCurveTo(W, 0, W, r);
  ctx.lineTo(W, stripH);
  ctx.lineTo(0, stripH);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(255,255,255,0.96)";
  ctx.font = "bold 20px Segoe UI, Helvetica Neue, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(yearRangeLabel(item), pad, stripH / 2);

  // Portrait band
  const mediaY = stripH;
  ctx.fillStyle = "#111";
  ctx.fillRect(0, mediaY, W, mediaH);
  if (portrait) {
    const sized = portrait as CanvasImageSource & {
      width?: number;
      height?: number;
      videoWidth?: number;
      videoHeight?: number;
    };
    const iw = sized.width || sized.videoWidth || W;
    const ih = sized.height || sized.videoHeight || mediaH;
    const scale = Math.max(W / iw, mediaH / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.drawImage(portrait, (W - dw) / 2, mediaY + (mediaH - dh) / 2, dw, dh);
  } else {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.32;
    ctx.fillRect(0, mediaY, W, mediaH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = "bold 96px Segoe UI, Helvetica Neue, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(item.title) || "?", W / 2, mediaY + mediaH / 2);
  }

  // White copy block + dark text
  const copyY = mediaY + mediaH;
  const copyH = H - 24 - copyY;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, copyY, W, copyH);

  ctx.fillStyle = "#111111";
  ctx.font = "bold 34px Segoe UI, Helvetica Neue, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const titleLines = wrapLines(ctx, item.title, W - pad * 2, 2);
  let ty = copyY + 16;
  titleLines.forEach((line) => {
    ctx.fillText(line, pad, ty);
    ty += 38;
  });

  ctx.fillStyle = "rgba(17,17,17,0.55)";
  ctx.font = "21px Segoe UI, Helvetica Neue, Arial, sans-serif";
  ctx.fillText(yearRangeLabel(item), pad, ty + 2);
  ty += 32;

  ctx.fillStyle = "rgba(17,17,17,0.78)";
  ctx.font = "18px Segoe UI, Helvetica Neue, Arial, sans-serif";
  wrapLines(ctx, item.intro, W - pad * 2, 4).forEach((line) => {
    ctx.fillText(line, pad, ty);
    ty += 24;
  });

  // Caret pin under card — solid brand fill (matches card accent / Clickr #FF6900)
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 20, H - 24);
  ctx.lineTo(W / 2 + 20, H - 24);
  ctx.lineTo(W / 2, H - 4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineJoin = "round";
  ctx.stroke();

  // Thin brand edge (inset so stroke isn't clipped at canvas edge)
  const inset = 2;
  roundRect(ctx, inset, inset, W - inset * 2, H - 24 - inset * 2, Math.max(0, r - inset));
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();
}

function makeCardTexture(
  item: Corridor3DItem,
  portrait: CanvasImageSource | null,
  accentHex: number,
) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_CANVAS_W;
  canvas.height = CARD_CANVAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  paintCard(ctx, item, portrait, accentHex);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { texture: tex, canvas, ctx };
}

function makeYearTexture(year: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 320;
  canvas.height = 140;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  ctx.clearRect(0, 0, 320, 140);
  ctx.fillStyle = "rgba(40,40,40,0.55)";
  ctx.font = "bold 86px Segoe UI, Helvetica Neue, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(year), 160, 70);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createCorridor3D(
  container: HTMLElement,
  options: { reducedMotion?: boolean; onSelect?: (index: number) => void } = {},
): Corridor3DHandle {
  const reducedMotion = Boolean(options.reducedMotion);
  const onSelect = typeof options.onSelect === "function" ? options.onSelect : null;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  scene.fog = new THREE.FogExp2(0xffffff, 0.012);

  // Slightly narrower FOV + raised cam — vanish sits higher without losing near cards.
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 320);
  camera.position.set(0, 2.45, 0.55);
  camera.lookAt(0, 0.75, -28);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "webgl-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.88));
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd0d0d0, 0.42);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 0.55);
  key.position.set(1.5, 9, 3);
  scene.add(key);

  const fill = new THREE.PointLight(0xffffff, 0.32, 55, 2);
  fill.position.set(0, 2.2, -6);
  scene.add(fill);

  // White floor — BasicMaterial so lights don't tint it gray
  const roadMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });
  const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2.35, 340), roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, -130);
  scene.add(road);

  // Black vanishing ruler edges
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x000000,
  });
  const edgePtsL = [
    new THREE.Vector3(-ROAD_HALF, 0.02, ROAD_Z_NEAR),
    new THREE.Vector3(-ROAD_HALF, 0.02, ROAD_Z_FAR),
  ];
  const edgePtsR = [
    new THREE.Vector3(ROAD_HALF, 0.02, ROAD_Z_NEAR),
    new THREE.Vector3(ROAD_HALF, 0.02, ROAD_Z_FAR),
  ];
  const leftEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePtsL), edgeMat);
  const rightEdge = new THREE.Line(new THREE.BufferGeometry().setFromPoints(edgePtsR), edgeMat);
  scene.add(leftEdge, rightEdge);

  const cardRoot = new THREE.Group();
  const tickRoot = new THREE.Group();
  const rulerRoot = new THREE.Group();
  const yearRoot = new THREE.Group();
  scene.add(cardRoot, tickRoot, rulerRoot, yearRoot);

  type CardEntry = {
    mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    reflection: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
    index: number;
    id: string;
    loaded: boolean;
    loading: boolean;
    canvas?: HTMLCanvasElement;
    ctx?: CanvasRenderingContext2D;
    texture?: THREE.Texture;
  };

  let cards: CardEntry[] = [];
  let items: Corridor3DItem[] = [];
  let activeIndex = 0;
  let depthZoom = 1;
  let paused = false;
  let disposed = false;
  let camZ = 0.4;
  let targetCamZ = 0.4;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const planeGeo = new THREE.PlaneGeometry(CARD_W, CARD_H);
  const yearGeo = new THREE.PlaneGeometry(2.9, 1.2);
  const rungMat = new THREE.LineBasicMaterial({
    color: 0x000000,
  });
  const rulerTickMat = new THREE.LineBasicMaterial({
    color: 0x000000,
  });

  function spacing() {
    return SPACING / Math.max(0.55, depthZoom);
  }

  function worldZForIndex(index: number) {
    return -index * spacing();
  }

  function disposeMaterialMap(mat: THREE.Material | THREE.Material[] | undefined) {
    const list = Array.isArray(mat) ? mat : mat ? [mat] : [];
    for (const m of list) {
      const mapped = m as THREE.MeshBasicMaterial;
      if (mapped.map) {
        mapped.map.dispose();
        mapped.map = null;
      }
    }
  }

  function disposeCard(entry: CardEntry | undefined) {
    if (!entry) return;
    const map = entry.mesh?.material?.map || entry.texture || null;
    if (entry.mesh?.material) {
      entry.mesh.material.map = null;
      entry.mesh.material.dispose();
    }
    if (entry.reflection?.material) {
      entry.reflection.material.map = null;
      entry.reflection.material.dispose();
    }
    if (map) map.dispose();
    if (entry.mesh) cardRoot.remove(entry.mesh);
    if (entry.reflection) cardRoot.remove(entry.reflection);
  }

  function clearRuler() {
    while (rulerRoot.children.length) {
      const child = rulerRoot.children[0] as THREE.Line;
      rulerRoot.remove(child);
      child.geometry.dispose();
    }
  }

  function clearDecor() {
    while (tickRoot.children.length) {
      const child = tickRoot.children[0] as THREE.Line;
      tickRoot.remove(child);
      child.geometry.dispose();
    }
    while (yearRoot.children.length) {
      const child = yearRoot.children[0] as THREE.Mesh;
      yearRoot.remove(child);
      disposeMaterialMap(child.material);
      if (!Array.isArray(child.material)) child.material.dispose();
    }
  }

  function clearCards() {
    cards.forEach(disposeCard);
    cards = [];
    clearDecor();
  }

  function rebuildRuler() {
    clearRuler();
    const tickLen = 0.16;
    for (let z = ROAD_Z_NEAR; z > ROAD_Z_FAR; z -= RULER_TICK_STEP) {
      const left = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-ROAD_HALF, 0.03, z),
          new THREE.Vector3(-ROAD_HALF + tickLen, 0.03, z),
        ]),
        rulerTickMat,
      );
      const right = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(ROAD_HALF, 0.03, z),
          new THREE.Vector3(ROAD_HALF - tickLen, 0.03, z),
        ]),
        rulerTickMat,
      );
      rulerRoot.add(left, right);
    }
  }

  function rebuildDecor() {
    clearDecor();
    const space = spacing();
    items.forEach((item, index) => {
      const z = -index * space;

      // Soft floor rung at each station
      const rung = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-ROAD_HALF + 0.06, 0.025, z),
          new THREE.Vector3(ROAD_HALF - 0.06, 0.025, z),
        ]),
        rungMat,
      );
      tickRoot.add(rung);

      // Large year labels on the RIGHT of the road (official preview)
      const yTex = makeYearTexture(item.year);
      const yMat = new THREE.MeshBasicMaterial({
        map: yTex,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const yMesh = new THREE.Mesh(yearGeo, yMat);
      yMesh.rotation.x = -Math.PI / 2;
      yMesh.position.set(ROAD_HALF + 0.95, 0.05, z);
      yearRoot.add(yMesh);
    });
  }

  function applyCardTexture(entry: CardEntry, texture: THREE.Texture) {
    const prev = entry.mesh.material.map || entry.texture || null;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    entry.mesh.material.map = texture;
    entry.mesh.material.needsUpdate = true;
    entry.reflection.material.map = texture;
    entry.reflection.material.needsUpdate = true;
    entry.texture = texture;
    entry.loaded = true;
    if (prev && prev !== texture) prev.dispose();
  }

  function paintAndApply(
    entry: CardEntry,
    item: Corridor3DItem,
    portrait: CanvasImageSource | null,
  ) {
    const accentHex = parseAccent(item.accent);
    if (!entry.canvas || !entry.ctx) {
      const built = makeCardTexture(item, portrait, accentHex);
      entry.canvas = built.canvas;
      entry.ctx = built.ctx;
      applyCardTexture(entry, built.texture);
      return;
    }
    paintCard(entry.ctx, item, portrait, accentHex);
    if (entry.texture) {
      entry.texture.needsUpdate = true;
    } else {
      const tex = new THREE.CanvasTexture(entry.canvas);
      applyCardTexture(entry, tex);
    }
    entry.loaded = true;
  }

  function ensureTexture(entry: CardEntry, item: Corridor3DItem) {
    if (entry.loaded || entry.loading) return;
    entry.loading = true;
    paintAndApply(entry, item, null);

    if (!item.image) {
      entry.loading = false;
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (disposed || entry.mesh.parent !== cardRoot) return;
      paintAndApply(entry, item, img);
      entry.loading = false;
    };
    img.onerror = () => {
      entry.loading = false;
    };
    img.src = proxiedImageUrl(item.image);
  }

  function rebuildCards(nextItems: Corridor3DItem[]) {
    clearCards();
    items = nextItems.slice();
    items.forEach((item, index) => {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        side: THREE.FrontSide,
        depthWrite: true,
      });
      const mesh = new THREE.Mesh(planeGeo, mat);
      mesh.position.set(laneX(index), 1.68, worldZForIndex(index));
      mesh.userData = { index, id: item.id };

      const reflMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.28,
        side: THREE.FrontSide,
        depthWrite: false,
      });
      const reflection = new THREE.Mesh(planeGeo, reflMat);
      reflection.userData = { index, id: item.id, isReflection: true };
      reflection.renderOrder = -1;

      cardRoot.add(mesh, reflection);
      cards.push({
        mesh,
        reflection,
        index,
        id: item.id,
        loaded: false,
        loading: false,
      });
    });
    rebuildDecor();
    syncVisibility();
    snapCamera(true);
  }

  function syncVisibility() {
    const space = spacing();
    tickRoot.children.forEach((tick: THREE.Object3D, index: number) => {
      const z = -index * space;
      const line = tick as THREE.Line;
      const pos = line.geometry?.attributes?.position;
      if (pos) {
        pos.setZ(0, z);
        pos.setZ(1, z);
        pos.needsUpdate = true;
      }
    });
    yearRoot.children.forEach((yMesh: THREE.Object3D, index: number) => {
      yMesh.position.z = -index * space;
      yMesh.position.x = ROAD_HALF + 0.95;
    });

    cards.forEach((entry) => {
      const d = entry.index - activeIndex;
      const visible = d >= -VISIBLE_BEHIND && d <= VISIBLE_AHEAD;
      entry.mesh.visible = visible;
      // Floor reflections for active + nearby ahead (preview stack)
      entry.reflection.visible = visible && d >= 0 && d <= 7;

      const z = -entry.index * space;
      const x = laneX(entry.index);
      const y = 1.68;
      entry.mesh.position.set(x, y, z);

      const scale = d === 0 ? 1.06 : Math.max(0.62, 1 - Math.abs(d) * 0.045);
      entry.mesh.scale.setScalar(scale);

      const opacity =
        d < 0 ? 0.38 : d === 0 ? 1 : Math.max(0.35, 1 - d * 0.07);
      entry.mesh.material.opacity = opacity;
      entry.reflection.material.opacity = opacity * (d === 0 ? 0.3 : 0.14);
      entry.reflection.scale.set(scale, -scale * 0.94, scale);
      entry.reflection.position.set(x, 0.035, z);

      entry.mesh.lookAt(camera.position.x, entry.mesh.position.y, camera.position.z);
      entry.reflection.quaternion.copy(entry.mesh.quaternion);
      entry.reflection.scale.y = -Math.abs(entry.reflection.scale.y);

      if (visible) ensureTexture(entry, items[entry.index]);
    });
  }

  function snapCamera(immediate: boolean) {
    targetCamZ = worldZForIndex(activeIndex) + 5.8;
    if (immediate || reducedMotion) camZ = targetCamZ;
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  function onPointer(event: MouseEvent) {
    if (paused || !onSelect) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(
      cards.filter((c) => c.mesh.visible).map((c) => c.mesh),
      false,
    );
    if (hits.length > 0) {
      const idx = hits[0].object.userData.index;
      if (typeof idx === "number") onSelect(idx);
    }
  }

  renderer.domElement.addEventListener("click", onPointer);

  const ro = new ResizeObserver(() => resize());
  ro.observe(container);
  rebuildRuler();
  resize();

  function animate() {
    if (disposed) return;
    requestAnimationFrame(animate);
    if (paused) return;
    const lerp = reducedMotion ? 1 : 0.09;
    camZ += (targetCamZ - camZ) * lerp;
    camera.position.z = camZ;
    camera.position.y = 2.45;
    camera.position.x = 0;
    camera.lookAt(0, 0.75, camZ - 26);
    fill.position.z = camZ - 6;
    cards.forEach((entry) => {
      if (!entry.mesh.visible) return;
      entry.mesh.lookAt(camera.position.x, entry.mesh.position.y, camera.position.z);
      entry.reflection.quaternion.copy(entry.mesh.quaternion);
      entry.reflection.scale.y = -Math.abs(entry.mesh.scale.y) * 0.94;
      entry.reflection.scale.x = entry.mesh.scale.x;
      entry.reflection.scale.z = entry.mesh.scale.z;
      entry.reflection.position.x = entry.mesh.position.x;
      entry.reflection.position.z = entry.mesh.position.z;
      entry.reflection.position.y = 0.035;
    });
    renderer.render(scene, camera);
  }
  animate();

  return {
    setItems(nextItems: Corridor3DItem[]) {
      rebuildCards(Array.isArray(nextItems) ? nextItems : []);
    },
    setActiveIndex(index: number) {
      activeIndex = Math.max(0, Math.min(items.length - 1, index | 0));
      snapCamera(false);
      syncVisibility();
    },
    setDepthZoom(z: number) {
      depthZoom = Number(z) || 1;
      rebuildDecor();
      syncVisibility();
      snapCamera(false);
    },
    setPaused(value: boolean) {
      paused = Boolean(value);
      renderer.domElement.style.visibility = paused ? "hidden" : "visible";
      if (!paused) {
        resize();
        snapCamera(false);
      }
    },
    dispose() {
      disposed = true;
      ro.disconnect();
      renderer.domElement.removeEventListener("click", onPointer);
      clearCards();
      clearRuler();
      planeGeo.dispose();
      yearGeo.dispose();
      road.geometry.dispose();
      roadMat.dispose();
      edgeMat.dispose();
      rungMat.dispose();
      rulerTickMat.dispose();
      leftEdge.geometry.dispose();
      rightEdge.geometry.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    },
  };
}
