"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// -------------------------------------------------------------
// TRACK DEFINITIONS & WAYPOINTS (Closed 3D Circuits)
// -------------------------------------------------------------
interface TrackPoint {
  x: number;
  y: number;
  z: number;
}

interface TrackDef {
  id: string;
  name: string;
  city: string;
  tagline: string;
  points: TrackPoint[];
  roadWidth: number;
  skyColor: number;
  ambientDay: number;
  groundColor: number;
}

const TRACKS: Record<string, TrackDef> = {
  gurugram: {
    id: "gurugram",
    name: "Cyber City Grand Prix",
    city: "Gurugram",
    tagline: "High-speed sweeping turns through towering glass tech towers",
    roadWidth: 26,
    skyColor: 0x64b5f6,
    ambientDay: 0xffffff,
    groundColor: 0x3d5a45,
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 400 },
      { x: 120, y: 5, z: 650 },
      { x: 350, y: 15, z: 750 },
      { x: 600, y: 10, z: 650 },
      { x: 750, y: 0, z: 450 },
      { x: 700, y: -5, z: 150 },
      { x: 500, y: 0, z: -100 },
      { x: 250, y: 5, z: -250 },
      { x: 50, y: 0, z: -200 },
    ],
  },
  karachi: {
    id: "karachi",
    name: "Karachi Grand Prix",
    city: "Karachi",
    tagline: "M.A. Jinnah & Clifton coastal bends with landmark towers",
    roadWidth: 28,
    skyColor: 0x7ec8e3,
    ambientDay: 0xfff3e0,
    groundColor: 0x4a6b52,
    points: [
      { x: 0, y: 0, z: 0 },
      { x: 50, y: 2, z: 350 },
      { x: 200, y: 8, z: 600 },
      { x: 450, y: 12, z: 700 },
      { x: 680, y: 6, z: 550 },
      { x: 600, y: 0, z: 300 },
      { x: 400, y: -4, z: 100 },
      { x: 550, y: 5, z: -150 },
      { x: 350, y: 8, z: -350 },
      { x: 100, y: 0, z: -250 },
    ],
  },
  delhi: {
    id: "delhi",
    name: "Delhi Heritage Circuit",
    city: "Delhi",
    tagline: "India Gate rotaries, grand avenues, and red stone monuments",
    roadWidth: 28,
    skyColor: 0x81d4fa,
    ambientDay: 0xffeedd,
    groundColor: 0x556b2f,
    points: [
      { x: 0, y: 0, z: 0 },
      { x: -50, y: 0, z: 300 },
      { x: 100, y: 5, z: 550 },
      { x: 380, y: 10, z: 650 },
      { x: 620, y: 0, z: 500 },
      { x: 650, y: -5, z: 200 },
      { x: 480, y: 0, z: -50 },
      { x: 300, y: 5, z: -200 },
      { x: 150, y: 0, z: -300 },
    ],
  },
};

// -------------------------------------------------------------
// VEHICLE / LIVERY DEFINITIONS
// -------------------------------------------------------------
interface VehicleDef {
  id: string;
  name: string;
  subtitle: string;
  bodyColor: string;
  canopyColor: string;
  frameColor: string;
  topSpeed: number; // km/h
  accel: number;
  handling: number;
  nitroBonus: number;
}

const VEHICLES: VehicleDef[] = [
  {
    id: "baba",
    name: "Baba Auto 🛺",
    subtitle: "Classic Green & White Street Legend",
    bodyColor: "#1E7A38",
    canopyColor: "#F7F7F2",
    frameColor: "#0E3B1A",
    topSpeed: 42,
    accel: 11,
    handling: 1.0,
    nitroBonus: 18,
  },
  {
    id: "queen",
    name: "Karachi Queen 👑",
    subtitle: "Crimson High-Speed Tuned Edition",
    bodyColor: "#B3122E",
    canopyColor: "#FFF3B0",
    frameColor: "#4A0612",
    topSpeed: 46,
    accel: 12.5,
    handling: 1.1,
    nitroBonus: 20,
  },
  {
    id: "cyber",
    name: "Cyber Cruiser ⚡",
    subtitle: "Neon Cyan Future Prototype",
    bodyColor: "#00F0FF",
    canopyColor: "#0E1329",
    frameColor: "#005577",
    topSpeed: 48,
    accel: 13,
    handling: 1.15,
    nitroBonus: 22,
  },
  {
    id: "bhatta",
    name: "Bhatta Express 🏆",
    subtitle: "Golden Turbo Championship King",
    bodyColor: "#E3A008",
    canopyColor: "#17140A",
    frameColor: "#2B2105",
    topSpeed: 50,
    accel: 14,
    handling: 1.2,
    nitroBonus: 24,
  },
];

// 7 AI Rivals Specs
interface RivalSpec {
  name: string;
  bodyColor: string;
  canopyColor: string;
  skill: number;
  targetOffset: number; // lateral offset on track (-0.6 to 0.6)
}

const RIVALS: RivalSpec[] = [
  { name: "Kabir", bodyColor: "#D62828", canopyColor: "#FDF0D5", skill: 0.96, targetOffset: -0.35 },
  { name: "Tariq", bodyColor: "#003049", canopyColor: "#EAE2B7", skill: 0.93, targetOffset: 0.35 },
  { name: "Zain", bodyColor: "#F77F00", canopyColor: "#1D2D44", skill: 0.91, targetOffset: -0.15 },
  { name: "Arjun", bodyColor: "#2A9D8F", canopyColor: "#264653", skill: 0.88, targetOffset: 0.2 },
  { name: "Farhan", bodyColor: "#6A0572", canopyColor: "#F5F5F5", skill: 0.85, targetOffset: -0.4 },
  { name: "Bilal", bodyColor: "#38B000", canopyColor: "#004B23", skill: 0.82, targetOffset: 0.4 },
  { name: "Rohan", bodyColor: "#E0A96D", canopyColor: "#201E20", skill: 0.79, targetOffset: 0.0 },
];

