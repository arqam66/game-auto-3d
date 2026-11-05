"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const W = 850;
const H = 450;
const GRAVITY = 1;
const JUMP_IMPULSE = -9;
const SLIDE_RESIST = 0.5;
const MAX_FALL = 2.5;
const OBS_W = 60;
const OBS_H = 70;
const MIN_DIST = 250;
const PAD = 40;
const MAX_PARTICLES = 150;
const PARTICLE_LIFETIME = 40;
const TILT_FALL = 5;
const TILT_LIFT = 0.8;
const MAX_SPEED_MULT = 2.0;
const MAX_DIFF_MULT = 2.0;
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS;
const LAPS = 3;
const LAP_LENGTH = 500;
const COIN_VALUE = 1;

const DIFFS: Record<string, { speed: number; gap: number }> = {
  Easy: { speed: 6, gap: 420 },
  Medium: { speed: 8, gap: 350 },
  Hard: { speed: 8.5, gap: 300 },
};

interface VehicleDef {
  id: string;
  name: string;
  subtitle: string;
  body: string;
  canopy: string;
  frame: string;
  width: number;
  height: number;
  unlocked: boolean;
  price: number;
}

const VEHICLES: VehicleDef[] = [
  { id: "Baba Auto", name: "Baba Auto", subtitle: "Green / White", body: "#1E7A38", canopy: "#F7F7F2", frame: "#0E3B1A", width: 67.5, height: 45, unlocked: true, price: 0 },
  { id: "Karachi Queen", name: "Karachi Queen", subtitle: "Red / White", body: "#B3122E", canopy: "#F7F7F2", frame: "#5A0A16", width: 67.5, height: 45, unlocked: false, price: 3 },
  { id: "Hassan Special", name: "Hassan Special", subtitle: "Blue / White", body: "#1B4F8A", canopy: "#F7F7F2", frame: "#0C2A45", width: 67.5, height: 45, unlocked: false, price: 6 },
  { id: "Bhatta Express", name: "Bhatta Express", subtitle: "Yellow / Black", body: "#E3A008", canopy: "#17140A", frame: "#17140A", width: 67.5, height: 45, unlocked: false, price: 10 },
];

const OBSTACLE_TYPES = ["bus", "truck", "rickshaw", "car"];
const OBSTACLE_COLORS: Record<string, { body: string; cabin: string }> = {
  bus: { body: "#B3122E", cabin: "#F5F5F5" },
  truck: { body: "#33475B", cabin: "#6B7B8D" },
  rickshaw: { body: "#1E7A38", cabin: "#F7F7F2" },
  car: { body: "#7A8B99", cabin: "#9AA7B0" },
};

