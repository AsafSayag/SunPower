/* The WebGL version of the home-page cube: a rounded block of dark glass that reflects a studio
   around it, with the figures painted on its four sides. Loaded only in the browser, after the page
   is up; StatsCube keeps its CSS cube as the fallback and as the text of the page. */

export type CubeGl = { render: (yaw: number, pitch: number, roll: number, now: number) => void; dispose: () => void };

type Side = { figure: string; unit: string; label: string };

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Paints one side's figure and label on a transparent square, in the site's own fonts. */
function paintSide(side: Side, fonts: { figure: string; label: string }) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.textBaseline = "alphabetic";

  // The figure, with its unit before it, shrunk until both fit the side.
  ctx.direction = "ltr";
  ctx.textAlign = "left";
  let px = 300;
  let figureW = 0;
  let unitW = 0;
  const gap = () => (side.unit ? px * 0.12 : 0);
  for (; px > 120; px -= 10) {
    ctx.font = `800 ${px}px ${fonts.figure}`;
    figureW = ctx.measureText(side.figure).width;
    ctx.font = `700 ${px * 0.34}px ${fonts.figure}`;
    unitW = side.unit ? ctx.measureText(side.unit).width : 0;
    if (figureW + unitW + gap() <= 850) break;
  }
  const left = (size - (figureW + unitW + gap())) / 2;
  const base = 500;
  ctx.shadowColor = "rgba(2, 8, 20, 0.55)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 6;
  if (side.unit) {
    ctx.font = `700 ${px * 0.34}px ${fonts.figure}`;
    ctx.fillStyle = "#a9c0d8";
    ctx.fillText(side.unit, left, base);
  }
  ctx.font = `800 ${px}px ${fonts.figure}`;
  ctx.fillStyle = "#a9e39d";
  ctx.fillText(side.figure, left + unitW + gap(), base);

  // The label, on one line or balanced over two.
  ctx.direction = "rtl";
  ctx.textAlign = "center";
  ctx.font = `700 78px ${fonts.label}`;
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;
  const words = side.label.split(/\s+/);
  let lines = [side.label];
  if (ctx.measureText(side.label).width > 800 && words.length > 1) {
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
  lines.forEach((line, i) => ctx.fillText(line, size / 2, 650 + i * 104));
  return canvas;
}

export async function createCubeGl(host: HTMLElement, sides: Side[], fonts: { figure: string; label: string }): Promise<CubeGl> {
  const [THREE, { RoundedBoxGeometry }, { RoomEnvironment }] = await Promise.all([
    import("three"),
    import("three/examples/jsm/geometries/RoundedBoxGeometry.js"),
    import("three/examples/jsm/environments/RoomEnvironment.js"),
  ]);
  await Promise.all([document.fonts.load(`800 100px ${fonts.figure}`), document.fonts.load(`700 78px ${fonts.label}`, sides.map((s) => s.label).join(" "))]).catch(() => undefined);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "cube-canvas";
  canvas.setAttribute("aria-hidden", "true");

  const scene = new THREE.Scene();
  // A soft studio around the cube: this is what the glass reflects.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const env = pmrem.fromScene(room, 0.03).texture;
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 50);
  camera.position.set(0, 1.65, 6.9);
  camera.lookAt(0, -0.05, 0);

  const cube = new THREE.Group();
  scene.add(cube);

  const body = new THREE.Mesh(
    new RoundedBoxGeometry(2, 2, 2, 8, 0.13),
    new THREE.MeshPhysicalMaterial({ color: 0x0a2a60, metalness: 0.55, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.15 }),
  );
  cube.add(body);

  const textures: import("three").CanvasTexture[] = [];
  const plane = new THREE.PlaneGeometry(1.78, 1.78);
  sides.forEach((side, i) => {
    const texture = new THREE.CanvasTexture(paintSide(side, fonts));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    textures.push(texture);
    const label = new THREE.Mesh(plane, new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false }));
    const turn = new THREE.Group();
    turn.rotation.y = rad(i * 90);
    label.position.z = 1.004;
    turn.add(label);
    cube.add(turn);
  });

  // One key light from the upper left in front, a cool fill, and a green rim from behind.
  scene.add(new THREE.AmbientLight(0xdcebfb, 0.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-3.2, 4.2, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x9fc8f5, 0.9);
  fill.position.set(4, 1, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9ad58f, 2.4);
  rim.position.set(3.5, 2.5, -4.5);
  scene.add(rim);

  const fit = () => {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    // On a narrow column the cube would be cut at the sides, so the camera steps back.
    camera.aspect = w / h;
    camera.position.z = 6.9 * Math.max(1, 0.8 / camera.aspect);
    camera.updateProjectionMatrix();
  };
  const watcher = new ResizeObserver(fit);
  watcher.observe(host);
  host.appendChild(canvas);
  fit();

  return {
    render(yaw, pitch, roll, now) {
      // The same angles the CSS cube uses; its vertical axis points down, so pitch and roll flip.
      cube.rotation.set(rad(-pitch * 0.55), rad(yaw), rad(-roll), "XZY");
      cube.position.y = Math.sin(now / 1300) * 0.07;
      renderer.render(scene, camera);
    },
    dispose() {
      watcher.disconnect();
      canvas.remove();
      textures.forEach((t) => t.dispose());
      plane.dispose();
      body.geometry.dispose();
      (body.material as import("three").Material).dispose();
      env.dispose();
      pmrem.dispose();
      room.dispose();
      renderer.dispose();
    },
  };
}