export default function KarachiRushGame() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);

  // React State for HUD & UI
  const [selectedTrack, setSelectedTrack] = useState<string>("gurugram");
  const [selectedVehicle, setSelectedVehicle] = useState<string>("baba");
  const [timeOfDay, setTimeOfDay] = useState<"day" | "sunset" | "night">("day");
  const [totalLaps, setTotalLaps] = useState<number>(3);
  const [gameState, setGameState] = useState<"menu" | "countdown" | "racing" | "paused" | "finished">("menu");
  const [countdownNum, setCountdownNum] = useState<number | string>(3);
  const [position, setPosition] = useState<number>(1);
  const [currentLap, setCurrentLap] = useState<number>(1);
  const [speedKmh, setSpeedKmh] = useState<number>(0);
  const [nitroAmount, setNitroAmount] = useState<number>(100);
  const [lapTime, setLapTime] = useState<number>(0);
  const [bestLapTime, setBestLapTime] = useState<number | null>(null);
  const [driftScore, setDriftScore] = useState<number>(0);
  const [driftPopup, setDriftPopup] = useState<{ text: string; id: number } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [finalRankings, setFinalRankings] = useState<{ rank: number; name: string; time: number }[]>([]);

  // Sound Engine Ref
  const soundEngineRef = useRef<{
    init: () => void;
    updateEngine: (speed: number, throttle: boolean, nitro: boolean) => void;
    playDrift: (isDrifting: boolean) => void;
    playNitro: (active: boolean) => void;
    playBeep: (high: boolean) => void;
    playCrash: () => void;
    setMuted: (muted: boolean) => void;
  } | null>(null);

  // Game control references
  const controlsRef = useRef({
    throttle: 0,
    brake: 0,
    steer: 0,
    nitro: false,
    drift: false,
  });

  const gameTriggerRef = useRef<{
    startRace: () => void;
    togglePause: () => void;
    setNightMode: (mode: "day" | "sunset" | "night") => void;
  } | null>(null);

  // -------------------------------------------------------------
  // PROCEDURAL WEB AUDIO SYNTHESIZER
  // -------------------------------------------------------------
  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let engineOsc: OscillatorNode | null = null;
    let engineGain: GainNode | null = null;
    let driftNoise: AudioBufferSourceNode | null = null;
    let driftGain: GainNode | null = null;
    let nitroOsc: OscillatorNode | null = null;
    let nitroGain: GainNode | null = null;
    let masterGain: GainNode | null = null;

    const initAudio = () => {
      if (audioCtx) return;
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = soundEnabled ? 0.8 : 0;
      masterGain.connect(audioCtx.destination);

      // 1. Two-stroke Engine Pulse Synthesizer
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

      // 2. Drift Tire Squeal Generator (Pink / Bandpassed Noise)
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      driftNoise = audioCtx.createBufferSource();
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

      // 3. Nitro Jet Boost Roar
      nitroOsc = audioCtx.createOscillator();
      nitroGain = audioCtx.createGain();
      nitroOsc.type = "triangle";
      nitroOsc.frequency.setValueAtTime(90, audioCtx.currentTime);
      nitroGain.gain.setValueAtTime(0, audioCtx.currentTime);
      nitroOsc.connect(nitroGain);
      nitroGain.connect(masterGain);
      nitroOsc.start();
    };

    soundEngineRef.current = {
      init: initAudio,
      updateEngine: (speed: number, throttle: boolean, nitro: boolean) => {
        if (!audioCtx || !engineOsc || !engineGain) return;
        const baseFreq = 24 + speed * 1.8 + (throttle ? 18 : 0) + (nitro ? 28 : 0);
        engineOsc.frequency.setTargetAtTime(Math.min(180, baseFreq), audioCtx.currentTime, 0.05);
        const gainVal = 0.08 + Math.min(0.2, (speed / 50) * 0.15) + (throttle ? 0.05 : 0);
        engineGain.gain.setTargetAtTime(gainVal, audioCtx.currentTime, 0.05);
      },
      playDrift: (isDrifting: boolean) => {
        if (!audioCtx || !driftGain) return;
        driftGain.gain.setTargetAtTime(isDrifting ? 0.18 : 0, audioCtx.currentTime, 0.08);
      },
      playNitro: (active: boolean) => {
        if (!audioCtx || !nitroGain) return;
        nitroGain.gain.setTargetAtTime(active ? 0.25 : 0, audioCtx.currentTime, 0.05);
      },
      playBeep: (high: boolean) => {
        if (!audioCtx || !masterGain) return;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.frequency.setValueAtTime(high ? 880 : 440, audioCtx.currentTime);
        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (high ? 0.5 : 0.25));
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + (high ? 0.5 : 0.25));
      },
      playCrash: () => {
        if (!audioCtx || !masterGain) return;
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.3);
        g.gain.setValueAtTime(0.4, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(g);
        g.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      },
      setMuted: (muted: boolean) => {
        if (masterGain && audioCtx) {
          masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, audioCtx.currentTime, 0.05);
        }
      },
    };

    return () => {
      if (audioCtx && audioCtx.state !== "closed") {
        audioCtx.close().catch(() => {});
      }
    };
  }, [soundEnabled]);

  // -------------------------------------------------------------
  // THREE.JS 3D RACE ENGINE
  // -------------------------------------------------------------
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
    let isDisposed = false;

    // Track Spline
    const trackDef = TRACKS[selectedTrack] || TRACKS.gurugram;
    const splinePoints = trackDef.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const spline = new THREE.CatmullRomCurve3(splinePoints, true, "centripetal");
    const trackLength = spline.getLength();

    // Player State
    const vehicleDef = VEHICLES.find((v) => v.id === selectedVehicle) || VEHICLES[0];
    let playerU = 0.0; // 0.0 to 1.0 along spline
    let playerSpeed = 0.0; // km/h
    let playerLateralOffset = 0.0; // distance from center line (-roadWidth/2 to +roadWidth/2)
    let playerSteerAngle = 0.0;
    let playerNitro = 100.0;
    let playerLap = 1;
    let currentLapStartTime = performance.now();
    let bestLapTimeSec: number | null = null;
    let totalScore = 0;
    let isDriftingNow = false;

    // 7 AI Rivals State
    interface AIRivalInstance {
      name: string;
      group: THREE.Group;
      frontWheel: THREE.Object3D;
      u: number;
      speed: number;
      lateralOffset: number;
      targetOffset: number;
      skill: number;
      lap: number;
      totalDistance: number;
    }
    const rivalsInstances: AIRivalInstance[] = [];

    // ---------------------------------------------------------
    // 3D Procedural Auto-Rickshaw Builder
    // ---------------------------------------------------------
    function createRickshawModel(bodyHex: string, canopyHex: string, frameHex: string, isPlayerVehicle = false) {
      const group = new THREE.Group();

      const bodyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bodyHex),
        metalness: 0.25,
        roughness: 0.5,
      });
      const canopyMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(canopyHex),
        metalness: 0.05,
        roughness: 0.7,
      });
      const frameMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(frameHex),
        metalness: 0.7,
        roughness: 0.3,
      });
      const chromeMat = new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        metalness: 0.9,
        roughness: 0.1,
      });
      const blackRubberMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.9,
      });
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        transmission: 0.8,
      });

      // Main Cabin Lower Body
      const bodyGeo = new THREE.BoxGeometry(2.4, 1.4, 3.6);
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      bodyMesh.position.set(0, 1.2, 0);
      bodyMesh.castShadow = true;
      group.add(bodyMesh);

      // Tapered Front Nose Cockpit
      const noseGeo = new THREE.CylinderGeometry(0.5, 1.2, 1.6, 6);
      const noseMesh = new THREE.Mesh(noseGeo, bodyMat);
      noseMesh.position.set(0, 1.1, 2.2);
      noseMesh.rotation.x = Math.PI / 2;
      noseMesh.castShadow = true;
      group.add(noseMesh);

      // Windshield Glass
      const glassGeo = new THREE.PlaneGeometry(1.9, 1.2);
      const glassMesh = new THREE.Mesh(glassGeo, glassMat);
      glassMesh.position.set(0, 2.3, 1.8);
      glassMesh.rotation.x = -Math.PI / 10;
      group.add(glassMesh);

      // Curved Canopy Roof
      const roofGeo = new THREE.BoxGeometry(2.35, 0.25, 3.4);
      const roofMesh = new THREE.Mesh(roofGeo, canopyMat);
      roofMesh.position.set(0, 2.9, -0.1);
      roofMesh.castShadow = true;
      group.add(roofMesh);

      // Roll Bar / Tubular Safety Frame
      const barGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
      for (const sx of [-1.1, 1.1]) {
        for (const sz of [-1.6, 1.5]) {
          const bar = new THREE.Mesh(barGeo, frameMat);
          bar.position.set(sx, 2.1, sz);
          group.add(bar);
        }
      }

      // Chrome Round Headlight
      const lampGeo = new THREE.CylinderGeometry(0.3, 0.25, 0.3, 16);
      const lampMesh = new THREE.Mesh(
        lampGeo,
        new THREE.MeshStandardMaterial({
          color: 0xfff6c5,
          emissive: 0xffe066,
          emissiveIntensity: 0.6,
        })
      );
      lampMesh.rotation.x = Math.PI / 2;
      lampMesh.position.set(0, 1.2, 3.1);
      group.add(lampMesh);

      // Front Wheel Fork (Steerable)
      const forkGroup = new THREE.Group();
      forkGroup.position.set(0, 0.55, 2.3);
      const wheelGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.35, 16);
      wheelGeo.rotateZ(Math.PI / 2);
      const fWheel = new THREE.Mesh(wheelGeo, blackRubberMat);
      fWheel.castShadow = true;
      forkGroup.add(fWheel);
      group.add(forkGroup);

      // Dual Rear Wheels
      for (const sx of [-1.25, 1.25]) {
        const rWheel = new THREE.Mesh(wheelGeo, blackRubberMat);
        rWheel.position.set(sx, 0.55, -1.2);
        rWheel.castShadow = true;
        group.add(rWheel);
      }

      // Chrome Rear Exhaust Pipe
      const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
      exhaustGeo.rotateX(Math.PI / 2);
      const exhaustMesh = new THREE.Mesh(exhaustGeo, chromeMat);
      exhaustMesh.position.set(0.7, 0.5, -1.9);
      group.add(exhaustMesh);

      // Rear Taillights
      for (const sx of [-0.9, 0.9]) {
        const tailGeo = new THREE.BoxGeometry(0.25, 0.2, 0.1);
        const tailMesh = new THREE.Mesh(
          tailGeo,
          new THREE.MeshStandardMaterial({
            color: 0xff0033,
            emissive: 0xff0033,
            emissiveIntensity: 0.8,
          })
        );
        tailMesh.position.set(sx, 1.2, -1.85);
        group.add(tailMesh);
      }

      // If AI Rival, add 3D Floating Name Banner
      if (!isPlayerVehicle) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(11, 16, 38, 0.8)";
          ctx.roundRect(4, 4, 248, 56, 12);
          ctx.fill();
          ctx.strokeStyle = bodyHex;
          ctx.lineWidth = 4;
          ctx.stroke();
          ctx.font = "bold 28px sans-serif";
          ctx.fillStyle = "#ffffff";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("AI RACER", 128, 32);
        }
        const tex = new THREE.CanvasTexture(canvas);
        const tagGeo = new THREE.PlaneGeometry(2.4, 0.6);
        const tagMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide });
        const tagMesh = new THREE.Mesh(tagGeo, tagMat);
        tagMesh.position.set(0, 3.8, 0);
        group.add(tagMesh);
      }

      return { group, frontWheel: forkGroup };
    }

    // ---------------------------------------------------------
    // SCENE INITIALIZATION
    // ---------------------------------------------------------
    function initScene() {
      if (!viewport) return;
      const width = viewport.clientWidth || 850;
      const height = viewport.clientHeight || 500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(trackDef.skyColor);
      scene.fog = new THREE.FogExp2(trackDef.skyColor, 0.0018);

      camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 3000);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      viewport.innerHTML = "";
      viewport.appendChild(renderer.domElement);

      // Ambient & Directional Sun Lights
      ambientLight = new THREE.AmbientLight(trackDef.ambientDay, 0.85);
      scene.add(ambientLight);

      dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
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

      // Night Spotlight on Player
      headLight = new THREE.SpotLight(0xfff6c5, 0, 180, Math.PI / 4, 0.3, 1);
      headLight.position.set(0, 2, 2);
      scene.add(headLight);

      // Massive Ground Plane
      const groundGeo = new THREE.PlaneGeometry(4000, 4000);
      const groundMat = new THREE.MeshStandardMaterial({
        color: trackDef.groundColor,
        roughness: 0.9,
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.1;
      ground.receiveShadow = true;
      scene.add(ground);

      // Build 3D Track Road & Curbs
      buildTrackMesh();

      // Build City Scenery & Landmarks
      buildCityScenery();
    }

    // ---------------------------------------------------------
    // 3D ROAD EXTRUSION & CURBS GENERATOR
    // ---------------------------------------------------------
    function buildTrackMesh() {
      const segments = 240;
      const roadW = trackDef.roadWidth;
      const halfW = roadW / 2;

      const roadPositions: number[] = [];
      const roadNormals: number[] = [];
      const roadUvs: number[] = [];

      const curbLPositions: number[] = [];
      const curbRPositions: number[] = [];

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const pt = spline.getPointAt(u);
        const tangent = spline.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        // Left & Right edges of road
        const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);
        const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);

        // Asphalt road surface
        roadPositions.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
        roadPositions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);

        roadNormals.push(0, 1, 0, 0, 1, 0);
        roadUvs.push(0, u * 40, 1, u * 40);

        // Striped Curbs
        const curbWidth = 1.4;
        const curbLOuter = new THREE.Vector3().copy(leftPt).addScaledVector(normal, curbWidth);
        curbLPositions.push(leftPt.x, leftPt.y + 0.15, leftPt.z);
        curbLPositions.push(curbLOuter.x, curbLOuter.y + 0.1, curbLOuter.z);

        const curbROuter = new THREE.Vector3().copy(rightPt).addScaledVector(normal, -curbWidth);
        curbRPositions.push(rightPt.x, rightPt.y + 0.15, rightPt.z);
        curbRPositions.push(curbROuter.x, curbROuter.y + 0.1, curbROuter.z);
      }

      // Asphalt Road Mesh
      const roadIndices: number[] = [];
      for (let i = 0; i < segments; i++) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        roadIndices.push(a, b, c);
        roadIndices.push(b, d, c);
      }

      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPositions, 3));
      roadGeo.setAttribute("normal", new THREE.Float32BufferAttribute(roadNormals, 3));
      roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(roadUvs, 2));
      roadGeo.setIndex(roadIndices);

      const roadMat = new THREE.MeshStandardMaterial({
        color: 0x22252a,
        roughness: 0.8,
        metalness: 0.1,
      });
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);

      // Red & White Striped Kerbs
      const curbGeoL = new THREE.BufferGeometry();
      curbGeoL.setAttribute("position", new THREE.Float32BufferAttribute(curbLPositions, 3));
      curbGeoL.setIndex(roadIndices);
      const curbMatL = new THREE.MeshStandardMaterial({ color: 0xd90429, roughness: 0.7 });
      const curbMeshL = new THREE.Mesh(curbGeoL, curbMatL);
      scene.add(curbMeshL);

      const curbGeoR = new THREE.BufferGeometry();
      curbGeoR.setAttribute("position", new THREE.Float32BufferAttribute(curbRPositions, 3));
      curbGeoR.setIndex(roadIndices);
      const curbMatR = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 });
      const curbMeshR = new THREE.Mesh(curbGeoR, curbMatR);
      scene.add(curbMeshR);

      // Start / Finish Line Checkered Arch
      const startPt = spline.getPointAt(0);
      const startTangent = spline.getTangentAt(0).normalize();

      const gantryGroup = new THREE.Group();
      gantryGroup.position.copy(startPt);
      gantryGroup.lookAt(new THREE.Vector3().copy(startPt).add(startTangent));

      const pillarGeo = new THREE.BoxGeometry(1.5, 12, 1.5);
      const pillarMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
      const pillarL = new THREE.Mesh(pillarGeo, pillarMat);
      pillarL.position.set(-halfW - 2, 6, 0);
      gantryGroup.add(pillarL);

      const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
      pillarR.position.set(halfW + 2, 6, 0);
      gantryGroup.add(pillarR);

      const archGeo = new THREE.BoxGeometry(roadW + 6, 2.5, 2);
      const archMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x005577 });
      const arch = new THREE.Mesh(archGeo, archMat);
      arch.position.set(0, 12, 0);
      gantryGroup.add(arch);

      scene.add(gantryGroup);
    }

    // ---------------------------------------------------------
    // PROCEDURAL CITY SCENERY & HIGH-RISES
    // ---------------------------------------------------------
    function buildCityScenery() {
      const buildingCount = 55;
      const bldgMatDay = new THREE.MeshStandardMaterial({ color: 0x8d99ae, roughness: 0.85 });
      const bldgMatGlass = new THREE.MeshStandardMaterial({ color: 0x2b2d42, roughness: 0.3, metalness: 0.8 });

      for (let i = 0; i < buildingCount; i++) {
        const u = (i / buildingCount + Math.random() * 0.05) % 1.0;
        const pt = spline.getPointAt(u);
        const tangent = spline.getTangentAt(u).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

        const side = i % 2 === 0 ? 1 : -1;
        const dist = trackDef.roadWidth * 0.6 + 20 + Math.random() * 90;
        const bPos = new THREE.Vector3().copy(pt).addScaledVector(normal, side * dist);

        const bw = 25 + Math.random() * 35;
        const bd = 25 + Math.random() * 35;
        const bh = 50 + Math.random() * 120;

        const bldgGeo = new THREE.BoxGeometry(bw, bh, bd);
        const bldgMesh = new THREE.Mesh(bldgGeo, i % 3 === 0 ? bldgMatGlass : bldgMatDay);
        bldgMesh.position.set(bPos.x, bh / 2, bPos.z);
        bldgMesh.castShadow = true;
        bldgMesh.receiveShadow = true;
        scene.add(bldgMesh);

        // Add streetlights along track
        if (i % 2 === 0) {
          const lampPostGeo = new THREE.CylinderGeometry(0.2, 0.3, 10, 8);
          const lampPost = new THREE.Mesh(lampPostGeo, new THREE.MeshStandardMaterial({ color: 0x444444 }));
          const lampPt = new THREE.Vector3().copy(pt).addScaledVector(normal, side * (trackDef.roadWidth / 2 + 2));
          lampPost.position.set(lampPt.x, 5, lampPt.z);
          scene.add(lampPost);
        }
      }

      // If Karachi Track, add the iconic Habib Bank / Telecom Tower landmark
      if (selectedTrack === "karachi") {
        const towerGroup = new THREE.Group();
        const towerMat = new THREE.MeshStandardMaterial({ color: 0xdfe8ff, roughness: 0.4, metalness: 0.7 });
        const tBase = new THREE.Mesh(new THREE.CylinderGeometry(18, 24, 180, 16), towerMat);
        tBase.position.y = 90;
        towerGroup.add(tBase);
        const tSpire = new THREE.Mesh(new THREE.ConeGeometry(18, 50, 16), towerMat);
        tSpire.position.y = 205;
        towerGroup.add(tSpire);
        towerGroup.position.set(150, 0, 450);
        scene.add(towerGroup);
      }
    }

    // ---------------------------------------------------------
    // SPAWN PLAYER & 7 AI RIVALS
    // ---------------------------------------------------------
    initScene();

    // Player Rickshaw
    const playerRickshaw = createRickshawModel(vehicleDef.bodyColor, vehicleDef.canopyColor, vehicleDef.frameColor, true);
    scene.add(playerRickshaw.group);

    // 7 AI Rivals
    RIVALS.forEach((rival, idx) => {
      const model = createRickshawModel(rival.bodyColor, rival.canopyColor, "#222222", false);
      scene.add(model.group);

      // Start grid spacing behind player
      const startU = (1.0 - (idx + 1) * 0.018) % 1.0;
      rivalsInstances.push({
        name: rival.name,
        group: model.group,
        frontWheel: model.frontWheel,
        u: startU,
        speed: 36 + Math.random() * 6,
        lateralOffset: rival.targetOffset * (trackDef.roadWidth * 0.35),
        targetOffset: rival.targetOffset * (trackDef.roadWidth * 0.35),
        skill: rival.skill,
        lap: 1,
        totalDistance: startU * trackLength,
      });
    });

    // ---------------------------------------------------------
    // INPUT LISTENERS (Desktop Keyboard)
    // ---------------------------------------------------------
    const onKeyDown = (e: KeyboardEvent) => {
      // Sound init on first interaction
      if (soundEngineRef.current) soundEngineRef.current.init();

      if (e.code === "ArrowUp" || e.code === "KeyW") controlsRef.current.throttle = 1;
      if (e.code === "ArrowDown" || e.code === "KeyS") controlsRef.current.brake = 1;
      if (e.code === "ArrowLeft" || e.code === "KeyA") controlsRef.current.steer = -1;
      if (e.code === "ArrowRight" || e.code === "KeyD") controlsRef.current.steer = 1;
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        controlsRef.current.drift = true;
      }
      if (e.code === "KeyN" || e.code === "ControlLeft") {
        controlsRef.current.nitro = true;
      }
      if (e.code === "KeyP") {
        if (gameTriggerRef.current) gameTriggerRef.current.togglePause();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") controlsRef.current.throttle = 0;
      if (e.code === "ArrowDown" || e.code === "KeyS") controlsRef.current.brake = 0;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        if (controlsRef.current.steer === -1) controlsRef.current.steer = 0;
      }
      if (e.code === "ArrowRight" || e.code === "KeyD") {
        if (controlsRef.current.steer === 1) controlsRef.current.steer = 0;
      }
      if (e.code === "Space" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        controlsRef.current.drift = false;
      }
      if (e.code === "KeyN" || e.code === "ControlLeft") {
        controlsRef.current.nitro = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    // ---------------------------------------------------------
    // TIME OF DAY SWITCHER (Day / Sunset / Night)
    // ---------------------------------------------------------
    function applyTimeOfDay(mode: "day" | "sunset" | "night") {
      if (!scene || !ambientLight || !dirLight || !headLight) return;
      if (mode === "day") {
        scene.background = new THREE.Color(trackDef.skyColor);
        scene.fog = new THREE.FogExp2(trackDef.skyColor, 0.0018);
        ambientLight.intensity = 0.85;
        ambientLight.color.set(trackDef.ambientDay);
        dirLight.intensity = 1.4;
        dirLight.color.set(0xffffff);
        headLight.intensity = 0;
      } else if (mode === "sunset") {
        scene.background = new THREE.Color(0xff7043);
        scene.fog = new THREE.FogExp2(0xff7043, 0.0025);
        ambientLight.intensity = 0.6;
        ambientLight.color.set(0xffab91);
        dirLight.intensity = 1.0;
        dirLight.color.set(0xff9800);
        headLight.intensity = 0.8;
      } else {
        // Night
        scene.background = new THREE.Color(0x0b1026);
        scene.fog = new THREE.FogExp2(0x0b1026, 0.0035);
        ambientLight.intensity = 0.25;
        ambientLight.color.set(0x3d4a68);
        dirLight.intensity = 0.45;
        dirLight.color.set(0x8fa4d2);
        headLight.intensity = 3.5;
      }
    }
    applyTimeOfDay(timeOfDay);

    // ---------------------------------------------------------
    // GAME TRIGGER APIS
    // ---------------------------------------------------------
    gameTriggerRef.current = {
      startRace: () => {
        if (soundEngineRef.current) soundEngineRef.current.init();
        setGameState("countdown");
        setCountdownNum(3);
        if (soundEngineRef.current) soundEngineRef.current.playBeep(false);

        let count = 3;
        const interval = setInterval(() => {
          count--;
          if (count > 0) {
            setCountdownNum(count);
            if (soundEngineRef.current) soundEngineRef.current.playBeep(false);
          } else if (count === 0) {
            setCountdownNum("GO!");
            if (soundEngineRef.current) soundEngineRef.current.playBeep(true);
          } else {
            clearInterval(interval);
            setGameState("racing");
            currentLapStartTime = performance.now();
          }
        }, 900);
      },
      togglePause: () => {
        setGameState((prev) => (prev === "racing" ? "paused" : prev === "paused" ? "racing" : prev));
      },
      setNightMode: (mode) => {
        setTimeOfDay(mode);
        applyTimeOfDay(mode);
      },
    };

    // ---------------------------------------------------------
    // MAIN PHYSICS & RENDER LOOP
    // ---------------------------------------------------------
    let lastTime = performance.now();

    function gameLoop(now: number) {
      if (isDisposed) return;
      animId = requestAnimationFrame(gameLoop);

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      if (gameState === "paused") {
        renderer.render(scene, camera);
        return;
      }

      const ctrl = controlsRef.current;
      const isRacing = gameState === "racing";

      // 1. Player Acceleration & Top Speed
      const maxSpeed = vehicleDef.topSpeed + (ctrl.nitro && playerNitro > 1 ? vehicleDef.nitroBonus : 0);
      const accelRate = vehicleDef.accel * (ctrl.nitro && playerNitro > 1 ? 1.6 : 1.0);

      if (isRacing && ctrl.throttle > 0) {
        playerSpeed = Math.min(maxSpeed, playerSpeed + accelRate * dt);
      } else if (isRacing && ctrl.brake > 0) {
        playerSpeed = Math.max(-10, playerSpeed - 24 * dt);
      } else {
        // Natural Coasting / Rolling resistance
        if (playerSpeed > 0) playerSpeed = Math.max(0, playerSpeed - 5.5 * dt);
        else if (playerSpeed < 0) playerSpeed = Math.min(0, playerSpeed + 8.0 * dt);
      }

      // Nitro Depletion & Regeneration
      if (isRacing && ctrl.nitro && playerNitro > 0) {
        playerNitro = Math.max(0, playerNitro - 26 * dt);
        if (soundEngineRef.current) soundEngineRef.current.playNitro(true);
      } else {
        if (soundEngineRef.current) soundEngineRef.current.playNitro(false);
        // Passive nitro regeneration when driving fast or drifting
        if (playerSpeed > 15) playerNitro = Math.min(100, playerNitro + (ctrl.drift ? 16 : 4) * dt);
      }
      setNitroAmount(Math.round(playerNitro));

      // 2. Steering & Drifting
      const steerSpeed = (ctrl.drift ? 1.4 : 1.0) * vehicleDef.handling * (playerSpeed / 40);
      playerLateralOffset += ctrl.steer * steerSpeed * 14 * dt;
      // Clamp within road width
      const maxOffset = trackDef.roadWidth * 0.45;
      if (Math.abs(playerLateralOffset) > maxOffset) {
        playerLateralOffset = Math.sign(playerLateralOffset) * maxOffset;
        playerSpeed *= 0.96; // Road edge friction
      }

      playerSteerAngle = THREE.MathUtils.lerp(playerSteerAngle, ctrl.steer * 0.45, 0.15);
      playerRickshaw.frontWheel.rotation.y = -playerSteerAngle;

      // Drift Score Logic
      isDriftingNow = isRacing && ctrl.drift && Math.abs(ctrl.steer) > 0.2 && playerSpeed > 20;
      if (isDriftingNow) {
        totalScore += Math.round(150 * dt);
        setDriftScore(totalScore);
        if (Math.random() < 0.05) {
          setDriftPopup({ text: "DRIFT +150 PTS!", id: Date.now() });
        }
      }
      if (soundEngineRef.current) soundEngineRef.current.playDrift(isDriftingNow);

      // Advance Player Position along Track Spline
      const distanceMoved = (playerSpeed * (1000 / 3600)) * dt; // km/h to m/s
      playerU = (playerU + distanceMoved / trackLength) % 1.0;

      // Track Spline Sampling
      const playerPosOnSpline = spline.getPointAt(playerU);
      const playerTangent = spline.getTangentAt(playerU).normalize();
      const playerNormal = new THREE.Vector3(-playerTangent.z, 0, playerTangent.x).normalize();

      const finalPlayerPos = new THREE.Vector3()
        .copy(playerPosOnSpline)
        .addScaledVector(playerNormal, playerLateralOffset);

      playerRickshaw.group.position.copy(finalPlayerPos);
      playerRickshaw.group.lookAt(new THREE.Vector3().copy(finalPlayerPos).add(playerTangent));

      // Rickshaw Body Roll & Pitch
      const targetRoll = -ctrl.steer * 0.12 * (playerSpeed / 40);
      playerRickshaw.group.rotation.z = THREE.MathUtils.lerp(playerRickshaw.group.rotation.z, targetRoll, 0.15);

      // Night Spotlight position update
      headLight.position.set(finalPlayerPos.x, finalPlayerPos.y + 2, finalPlayerPos.z);
      headLight.target.position.set(
        finalPlayerPos.x + playerTangent.x * 20,
        finalPlayerPos.y,
        finalPlayerPos.z + playerTangent.z * 20
      );
      scene.add(headLight.target);

      // 3. Camera Chase System
      const camFollowDist = ctrl.nitro && playerNitro > 1 ? 13 : 11;
      const camHeight = 4.8;
      const targetCamPos = new THREE.Vector3()
        .copy(finalPlayerPos)
        .addScaledVector(playerTangent, -camFollowDist)
        .add(new THREE.Vector3(0, camHeight, 0));

      camera.position.lerp(targetCamPos, 0.12);
      camera.lookAt(new THREE.Vector3(finalPlayerPos.x, finalPlayerPos.y + 1.8, finalPlayerPos.z));

      // Dynamic FOV for speed sensation
      const targetFov = 60 + (playerSpeed / 60) * 15 + (ctrl.nitro && playerNitro > 1 ? 8 : 0);
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.1);
      camera.updateProjectionMatrix();

      // 4. Update 7 AI Rivals
      let playerRank = 1;
      const totalPlayerDist = (playerLap - 1) * trackLength + playerU * trackLength;

      rivalsInstances.forEach((rival) => {
        if (isRacing) {
          const rivalTargetSpeed = (vehicleDef.topSpeed * 0.95 + rival.skill * 4) * (1000 / 3600);
          rival.speed = THREE.MathUtils.lerp(rival.speed, rivalTargetSpeed, 0.05);

          const rivalDistMoved = rival.speed * dt;
          const prevU = rival.u;
          rival.u = (rival.u + rivalDistMoved / trackLength) % 1.0;
          if (rival.u < prevU) rival.lap++;

          rival.totalDistance = (rival.lap - 1) * trackLength + rival.u * trackLength;
        }

        if (rival.totalDistance > totalPlayerDist) playerRank++;

        const rivalPos = spline.getPointAt(rival.u);
        const rivalTangent = spline.getTangentAt(rival.u).normalize();
        const rivalNormal = new THREE.Vector3(-rivalTangent.z, 0, rivalTangent.x).normalize();

        const finalRivalPos = new THREE.Vector3()
          .copy(rivalPos)
          .addScaledVector(rivalNormal, rival.lateralOffset);

        rival.group.position.copy(finalRivalPos);
        rival.group.lookAt(new THREE.Vector3().copy(finalRivalPos).add(rivalTangent));
      });

      setPosition(playerRank);

      // 5. Lap Completion Detection
      if (isRacing && distanceMoved > 0) {
        // If wrapped around start line
        const lapElapsed = (performance.now() - currentLapStartTime) / 1000;
        setLapTime(lapElapsed);

        if (playerU < 0.03 && lapElapsed > 12) {
          if (!bestLapTimeSec || lapElapsed < bestLapTimeSec) {
            bestLapTimeSec = lapElapsed;
            setBestLapTime(lapElapsed);
          }
          if (playerLap >= totalLaps) {
            // Race Finished!
            setGameState("finished");
            const rankings = [
              { rank: playerRank, name: "YOU (Player)", time: lapElapsed * totalLaps },
              ...rivalsInstances.map((r, i) => ({
                rank: i + 2,
                name: r.name,
                time: lapElapsed * totalLaps + (i + 1) * 2.2,
              })),
            ].sort((a, b) => a.time - b.time);
            setFinalRankings(rankings);
          } else {
            playerLap++;
            setCurrentLap(playerLap);
            currentLapStartTime = performance.now();
          }
        }
      }

      // Update Engine Sound
      if (soundEngineRef.current) {
        soundEngineRef.current.updateEngine(playerSpeed, ctrl.throttle > 0, ctrl.nitro && playerNitro > 1);
      }

      setSpeedKmh(Math.max(0, Math.round(playerSpeed)));
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

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", onResize);
      if (renderer) renderer.dispose();
    };
  }, [selectedTrack, selectedVehicle, totalLaps, gameState, timeOfDay]);

  return (
    <div id="game-container" ref={containerRef}>
      {/* Three.js 3D Viewport */}
      <div id="viewport" ref={viewportRef} />

      {/* Main HUD Overlay */}
      {gameState !== "menu" && (
        <div className="game-hud">
          {/* Top Bar: Position, Laps, Mini-Map, Controls */}
          <div className="hud-top-bar">
            <div className="hud-left">
              <div className="pos-badge">
                <span className="pos-main">
                  {position}
                  <sup style={{ fontSize: "16px" }}>
                    {position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th"}
                  </sup>
                </span>
                <span className="pos-total">/ 8</span>
              </div>

              <div className="race-timer-box">
                <span className="lap-pill">
                  LAP {currentLap} / {totalLaps}
                </span>
                <span className="time-pill">⏱️ {lapTime.toFixed(1)}s</span>
                {bestLapTime && <span style={{ color: "#06d6a0" }}>⭐ Best: {bestLapTime.toFixed(1)}s</span>}
              </div>

              {/* Live Track Progress Bar */}
              <div className="track-progress-bar">
                <div className="progress-track-fill" style={{ width: `${Math.round(((currentLap - 1) / totalLaps) * 100)}%` }} />
                <div className="progress-player-pin" style={{ left: "50%" }} />
              </div>
            </div>

            {/* Right Buttons: Time of Day, Sound, Pause */}
            <div className="hud-right">
              <button
                className="icon-btn"
                onClick={() => {
                  const nextMode = timeOfDay === "day" ? "sunset" : timeOfDay === "sunset" ? "night" : "day";
                  if (gameTriggerRef.current) gameTriggerRef.current.setNightMode(nextMode);
                }}
              >
                {timeOfDay === "day" ? "☀️ DAY" : timeOfDay === "sunset" ? "🌅 DUSK" : "🌙 NIGHT"}
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  setSoundEnabled((v) => {
                    const next = !v;
                    if (soundEngineRef.current) soundEngineRef.current.setMuted(!next);
                    return next;
                  });
                }}
              >
                {soundEnabled ? "🔊 SOUND" : "🔇 MUTED"}
              </button>
              <button
                className="icon-btn"
                onClick={() => {
                  if (gameTriggerRef.current) gameTriggerRef.current.togglePause();
                }}
              >
                {gameState === "paused" ? "▶️ RESUME" : "⏸️ PAUSE"}
              </button>
            </div>
          </div>

          {/* Drift Tag Notification */}
          {driftPopup && (
            <div key={driftPopup.id} className="drift-tag-popup">
              🔥 {driftPopup.text}
            </div>
          )}

          {/* Bottom Bar: Speedometer & Nitro Boost Gauge */}
          <div className="hud-bottom-bar">
            <div className="speedo-cluster">
              <div className="speedo-card">
                <span className="speed-value">{speedKmh}</span>
                <span className="speed-unit">KM / H</span>
              </div>

              <div className="nitro-cluster">
                <div className="nitro-label">
                  <span>⚡ NITRO BOOST</span>
                  <span>{nitroAmount}%</span>
                </div>
                <div className="nitro-bar-wrap">
                  <div className="nitro-bar-fill" style={{ width: `${nitroAmount}%` }} />
                </div>
              </div>
            </div>

            {driftScore > 0 && (
              <div className="pos-badge" style={{ background: "rgba(0, 240, 255, 0.2)", color: "#00f0ff" }}>
                🎯 SCORE: {driftScore}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Countdown 3-2-1-GO Overlay */}
      {gameState === "countdown" && (
        <div className="countdown-overlay">
          <div className={`countdown-number ${countdownNum === "GO!" ? "go" : ""}`}>
            {countdownNum}
          </div>
        </div>
      )}

      {/* Main Start Menu */}
      {gameState === "menu" && (
        <div className="screen-overlay">
          <div className="modal-panel">
            <div className="game-title">AUTO RUSH 3D</div>
            <div className="game-subtitle">GRAND PRIX CHAMPIONSHIP</div>

            {/* City / Track Selector */}
            <div style={{ textAlign: "left", marginBottom: "8px", fontSize: "13px", fontWeight: "700" }}>
              🗺️ SELECT CIRCUIT
            </div>
            <div className="selection-grid">
              {Object.values(TRACKS).map((t) => (
                <div
                  key={t.id}
                  className={`select-card ${selectedTrack === t.id ? "active" : ""}`}
                  onClick={() => setSelectedTrack(t.id)}
                >
                  <div className="select-card-name">{t.city}</div>
                  <div className="select-card-desc">{t.name}</div>
                </div>
              ))}
            </div>

            {/* Rickshaw Garage Selector */}
            <div style={{ textAlign: "left", marginBottom: "8px", fontSize: "13px", fontWeight: "700" }}>
              🛺 CHOOSE YOUR RICKSHAW
            </div>
            <div className="selection-grid">
              {VEHICLES.map((v) => (
                <div
                  key={v.id}
                  className={`select-card ${selectedVehicle === v.id ? "active" : ""}`}
                  onClick={() => setSelectedVehicle(v.id)}
                >
                  <div className="select-card-name">{v.name}</div>
                  <div className="select-card-desc">Max: {v.topSpeed} km/h</div>
                </div>
              ))}
            </div>

            {/* Laps Options */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "24px" }}>
              {[1, 3, 5].map((laps) => (
                <button
                  key={laps}
                  className={`icon-btn ${totalLaps === laps ? "active" : ""}`}
                  onClick={() => setTotalLaps(laps)}
                  style={{
                    borderColor: totalLaps === laps ? "#ffb703" : "rgba(255,255,255,0.2)",
                    background: totalLaps === laps ? "rgba(255,183,3,0.2)" : undefined,
                  }}
                >
                  🏁 {laps} {laps === 1 ? "LAP" : "LAPS"}
                </button>
              ))}
            </div>

            {/* Start Race Button */}
            <button
              className="action-btn"
              onClick={() => {
                if (gameTriggerRef.current) gameTriggerRef.current.startRace();
              }}
            >
              START RACE 🚀
            </button>
          </div>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {gameState === "paused" && (
        <div className="screen-overlay">
          <div className="modal-panel">
            <div className="game-title">RACE PAUSED</div>
            <div className="game-subtitle">Press P or click below to resume</div>
            <button
              className="action-btn"
              onClick={() => {
                if (gameTriggerRef.current) gameTriggerRef.current.togglePause();
              }}
            >
              RESUME RACE ▶️
            </button>
            <button
              className="action-btn secondary"
              onClick={() => {
                setGameState("menu");
              }}
            >
              MAIN MENU 🏠
            </button>
          </div>
        </div>
      )}

      {/* Race Finished Results Screen */}
      {gameState === "finished" && (
        <div className="screen-overlay">
          <div className="modal-panel">
            <div className="game-title">
              {position === 1 ? "🏆 VICTORY!" : position <= 3 ? "🥈 PODIUM FINISH!" : "🏁 RACE FINISHED"}
            </div>
            <div className="game-subtitle">
              You finished in {position}
              {position === 1 ? "st" : position === 2 ? "nd" : position === 3 ? "rd" : "th"} place!
            </div>

            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "14px" }}>
                <span>Total Drift Score:</span>
                <span style={{ color: "#00f0ff", fontWeight: "bold" }}>{driftScore} PTS</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "14px" }}>
                <span>Fastest Lap Time:</span>
                <span style={{ color: "#06d6a0", fontWeight: "bold" }}>
                  {bestLapTime ? `${bestLapTime.toFixed(2)}s` : "--"}
                </span>
              </div>
              {finalRankings.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "8px", maxHeight: "140px", overflowY: "auto" }}>
                  {finalRankings.slice(0, 5).map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "2px 0", color: r.name.includes("YOU") ? "#ffb703" : "#aaa" }}>
                      <span>#{i + 1} {r.name}</span>
                      <span>{r.time.toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              className="action-btn"
              onClick={() => {
                if (gameTriggerRef.current) gameTriggerRef.current.startRace();
              }}
            >
              RACE AGAIN 🔄
            </button>
            <button
              className="action-btn secondary"
              onClick={() => {
                setGameState("menu");
              }}
            >
              MAIN MENU 🏠
            </button>
          </div>
        </div>
      )}

      {/* Mobile Touch Controls for handheld devices */}
      <div className="mobile-controls">
        <div className="touch-cluster-left">
          <div
            className="touch-btn"
            onTouchStart={() => (controlsRef.current.steer = -1)}
            onTouchEnd={() => (controlsRef.current.steer = 0)}
          >
            ◀️
          </div>
          <div
            className="touch-btn"
            onTouchStart={() => (controlsRef.current.steer = 1)}
            onTouchEnd={() => (controlsRef.current.steer = 0)}
          >
            ▶️
          </div>
        </div>

        <div className="touch-cluster-right">
          <div
            className="touch-btn nitro"
            onTouchStart={() => (controlsRef.current.nitro = true)}
            onTouchEnd={() => (controlsRef.current.nitro = false)}
          >
            ⚡
          </div>
          <div
            className="touch-btn drift"
            onTouchStart={() => (controlsRef.current.drift = true)}
            onTouchEnd={() => (controlsRef.current.drift = false)}
          >
            💨
          </div>
          <div
            className="touch-btn"
            onTouchStart={() => (controlsRef.current.brake = 1)}
            onTouchEnd={() => (controlsRef.current.brake = 0)}
          >
            🛑
          </div>
          <div
            className="touch-btn"
            onTouchStart={() => (controlsRef.current.throttle = 1)}
            onTouchEnd={() => (controlsRef.current.throttle = 0)}
          >
            🚀
          </div>
        </div>
      </div>
    </div>
  );
}