export default function KarachiRushGame() {
  const viewportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewportElRef = viewportRef.current;
    if (!viewportElRef) return;
    const viewportEl: HTMLDivElement = viewportElRef;

    let renderer!: THREE.WebGLRenderer;
    let scene!: THREE.Scene;
    let camera!: THREE.PerspectiveCamera;
    let ambientLight!: THREE.AmbientLight;
    let dirLight!: THREE.DirectionalLight;
    let ground!: THREE.Mesh;
    let nightMode = false;
    let playerGroup!: THREE.Group;
    const pl = 20;
    let pBottom = H - 45 - 30;
    let playerHeight = 45;
    let playerWidth = 67.5;
    let vel = 0;
    let tilt = 0;
    let sliding = false;
    let obstacles: THREE.Group[] = [];
    let coins: THREE.Mesh[] = [];
    let particles: { mesh: THREE.Mesh; life: number }[] = [];
    let score = 0;
    let currency = 0;
    let steps = 0;
    let personalBest = parseInt(window.localStorage.getItem("personalBest") || "0") || 0;
    let difficulty = "Medium";
    let raceFinished = false;
    let gameOver = false;
    let showStartScreen = true;
    let isPaused = false;
    let rafId = 0;
    let lastTime = 0;
    let acc = 0;
    let currentSpeed = DIFFS.Medium.speed;
    let currentGap = DIFFS.Medium.gap;

    const getEl = (id: string): HTMLElement => {
      const e = document.getElementById(id);
      if (!e) throw new Error("KarachiRush: missing DOM element " + id);
      return e;
    };

    function initScene() {
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(W, H);
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      viewportEl.appendChild(renderer.domElement);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x8ed4a0);
      camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 2000);

      ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
      scene.add(ambientLight);
      dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(200, 400, 200);
      scene.add(dirLight);

      ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshStandardMaterial({ color: 0x527a52, roughness: 0.95, metalness: 0 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      scene.add(ground);

      // ---- Karachi landmarks (stylized) ----
      const tower = new THREE.Group();
      const towerMat = new THREE.MeshStandardMaterial({ color: 0x8a8f98, roughness: 0.9 });
      const towerBody = new THREE.Mesh(new THREE.CylinderGeometry(26, 38, 150, 10), towerMat);
      towerBody.position.y = 75;
      tower.add(towerBody);
      const towerTop = new THREE.Mesh(new THREE.ConeGeometry(26, 46, 10), towerMat);
      towerTop.position.y = 175;
      tower.add(towerTop);
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 90, 6), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, metalness: 0.8 }));
      antenna.position.y = 220;
      tower.add(antenna);
      const towerBase = new THREE.Mesh(new THREE.CylinderGeometry(40, 44, 12, 10), towerMat);
      towerBase.position.y = 6;
      tower.add(towerBase);
      tower.position.set(240, 0, 560);
      scene.add(tower);

      const bldg1 = new THREE.Group();
      const bldgMat = new THREE.MeshStandardMaterial({ color: 0x9aa5a8, roughness: 0.9 });
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(120, 70, 60), bldgMat);
      b1.position.y = 35;
      bldg1.add(b1);
      const b2 = new THREE.Mesh(new THREE.BoxGeometry(90, 55, 55), bldgMat);
      b2.position.set(70, 27.5, -20);
      bldg1.add(b2);
      const b3 = new THREE.Mesh(new THREE.BoxGeometry(70, 45, 50), bldgMat);
      b3.position.set(-60, 22.5, 10);
      bldg1.add(b3);
      bldg1.position.set(-360, 0, 430);
      scene.add(bldg1);

      const bldg2 = new THREE.Group();
      const bldgMat2 = new THREE.MeshStandardMaterial({ color: 0x7d8a90, roughness: 0.9 });
      const c1 = new THREE.Mesh(new THREE.BoxGeometry(140, 90, 70), bldgMat2);
      c1.position.y = 45;
      bldg2.add(c1);
      const c2 = new THREE.Mesh(new THREE.BoxGeometry(100, 60, 60), bldgMat2);
      c2.position.set(80, 30, -15);
      bldg2.add(c2);
      bldg2.position.set(-560, 0, 300);
      scene.add(bldg2);
    }

    function setNight(v: boolean) {
      nightMode = v;
      scene.background = new THREE.Color(v ? 0x0b1026 : 0x8ed4a0);
      if (v) scene.fog = new THREE.Fog(0x0b1026, 60, 320);
      else scene.fog = null;
      ambientLight.intensity = v ? 0.35 : 0.9;
      ambientLight.color.set(v ? 0x33445c : 0xffffff);
      dirLight.intensity = v ? 0.55 : 1.2;
      dirLight.color.set(v ? 0xdfe8ff : 0xffffff);
      (ground.material as THREE.MeshStandardMaterial).color.set(v ? 0x0d1a12 : 0x527a52);
    }

    function buildVehicle(v: VehicleDef) {
      const g = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: v.body, roughness: 0.55, metalness: 0.15 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: v.canopy, roughness: 0.6, metalness: 0.1 });
      const frameMat = new THREE.MeshStandardMaterial({ color: v.frame, roughness: 0.6 });
      const w = v.width;
      const h = v.height;
      const depth = w * 0.7;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.62, depth), bodyMat);
      body.position.y = (h * 0.62) / 2;
      g.add(body);
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(w * 0.56, h * 0.2, depth * 0.9), canopyMat);
      canopy.position.y = h * 0.62 + h * 0.2 / 2 - h * 0.05;
      g.add(canopy);
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.1, h * 0.5, depth * 0.9), frameMat);
      frame.position.y = h * 0.25;
      g.add(frame);
      const wheelGeo = new THREE.CylinderGeometry(h * 0.14, h * 0.14, w * 0.14, 12);
      for (const sx of [-1, 1]) {
        const wheel = new THREE.Mesh(wheelGeo, new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 }));
        wheel.position.set(sx * w * 0.28, h * 0.14, sx * depth * 0.45);
        wheel.rotation.z = Math.PI / 2;
        g.add(wheel);
      }
      g.userData = { ...v };
      return g;
    }

    const vehicleGroups: Record<string, THREE.Group> = {};
    for (const v of VEHICLES) vehicleGroups[v.id] = buildVehicle(v);

    let selectedVehicleId = "Baba Auto";
    function selectVehicle(id: string) {
      selectedVehicleId = id;
      const v = VEHICLES.find((x) => x.id === id) || VEHICLES[0];
      playerGroup = vehicleGroups[id];
      playerHeight = v.height;
      playerWidth = v.width;
      playerGroup.position.set(pl, pBottom, 0);
      playerGroup.rotation.x = tilt;
      scene.add(playerGroup);
    }

    function spawnObstacle() {
      const positions: { top: number; name: string }[] = [
        { top: PAD, name: "top" },
        { top: H - PAD - OBS_H, name: "bottom" },
        { top: H / 2 - OBS_H / 2, name: "middle" },
      ];
      let available = positions;
      const last = obstacles[obstacles.length - 1];
      if (last) available = positions.filter((p) => p.name !== last.name);
      const pos = available[Math.floor(Math.random() * available.length)];
      const variation = (Math.random() - 0.5) * 60;
      const top = Math.max(PAD, Math.min(H - PAD - OBS_H, pos.top + variation));
      const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      const og = new THREE.Group();
      const w = OBS_W;
      const h = OBS_H;
      const depth = w * 0.7;
      const bodyMat = new THREE.MeshStandardMaterial({ color: OBSTACLE_COLORS[type].body, roughness: 0.6, metalness: 0.2 });
      const cabinMat = new THREE.MeshStandardMaterial({ color: OBSTACLE_COLORS[type].cabin, roughness: 0.6 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h * 0.7, depth), bodyMat);
      body.position.y = (h * 0.7) / 2;
      og.add(body);
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.7, h * 0.3, depth * 0.95), cabinMat);
      cabin.position.y = h * 0.7 + h * 0.3 / 2 - h * 0.05;
      og.add(cabin);
      const minL = pl - 20;
      const maxL = pl + playerWidth - OBS_W - 10;
      const ol = maxL > minL ? minL + Math.random() * (maxL - minL) : pl;
      og.position.set(ol, top - h, currentGap + Math.random() * 150);
      og.userData = { type, top, h, w };
      obstacles.push(og);

      const coin = new THREE.Mesh(new THREE.SphereGeometry(9, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.25, metalness: 0.8 }));
      coin.position.set(ol, 90, og.position.z - 30);
      coin.userData = { collected: false };
      coins.push(coin);
    }

    function spawnParticles() {
      for (let i = 0; i < 3; i++) {
        if (particles.length >= MAX_PARTICLES) {
          const old = particles.shift();
          if (old) scene.remove(old.mesh);
        }
        const mesh = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshStandardMaterial({ color: 0x225d31, emissive: 0x225d31, emissiveIntensity: 0.6 }));
        mesh.position.set(pl + playerWidth * 0.2, pBottom + playerHeight * 0.7, 0);
        scene.add(mesh);
        particles.push({ mesh, life: PARTICLE_LIFETIME });
      }
    }

    function updateParticles(dt: number) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        p.mesh.position.z -= 30 * dt;
        p.mesh.position.y += (Math.random() - 0.5) * 2 * dt;
        if (p.life <= 0) {
          scene.remove(p.mesh);
          particles.splice(i, 1);
        }
      }
    }

    function update(dt: number) {
      if (gameOver || isPaused || showStartScreen) return;

      const mob = window.innerWidth <= 768 ? 0.7 : 1;
      const speedMult = Math.min(1 + (Math.floor(score / 25) * 0.1), MAX_SPEED_MULT);
      const speed = currentSpeed * speedMult * mob;
      const diffMult = Math.min(1 + (Math.floor(score / 40) * 0.15), MAX_DIFF_MULT);
      const gapNow = currentGap / diffMult;
      const minDist = MIN_DIST * diffMult;

      if (sliding) vel += SLIDE_RESIST * dt;
      else vel += GRAVITY * dt;
      if (vel > MAX_FALL) vel = MAX_FALL;
      pBottom += vel * dt;
      if (pBottom < 0) {
        pBottom = 0;
        vel = 0;
        sliding = false;
      }
      if (pBottom > H - playerHeight) {
        pBottom = H - playerHeight;
        vel = 0;
        sliding = false;
      }

      const targetTilt = vel < 0 ? -TILT_LIFT * Math.min(1, -vel / Math.abs(JUMP_IMPULSE)) : TILT_FALL * Math.min(1, vel / MAX_FALL);
      tilt += (targetTilt - tilt) * Math.min(1, 12 * dt);
      playerGroup.rotation.x = tilt;

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const ob = obstacles[i];
        ob.position.z -= speed * dt;
        const top = ob.userData.top;
        const oh = ob.userData.h;
        const hit = ob.position.z < 60 && ob.position.z > -60 &&
          pl < ob.position.x + ob.userData.w && pl + playerWidth > ob.position.x &&
          pBottom < top && pBottom + playerHeight > top - oh;
        if (hit) {
          gameOver = true;
          if (score > personalBest) {
            personalBest = score;
            window.localStorage.setItem("personalBest", String(personalBest));
          }
          refreshOverlay();
        }
        if (ob.position.z < -60) {
          obstacles.splice(i, 1);
          score++;
        }
      }

      const last = obstacles[obstacles.length - 1];
      if (!last || gapNow - last.position.z >= minDist + Math.random() * 100) spawnObstacle();

      for (let i = coins.length - 1; i >= 0; i--) {
        const c = coins[i];
        if (c.userData.collected) {
          coins.splice(i, 1);
          continue;
        }
        c.position.z -= speed * dt;
        if (c.position.z < 60 && !c.userData.collected &&
          pl < c.position.x + 18 && pl + playerWidth > c.position.x &&
          pBottom + playerHeight > c.position.y - 9 && pBottom < c.position.y + 9) {
          c.userData.collected = true;
          currency += COIN_VALUE;
        }
        if (c.position.z < -60) coins.splice(i, 1);
      }

      updateParticles(dt);

      const lap = Math.min(Math.floor(score / LAP_LENGTH) + 1, LAPS);
      getEl("hudLap").textContent = "Lap: " + lap + " / " + LAPS;
      syncHud();
      if (lap > LAPS && !raceFinished) finishRace();
    }

    function finishRace() {
      raceFinished = true;
      gameOver = true;
      currency += 8;
      if (score > personalBest) {
        personalBest = score;
        window.localStorage.setItem("personalBest", String(personalBest));
      }
      syncHud();
    }

    function loop(t: number) {
      rafId = requestAnimationFrame(loop);
      if (!lastTime) lastTime = t;
      const dt = Math.min((t - lastTime) / 1000, 0.05);
      lastTime = t;
      acc += dt * 1000;
      let frames = 0;
      while (acc >= FRAME_TIME && frames < 4) {
        update(acc / 1000);
        acc -= FRAME_TIME;
        frames++;
      }
      if (frames === 4) acc = 0;
      renderer.render(scene, camera);
      camera.position.set(pl, pBottom + 170, -600);
      camera.lookAt(new THREE.Vector3(pl, 120, 0));
    }

    function hop() {
      if (showStartScreen || gameOver || raceFinished || isPaused) return;
      sliding = true;
      vel = JUMP_IMPULSE;
      steps++;
      spawnParticles();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      if (e.code === "Space" || e.code === "Spacebar") {
        e.preventDefault();
        if (showStartScreen) {
          startRace();
          return;
        }
        hop();
      }
      if (e.code === "KeyP") {
        e.preventDefault();
        if (!showStartScreen && !gameOver && !raceFinished) isPaused = !isPaused;
      }
      if (e.code === "KeyN") setNight(!nightMode);
      if (e.code === "ArrowUp" || e.code === "KeyW") {
        e.preventDefault();
        hop();
      }
      if (e.code === "ArrowDown" || e.code === "KeyS") sliding = false;
    }

    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "Spacebar" || e.code === "ArrowUp" || e.code === "KeyW") sliding = false;
    }

    function onResize() {
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }

    function setDifficulty(d: string) {
      difficulty = d;
      currentSpeed = DIFFS[d].speed;
      currentGap = DIFFS[d].gap;
      getEl("btnEasy").setAttribute("data-active", d === "Easy" ? "Easy" : "");
      getEl("btnMedium").setAttribute("data-active", d === "Medium" ? "Medium" : "");
      getEl("btnHard").setAttribute("data-active", d === "Hard" ? "Hard" : "");
    }

    function buyVehicleById(id: string) {
      const v = VEHICLES.find((x) => x.id === id) || VEHICLES[0];
      if (v.unlocked) {
        selectVehicle(id);
        syncHud();
        return true;
      }
      if (currency >= v.price) {
        currency -= v.price;
        v.unlocked = true;
        selectVehicle(id);
        syncHud();
        return true;
      }
      return false;
    }

    function syncHud() {
      getEl("hudScore").textContent = "Score: " + score;
      getEl("hudCoins").textContent = "Coins: " + currency;
      const lap = Math.min(Math.floor(score / LAP_LENGTH) + 1, LAPS);
      getEl("hudLap").textContent = "Lap: " + lap + " / " + LAPS;
      getEl("btnNight").textContent = nightMode ? "Day" : "Night";
      getEl("btnEasy").setAttribute("data-active", difficulty === "Easy" ? "Easy" : "");
      getEl("btnMedium").setAttribute("data-active", difficulty === "Medium" ? "Medium" : "");
      getEl("btnHard").setAttribute("data-active", difficulty === "Hard" ? "Hard" : "");
      const buyBaba = getEl("buyBaba") as HTMLElement;
      buyBaba.className = "buy-card" + (VEHICLES[0].unlocked ? "" : " locked");
      const buyKarachiQueen = getEl("buyKarachiQueen") as HTMLElement;
      buyKarachiQueen.className = "buy-card" + (VEHICLES[1].unlocked ? "" : " locked");
      const buyHassan = getEl("buyHassan") as HTMLElement;
      buyHassan.className = "buy-card" + (VEHICLES[2].unlocked ? "" : " locked");
      const buyBhatta = getEl("buyBhatta") as HTMLElement;
      buyBhatta.className = "buy-card" + (VEHICLES[3].unlocked ? "" : " locked");
    }

    function refreshOverlay() {
      const show = showStartScreen || gameOver;
      const overlay = getEl("overlay") as HTMLElement;
      overlay.classList.toggle("hidden", !show);
      if (gameOver) {
        (getEl("overlayTitle") as HTMLElement).textContent = "Game Over";
        (getEl("overlaySubtitle") as HTMLElement).textContent = "Score: " + score;
        const overlayScore = getEl("overlayScore") as HTMLElement;
        overlayScore.style.display = "block";
        overlayScore.textContent = "Best: " + personalBest;
      } else {
        (getEl("overlayTitle") as HTMLElement).textContent = "Auto Rush";
        (getEl("overlaySubtitle") as HTMLElement).textContent = "Karachi Grand Prix";
        (getEl("overlaySubtitle") as HTMLElement).textContent = "Press Space to start";
        const overlayScore = getEl("overlayScore") as HTMLElement;
        overlayScore.style.display = "none";
      }
    }

    function startRace() {
      showStartScreen = false;
      gameOver = false;
      raceFinished = false;
      isPaused = false;
      score = 0;
      obstacles = [];
      coins = [];
      particles = [];
      pBottom = H - playerHeight - 30;
      vel = 0;
      tilt = 0;
      sliding = false;
      setDifficulty(difficulty);
      selectVehicle(selectedVehicleId);
      syncHud();
      refreshOverlay();
    }

    function init() {
      initScene();
      playerGroup = vehicleGroups["Baba Auto"];
      playerGroup.position.set(pl, pBottom, 0);
      scene.add(playerGroup);
      syncHud();
      refreshOverlay();
      rafId = requestAnimationFrame(loop);
    }

    const btnStart = getEl("btnStart") as HTMLElement;
    btnStart.addEventListener("click", () => {
      startRace();
    });
    const btnHow = getEl("btnHow") as HTMLElement;
    btnHow.addEventListener("click", () => {
      const overlay = getEl("overlay") as HTMLElement;
      overlay.classList.add("hidden");
      const overlayHow = getEl("overlayHow") as HTMLElement;
      overlayHow.classList.remove("hidden");
    });
    const btnCloseHow = getEl("btnCloseHow") as HTMLElement;
    btnCloseHow.addEventListener("click", () => {
      const overlayHow = getEl("overlayHow") as HTMLElement;
      overlayHow.classList.add("hidden");
      if (showStartScreen || gameOver) refreshOverlay();
    });
    const btnNight = getEl("btnNight") as HTMLElement;
    btnNight.addEventListener("click", () => {
      setNight(!nightMode);
    });
    const btnEasy = getEl("btnEasy") as HTMLElement;
    btnEasy.addEventListener("click", () => {
      setDifficulty("Easy");
    });
    const btnMedium = getEl("btnMedium") as HTMLElement;
    btnMedium.addEventListener("click", () => {
      setDifficulty("Medium");
    });
    const btnHard = getEl("btnHard") as HTMLElement;
    btnHard.addEventListener("click", () => {
      setDifficulty("Hard");
    });
    const buyBaba = getEl("buyBaba") as HTMLElement;
    buyBaba.addEventListener("click", () => {
      buyVehicleById("Baba Auto");
    });
    const buyKarachiQueen = getEl("buyKarachiQueen") as HTMLElement;
    buyKarachiQueen.addEventListener("click", () => {
      buyVehicleById("Karachi Queen");
    });
    const buyHassan = getEl("buyHassan") as HTMLElement;
    buyHassan.addEventListener("click", () => {
      buyVehicleById("Hassan Special");
    });
    const buyBhatta = getEl("buyBhatta") as HTMLElement;
    buyBhatta.addEventListener("click", () => {
      buyVehicleById("Bhatta Express");
    });

    (window as unknown as Record<string, unknown>).__karachi = {
      get score() {
        return score;
      },
      get coins() {
        return currency;
      },
      get steps() {
        return steps;
      },
      get lap() {
        return Math.min(Math.floor(score / LAP_LENGTH) + 1, LAPS);
      },
      get gameOver() {
        return gameOver;
      },
      get raceFinished() {
        return raceFinished;
      },
      get nightMode() {
        return nightMode;
      },
      get isPaused() {
        return isPaused;
      },
      get showStartScreen() {
        return showStartScreen;
      },
      get difficulty() {
        return difficulty;
      },
      get obstacles() {
        return obstacles.length;
      },
      get coinsOnField() {
        return coins.length;
      },
      start: startRace,
      setNight: setNight,
      buy: buyVehicleById,
      setDifficulty: setDifficulty,
      get vehicles() {
        return VEHICLES.map((v) => ({ id: v.id, unlocked: v.unlocked, price: v.price }));
      },
    };

    window.addEventListener("error", (e) => {
      // Surface runtime errors for debugging; game keeps running.
      console.error("KarachiRush error:", e.message);
    });
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      if (showStartScreen) {
        startRace();
        return;
      }
      hop();
    };
    const onPointerUp = () => {
      sliding = false;
    };
    const onPointerCancel = () => {
      sliding = false;
    };
    viewportEl.addEventListener("pointerdown", onPointerDown);
    viewportEl.addEventListener("pointerup", onPointerUp);
    viewportEl.addEventListener("pointercancel", onPointerCancel);
    window.addEventListener("resize", onResize);

    try {
      init();
    } catch (err) {
      console.error("KarachiRush init failed:", err);
    }

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      viewportEl.removeEventListener("pointerdown", onPointerDown);
      viewportEl.removeEventListener("pointerup", onPointerUp);
      viewportEl.removeEventListener("pointercancel", onPointerCancel);
      if (renderer) renderer.dispose();
      if (viewportEl && renderer) viewportEl.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="karachi-rush-root">
      <div id="app">
        <div id="viewport" ref={viewportRef} />
        <div id="hud">
          <div className="hud-score" id="hudScore">
            Score: 0
          </div>
          <div className="hud-coins" id="hudCoins">
            Coins: 0
          </div>
          <div className="hud-lap" id="hudLap">
            Lap: 1 / 3
          </div>
          <div className="hud-right">
            <button className="hud-btn" id="btnNight" type="button">
              Night
            </button>
            <button className="hud-btn" id="btnEasy" type="button">
              Easy
            </button>
            <button className="hud-btn" id="btnMedium" type="button">
              Medium
            </button>
            <button className="hud-btn" id="btnHard" type="button">
              Hard
            </button>
          </div>
          <div id="buybar">
            <div className="buy-card" id="buyBaba">
              Baba Auto — Owned
            </div>
            <div className="buy-card locked" id="buyKarachiQueen">
              Karachi Queen — 3 🪙
            </div>
            <div className="buy-card locked" id="buyHassan">
              Hassan Special — 6 🪙
            </div>
            <div className="buy-card locked" id="buyBhatta">
              Bhatta Express — 10 🪙
            </div>
          </div>
          <div id="overlay" className="overlay">
            <div className="overlay-inner">
              <div className="overlay-title" id="overlayTitle">
                Auto Rush
              </div>
              <div className="overlay-sub">Karachi Grand Prix</div>
              <div className="overlay-sub" id="overlaySubtitle">
                Press Space to start
              </div>
              <div className="overlay-score" id="overlayScore" style={{ display: "none" }}>
                Best: 0
              </div>
              <div className="overlay-actions">
                <button className="overlay-btn" id="btnStart" type="button">
                  Start Race
                </button>
                <button className="overlay-btn secondary" id="btnHow" type="button">
                  How to play
                </button>
              </div>
            </div>
          </div>
          <div id="overlayHow" className="overlay hidden">
            <div className="overlay-inner">
              <div className="overlay-title">How to play</div>
              <div className="overlay-sub">Hop with Space / ↑ / W / tap. Release to slide down.</div>
              <div className="overlay-sub">Coins buy new vehicles. Night mode: N. Pause: P.</div>
              <div className="overlay-actions">
                <button className="overlay-btn" id="btnCloseHow" type="button">
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
