/* The WebGL solar panel of the home hero: an aluminium frame around sixty cells under glass that
   reflects a studio around it, with one of the company's figures on each of its two faces. Loaded
   only in the browser, after the page is up; SolarPanel3d keeps a CSS panel as the fallback and as
   the text of the page. */

export type PanelGl = { render: (yaw: number, pitch: number, roll: number, now: number, front: number, back: number) => void; dispose: () => void };

type Side = { figure: string; unit: string; label: string };

const rad = (deg: number) => (deg * Math.PI) / 180;
// The panel, in scene units: a little wider than 1.6 : 1, as a sixty-cell module lying on its side.
const W = 3.4;
const H = 2.1;
const DEPTH = 0.12;
const BAR = 0.075; // width of the frame, seen from the front
const COLS = 10;
const ROWS = 6;

/** Sixty monocrystalline cells: dark blue squares with clipped corners, busbars, and the pale
    backsheet showing in the gaps between them. */
function paintCells() {
  const w = 2000;
  const h = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#aebccd";
  ctx.fillRect(0, 0, w, h);
  const cw = w / COLS;
  const ch = h / ROWS;
  const gap = 5;
  const cut = 16; // the clipped corner of a cell cut from a round ingot
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const x = c * cw + gap;
      const y = r * ch + gap;
      const a = cw - gap * 2;
      const b = ch - gap * 2;
      const shade = ctx.createLinearGradient(x, y, x + a, y + b);
      // no two cells are quite the same blue
      const tint = ((c * 7 + r * 13) % 5) - 2;
      shade.addColorStop(0, `rgb(${16 + tint}, ${44 + tint * 2}, ${92 + tint * 3})`);
      shade.addColorStop(1, `rgb(${8 + tint}, ${24 + tint}, ${56 + tint * 2})`);
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.moveTo(x + cut, y);
      ctx.lineTo(x + a - cut, y);
      ctx.lineTo(x + a, y + cut);
      ctx.lineTo(x + a, y + b - cut);
      ctx.lineTo(x + a - cut, y + b);
      ctx.lineTo(x + cut, y + b);
      ctx.lineTo(x, y + b - cut);
      ctx.lineTo(x, y + cut);
      ctx.closePath();
      ctx.fill();
      // fine fingers across the cell, and the busbars that collect from them
      ctx.strokeStyle = "rgba(170, 195, 230, 0.07)";
      ctx.lineWidth = 1;
      for (let f = 1; f < 24; f++) {
        const fy = y + (b * f) / 24;
        ctx.beginPath();
        ctx.moveTo(x + 3, fy);
        ctx.lineTo(x + a - 3, fy);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(205, 220, 240, 0.42)";
      ctx.lineWidth = 2;
      for (let bar = 1; bar <= 5; bar++) {
        const bx = x + (a * bar) / 6;
        ctx.beginPath();
        ctx.moveTo(bx, y + 2);
        ctx.lineTo(bx, y + b - 2);
        ctx.stroke();
      }
    }
  }
  return canvas;
}

