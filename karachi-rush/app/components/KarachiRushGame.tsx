"use client";

import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";
import * as THREE from "three";
import {
  TRACK,
  DISTRICTS,
  VEHICLES,
  RIVALS,
  DIFFICULTIES,
  difficultyById,
  vehicleById,
  OBSTACLE_TUNING,
  uDistanceMeters,
  mulberry32,
  STORAGE_KEYS,
  type VehicleDef,
  type DifficultyDef,
} from "./game/data";

// =============================================================
// TYPES
// =============================================================
type Phase = "menu" | "countdown" | "racing" | "paused" | "finished";
type TimeMode = "day" | "sunset" | "night";
type ObstacleKind = "tyre" | "cone" | "rickshaw" | "breaker" | "oil" | "manhole";

interface Obstacle {
  kind: ObstacleKind;
  u: number; // 0..1 on spline
  lateral: number; // meters from center
  mesh: THREE.Group;
  speed: number; // forward speed m/s (0 for static)
  hitCooldown: number;
  dodged: boolean;
  weavePhase: number;
  curLateral: number; // current lateral position (moves for weaving rickshaws)
}

interface CoinRow {
  u: number;
  lateral: number;
  meshes: THREE.Mesh[];
  collectedLap: number; // lap number it was collected on; -1 = never
}

interface LapSummary {
  lap: number;
  district: string;
  timeSec: number;
  coins: number;
  trapsDodged: number;
}

interface HudView {
  position: number;
  lap: number;
  lapTime: number;
  bestLap: number | null;
  score: number;
  speed: number;
  nitro: number;
  runCoins: number;
  bank: number;
  steps: number;
  distanceM: number;
  trapsDodged: number;
  crashes: number;
  difficulty: string;
  timeMode: TimeMode;
}

interface Controls {
  throttle: number;
  brake: number;
  steer: number;
  nitro: boolean;
  drift: boolean;
}

const SOUND_LABELS: Record<TimeMode, string> = {
  day: "☀️ DAY",
  sunset: "🌅 DUSK",
  night: "🌙 NIGHT",
};

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
};

// =============================================================
// COMPONENT
// =============================================================
export default function KarachiRushGame() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const minimapRef = useRef<HTMLCanvasElement | null>(null);

  // ---- menu / ui state (plain React, engine reads via refs at race start)
  const [runId, setRunId] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("baba");
  const [difficultyId, setDifficultyId] = useState<string>("medium");
  const [totalLaps, setTotalLaps] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [setupOpen, setSetupOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [menuTimeMode, setMenuTimeMode] = useState<TimeMode>("day");
  const [phase, setPhase] = useState<Phase>("menu");
  const [loading, setLoading] = useState(true);
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [countdownNum, setCountdownNum] = useState<number | string>(3);
  const [driftPopup, setDriftPopup] = useState<{ text: string; id: number } | null>(null);
  const [wrongWay, setWrongWay] = useState<boolean>(false);
  const [lapBanner, setLapBanner] = useState<{ district: string; tagline: string; lap: number; coins: number; traps: number; time: number } | null>(null);
  const [finalStats, setFinalStats] = useState<{
    rankings: { rank: number; name: string; time: number }[];
    raceTime: number;
    bestLap: number | null;
    coinsEarned: number;
    distanceM: number;
    steps: number;
    trapsDodged: number;
    crashes: number;
    driftScore: number;
    difficulty: string;
    laps: LapSummary[];
  } | null>(null);
  const [hud, setHud] = useState<HudView>({
    position: 1, lap: 1, lapTime: 0, bestLap: null, score: 0, speed: 0, nitro: 100,
    runCoins: 0, bank: 0, steps: 0, distanceM: 0, trapsDodged: 0, crashes: 0,
    difficulty: "medium", timeMode: "day",
  });

  // ---- refs shared with the engine
  const controlsRef = useRef<Controls>({ throttle: 0, brake: 0, steer: 0, nitro: false, drift: false });
  const vehicleRef = useRef<VehicleDef>(VEHICLES[0]);
  const difficultyRef = useRef<DifficultyDef>(DIFFICULTIES[1]);
  const totalLapsRef = useRef(3);
  const soundEnabledRef = useRef(true);

  // ---- engine trigger surface
  const engineRef = useRef<{
    startRace: () => void;
    togglePause: () => void;
    cycleTimeMode: () => void;
    setTimeMode: (m: TimeMode) => void;
    quitRace: () => void;
  } | null>(null);

  // ---- sound engine
  const soundRef = useRef<{
    init: () => void;
    updateEngine: (speed: number, throttle: boolean, nitro: boolean) => void;
    playDrift: (isDrifting: boolean) => void;
    playNitro: (active: boolean) => void;
    playBeep: (high: boolean) => void;
    playCrash: () => void;
    playCoin: () => void;
    playThud: () => void;
    setMuted: (muted: boolean) => void;
  } | null>(null);

  // -------------------------------------------------------------
  // PROCEDURAL WEB AUDIO SYNTHESIZER
  // -------------------------------------------------------------
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (soundRef.current) soundRef.current.setMuted(!soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let engineOsc: OscillatorNode | null = null;
    let engineGain: GainNode | null = null;
    let driftGain: GainNode | null = null;
    let nitroGain: GainNode | null = null;
    let masterGain: GainNode | null = null;

    const initAudio = () => {
      if (audioCtx) return;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new Ctx();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = soundEnabledRef.current ? 0.8 : 0;
      masterGain.connect(audioCtx.destination);

      engineOsc = audioCtx.createOscillator();
      engineGain = audioCtx.createGain();
      engineOsc.type = "sawtooth";
      engineOsc.frequency.setValueAtTime(22, audioCtx.currentTime);
      engineGain.gain.setValueAtTime(0, audioCtx.currentTime);
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, audioCtx.currentTime);
      engineOsc.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(masterGain);
      engineOsc.start();

      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
      const driftNoise = audioCtx.createBufferSource();
      driftNoise.buffer = noiseBuffer;
      driftNoise.loop = true;
      const driftFilter = audioCtx.createBiquadFilter();
      driftFilter.type = "bandpass";
      driftFilter.frequency.setValueAtTime(1400, audioCtx.currentTime);
      driftFilter.Q.setValueAtTime(4.0, audioCtx.currentTime);
      driftGain = audioCtx.createGain();
      driftGain.gain.setValueAtTime(0, audioCtx.currentTime);
      driftNoise.connect(driftFilter);
      driftFilter.connect(driftGain);
      driftGain.connect(masterGain);
      driftNoise.start();

      const nitroOsc = audioCtx.createOscillator();
      const nitroGainN = audioCtx.createGain();
      nitroOsc.type = "triangle";
      nitroOsc.frequency.setValueAtTime(90, audioCtx.currentTime);
      nitroGainN.gain.setValueAtTime(0, audioCtx.currentTime);
      nitroOsc.connect(nitroGainN);
      nitroGainN.connect(masterGain);
      nitroOsc.start();
      nitroGain = nitroGainN;
    };

    const beep = (freq: number, dur: number, vol: number, type: OscillatorType = "sine") => {
      if (!audioCtx || !masterGain) return;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
      osc.connect(g);
      g.connect(masterGain);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    };

    soundRef.current = {
      init: initAudio,
      updateEngine: (speed, throttle, nitro) => {
        if (!audioCtx || !engineOsc || !engineGain) return;
        const base = 24 + speed * 1.8 + (throttle ? 18 : 0) + (nitro ? 28 : 0);
        engineOsc.frequency.setTargetAtTime(Math.min(180, base), audioCtx.currentTime, 0.05);
        const gv = 0.08 + Math.min(0.2, (speed / 50) * 0.15) + (throttle ? 0.05 : 0);
        engineGain.gain.setTargetAtTime(gv, audioCtx.currentTime, 0.05);
      },
      playDrift: (d) => {
        if (!audioCtx || !driftGain) return;
        driftGain.gain.setTargetAtTime(d ? 0.18 : 0, audioCtx.currentTime, 0.08);
      },
      playNitro: (a) => {
        if (!audioCtx || !nitroGain) return;
        nitroGain.gain.setTargetAtTime(a ? 0.25 : 0, audioCtx.currentTime, 0.05);
      },
      playBeep: (high) => beep(high ? 880 : 440, high ? 0.5 : 0.25, 0.3),
      playCrash: () => beep(120, 0.3, 0.4, "square"),
      playCoin: () => {
        beep(1320, 0.09, 0.22, "triangle");
        setTimeout(() => beep(1980, 0.12, 0.22, "triangle"), 60);
      },
      playThud: () => beep(80, 0.18, 0.3, "square"),
      setMuted: (muted) => {
        if (masterGain && audioCtx) {
          masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, audioCtx.currentTime, 0.05);
        }
      },
    };
    return () => {
      if (audioCtx && audioCtx.state !== "closed") audioCtx.close().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  // -------------------------------------------------------------
  // PERSISTED ECONOMY (coins bank, unlocks)
  // -------------------------------------------------------------
  const readBank = useCallback((): number => {
    try {
      return parseInt(window.localStorage.getItem(STORAGE_KEYS.bank) || "0", 10) || 0;
    } catch {
      return 0;
    }
  }, []);
  const writeBank = useCallback((v: number) => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.bank, String(Math.max(0, Math.round(v))));
    } catch { /* ignore */ }
  }, []);
  const readUnlocked = useCallback((): string[] => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.unlocked);
      if (raw) return JSON.parse(raw) as string[];
    } catch { /* ignore */ }
    return ["baba"];
  }, []);
  const writeUnlocked = useCallback((ids: string[]) => {
    try {
      window.localStorage.setItem(STORAGE_KEYS.unlocked, JSON.stringify(ids));
    } catch { /* ignore */ }
  }, []);

  const [bank, setBank] = useState(0);
  const [unlocked, setUnlocked] = useState<string[]>(["baba"]);

  useEffect(() => {
    setBank(readBank());
    setUnlocked(readUnlocked());
    const lastDiff = window.localStorage.getItem(STORAGE_KEYS.difficulty);
    if (lastDiff && DIFFICULTIES.some((d) => d.id === lastDiff)) setDifficultyId(lastDiff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buyVehicle = useCallback((id: string) => {
    const v = vehicleById(id);
    if (!v || v.price <= 0) return;
    const curBank = readBank();
    if (curBank >= v.price && !readUnlocked().includes(id)) {
      writeBank(curBank - v.price);
      writeUnlocked([...readUnlocked(), id]);
      setBank(curBank - v.price);
      setUnlocked([...readUnlocked(), id]);
      soundRef.current?.playCoin();
    }
  }, [readBank, writeBank, readUnlocked, writeUnlocked]);

  // =============================================================
  // THREE.JS 3D RACE ENGINE (built once per run)
  // =============================================================
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let renderer!: THREE.WebGLRenderer;
    let scene!: THREE.Scene;
    let camera!: THREE.PerspectiveCamera;
    let ambientLight!: THREE.AmbientLight;
    let dirLight!: THREE.DirectionalLight;
    let headLight!: THREE.SpotLight;
    let animId = 0;
    let disposed = false;

    // ---- spline
    const splinePoints = TRACK.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const spline = new THREE.CatmullRomCurve3(splinePoints, true, "centripetal");
    const trackLength = spline.getLength();

    // ---- engine-local state
    const vehicleDef = vehicleById(selectedVehicle);
    vehicleRef.current = vehicleDef;
    difficultyRef.current = difficultyById(window.localStorage.getItem(STORAGE_KEYS.difficulty) || difficultyId);

    let playerU = 0.0;
    let playerSpeed = 0.0;
    let wrongWayNow = false;
    let prevPlayerU = 0.0;
    let playerLateral = 0.0;
    let playerSteerAngle = 0.0;
    let playerNitro = 100.0;
    let playerLap = 1;
    let lapReady = false;
    let lapStartWall = 0;
    let raceTimer = 0;
    let totalScore = 0;
    let runCoins = 0;
    let lapsRunCoins = 0;
    let trapsDodged = 0;
    let crashes = 0;
    let distanceMeters = 0;
    let bestLapSec: number | null = null; // re-read from storage at each race start
    let crashTimer = 0;
    let gripLossTimer = 0;
    let isDriftingNow = false;
    let manPhase: Phase = "menu"; // engine mirror of the React phase

    interface AIRivalInstance {
      name: string;
      group: THREE.Group;
      frontWheel: THREE.Object3D;
      u: number;
      speed: number; // m/s
      lateralOffset: number;
      dist: number; // total meters traveled (negative = behind the start line)
    }
    const rivals: AIRivalInstance[] = [];
    const rivalTagMeshes: THREE.Mesh[] = [];
    const windowMats: THREE.MeshStandardMaterial[] = [];
    const obstacles: Obstacle[] = [];
    const coinRows: CoinRow[] = [];
    const lapSummaries: LapSummary[] = [];

    // ---------------------------------------------------------
    // 3D Procedural Auto-Rickshaw Builder
    // ---------------------------------------------------------
    function createRickshawModel(bodyHex: string, canopyHex: string, frameHex: string, isPlayerVehicle = false, nameTag = "AI RACER") {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyHex), metalness: 0.25, roughness: 0.5 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(canopyHex), metalness: 0.05, roughness: 0.7 });
      const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(frameHex), metalness: 0.7, roughness: 0.3 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.9, roughness: 0.1 });
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, roughness: 0.1, transmission: 0.8 });

      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 3.6), bodyMat);
      bodyMesh.position.set(0, 1.2, 0);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      const nose = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 1.6, 6), bodyMat);
      nose.position.set(0, 1.1, 2.2);
      nose.rotation.x = Math.PI / 2;
      nose.castShadow = true;
      group.add(nose);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.2), glassMat);
      glass.position.set(0, 2.3, 1.8);
      glass.rotation.x = -Math.PI / 10;
      group.add(glass);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.25, 3.4), canopyMat);
      roof.position.set(0, 2.9, -0.1);
      roof.castShadow = true;
      group.add(roof);

      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
      for (const sx of [-1.1, 1.1]) {
        for (const sz of [-1.6, 1.5]) {
          const bar = new THREE.Mesh(barGeo, frameMat);
          bar.position.set(sx, 2.1, sz);
          group.add(bar);
        }
      }

      const lamp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.25, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0xfff6c5, emissive: 0xffe066, emissiveIntensity: 0.6 })
      );
      lamp.rotation.x = Math.PI / 2;
      lamp.position.set(0, 1.2, 3.1);
      group.add(lamp);

      const fork = new THREE.Group();
      fork.position.set(0, 0.55, 2.3);
      const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      const fWheel = new THREE.Mesh(wheelGeo, rubberMat);
      fWheel.castShadow = true;
      fork.add(fWheel);
      group.add(fork);

      for (const sx of [-1.25, 1.25]) {
        const rWheel = new THREE.Mesh(wheelGeo, rubberMat);
        rWheel.position.set(sx, 0.55, -1.2);
        rWheel.castShadow = true;
        group.add(rWheel);
      }

      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8), chromeMat);
      exhaust.rotateX(Math.PI / 2);
      exhaust.position.set(0.7, 0.5, -1.9);
      group.add(exhaust);

      for (const sx of [-0.9, 0.9]) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.2, 0.1),
          new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0xff0033, emissiveIntensity: 0.8 }));
        tail.position.set(sx, 1.2, -1.85);
        group.add(tail);
      }

      if (!isPlayerVehicle) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(18, 18, 20, 0.85)";
          ctx.fillRect(4, 4, 248, 56);
          ctx.strokeStyle = bodyHex;
          ctx.lineWidth = 4;
          ctx.strokeRect(4, 4, 248, 56);
          ctx.font = "800 26px sans-serif";
          ctx.fillStyle = "#f2f2ee";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(nameTag, 128, 33);
        }
        const tex = new THREE.CanvasTexture(canvas);
        const tag = new THREE.Mesh(
          new THREE.PlaneGeometry(2.6, 0.65),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        tag.position.set(0, 3.9, 0);
        group.add(tag);
        rivalTagMeshes.push(tag);
      }

      return { group, frontWheel: fork };
    }

    // ---------------------------------------------------------
    // KARACHI LANDMARK BUILDERS (named, band-placed)
    // ---------------------------------------------------------
    function splineFrame(u: number) {
      const pt = spline.getPointAt(u);
      const tangent = spline.getTangentAt(u).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      return { pt, tangent, normal };
    }

    function placeAt(u: number, side: number, dist: number, build: (h: number) => THREE.Group) {
      const { pt, normal } = splineFrame(u);
      const g = build(dist);
      g.position.set(
        pt.x + normal.x * side * dist,
        0,
        pt.z + normal.z * side * dist
      );
      g.lookAt(0, g.position.y, 0);
      scene.add(g);
    }

    function buildChaarMinar(): THREE.Group {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xe8dcc4, roughness: 0.85 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 26), mat);
      base.position.y = 1;
      g.add(base);
      for (const sx of [-8, 8]) for (const sz of [-8, 8]) {
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.9, 24, 10), mat);
        pillar.position.set(sx, 14, sz);
        pillar.castShadow = true;
        g.add(pillar);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), new THREE.MeshStandardMaterial({ color: 0x1E7A38, roughness: 0.6 }));
        cap.position.set(sx, 27.5, sz);
        g.add(cap);
      }
      const dome = new THREE.Mesh(new THREE.SphereGeometry(6, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0x1E7A38, roughness: 0.55 }));
      dome.position.y = 4;
      g.add(dome);
      const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 7, 6), mat);
      spire.position.y = 14;
      g.add(spire);
      return g;
    }

    function buildEmpressMarket(): THREE.Group {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xb98a6e, roughness: 0.9 });
      const hall = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 20), mat);
      hall.position.y = 7;
      hall.castShadow = true;
      g.add(hall);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(4, 4.5, 34, 10), mat);
      tower.position.set(-17, 17, 4);
      tower.castShadow = true;
      g.add(tower);
      const clock = new THREE.Mesh(new THREE.CircleGeometry(2.6, 12),
        new THREE.MeshStandardMaterial({ color: 0xfff3b0, emissive: 0x3d3000, emissiveIntensity: 0.4 }));
      clock.position.set(-17, 28, 8.6);
      g.add(clock);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(5.5, 7, 10), new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 0.8 }));
      roof.position.set(-17, 37, 4);
      g.add(roof);
      return g;
    }

    function buildHabibBankPlaza(): THREE.Group {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0xdfe8ff, roughness: 0.4, metalness: 0.7 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(16, 20, 150, 16), mat);
      body.position.y = 75;
      body.castShadow = true;
      g.add(body);
      const spire = new THREE.Mesh(new THREE.ConeGeometry(16, 44, 16), mat);
      spire.position.y = 172;
      g.add(spire);
      return g;
    }

    function buildBoultonMarketArch(): THREE.Group {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: 0x8a6f52, roughness: 0.9 });
      const legL = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 3), mat);
      legL.position.set(-19, 8, 0);
      g.add(legL);
      const legR = legL.clone();
      legR.position.x = 19;
      g.add(legR);
      const arch = new THREE.Mesh(new THREE.BoxGeometry(42, 4, 3), mat);
      arch.position.y = 16;
      g.add(arch);
      return g;
    }

    function buildMazarEQuaid(): THREE.Group {
      const g = new THREE.Group();
      const white = new THREE.MeshStandardMaterial({ color: 0xf2f0e8, roughness: 0.7 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(36, 10, 36), white);
      base.position.y = 5;
      base.castShadow = true;
      g.add(base);
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(13, 14.5, 12, 12), white);
      drum.position.y = 16;
      g.add(drum);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(13, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), white);
      dome.position.y = 22;
      dome.castShadow = true;
      g.add(dome);
      for (const sx of [-16, 16]) for (const sz of [-16, 16]) {
        const minaret = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 34, 8), white);
        minaret.position.set(sx, 17, sz);
        g.add(minaret);
        const top = new THREE.Mesh(new THREE.ConeGeometry(1.4, 4, 8), white);
        top.position.set(sx, 36, sz);
        g.add(top);
      }
      return g;
    }

    function buildSerenaTower(): THREE.Group {
      const g = new THREE.Group();
      const glass = new THREE.MeshStandardMaterial({ color: 0x2b3a55, roughness: 0.25, metalness: 0.85 });
      const tower = new THREE.Mesh(new THREE.BoxGeometry(22, 70, 22), glass);
      tower.position.y = 35;
      tower.castShadow = true;
      g.add(tower);
      const crown = new THREE.Mesh(new THREE.BoxGeometry(24, 3, 24), new THREE.MeshStandardMaterial({ color: 0xf2b632, metalness: 0.6, roughness: 0.4 }));
      crown.position.y = 71.5;
      g.add(crown);
      return g;
    }

    function buildBillboard(text: string): THREE.Group {
      const g = new THREE.Group();
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x333a3f, metalness: 0.6, roughness: 0.4 });
      for (const sx of [-9, 9]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 18, 8), poleMat);
        p.position.set(sx, 9, 0);
        g.add(p);
      }
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0b1026";
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = "#f2b632";
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 500, 116);
        ctx.font = "800 52px sans-serif";
        ctx.fillStyle = "#f2b632";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 256, 66);
      }
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(22, 5.5),
        new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), side: THREE.DoubleSide })
      );
      panel.position.y = 15;
      g.add(panel);
      return g;
    }

    // ---------------------------------------------------------
    // SCENE INITIALIZATION
    // ---------------------------------------------------------
    function initScene() {
      if (!viewport) return;
      const width = viewport.clientWidth || 850;
      const height = viewport.clientHeight || 500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(TRACK.daySky);
      scene.fog = new THREE.FogExp2(TRACK.daySky, 0.0018);
      camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 3000);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      viewport.innerHTML = "";
      viewport.appendChild(renderer.domElement);

      ambientLight = new THREE.AmbientLight(TRACK.ambientDay, 0.95);
      scene.add(ambientLight);
      dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
      dirLight.position.set(200, 400, 150);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 1200;
      const d = 350;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      scene.add(dirLight);
      headLight = new THREE.SpotLight(0xfff6c5, 0, 180, Math.PI / 4, 0.3, 1);
      headLight.position.set(0, 2, 2);
      scene.add(headLight);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshStandardMaterial({ color: TRACK.groundColor, roughness: 0.9 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      ground.receiveShadow = true;
      scene.add(ground);

      buildTrackMesh();
      buildLandmarks();
    }

    function buildTrackMesh() {
      const segments = 240;
      const roadW = TRACK.roadWidth;
      const halfW = roadW / 2;

      const roadPositions: number[] = [];
      const roadNormals: number[] = [];
      const roadUvs: number[] = [];
      const curbL: number[] = [];
      const curbR: number[] = [];

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const { pt, tangent, normal } = splineFrame(u);
        const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);
        const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);

        roadPositions.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
        roadPositions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);
        roadNormals.push(0, 1, 0, 0, 1, 0);
        roadUvs.push(0, u * 40, 1, u * 40);

        const curbWidth = 1.4;
        const curbLOuter = new THREE.Vector3().copy(leftPt).addScaledVector(normal, curbWidth);
        curbL.push(leftPt.x, leftPt.y + 0.15, leftPt.z, curbLOuter.x, curbLOuter.y + 0.1, curbLOuter.z);
        const curbROuter = new THREE.Vector3().copy(rightPt).addScaledVector(normal, -curbWidth);
        curbR.push(rightPt.x, rightPt.y + 0.15, rightPt.z, curbROuter.x, curbROuter.y + 0.1, curbROuter.z);
      }

      const roadIndices: number[] = [];
      for (let i = 0; i < segments; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d2 = (i + 1) * 2 + 1;
        roadIndices.push(a, b, c, b, d2, c);
      }

      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPositions, 3));
      roadGeo.setAttribute("normal", new THREE.Float32BufferAttribute(roadNormals, 3));
      roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(roadUvs, 2));
      roadGeo.setIndex(roadIndices);
      const roadMesh = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: 0x22252a, roughness: 0.8, metalness: 0.1 }));
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);

      for (const pts of [curbL, curbR]) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        g.setIndex(roadIndices);
        const isL = pts === curbL;
        const curb = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: isL ? 0xd90429 : 0xf2f0e8, roughness: 0.7 }));
        scene.add(curb);
      }

      // Center dashed lane marking
      const dashMat = new THREE.MeshStandardMaterial({ color: 0xf2f0e8, emissive: 0x222222, emissiveIntensity: 0.1 });
      const dashGeo = new THREE.BoxGeometry(0.4, 0.08, 4.5);
      for (let i = 0; i < segments; i += 3) {
        const u = i / segments;
        const { pt, tangent } = splineFrame(u);
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.copy(pt);
        dash.position.y += 0.12;
        dash.lookAt(new THREE.Vector3().copy(pt).add(tangent));
        scene.add(dash);
      }

      // Edge lines (solid white, just inside curbs)
      for (const side of [1, -1]) {
        const pts: number[] = [];
        for (let i = 0; i <= segments; i++) {
          const u = i / segments;
          const { pt, normal } = splineFrame(u);
          const x = pt.x + normal.x * side * (halfW - 0.9);
          const z = pt.z + normal.z * side * (halfW - 0.9);
          pts.push(x, pt.y + 0.09, z);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: 0xf2f0e8 }));
        scene.add(line);
      }
      const { pt, tangent } = splineFrame(0);
      const gantry = new THREE.Group();
      gantry.position.copy(pt);
      gantry.lookAt(new THREE.Vector3().copy(pt).add(tangent));
      const pillarGeo = new THREE.BoxGeometry(1.5, 12, 1.5);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2e, metalness: 0.8 });
      const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
      pillarL.position.set(-halfW - 2, 6, 0);
      gantry.add(pillarL);
      const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
      pillarR.position.set(halfW + 2, 6, 0);
      gantry.add(pillarR);
      const archMat = new THREE.MeshStandardMaterial({ color: 0xf2b632, emissive: 0x6b4d00, emissiveIntensity: 0.5 });
      const arch = new THREE.Mesh(new THREE.BoxGeometry(roadW + 6, 2.5, 2), archMat);
      arch.position.set(0, 12, 0);
      gantry.add(arch);
      scene.add(gantry);
    }

    function buildLandmarks() {
      // Sadar band
      placeAt(0.10, 1, 40, () => buildChaarMinar());
      placeAt(0.20, -1, 36, () => buildEmpressMarket());
      // II Chundrigar band
      placeAt(0.45, 1, 55, () => buildHabibBankPlaza());
      placeAt(0.56, -1, 34, () => buildBoultonMarketArch());
      // Clifton band
      placeAt(0.78, 1, 48, () => buildMazarEQuaid());
      placeAt(0.90, -1, 38, () => buildSerenaTower());
      // Billboard at the final bend
      placeAt(0.97, 1, 30, () => buildBillboard("SEA VIEW • CLIFTON"));

      // generic city fill
      const rng = mulberry32(7021);
      const bldgMatDay = new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.85 });
      const bldgMatGlass = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.3, metalness: 0.8 });
      const bldgMatBrick = new THREE.MeshStandardMaterial({ color: 0x7a5a4a, roughness: 0.9 });
      const mats = [bldgMatDay, bldgMatGlass, bldgMatBrick];
      for (let i = 0; i < 90; i++) {
        const u = (i / 90 + rng() * 0.05) % 1.0;
        const { pt, normal } = splineFrame(u);
        const side = i % 2 === 0 ? 1 : -1;
        const dist = TRACK.roadWidth * 0.6 + 18 + rng() * 70;
        const bw = 20 + rng() * 30;
        const bd = 20 + rng() * 30;
        const bh = 60 + rng() * 160;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mats[i % 3]);
        mesh.position.set(pt.x + normal.x * side * dist, bh / 2, pt.z + normal.z * side * dist);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        // window strip for glass buildings
        if (i % 3 === 1) {
          const winMat = new THREE.MeshStandardMaterial({ color: 0xf2b632, emissive: 0xf2b632, emissiveIntensity: 0.35, transparent: true, opacity: 0.6 });
          windowMats.push(winMat);
          const win = new THREE.Mesh(new THREE.PlaneGeometry(bw * 0.85, bh * 0.7), winMat);
          win.position.set(pt.x + normal.x * side * (dist - bd / 2 - 0.5), bh / 2, pt.z + normal.z * side * (dist - bd / 2 - 0.5));
          win.lookAt(new THREE.Vector3(pt.x, bh / 2, pt.z));
          scene.add(win);
        }
        if (i % 2 === 0) {
          const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 10, 8), new THREE.MeshStandardMaterial({ color: 0x444444 }));
          const dk = TRACK.roadWidth / 2 + 2;
          lampPost.position.set(pt.x + normal.x * side * dk, 5, pt.z + normal.z * side * dk);
          scene.add(lampPost);
        }
      }

      // far skyline ring (fills the horizon, no shadows)
      const rng2 = mulberry32(9091);
      const skyMat = new THREE.MeshStandardMaterial({ color: 0x57607a, roughness: 1, metalness: 0 });
      for (let i = 0; i < 26; i++) {
        const u = (i / 26 + rng2() * 0.1) % 1.0;
        const { pt, normal } = splineFrame(u);
        const side = i % 2 === 0 ? 1 : -1;
        const dist = TRACK.roadWidth * 0.6 + 160 + rng2() * 220;
        const bw = 60 + rng2() * 80;
        const bd = 60 + rng2() * 80;
        const bh = 90 + rng2() * 170;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), skyMat);
        mesh.position.set(pt.x + normal.x * side * dist, bh / 2, pt.z + normal.z * side * dist);
        scene.add(mesh);
      }
    }

    // ---------------------------------------------------------
    // TRAP SYSTEM — 6 kinds, generated seeded per run
    // ---------------------------------------------------------
    function makeStaticTrapMesh(kind: ObstacleKind): THREE.Group {
      const g = new THREE.Group();
      const rubber = new THREE.MeshStandardMaterial({ color: 0x1e1e22, roughness: 0.95 });
      if (kind === "tyre") {
        for (const sy of [0.55, 1.35, 2.15]) {
          const t = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.42, 10, 18), rubber);
          t.rotation.x = Math.PI / 2;
          t.position.y = sy;
          t.castShadow = true;
          g.add(t);
        }
        const paint = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.2, 8, 18), new THREE.MeshStandardMaterial({ color: 0xf2f0e8 }));
        paint.rotation.x = Math.PI / 2;
        paint.position.y = 2.15;
        g.add(paint);
      } else if (kind === "cone") {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.6, 10), new THREE.MeshStandardMaterial({ color: 0xd35400, roughness: 0.7 }));
        cone.position.y = 0.8;
        cone.castShadow = true;
        g.add(cone);
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.28, 10), new THREE.MeshStandardMaterial({ color: 0xf2f0e8 }));
        band.position.y = 0.95;
        g.add(band);
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 1.1), rubber);
        base.position.y = 0.05;
        g.add(base);
      }
      return g;
    }

    function makeTrapRickshaw(): { group: THREE.Group; frontWheel: THREE.Object3D } {
      const colors = ["#8a4fff", "#c0392b", "#1e6f5c"];
      const c = colors[Math.floor(Math.random() * colors.length)];
      return createRickshawModel(c, "#FFF3B0", "#222222", false, "SLOW!");
    }

    function makeZoneMesh(kind: ObstacleKind): THREE.Group {
      const g = new THREE.Group();
      const planeGeo = new THREE.PlaneGeometry(kind === "breaker" ? 4.5 : 7, kind === "breaker" ? 2.4 : 4);
      planeGeo.rotateX(-Math.PI / 2);
      const mat =
        kind === "breaker" ? new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.9 })
          : kind === "oil" ? new THREE.MeshStandardMaterial({ color: 0x0e0e12, roughness: 0.15, metalness: 0.9 })
            : new THREE.MeshStandardMaterial({ color: 0x101014, roughness: 0.9 });
      const m = new THREE.Mesh(planeGeo, mat);
      m.position.y = kind === "breaker" ? 0.32 : 0.08;
      g.add(m);
      if (kind === "breaker") {
        const stripes = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.12, 0.4), new THREE.MeshStandardMaterial({ color: 0xf2f0e8 }));
        stripes.position.y = 0.36;
        g.add(stripes);
      }
      return g;
    }

    function generateRaceObjects(diff: DifficultyDef) {
      // deterministic per difficulty so runs are reproducible for tests
      const seed = diff.id === "easy" ? 1010 : diff.id === "medium" ? 2020 : 3030;
      const rng = mulberry32(seed);
      const count = Math.round((({ easy: 16, medium: 26, hard: 40 } as Record<"easy" | "medium" | "hard", number>)[diff.id]) * diff.obstacleDensityMult);
      const statics: ObstacleKind[] = ["tyre", "tyre", "cone", "rickshaw", "manhole", "oil", "breaker"];
      const staticMeshCache = {
        tyre: makeStaticTrapMesh("tyre"),
        cone: makeStaticTrapMesh("cone"),
      };
      const startMeters = 0.05 * trackLength;
      const available = trackLength - 30 - startMeters; // keep clear of the finish line
      const avgBase = available / count;
      // stratified placement: exactly `count` obstacles, gaps never below
      // OBSTACLE_TUNING.minGapMeters (38m) for fairness
      const jitter = Math.max(0, Math.min(avgBase - OBSTACLE_TUNING.minGapMeters, avgBase * 0.8));

      for (let i = 0; i < count; i++) {
        const targetMeters = startMeters + (i + 0.5) * avgBase + (rng() - 0.5) * jitter;
        const u = targetMeters / trackLength;
        const kind = statics[Math.floor(rng() * statics.length)];
        const lateral = (rng() * 2 - 1) * (TRACK.roadWidth * 0.42);
        let mesh: THREE.Group;
        let obstacleSpeed = 0;
        if (kind === "tyre" || kind === "cone") {
          mesh = (kind === "tyre" ? staticMeshCache.tyre : staticMeshCache.cone).clone();
        } else if (kind === "rickshaw") {
          const t = makeTrapRickshaw();
          mesh = t.group;
          obstacleSpeed = OBSTACLE_TUNING.rickshawSpeed;
        } else {
          mesh = makeZoneMesh(kind);
        }
        // place mesh
        const { pt, tangent, normal } = splineFrame(u);
        mesh.position.set(
          pt.x + normal.x * lateral,
          pt.y,
          pt.z + normal.z * lateral
        );
        mesh.lookAt(new THREE.Vector3().copy(pt).add(tangent));
        scene.add(mesh);
        obstacles.push({ kind, u, lateral, mesh, speed: obstacleSpeed, hitCooldown: 0, dodged: false, weavePhase: rng() * Math.PI * 2, curLateral: lateral });
      }

      // coin rows
      for (let r = 0; r < OBSTACLE_TUNING.coinRowsPerLap; r++) {
        const u = ((r + 1) / (OBSTACLE_TUNING.coinRowsPerLap + 1)) % 1.0;
        const lateral = (rng() * 2 - 1) * (TRACK.roadWidth * 0.36);
        const meshes: THREE.Mesh[] = [];
        for (let c = 0; c < 3; c++) {
          const cu = (u + (c * 8) / trackLength) % 1.0;
          const { pt, normal } = splineFrame(cu);
          const coin = new THREE.Mesh(
            new THREE.TorusGeometry(1.0, 0.28, 8, 20),
            new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.85, roughness: 0.25, emissive: 0x6b5000, emissiveIntensity: 0.5 })
          );
          coin.position.set(pt.x + normal.x * lateral, pt.y + 2.0, pt.z + normal.z * lateral);
          coin.rotation.y = Math.random() * Math.PI;
          (coin.userData as { baseY: number }).baseY = coin.position.y;
          scene.add(coin);
          meshes.push(coin);
        }
        coinRows.push({ u, lateral, meshes, collectedLap: -1 });
      }
    }

    function clearRaceObjects() {
      for (const o of obstacles) {
        scene.remove(o.mesh);
        o.mesh.traverse((n) => {
          if (n instanceof THREE.Mesh) {
            n.geometry.dispose();
            if (Array.isArray(n.material)) n.material.forEach((m) => m.dispose());
            else n.material.dispose();
          }
        });
      }
      obstacles.length = 0;
      for (const row of coinRows) {
        for (const m of row.meshes) {
          scene.remove(m);
          m.geometry.dispose();
          if (Array.isArray(m.material)) m.material.forEach((mm) => mm.dispose());
          else m.material.dispose();
        }
      }
      coinRows.length = 0;
    }

    // ---------------------------------------------------------
    // PLAYER + RIVALS SPAWN
    // ---------------------------------------------------------
    initScene();

    const playerRickshaw = createRickshawModel(vehicleDef.bodyColor, vehicleDef.canopyColor, vehicleDef.frameColor, true);
    scene.add(playerRickshaw.group);

    RIVALS.forEach((rival, idx) => {
      const model = createRickshawModel(rival.bodyColor, rival.canopyColor, "#222222", false, rival.name);
      scene.add(model.group);
      // grid start: staggered 6m behind the start line (negative traveled distance)
      const startDist = -(12 + idx * 6);
      const startU = ((startDist / trackLength) % 1 + 1) % 1;
      rivals.push({
        name: rival.name,
        group: model.group,
        frontWheel: model.frontWheel,
        u: startU,
        speed: 10,
        lateralOffset: rival.targetOffset * (TRACK.roadWidth * 0.35),
        dist: startDist,
      });
    });

    // =========================================================
    // TIME OF DAY
    // =========================================================
    function applyTimeMode(mode: TimeMode) {
      if (!scene || !ambientLight || !dirLight || !headLight) return;
      if (mode === "day") {
        scene.background = new THREE.Color(TRACK.daySky);
        scene.fog = new THREE.FogExp2(TRACK.daySky, 0.0018);
        ambientLight.intensity = 0.95;
        ambientLight.color.set(TRACK.ambientDay);
        dirLight.intensity = 1.6;
        dirLight.color.set(0xffffff);
        headLight.intensity = 0;
      } else if (mode === "sunset") {
        scene.background = new THREE.Color(TRACK.sunsetSky);
        scene.fog = new THREE.FogExp2(TRACK.sunsetSky, 0.0025);
        ambientLight.intensity = 0.6;
        ambientLight.color.set(0xffab91);
        dirLight.intensity = 1.0;
        dirLight.color.set(0xff9800);
        headLight.intensity = 0.8;
      } else {
        scene.background = new THREE.Color(TRACK.nightSky);
        scene.fog = new THREE.FogExp2(TRACK.nightSky, 0.0035);
        ambientLight.intensity = 0.25;
        ambientLight.color.set(0x3d4a68);
        dirLight.intensity = 0.45;
        dirLight.color.set(0x8fa4d2);
        headLight.intensity = 3.5;
      }
      const winInt = mode === "night" ? 0.9 : mode === "sunset" ? 0.55 : 0.35;
      for (const m of windowMats) m.emissiveIntensity = winInt;
    }
    applyTimeMode("day");

    // =========================================================
    // RACE LIFECYCLE TRIGGERS
    // =========================================================
    let countdownInterval: ReturnType<typeof setInterval> | null = null;

    const startRaceInternal = () => {
      soundRef.current?.init();
      // reset player state
      playerU = 0;
      playerSpeed = 0;
      playerLateral = 0;
      playerSteerAngle = 0;
      playerNitro = 100;
      playerLap = 1;
      lapReady = false;
      raceTimer = 0;
      totalScore = 0;
      runCoins = 0;
      lapsRunCoins = 0;
      trapsDodged = 0;
      crashes = 0;
      distanceMeters = 0;
      crashTimer = 0;
      gripLossTimer = 0;
      lapSummaries.length = 0;
      try {
        const blRaw = window.localStorage.getItem(STORAGE_KEYS.bestLap);
        bestLapSec = blRaw ? parseFloat(blRaw) || null : null;
      } catch { bestLapSec = null; }

      clearRaceObjects();
      generateRaceObjects(difficultyRef.current);
      applyTimeMode("day");
      onBanner({ district: "SADAR", tagline: "EMPRESS MARKET • CHAAR MINAR", lap: 1, coins: -1, traps: 0, time: 0 });
      rivals.forEach((rival, idx) => {
        const startDist = -(12 + idx * 6);
        rival.dist = startDist;
        rival.u = ((startDist / trackLength) % 1 + 1) % 1;
        rival.speed = 10;
      });

      setPhaseState("countdown");
      setCountdownNum(3);
      soundRef.current?.playBeep(false);
      let count = 3;
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdownNum(count);
          soundRef.current?.playBeep(false);
        } else if (count === 0) {
          setCountdownNum("GO!");
          soundRef.current?.playBeep(true);
        } else {
          if (countdownInterval) clearInterval(countdownInterval);
          countdownInterval = null;
          lapStartWall = performance.now();
          setPhaseState("racing");
        }
      }, 900);
    };

    const setPhaseState = (p: Phase) => {
      manPhase = p;
      setPhase(p);
    };

    engineRef.current = {
      startRace: startRaceInternal,
      togglePause: () => {
        setPhaseState(manPhase === "racing" ? "paused" : manPhase === "paused" ? "racing" : manPhase);
      },
      cycleTimeMode: () => {
        // manual live toggle: day -> sunset -> night
        const curBg = scene.background as THREE.Color | null;
        if (!curBg) return applyTimeMode("day");
        if (curBg.getHex() === TRACK.daySky) applyTimeMode("sunset");
        else if (curBg.getHex() === TRACK.sunsetSky) applyTimeMode("night");
        else applyTimeMode("day");
      },
      setTimeMode: (m: TimeMode) => applyTimeMode(m),
      quitRace: () => {
        if (countdownInterval) clearInterval(countdownInterval);
        countdownInterval = null;
        clearRaceObjects();
        setPhaseState("menu");
        setWrongWay(false);
      },
    };

    // =========================================================
    // DEBUG / TEST API
    // =========================================================
    (window as unknown as { __rush: unknown }).__rush = {
      get: () => ({
        phase: manPhase,
        lap: playerLap,
        playerU: playerU.toFixed(4),
        lateral: Math.round(playerLateral * 10) / 10,
        speed: Math.round(playerSpeed),
        score: totalScore,
        runCoins,
        bank: readBank(),
        difficulty: difficultyRef.current.id,
        obstacles: obstacles.length,
        coinRows: coinRows.length,
        distanceM: Math.round(distanceMeters),
        steps: Math.round(distanceMeters * 1.4),
        trapsDodged,
        crashes,
        timeMode: detectTimeMode(),
        trackLength: Math.round(trackLength),
      }),
      start: () => startRaceInternal(),
      setDifficulty: (id: string) => {
        if (DIFFICULTIES.some((d) => d.id === id)) {
          difficultyRef.current = difficultyById(id);
          window.localStorage.setItem(STORAGE_KEYS.difficulty, id);
        }
      },
      forceLap: () => {
        completeLap(true);
      },
      addBank: (n: number) => {
        const b = readBank() + n;
        writeBank(b);
      },
      unlockAll: () => writeUnlocked(VEHICLES.map((v) => v.id)),
      // test-only: teleport the player to a track fraction + lateral offset
      warp: (u: number, lateral = 0) => {
        playerU = ((u % 1) + 1) % 1;
        const maxOff = TRACK.roadWidth * 0.45;
        playerLateral = Math.max(-maxOff, Math.min(maxOff, lateral));
        lapReady = true;
      },
      listCoinRows: () => coinRows.map((r) => ({ u: r.u, lateral: r.lateral })),
      listObstacles: () => obstacles.map((o) => ({ u: o.u, kind: o.kind })),
    };

    function detectTimeMode(): TimeMode {
      const bg = scene.background as THREE.Color | null;
      if (!bg) return "day";
      if (bg.getHex() === TRACK.nightSky) return "night";
      if (bg.getHex() === TRACK.sunsetSky) return "sunset";
      return "day";
    }

    function onBanner(b: { district: string; tagline: string; lap: number; coins: number; traps: number; time: number }) {
      setLapBanner(b);
      window.setTimeout(() => setLapBanner(null), 2600);
    }

    let trapsDodgedThisLap = 0;

    function completeLap(force = false) {
      const lapElapsed = (performance.now() - lapStartWall) / 1000;
      if (!force) {
        if (!bestLapSec || lapElapsed < bestLapSec) {
          bestLapSec = lapElapsed;
          try { window.localStorage.setItem(STORAGE_KEYS.bestLap, String(lapElapsed)); } catch { /* ignore */ }
        }
      }
      lapSummaries.push({
        lap: playerLap,
        district: DISTRICTS[Math.min(playerLap - 1, DISTRICTS.length - 1)]?.name ?? "KARACHI",
        timeSec: lapElapsed,
        coins: lapsRunCoins,
        trapsDodged: trapsDodgedThisLap,
      });

      const nextLap = playerLap + 1;
      if (nextLap > totalLapsRef.current) {
        finishRace();
        return;
      }
      playerLap = nextLap;
      lapsRunCoins = 0;
      trapsDodgedThisLap = 0;
      lapReady = false;
      lapStartWall = performance.now();
      // district change: roll time of day to the new district's phase
      const district = DISTRICTS[Math.min(playerLap - 1, DISTRICTS.length - 1)];
      applyTimeMode(district.timeOfDay);
      onBanner({ district: district.name, tagline: district.tagline, lap: playerLap, coins: -1, traps: 0, time: 0 });
      soundRef.current?.playBeep(true);
    }

    function finishRace() {
      const diff = difficultyRef.current;
      // deposit coins
      const b = readBank() + runCoins;
      writeBank(b);
      // rankings: player distance parity vs rivals' traveled distance
      const playerTotalDist = totalLapsRef.current * trackLength; // player just crossed the final line
      const rankRows: { rank: number; name: string; time: number }[] = [{ rank: 1, name: "YOU", time: raceTimer }];
      for (const r of rivals) {
        const rivalRemaining = Math.max(0, playerTotalDist - r.dist);
        const estSpeed = (r.speed + 1) || 10;
        rankRows.push({ rank: 0, name: r.name, time: raceTimer + rivalRemaining / estSpeed });
      }
      rankRows.sort((a, b) => a.time - b.time);
      rankRows.forEach((r, i) => (r.rank = i + 1));
      setFinalStats({
        rankings: rankRows.slice(0, 6),
        raceTime: raceTimer,
        bestLap: bestLapSec,
        coinsEarned: runCoins,
        distanceM: Math.round(distanceMeters),
        steps: Math.round(distanceMeters * 1.4),
        trapsDodged,
        crashes,
        driftScore: totalScore,
        difficulty: diff.label,
        laps: lapSummaries.slice(),
      });
      setPhaseState("finished");
    }

    // =========================================================
    // INPUT
    // =========================================================
    const onKeyDown = (e: KeyboardEvent) => {
      soundRef.current?.init();
      const c = controlsRef.current;
      if (e.code === "ArrowUp" || e.code === "KeyW") c.throttle = 1;
      if (e.code === "ArrowDown" || e.code === "KeyS") c.brake = 1;
      if (e.code === "ArrowLeft" || e.code === "KeyA") c.steer = -1;
      if (e.code === "ArrowRight" || e.code === "KeyD") c.steer = 1;
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") c.drift = true;
      if (e.code === "KeyN" || e.code === "ControlLeft") c.nitro = true;
      if (e.code === "KeyP") engineRef.current?.togglePause();
      if (e.code === "Escape") engineRef.current?.togglePause();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const c = controlsRef.current;
      if (e.code === "ArrowUp" || e.code === "KeyW") c.throttle = 0;
      if (e.code === "ArrowDown" || e.code === "KeyS") c.brake = 0;
      if (e.code === "ArrowLeft" || e.code === "KeyA") { if (c.steer === -1) c.steer = 0; }
      if (e.code === "ArrowRight" || e.code === "KeyD") { if (c.steer === 1) c.steer = 0; }
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") c.drift = false;
      if (e.code === "KeyN" || e.code === "ControlLeft") c.nitro = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // =========================================================
    // MAIN LOOP
    // =========================================================
    let lastTime = performance.now();
    let positionRank = 1;

    function gameLoop(now: number) {
      if (disposed) return;
      animId = requestAnimationFrame(gameLoop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (manPhase === "paused") {
        renderer.render(scene, camera);
        return;
      }

      const ctrl = controlsRef.current;
      const diff = difficultyRef.current;
      const isRacing = manPhase === "racing";
      const isMenuIdle = manPhase === "menu";
      // rival name tags are canvas-texture planes: only part of the race,
      // never part of the menu showroom shot
      for (const tag of rivalTagMeshes) tag.visible = !isMenuIdle;

      if (isRacing) raceTimer += dt;

      // 1. speed
      const maxSpeed = vehicleDef.topSpeed + (ctrl.nitro && playerNitro > 1 ? vehicleDef.nitroBonus : 0);
      const accelRate = vehicleDef.accel * (ctrl.nitro && playerNitro > 1 ? 1.6 : 1.0);
      if (isRacing && ctrl.throttle > 0) {
        playerSpeed = Math.min(maxSpeed, playerSpeed + accelRate * dt);
      } else if (isRacing && ctrl.brake > 0) {
        playerSpeed = Math.max(-10, playerSpeed - 24 * dt);
      } else {
        if (playerSpeed > 0) playerSpeed = Math.max(0, playerSpeed - 5.5 * dt);
        else if (playerSpeed < 0) playerSpeed = Math.min(0, playerSpeed + 8.0 * dt);
      }

      // nitro
      if (isRacing && ctrl.nitro && playerNitro > 0) {
        playerNitro = Math.max(0, playerNitro - 26 * dt);
        soundRef.current?.playNitro(true);
      } else {
        soundRef.current?.playNitro(false);
        if (playerSpeed > 15) playerNitro = Math.min(100, playerNitro + (ctrl.drift ? 16 : 4) * dt);
      }

      // 2. steering (grip loss from oil slick)
      const gripMult = gripLossTimer > 0 ? 0.45 : 1.0;
      const steerSpeed = (ctrl.drift ? 1.4 : 1.0) * vehicleDef.handling * (playerSpeed / 40) * gripMult;
      playerLateral += ctrl.steer * steerSpeed * 14 * dt;
      const maxOffset = TRACK.roadWidth * 0.45;
      if (Math.abs(playerLateral) > maxOffset) {
        playerLateral = Math.sign(playerLateral) * maxOffset;
        playerSpeed *= 0.96;
      }
      playerSteerAngle = THREE.MathUtils.lerp(playerSteerAngle, ctrl.steer * 0.45, 0.15);
      playerRickshaw.frontWheel.rotation.y = -playerSteerAngle;

      // drift scoring
      isDriftingNow = isRacing && ctrl.drift && Math.abs(ctrl.steer) > 0.2 && playerSpeed > 20;
      if (isDriftingNow) {
        totalScore += Math.round(150 * dt * diff.scoreMult);
        if (Math.random() < 0.05) setDriftPopup({ text: "DRIFT +150", id: Date.now() });
      }
      soundRef.current?.playDrift(isDriftingNow);

      // advance along spline
      const distanceMoved = (playerSpeed * (1000 / 3600)) * dt;
      if (isRacing) {
        distanceMeters += Math.max(0, distanceMoved);
      }
      const prevU = playerU;
      playerU = (playerU + distanceMoved / trackLength) % 1.0;
      if (playerU > 0.15 && !lapReady) lapReady = true;

      // collision states decay
      if (crashTimer > 0) crashTimer = Math.max(0, crashTimer - dt);
      if (gripLossTimer > 0) gripLossTimer = Math.max(0, gripLossTimer - dt);

      // player position
      const { pt: playerPos0, tangent: playerTangent, normal: playerNormal } = splineFrame(playerU);
      const playerPos = new THREE.Vector3().copy(playerPos0).addScaledVector(playerNormal, playerLateral);
      playerRickshaw.group.position.copy(playerPos);
      playerRickshaw.group.lookAt(new THREE.Vector3().copy(playerPos).add(playerTangent));
      if (crashTimer > 0) playerRickshaw.group.rotation.y += dt * 9;
      const targetRoll = -ctrl.steer * 0.12 * (playerSpeed / 40) + (gripLossTimer > 0 ? -0.09 : 0);
      playerRickshaw.group.rotation.z = THREE.MathUtils.lerp(playerRickshaw.group.rotation.z, targetRoll, 0.15);
      if (isMenuIdle) {
        // idle life: engine bounce + restless front wheel while showing off
        const tIdle = now / 1000;
        playerRickshaw.group.position.y += Math.sin(tIdle * 2.1) * 0.05;
        playerRickshaw.frontWheel.rotation.y = Math.sin(tIdle * 1.6) * 0.22;
      }

      headLight.position.set(playerPos.x, playerPos.y + 2, playerPos.z);
      headLight.target.position.set(playerPos.x + playerTangent.x * 20, playerPos.y, playerPos.z + playerTangent.z * 20);
      scene.add(headLight.target);

      // 3. camera
      if (isMenuIdle) {
        // menu idle shot: slow orbit around the parked rickshaw (autorush-style live scene)
        const t = now / 1000;
        const orbitAng = t * 0.14;
        const orbitR = 14 + Math.sin(t * 0.4) * 1.2;
        camera.position.set(
          playerPos.x + Math.sin(orbitAng) * orbitR,
          playerPos.y + 4.2 + Math.sin(t * 0.8) * 0.2,
          playerPos.z + Math.cos(orbitAng) * orbitR
        );
      } else if (crashTimer > 0) {
        camera.position.x += (Math.random() - 0.5) * 0.6;
        camera.position.y += (Math.random() - 0.5) * 0.4;
      } else {
        const camFollowDist = ctrl.nitro && playerNitro > 1 ? 13 : 11;
        const targetCamPos = new THREE.Vector3()
          .copy(playerPos)
          .addScaledVector(playerTangent, -camFollowDist)
          .add(new THREE.Vector3(0, 5.2, 0));
        camera.position.lerp(targetCamPos, 0.12);
      }
      const lookY = isMenuIdle ? 2.2 : 2.0;
      camera.lookAt(new THREE.Vector3(playerPos.x, playerPos.y + lookY, playerPos.z));
      const targetFov = isMenuIdle ? 50 : 60 + (playerSpeed / 60) * 15 + (ctrl.nitro && playerNitro > 1 ? 8 : 0);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.updateProjectionMatrix();

      // minimap (top-down track + player dot)
      const mm = minimapRef.current;
      if (mm) {
        const mctx = mm.getContext("2d");
        if (mctx) {
          const W = mm.width, H = mm.height;
          mctx.clearRect(0, 0, W, H);
          mctx.fillStyle = "rgba(11,16,38,0.85)";
          mctx.fillRect(0, 0, W, H);
          // project spline points to 2D (x,z) scaled to fit
          let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
          const pts: { x: number; z: number }[] = [];
          for (let i = 0; i <= 120; i++) {
            const u = i / 120;
            const p = spline.getPointAt(u);
            pts.push({ x: p.x, z: p.z });
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
          }
          const pad = 12;
          const sx = (W - pad * 2) / (maxX - minX || 1);
          const sz = (H - pad * 2) / (maxZ - minZ || 1);
          const s = Math.min(sx, sz);
          const ox = pad + ((W - pad * 2) - (maxX - minX) * s) / 2 - minX * s;
          const oz = pad + ((H - pad * 2) - (maxZ - minZ) * s) / 2 - minZ * s;
          mctx.strokeStyle = "#3a3a42";
          mctx.lineWidth = 2;
          mctx.beginPath();
          pts.forEach((p, i) => {
            const x = p.x * s + ox;
            const y = p.z * s + oz;
            if (i === 0) mctx.moveTo(x, y); else mctx.lineTo(x, y);
          });
          mctx.closePath();
          mctx.stroke();
          // rival dots
          for (const rv of rivals) {
            const ru = ((rv.u % 1) + 1) % 1;
            const rp = spline.getPointAt(Math.min(0.999, ru));
            mctx.fillStyle = "#d90429";
            mctx.beginPath();
            mctx.arc(rp.x * s + ox, rp.z * s + oz, 2.5, 0, Math.PI * 2);
            mctx.fill();
          }
          // player dot
          const pp = spline.getPointAt(Math.min(0.999, playerU));
          mctx.fillStyle = "#f2b632";
          mctx.beginPath();
          mctx.arc(pp.x * s + ox, pp.z * s + oz, 4, 0, Math.PI * 2);
          mctx.fill();
        }
      }

      // 4. rivals (traveled-distance model: dist grows monotonically, u derived)
      let rank = 1;
      const playerTotalDist = (playerLap - 1) * trackLength + playerU * trackLength;
      for (const rival of rivals) {
        if (isRacing) {
          const rivalTargetSpeed = (vehicleDef.topSpeed * 0.95 * diff.rivalSpeedMult + rival.name.length) * (1000 / 3600);
          rival.speed = THREE.MathUtils.lerp(rival.speed, rivalTargetSpeed, 0.05);
          rival.dist += rival.speed * dt;
          rival.u = ((rival.dist / trackLength) % 1 + 1) % 1;
        }
        // rival races totalLaps lengths from its (negative) start offset; compare traveled progress vs player
        const rivalProgress = rival.dist + totalLapsRef.current * trackLength;
        if (rivalProgress > playerTotalDist) rank++;
        const { pt, tangent, normal } = splineFrame(rival.u);
        const rp = new THREE.Vector3().copy(pt).addScaledVector(normal, rival.lateralOffset);
        rival.group.position.copy(rp);
        rival.group.lookAt(new THREE.Vector3().copy(rp).add(tangent));
        rival.frontWheel.rotation.y = Math.sin(now / 300 + rival.u * 100) * 0.2;
      }
      positionRank = isRacing ? rank : positionRank;

      // 5. obstacles
      for (const o of obstacles) {
        if (o.speed > 0) {
          o.u = (o.u + (o.speed * dt) / trackLength) % 1.0;
          const { pt, tangent, normal } = splineFrame(o.u);
          const weave = Math.sin(now / 900 + o.weavePhase) * 2.2;
          const lat = Math.max(-TRACK.roadWidth * 0.44, Math.min(TRACK.roadWidth * 0.44, o.lateral + weave));
          o.curLateral = lat;
          o.mesh.position.set(pt.x + normal.x * lat, pt.y, pt.z + normal.z * lat);
          o.mesh.lookAt(new THREE.Vector3().copy(pt).add(tangent));
        }
        if (o.hitCooldown > 0) o.hitCooldown -= dt;

        if (!isRacing) continue;
        const rel = uDistanceMeters(prevU, o.u, trackLength); // meters behind (+) or ahead (-)
        const halfLen = o.kind === "breaker" || o.kind === "oil" || o.kind === "manhole" ? OBSTACLE_TUNING.zoneHalfLen : OBSTACLE_TUNING.staticHalfLen;
        const crossed = Math.abs(rel) <= halfLen;

        if (crossed && o.hitCooldown <= 0) {
          const latDiff = Math.abs(playerLateral - (o.speed > 0 ? o.curLateral : o.lateral));
          if (latDiff < OBSTACLE_TUNING.gridHalfWidth) {
            if (o.kind === "tyre" || o.kind === "cone" || o.kind === "rickshaw") {
              // full crash
              playerSpeed *= 0.25;
              crashTimer = 0.55;
              crashes++;
              o.hitCooldown = 2.5;
              totalScore = Math.max(0, totalScore - 100);
              setDriftPopup({ text: "CRASH! −100", id: Date.now() });
              soundRef.current?.playCrash();
            } else if (o.kind === "breaker") {
              playerSpeed *= 0.82;
              playerNitro = Math.max(0, playerNitro - 8);
              o.hitCooldown = 2.0;
              soundRef.current?.playThud();
              setDriftPopup({ text: "SPEED BREAKER!", id: Date.now() });
            } else if (o.kind === "oil") {
              gripLossTimer = 2.0;
              playerSpeed *= 0.95;
              o.hitCooldown = 3.0;
              soundRef.current?.playThud();
              setDriftPopup({ text: "OIL SLICK!", id: Date.now() });
            } else {
              // manhole
              playerSpeed *= 0.9;
              crashTimer = 0.2;
              o.hitCooldown = 2.0;
              soundRef.current?.playThud();
            }
          } else if (!o.dodged) {
            o.dodged = true;
            if (o.kind !== "oil" && o.kind !== "manhole" && o.kind !== "breaker") {
              trapsDodgedThisLap++;
              trapsDodged++;
              totalScore += Math.round(30 * diff.scoreMult);
            } else {
              trapsDodgedThisLap++;
              trapsDodged++;
            }
          }
        }
      }

      // 6. coins (visual spin/bob always; pickup only while racing)
      for (const row of coinRows) {
        if (isRacing && row.collectedLap === playerLap) continue;
        for (let c = 0; c < row.meshes.length; c++) {
          const mesh = row.meshes[c];
          if (!mesh.visible) continue;
          const cu = (row.u + (c * 8) / trackLength) % 1.0;
          const rel = uDistanceMeters(prevU, cu, trackLength);
          mesh.rotation.y += dt * 2.4;
          mesh.position.y = (mesh.userData as { baseY: number }).baseY + Math.sin(now / 400 + c) * 0.35;
            if (isRacing && rel >= -2 && rel <= OBSTACLE_TUNING.coinPickupRadius) {
              const latDiff = Math.abs(playerLateral - row.lateral);
              if (latDiff < OBSTACLE_TUNING.coinPickupRadius) {
                mesh.visible = false;
                runCoins += diff.coinValue;
                lapsRunCoins += diff.coinValue;
                totalScore += Math.round(20 * diff.scoreMult);
                soundRef.current?.playCoin();
              }
            }
          }
        }

      // 7. lap detection
      const uDelta = playerU - prevPlayerU;
      if (isRacing) {
        const nowWrong = uDelta < -0.02 && playerSpeed > 5;
        if (nowWrong !== wrongWayNow) { wrongWayNow = nowWrong; setWrongWay(nowWrong); }
      }
      prevPlayerU = playerU;
      if (isRacing && lapReady && playerU < 0.03 && distanceMoved > 0) {
        lapReady = false;
        completeLap();
      }

      // 8. engine sound
      soundRef.current?.updateEngine(playerSpeed, ctrl.throttle > 0, ctrl.nitro && playerNitro > 1);

      // 9. HUD (one state update per frame)
      // (manPhase can never be "paused" here — early-returned above)
      if (manPhase === "countdown" || isRacing || manPhase === "finished") {
        setHud({
          position: positionRank,
          lap: Math.min(playerLap, totalLapsRef.current),
          lapTime: (performance.now() - lapStartWall) / 1000 || 0,
          bestLap: bestLapSec,
          score: totalScore,
          speed: Math.max(0, Math.round(playerSpeed)),
          nitro: Math.round(playerNitro),
          runCoins,
          bank: readBank(),
          steps: Math.round(distanceMeters * 1.4),
          distanceM: Math.round(distanceMeters),
          trapsDodged,
          crashes,
          difficulty: diff.label,
          timeMode: detectTimeMode(),
        });
      }

      renderer.render(scene, camera);
    }

    animId = requestAnimationFrame(gameLoop);

    const onResize = () => {
      if (!viewport || !renderer || !camera) return;
      const w = viewport.clientWidth || 850;
      const h = viewport.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const onBlur = () => { if (manPhase === "racing") engineRef.current?.togglePause(); };
    window.addEventListener("blur", onBlur);

    const loadTimer = setTimeout(() => {
      setLoading(false);
      setTimeout(() => setLoadingVisible(false), 450);
    }, 1400);

    return () => {
      clearTimeout(loadTimer);
      disposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("blur", onBlur);
      if (renderer) {
        scene.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
        renderer.dispose();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId, selectedVehicle]);

  // keep difficulty & laps refs synced from menu selection
  useEffect(() => {
    difficultyRef.current = difficultyById(difficultyId);
    try { window.localStorage.setItem(STORAGE_KEYS.difficulty, difficultyId); } catch { /* ignore */ }
  }, [difficultyId]);
  useEffect(() => {
    totalLapsRef.current = totalLaps;
  }, [totalLaps]);

  // =============================================================
  // RENDER
  // =============================================================
  const curVehicle = vehicleById(selectedVehicle);

  return (
    <div id="game-container">
      {loadingVisible && (
        <div className={`loading-screen ${loading ? "" : "loading-screen--out"}`}>
          <div className="loading-title">KARACHI RUSH</div>
          <div className="loading-subtitle">SADAR — II CHUNDRIGAR — CLIFTON</div>
          <div className="loading-bar">
            <div className="loading-bar-fill" />
          </div>
          <div className="loading-msg">LOADING DISTRICTS…</div>
          <div className="loading-dots">
            <span className="coin-dot" />
            <span className="coin-dot" />
            <span className="coin-dot" />
          </div>
        </div>
      )}
      <div id="viewport" ref={viewportRef} />

      {/* HUD */}
      {(phase === "racing" || phase === "countdown" || phase === "paused") && (
        <div className="game-hud">
          <div className="hud-top-bar">
            <div className="hud-left">
              <div className="chip chip-pos">
                <span className="pos-main">{hud.position}</span>
                <span className="pos-total">/ 8</span>
              </div>

              <div className="chip chip-info">
                <span className="chip-district">
                  LAP {hud.lap}/{totalLaps} — {DISTRICTS[Math.min(hud.lap - 1, 2)].name}
                </span>
                <span className="chip-time">{fmtTime(hud.lapTime)}{hud.bestLap ? `  •  BEST ${fmtTime(hud.bestLap)}` : ""}</span>
              </div>

              <div className="chip-row">
                <div className="chip chip-coin">
                  <span className="coin-dot" /> {hud.runCoins}
                </div>
                <div className="chip chip-steps">
                  {hud.steps} STEPS
                </div>
                <div className="chip chip-diff">
                  {hud.difficulty}
                </div>
              </div>

              <div className="track-progress-bar">
                <div className="progress-track-fill" style={{ width: `${((hud.lap - 1) / totalLaps) * 100}%` }} />
                <div className="progress-player-pin" />
              </div>
            </div>

            <div className="hud-right">
              <button className="icon-btn" onClick={() => engineRef.current?.cycleTimeMode()}>
                {SOUND_LABELS[hud.timeMode]}
              </button>
              <button className="icon-btn" onClick={() => setSoundEnabled((v) => !v)}>
                {soundEnabled ? "🔊 SOUND" : "🔇 MUTED"}
              </button>
              <button className="icon-btn" onClick={() => engineRef.current?.togglePause()}>
                {phase === "paused" ? "▶ RESUME" : "❚❚ PAUSE"}
              </button>
            </div>
          </div>

          {driftPopup && (
            <div key={driftPopup.id} className="drift-tag-popup">
              {driftPopup.text}
            </div>
          )}

          <div className="hud-bottom-bar">
            <div className="speedo-cluster">
              <div className={`chip speedo-card ${hud.nitro > 50 ? "hot" : ""}`}>
                <span className="speed-value">{hud.speed}</span>
                <span className="speed-unit">KM/H</span>
              </div>
              <div className="nitro-cluster">
                <div className="nitro-label">
                  <span>NITRO</span>
                  <span>{hud.nitro}%</span>
                </div>
                <div className="nitro-bar-wrap">
                  <div className="nitro-bar-fill" style={{ width: `${hud.nitro}%` }} />
                </div>
              </div>
              <div className="chip chip-score">
                <span className="chip-kv-label">SCORE</span>
                <span className="chip-kv-value">{hud.score}</span>
              </div>
            </div>
            <div className="chip chip-traps">
              <span className="chip-kv-label">TRAPS</span>
              <span className="chip-kv-value">{hud.trapsDodged}</span>
            </div>
          </div>

          {/* Lap Banner */}
          {lapBanner && (
            <div className="lap-banner">
              <div className="lap-banner-kicker">LAP {lapBanner.lap}</div>
              <div className="lap-banner-district">{lapBanner.district}</div>
              <div className="lap-banner-tagline">{lapBanner.tagline}</div>
            </div>
          )}

          {/* autorush-style HUD chrome */}
          <canvas id="minimap" className="minimap" width={190} height={190} ref={minimapRef} />
          {wrongWay && <div className="wrong-way">WRONG WAY!</div>}
        </div>
      )}

      {/* Countdown */}
      {phase === "countdown" && (
        <div className="countdown-overlay">
          <div className={`countdown-number ${countdownNum === "GO!" ? "go" : ""}`}>{countdownNum}</div>
        </div>
      )}

      {/* Start Menu */}
      {phase === "menu" && (
        <div className="screen-overlay menu-overlay">
          <div className="modal-panel home-dock">
            <div className="menu-ticker" aria-hidden="true">
              <div className="menu-ticker-track">
                <span>SADAR BAZAR ◆ II CHUNDRIGAR ROAD ◆ CLIFTON NIGHT LAP ◆ DRIFT FOR SCORE ◆ N FOR NITRO ◆ DODGE THE CONES ◆&nbsp;</span>
                <span aria-hidden="true">SADAR BAZAR ◆ II CHUNDRIGAR ROAD ◆ CLIFTON NIGHT LAP ◆ DRIFT FOR SCORE ◆ N FOR NITRO ◆ DODGE THE CONES ◆&nbsp;</span>
              </div>
            </div>
            <header className="home-top">
              <div className="game-title">KARACHI RUSH</div>
              <div className="game-subtitle">SADAR — II CHUNDRIGAR — CLIFTON</div>
            </header>

            <div className="bank-pill">
              <span className="coin-dot coin-dot-lg" />
              <span className="bank-value">{bank}</span>
              <span className="bank-label">COIN BANK</span>
            </div>

            <div className="home-picker">
              <button className="arrow" aria-label="Previous rickshaw" onClick={() => {
                const idx = VEHICLES.findIndex((v) => v.id === selectedVehicle);
                const prev = VEHICLES[(idx - 1 + VEHICLES.length) % VEHICLES.length];
                if (prev.price === 0 || unlocked.includes(prev.id)) setSelectedVehicle(prev.id);
              }}>‹</button>
              <button className="arrow" aria-label="Next rickshaw" onClick={() => {
                const idx = VEHICLES.findIndex((v) => v.id === selectedVehicle);
                const next = VEHICLES[(idx + 1) % VEHICLES.length];
                if (next.price === 0 || unlocked.includes(next.id)) setSelectedVehicle(next.id);
              }}>›</button>
            </div>

            {/* keep all vehicles selectable in a compact grid below */}
            <div className="section-label">RICKSHAW GARAGE</div>
            <div className="selection-grid garage-grid compact">
              {VEHICLES.map((v, i) => {
                const isOwned = v.price === 0 || unlocked.includes(v.id);
                const isActive = selectedVehicle === v.id;
                return (
                  <div
                    key={v.id}
                    className={`select-card ${isActive ? "active" : ""} ${isOwned ? "" : "locked"}`}
                    style={{ "--i": i } as CSSProperties}
                    onClick={() => { if (isOwned) setSelectedVehicle(v.id); }}
                  >
                    <div className="select-card-name">{v.name}</div>
                    <div className="select-card-desc">{v.subtitle}</div>
                    <div className="select-card-stats">TOP {v.topSpeed} KM/H</div>
                    {!isOwned ? (
                      <button
                        className={`buy-btn ${bank >= v.price ? "" : "buy-btn-disabled"}`}
                        onClick={(e) => { e.stopPropagation(); buyVehicle(v.id); }}
                      >
                        BUY {v.price}
                      </button>
                    ) : isActive ? (
                      <div className="owned-tag">EQUIPPED</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="section-label">DIFFICULTY</div>
            <div className="selection-grid diff-grid">
              {DIFFICULTIES.map((d, i) => (
                <div
                  key={d.id}
                  className={`select-card ${difficultyId === d.id ? "active" : ""}`}
                  style={{ "--i": i } as CSSProperties}
                  onClick={() => setDifficultyId(d.id)}
                >
                  <div className="select-card-name">{d.label}</div>
                  <div className="select-card-desc">{d.tagline}</div>
                </div>
              ))}
            </div>

            <div className="lap-choose-row">
              {[1, 3, 5].map((laps) => (
                <button
                  key={laps}
                  className={`icon-btn ${totalLaps === laps ? "active" : ""}`}
                  onClick={() => setTotalLaps(laps)}
                >
                  {laps} LAP{laps > 1 ? "S" : ""}
                </button>
              ))}
            </div>

            <div className="go-row">
              <button className="action-btn" onClick={() => engineRef.current?.startRace()}>
                START RUSH <span className="btn-arrow" aria-hidden="true">▶</span>
              </button>
            </div>

            <div className="home-row">
              <button className="btn sec-btn setup-btn" onClick={() => setSetupOpen(true)}>
                Race setup
              </button>
              <button className="btn sec-btn setup-btn" onClick={() => setSettingsOpen(true)}>
                Settings
              </button>
            </div>

            <div className="controls-hint">
              W/↑ THROTTLE • S/↓ BRAKE • A/D STEER • SPACE DRIFT • N NITRO • P PAUSE
            </div>
          </div>
        </div>
      )}

      {/* Race setup sheet */}
      {phase === "menu" && setupOpen && (
        <div className="screen-overlay" onClick={() => setSetupOpen(false)}>
          <div className="modal-panel panel-slim" onClick={(e) => e.stopPropagation()}>
            <div className="game-title" style={{ fontSize: 28 }}>RACE SETUP</div>
            <div className="game-subtitle">Choose how you race</div>
            <div className="section-label">LAPS</div>
            <div className="lap-choose-row">
              {[1, 3, 5].map((laps) => (
                <button
                  key={laps}
                  className={`icon-btn ${totalLaps === laps ? "active" : ""}`}
                  onClick={() => setTotalLaps(laps)}
                >
                  {laps}
                </button>
              ))}
            </div>
            <div className="section-label">RIVALS</div>
            <div className="selection-grid diff-grid">
              {DIFFICULTIES.map((d) => (
                <div
                  key={d.id}
                  className={`select-card ${difficultyId === d.id ? "active" : ""}`}
                  onClick={() => setDifficultyId(d.id)}
                >
                  <div className="select-card-name">{d.label}</div>
                  <div className="select-card-desc">{d.tagline}</div>
                </div>
              ))}
            </div>
            <div className="section-label">TIME</div>
            <div className="lap-choose-row">
              {(["day", "sunset", "night"] as TimeMode[]).map((t) => (
                <button
                  key={t}
                  className={`icon-btn ${menuTimeMode === t ? "active" : ""}`}
                  onClick={() => { setMenuTimeMode(t); engineRef.current?.setTimeMode(t); }}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <button className="action-btn" onClick={() => setSetupOpen(false)}>DONE</button>
          </div>
        </div>
      )}

      {/* Settings */}
      {phase === "menu" && settingsOpen && (
        <div className="screen-overlay" onClick={() => setSettingsOpen(false)}>
          <div className="modal-panel panel-slim" onClick={(e) => e.stopPropagation()}>
            <div className="game-title" style={{ fontSize: 28 }}>SETTINGS</div>
            <div className="game-subtitle">Sound & controls</div>
            <div className="section-label">SOUND</div>
            <button className="action-btn secondary" onClick={() => setSoundEnabled((v) => !v)}>
              {soundEnabled ? "🔊 SOUND ON" : "🔇 MUTED"}
            </button>
            <div className="section-label">CONTROLS</div>
            <div className="controls-hint" style={{ textAlign: "left", lineHeight: 1.6 }}>
              W/↑ THROTTLE • S/↓ BRAKE • A/D STEER<br />
              SPACE DRIFT • N NITRO • P / ESC PAUSE<br />
              CYCLE TIME: button in HUD
            </div>
            <button className="action-btn" onClick={() => setSettingsOpen(false)}>DONE</button>
          </div>
        </div>
      )}

      {/* Pause */}
      {phase === "paused" && (
        <div className="screen-overlay">
          <div className="modal-panel panel-slim">
            <div className="game-title">PAUSED</div>
            <div className="game-subtitle">{curVehicle.name} — LAP {hud.lap} OF {totalLaps}</div>
            <button className="action-btn" onClick={() => engineRef.current?.togglePause()}>RESUME</button>
            <button className="action-btn secondary" onClick={() => engineRef.current?.quitRace()}>MAIN MENU</button>
          </div>
        </div>
      )}

      {/* Results */}
      {phase === "finished" && finalStats && (
        <div className="screen-overlay">
          <div className="modal-panel panel-wide">
            <div className="game-title">
              {finalStats.rankings[0]?.name === "YOU" ? "CHAMPION!" : "RACE FINISHED"}
            </div>
            <div className="game-subtitle">{finalStats.difficulty} — {fmtTime(finalStats.raceTime)}</div>

            <div className="results-grid">
              <div className="stat-box"><span className="stat-num gold">{finalStats.coinsEarned}</span><span className="stat-label">COINS EARNED</span></div>
              <div className="stat-box"><span className="stat-num">{Math.round(finalStats.raceTime)}</span><span className="stat-label">RACE SEC</span></div>
              <div className="stat-box"><span className="stat-num">{finalStats.bestLap ? fmtTime(finalStats.bestLap) : "--"}</span><span className="stat-label">BEST LAP</span></div>
              <div className="stat-box"><span className="stat-num">{finalStats.steps}</span><span className="stat-label">STEPS</span></div>
              <div className="stat-box"><span className="stat-num">{finalStats.distanceM}m</span><span className="stat-label">DISTANCE</span></div>
              <div className="stat-box"><span className="stat-num">{finalStats.trapsDodged}</span><span className="stat-label">TRAPS DODGED</span></div>
              <div className="stat-box"><span className="stat-num">{finalStats.crashes}</span><span className="stat-label">CRASHES</span></div>
              <div className="stat-box"><span className="stat-num">{finalStats.driftScore}</span><span className="stat-label">DRIFT SCORE</span></div>
            </div>

            <div className="lap-summary-list">
              {finalStats.laps.map((l) => (
                <div key={l.lap} className="lap-summary-row">
                  <span className="lap-summary-k">LAP {l.lap} — {l.district}</span>
                  <span className="lap-summary-v">{l.timeSec.toFixed(1)}s • {l.coins} coins • {l.trapsDodged} traps</span>
                </div>
              ))}
            </div>

            <div className="rankings-list">
              {finalStats.rankings.slice(0, 5).map((r) => (
                <div key={r.rank} className={`ranking-row ${r.name === "YOU" ? "you" : ""}`}>
                  <span>#{r.rank} {r.name}</span>
                  <span>{fmtTime(r.time)}</span>
                </div>
              ))}
            </div>

            <button className="action-btn" onClick={() => engineRef.current?.startRace()}>RACE AGAIN</button>
            <button className="action-btn secondary" onClick={() => engineRef.current?.quitRace()}>MAIN MENU</button>
          </div>
        </div>
      )}

      {/* Mobile touch controls */}
      <div className="mobile-controls">
        <div className="touch-cluster-left">
          <div className="touch-btn" onTouchStart={() => (controlsRef.current.steer = -1)} onTouchEnd={() => (controlsRef.current.steer = 0)}>◀</div>
          <div className="touch-btn" onTouchStart={() => (controlsRef.current.steer = 1)} onTouchEnd={() => (controlsRef.current.steer = 0)}>▶</div>
        </div>
        <div className="touch-cluster-right">
          <div className="touch-btn nitro" onTouchStart={() => (controlsRef.current.nitro = true)} onTouchEnd={() => (controlsRef.current.nitro = false)}>⚡</div>
          <div className="touch-btn drift" onTouchStart={() => (controlsRef.current.drift = true)} onTouchEnd={() => (controlsRef.current.drift = false)}>DRIFT</div>
          <div className="touch-btn" onTouchStart={() => (controlsRef.current.brake = 1)} onTouchEnd={() => (controlsRef.current.brake = 0)}>🛑</div>
          <div className="touch-btn go" onTouchStart={() => (controlsRef.current.throttle = 1)} onTouchEnd={() => (controlsRef.current.throttle = 0)}>GO</div>
        </div>
      </div>
    </div>
  );
}