/** Paints one figure and its label on a transparent sheet the shape of the glass, in the site's fonts. */
function paintSide(side: Side, fonts: { figure: string; label: string }) {
  const w = 1600;
  const h = 960;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  // A soft shade under the text quiets the cell lines behind it.
  const shade = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
  shade.addColorStop(0, "rgba(3, 9, 22, 0.72)");
  shade.addColorStop(0.6, "rgba(3, 9, 22, 0.4)");
  shade.addColorStop(1, "rgba(3, 9, 22, 0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, w, h);
  ctx.textBaseline = "alphabetic";

  // The figure, with its unit before it, shrunk until both fit.
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  let px = 400;
  let figureW = 0;
  let unitW = 0;
  const gap = () => (side.unit ? px * 0.12 : 0);
  for (; px > 160; px -= 10) {
    ctx.font = `800 ${px}px ${fonts.figure}`;
    figureW = ctx.measureText(side.figure).width;
    ctx.font = `700 ${px * 0.34}px ${fonts.figure}`;
    unitW = side.unit ? ctx.measureText(side.unit).width : 0;
    if (figureW + unitW + gap() <= 1250) break;
  }
  const left = (w - (figureW + unitW + gap())) / 2;
  const base = 540;
  ctx.shadowColor = "rgba(2, 8, 20, 0.7)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 8;
  if (side.unit) {
    ctx.font = `700 ${px * 0.34}px ${fonts.figure}`;
    ctx.fillStyle = "#c3d3e6";
    ctx.fillText(side.unit, left, base);
  }
  ctx.font = `800 ${px}px ${fonts.figure}`;
  ctx.fillStyle = "#b3eaa8";
  ctx.fillText(side.figure, left + unitW + gap(), base);

  // The label, on one line or balanced over two.
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.font = `700 104px ${fonts.label}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  const words = side.label.split(/\s+/);
  let lines = [side.label];
  if (ctx.measureText(side.label).width > 1300 && words.length > 1) {
    let best = Infinity;
    for (let i = 1; i < words.length; i++) {
      const a = words.slice(0, i).join(" ");
      const b = words.slice(i).join(" ");
      const diff = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
      if (diff < best) {
        best = diff;
        lines = [a, b];
      }
    }
  }
  lines.forEach((line, i) => ctx.fillText(line, w / 2, 710 + i * 124));
  return canvas;
}

export async function createPanelGl(host: HTMLElement, sides: Side[], fonts: { figure: string; label: string }): Promise<PanelGl> {
  const [THREE, { RoundedBoxGeometry }, { RoomEnvironment }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);
  await Promise.all([document.fonts.load(`800 100px ${fonts.figure}`), document.fonts.load(`700 100px ${fonts.label}`, sides.map((s) => s.label).join(" "))]).catch(() => undefined);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "sp-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const sharp = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  // A soft studio around the panel: this is what the glass and the aluminium reflect.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.03).texture;
  scene.environment = env;

  const fov = 27;
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 60);

  const panel = new THREE.Group();
  scene.add(panel);
  const trash: { dispose: () => void }[] = [env, pmrem, room];
  const keep = <T extends { dispose: () => void }>(thing: T) => {
    trash.push(thing);
    return thing;
  };

  // Frame: four bars of brushed, anodised aluminium with softened edges.
  const aluminium = keep(new THREE.MeshStandardMaterial({ color: 0xd3d8df, metalness: 1, roughness: 0.3, envMapIntensity: 1.1 }));
  const across = keep(new RoundedBoxGeometry(W, BAR, DEPTH, 3, 0.014));
  const upright = keep(new RoundedBoxGeometry(BAR, H - BAR * 2 + 0.01, DEPTH, 3, 0.014));
  for (const y of [H / 2 - BAR / 2, -(H / 2 - BAR / 2)]) {
    const bar = new THREE.Mesh(across, aluminium);
    bar.position.y = y;
    panel.add(bar);
  }
  for (const x of [W / 2 - BAR / 2, -(W / 2 - BAR / 2)]) {
    const bar = new THREE.Mesh(upright, aluminium);
    bar.position.x = x;
    panel.add(bar);
  }

  // The laminate inside the frame, and the glass over the cells on both faces (a bifacial module).
  const inner = { w: W - BAR * 2, h: H - BAR * 2 };
  panel.add(new THREE.Mesh(keep(new THREE.BoxGeometry(inner.w, inner.h, DEPTH * 0.5)), keep(new THREE.MeshStandardMaterial({ color: 0x070d1a, roughness: 0.6 }))));
  const cells = keep(new THREE.CanvasTexture(paintCells()));
  cells.colorSpace = THREE.SRGBColorSpace;
  cells.anisotropy = sharp;
  const glass = keep(new THREE.MeshPhysicalMaterial({ map: cells, metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.05 }));
  const sheet = keep(new THREE.PlaneGeometry(inner.w, inner.h));
  const textures = sides.map((side) => {
    const texture = keep(new THREE.CanvasTexture(paintSide(side, fonts)));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = sharp;
    return texture;
  });
  const z = DEPTH / 2 - 0.022;
  const faces = [0, 1].map((i) => {
    const turn = new THREE.Group();
    turn.rotation.y = i * Math.PI;
    const pane = new THREE.Mesh(sheet, glass);
    pane.position.z = z;
    const material = keep(new THREE.MeshBasicMaterial({ map: textures[i % textures.length], transparent: true, depthWrite: false, toneMapped: false }));
    const text = new THREE.Mesh(sheet, material);
    text.position.z = z + 0.004;
    turn.add(pane, text);
    panel.add(turn);
    return { material, shown: i % textures.length };
  });

  // One key light from the upper left in front, a cool fill, and a green rim from behind.
  scene.add(new THREE.AmbientLight(0xdcebfb, 0.3));
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(-3.2, 4.2, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fc8f5, 0.9);
  fill.position.set(4, 1, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9ad58f, 1.8);
  rim.position.set(3.5, 2.5, -4.5);
  scene.add(rim);

  const fit = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Far enough back for the whole panel, whichever of the column's sides is the tight one.
    const half = Math.tan(rad(fov / 2));
    const distance = Math.max((W * 1.16) / (2 * half * camera.aspect), (H * 1.5) / (2 * half));
    camera.position.set(0, distance * 0.17, distance);
    camera.lookAt(0, -0.04, 0);
    camera.updateProjectionMatrix();
  };
  const watcher = new ResizeObserver(fit);
  watcher.observe(host);
  host.appendChild(canvas);
  fit();

  return {
    render(yaw, pitch, roll, now, front, back) {
      [front, back].forEach((stat, i) => {
        if (faces[i].shown === stat) return;
        faces[i].shown = stat;
        faces[i].material.map = textures[stat];
        faces[i].material.needsUpdate = true;
      });
      // The same angles the CSS panel uses; its vertical axis points down, so pitch and roll flip.
      panel.rotation.set(rad(-pitch * 0.6), rad(yaw), rad(-roll), "XZY");
      panel.position.y = Math.sin(now / 1300) * 0.06;
      renderer.render(scene, camera);
    },
    dispose() {
      watcher.disconnect();
      canvas.remove();
      trash.forEach((thing) => thing.dispose());
      renderer.dispose();
    },
  };
}
