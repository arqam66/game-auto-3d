"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import {
  CoinIcon,
  BoltIcon,
  PauseIcon,
  PlayIcon,
  SpeakerIcon,
  SpeakerOffIcon,
  WarningIcon,
  GearIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "./game/icons";
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
  CHALLENGE_POOL,
  generateDailyChallenges,
  UPGRADE_STATS,
  MAX_UPGRADE_LEVEL,
  upgradeCost,
  getUpgradedStat,
  type VehicleDef,
  type DifficultyDef,
  type ChallengeDef,
} from "./game/data";

// =============================================================
// TYPES
// =============================================================
type Phase = "menu" | "countdown" | "racing" | "paused" | "finished";
type TimeMode = "day" | "sunset" | "night";
type ObstacleKind = "tyre" | "cone" | "rickshaw" | "breaker" | "oil" | "manhole";
type CameraMode = "chase" | "hood" | "cinematic";

const VEHICLE_TIERS: Record<string, string> = {
  baba: "CHINGCHI",
  queen: "CNG AUTO",
  hassan: "TRUCK ART",
  mehran: "STREET BOSS",
  bolan: "SUZUKI VAN",
  ravi: "PICKUP",
  seaview: "COASTAL",
  bhatta: "CHAMPION GOLD",
};

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

const TIME_LABELS: Record<TimeMode, string> = {
  day: "DAY",
  sunset: "DUSK",
  night: "NIGHT",
};

// Music themes (day / sunset / night) — shared between audio and rendering effects
type MusicTheme = "day" | "sunset" | "night";
const MUSIC_THEMES: Record<MusicTheme, {
  bassType: OscillatorType;
  leadType: OscillatorType;
  arpType: OscillatorType;
  bassNotes: number[];
  leadNotes: number[];
  arpNotes: number[];
  beatLen: number;
  bassGain: number;
  leadGain: number;
  arpGain: number;
}> = {
  day: {
    bassType: "sine",
    leadType: "triangle",
    arpType: "square",
    bassNotes: [55, 41.2, 36.7, 49],
    leadNotes: [110, 130.8, 146.8, 164.8],
    arpNotes: [220, 246.9, 277.2, 311.1, 277.2, 246.9],
    beatLen: 0.25,
    bassGain: 0.24,
    leadGain: 0.14,
    arpGain: 0.10,
  },
  sunset: {
    bassType: "sawtooth",
    leadType: "sine",
    arpType: "triangle",
    bassNotes: [41.2, 36.7, 32.7, 38.9],
    leadNotes: [82.4, 98.0, 110.0, 123.5],
    arpNotes: [164.8, 185.0, 207.7, 233.1, 207.7, 185.0],
    beatLen: 0.30,
    bassGain: 0.24,
    leadGain: 0.12,
    arpGain: 0.08,
  },
  night: {
    bassType: "square",
    leadType: "sawtooth",
    arpType: "sine",
    bassNotes: [36.7, 32.7, 27.5, 34.6],
    leadNotes: [65.4, 77.8, 87.3, 98.0],
    arpNotes: [130.8, 146.8, 164.8, 185.0, 164.8, 146.8],
    beatLen: 0.35,
    bassGain: 0.20,
    leadGain: 0.10,
    arpGain: 0.06,
  },
};

const CAM_VIEW_OPTIONS: [CamView, string][] = [
  ["low", "LOW"],
  ["normal", "NORMAL"],
  ["high", "HIGH"],
  ["roof", "ROOF"],
];

const VIBRATION_OPTIONS: [Vib, string][] = [
  ["off", "Off"],
  ["light", "Light"],
  ["full", "Full"],
];

type CamView = "low" | "normal" | "high" | "roof";
type Vib = "off" | "light" | "full";

// 2πr for the 64px nitro ring's 28px radius track.
const NITRO_CIRC = 2 * Math.PI * 28;

const ordinal = (n: number) => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1: return `${n}st`;
    case 2: return `${n}nd`;
    case 3: return `${n}rd`;
    default: return `${n}th`;
  }
};

const fmtNum = (n: number) => n.toLocaleString("en-US");

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s - m * 60;
  return `${m}:${sec.toFixed(1).padStart(4, "0")}`;
};

/**
 * A 3x3 block of lit and dark windows on a transparent tile. One texture is
 * shared by every facade and each plane repeats it by size, so a 20 m corner
 * shop and a 120 m tower both get ~2 m windows instead of one giant amber
 * quad — which is what the old single-plane version rendered.
 */
function makeWindowTexture(): THREE.CanvasTexture {
  const tile = 96;
  const cols = 3;
  const rows = 3;
  const canvas = document.createElement("canvas");
  canvas.width = tile;
  canvas.height = tile;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const rng = mulberry32(4471);
    const cw = tile / cols;
    const ch = tile / rows;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        if (rng() < 0.28) continue;
        // Neutral glass in daylight; the amber comes from the emissive channel
        // at dusk and night, so windows do not glow at noon.
        ctx.fillStyle = rng() < 0.16 ? "#ffffff" : rng() < 0.5 ? "#dfe8f4" : "#b9c6d8";
        ctx.fillRect(x * cw + cw * 0.2, y * ch + ch * 0.22, cw * 0.6, ch * 0.5);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

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
  const [musicVolume, setMusicVolume] = useState<number>(80);
  const [effectsVolume, setEffectsVolume] = useState<number>(80);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  // Multiplayer PIN state (safe top-level state only — engine hooks added inside the engine useEffect)
  const [roomPin, setRoomPin] = useState<string>('');
  const [isHost, setIsHost] = useState<boolean>(false);
  const [multiplayerOpen, setMultiplayerOpen] = useState<boolean>(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  const generatePin = () => Math.floor(1000 + Math.random() * 9000).toString();

  const hostRoom = () => {
    const pin = generatePin();
    setRoomPin(pin);
    setIsHost(true);
    channelRef.current = new BroadcastChannel(`karachiRoom_${pin}`);
  };

  const joinRoom = (pin: string) => {
    setRoomPin(pin);
    setIsHost(false);
    channelRef.current = new BroadcastChannel(`karachiRoom_${pin}`);
    setMultiplayerOpen(false);
  };
  const [menuTimeMode, setMenuTimeMode] = useState<TimeMode>("day");
  const [menuWeather, setMenuWeather] = useState<"clear" | "rain">("clear");
  const [phase, setPhase] = useState<Phase>("menu");
  const [loading, setLoading] = useState(true);
  const [loadingVisible, setLoadingVisible] = useState(true);
  const [countdownNum, setCountdownNum] = useState<number | string>(3);
  const [driftPopup, setDriftPopup] = useState<{ text: string; id: number } | null>(null);
  const [wrongWay, setWrongWay] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
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

  // ---- camera mode (chase / hood / cinematic) — switched with C key
  const [cameraMode, setCameraMode] = useState<CameraMode>("chase");

  // ---- camera view (Low / Normal / High / Roof) — autorush style
  type CamView = "low" | "normal" | "high" | "roof";
  const [camView, setCamView] = useState<CamView>("normal");

  // ---- vibration (Off / Light / Full)
  type Vib = "off" | "light" | "full";
  const [vibration, setVibration] = useState<Vib>("light");

  // ---- daily streak (last race date + streak count)
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [dailyBonus, setDailyBonus] = useState<number>(0);
  const [beatPulse, setBeatPulse] = useState<boolean>(false);

  // ---- daily challenges (autorush style) ----
  const [dailyChallenges, setDailyChallenges] = useState<ChallengeDef[]>([]);
  const [challengeProgress, setChallengeProgress] = useState<Record<string, number>>({});
  const [challengeCompleted, setChallengeCompleted] = useState<Record<string, boolean>>({});
  const [challengeClaimed, setChallengeClaimed] = useState<Record<string, boolean>>({});

  // ---- race-session challenge progress (reset each race) ----
  const raceChallenge = useRef<{
    traps: number;
    driftMeters: number;
    coins: number;
    crashes: number;
  }>({ traps: 0, driftMeters: 0, coins: 0, crashes: 0 });

  // ---- vehicle upgrades (per-vehicle stat boosts) ----
  const [upgradeLevels, setUpgradeLevels] = useState<Record<string, Record<string, number>>>({});

  // Resolve the selected vehicle with its applied upgrade levels
  const upgradedVehicle = useMemo(() => {
    const base = vehicleById(selectedVehicle);
    const levels = upgradeLevels[selectedVehicle] ?? {};
    return {
      ...base,
      topSpeed: getUpgradedStat(base, "topSpeed", levels.topSpeed ?? 0),
      accel: getUpgradedStat(base, "accel", levels.accel ?? 0),
      handling: getUpgradedStat(base, "handling", levels.handling ?? 0),
      nitroBonus: getUpgradedStat(base, "nitroBonus", levels.nitroBonus ?? 0),
    };
  }, [selectedVehicle, upgradeLevels]);

  // ---- cinematic crash (letterbox bars + crash sound word, autorush style)
  const [crashWord, setCrashWord] = useState<string | null>(null);
  const [cinematicShowing, setCinematicShowing] = useState<boolean>(false);



  // ---- music theme ref (shared between audio effect and applyTimeMode)
  const musicThemeRef = useRef<MusicTheme>("day");
  const musicBeatRef = useRef<boolean>(false);

  // ---- refs shared with the engine
  const controlsRef = useRef<Controls>({ throttle: 0, brake: 0, steer: 0, nitro: false, drift: false });
  const vehicleRef = useRef<VehicleDef>(VEHICLES[0]);
  const difficultyRef = useRef<DifficultyDef>(DIFFICULTIES[1]);
  const totalLapsRef = useRef(3);
  const soundEnabledRef = useRef(true);
  const prevThrottleRef = useRef<boolean>(false);
  const prevDriftRef = useRef<boolean>(false);
  const prevNitroRef = useRef<boolean>(false);
  const playerNitroRef = useRef<number>(100);
  const fpsRef = useRef(0);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  // The menu TIME row doubles as the race's starting time of day. A ref is
  // needed because the engine is built once and would otherwise close over the
  // initial "day".
  const menuTimeModeRef = useRef<TimeMode>("day");
  const menuWeatherRef = useRef<"clear" | "rain">("clear");

  // ---- engine trigger surface
  const engineRef = useRef<{
    startRace: () => void;
    togglePause: () => void;
    cycleTimeMode: () => void;
    setTimeMode: (m: TimeMode) => void;
    quitRace: () => void;
  } | null>(null);

  // ---- post-processing (HD 3D: bloom + tone mapping)
  const composerRef = useRef<EffectComposer | null>(null);
  const bloomPassRef = useRef<UnrealBloomPass | null>(null);

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
    playCountdown: () => void;
    playHorn: () => void;
    playExhaustPop: () => void;
    playTireSqueal: (intensity: number) => void;
    playNitroWhoosh: () => void;
    duckMusic: (target: number, len: number) => void;
    setMuted: (muted: boolean) => void;
    setMusicVolume: (v: number) => void;
    setEffectsVolume: (v: number) => void;
  } | null>(null);

  // -------------------------------------------------------------
  // PROCEDURAL WEB AUDIO ENGINE — background music + SFX
  // -------------------------------------------------------------
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
    if (soundRef.current) soundRef.current.setMuted(!soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (soundRef.current) {
      soundRef.current.setMusicVolume(musicVolume);
      soundRef.current.setEffectsVolume(effectsVolume);
    }
  }, [musicVolume, effectsVolume]);

  // Auto-start audio on mount so music plays from the menu. AudioContext is
  // suspended by browsers until the first user gesture; on first click/tap we
  // resume it and mark audio unlocked so music/SFX are audible.
  useEffect(() => {
    let initScheduled = false;
    const tryInit = () => {
      if (initScheduled || !soundRef.current) return;
      initScheduled = true;
      try {
        soundRef.current.init();
        setAudioUnlocked(true);
      } catch {
        // AudioContext may still be blocked; user will unlock on next gesture.
      }
    };
    // Attempt once on mount.
    tryInit();
    const onGesture = () => {
      if (audioUnlocked) return;
      soundRef.current?.init();
      setAudioUnlocked(true);
    };
    document.addEventListener("keydown", onGesture, { once: true });
    document.addEventListener("mousedown", onGesture, { once: true });
    document.addEventListener("touchstart", onGesture, { once: true });
    return () => {
      document.removeEventListener("keydown", onGesture);
      document.removeEventListener("mousedown", onGesture);
      document.removeEventListener("touchstart", onGesture);
    };
  }, [audioUnlocked, soundRef.current]);

  useEffect(() => {
    let audioCtx: AudioContext | null = null;
    let masterGain: GainNode | null = null;
    let musicGain: GainNode | null = null;
    let sfxGain: GainNode | null = null;

    // Engine voices (layered for a richer auto-rickshaw putt-putt)
    let engineBass: OscillatorNode | null = null;
    let engineBassGain: GainNode | null = null;
    let engineLead: OscillatorNode | null = null;
    let engineLeadGain: GainNode | null = null;
    let engineFilter: BiquadFilterNode | null = null;

    // Drift / nitro noise
    let driftNoise: AudioBufferSourceNode | null = null;
    let driftGain: GainNode | null = null;
    let nitroGain: GainNode | null = null;

    // Background music voices
    let musicBass: OscillatorNode | null = null;
    let musicBassGain: GainNode | null = null;
    let musicLead: OscillatorNode | null = null;
    let musicLeadGain: GainNode | null = null;
    let musicArp: OscillatorNode | null = null;
    let musicArpGain: GainNode | null = null;
    let musicStartTime = 0;

    // Music theme state — shared with the rendering effect via musicThemeRef
    function buildMusicVoices(theme: MusicTheme) {
      if (!audioCtx || !musicGain) return;
      const cfg = MUSIC_THEMES[theme];
      musicBass = audioCtx.createOscillator();
      musicBass.type = cfg.bassType;
      musicBass.frequency.setValueAtTime(cfg.bassNotes[0], audioCtx.currentTime);
      musicBassGain = audioCtx.createGain();
      musicBassGain.gain.setValueAtTime(cfg.bassGain, audioCtx.currentTime);
      musicBass.connect(musicBassGain);
      musicBassGain.connect(musicGain);
      musicBass.start();

      musicLead = audioCtx.createOscillator();
      musicLead.type = cfg.leadType;
      musicLead.frequency.setValueAtTime(cfg.leadNotes[0], audioCtx.currentTime);
      musicLeadGain = audioCtx.createGain();
      musicLeadGain.gain.setValueAtTime(cfg.leadGain, audioCtx.currentTime);
      musicLead.connect(musicLeadGain);
      musicLeadGain.connect(musicGain);
      musicLead.start();

      musicArp = audioCtx.createOscillator();
      musicArp.type = cfg.arpType;
      musicArp.frequency.setValueAtTime(cfg.arpNotes[0], audioCtx.currentTime);
      musicArpGain = audioCtx.createGain();
      musicArpGain.gain.setValueAtTime(cfg.arpGain, audioCtx.currentTime);
      musicArp.connect(musicArpGain);
      musicArpGain.connect(musicGain);
      musicArp.start();
    }

    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const initAudio = () => {
      if (audioCtx) return;
      audioCtx = new Ctx();
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => { });
      }
      masterGain = audioCtx.createGain();
      masterGain.gain.value = soundEnabledRef.current ? 0.95 : 0;
      masterGain.connect(audioCtx.destination);

      // --- sub-buses ---
      musicGain = audioCtx.createGain();
      musicGain.gain.value = soundEnabledRef.current ? 0.85 : 0;
      musicGain.connect(masterGain);

      sfxGain = audioCtx.createGain();
      sfxGain.gain.value = soundEnabledRef.current ? 0.9 : 0;
      sfxGain.connect(masterGain);

      // --- engine voices ---
      engineBass = audioCtx.createOscillator();
      engineBass.type = "sawtooth";
      engineBass.frequency.setValueAtTime(44, audioCtx.currentTime);
      engineBassGain = audioCtx.createGain();
      engineBassGain.gain.setValueAtTime(0, audioCtx.currentTime);
      engineBass.connect(engineBassGain);
      engineBassGain.connect(sfxGain);
      engineBass.start();

      engineLead = audioCtx.createOscillator();
      engineLead.type = "square";
      engineLead.frequency.setValueAtTime(110, audioCtx.currentTime);
      engineLeadGain = audioCtx.createGain();
      engineLeadGain.gain.setValueAtTime(0, audioCtx.currentTime);
      engineFilter = audioCtx.createBiquadFilter();
      engineFilter.type = "lowpass";
      engineFilter.frequency.setValueAtTime(900, audioCtx.currentTime);
      engineFilter.Q.setValueAtTime(2, audioCtx.currentTime);
      engineLead.connect(engineFilter);
      engineFilter.connect(engineLeadGain);
      engineLeadGain.connect(sfxGain);
      engineLead.start();

      // --- drift noise ---
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const out = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) out[i] = Math.random() * 2 - 1;
      driftNoise = audioCtx.createBufferSource();
      driftNoise.buffer = noiseBuffer;
      driftNoise.loop = true;
      const driftFilter = audioCtx.createBiquadFilter();
      driftFilter.type = "bandpass";
      driftFilter.frequency.setValueAtTime(1200, audioCtx.currentTime);
      driftFilter.Q.setValueAtTime(3.5, audioCtx.currentTime);
      driftGain = audioCtx.createGain();
      driftGain.gain.setValueAtTime(0, audioCtx.currentTime);
      driftNoise.connect(driftFilter);
      driftFilter.connect(driftGain);
      driftGain.connect(sfxGain);
      driftNoise.start();

      // --- nitro ---
      const nitroOsc = audioCtx.createOscillator();
      nitroOsc.type = "triangle";
      nitroOsc.frequency.setValueAtTime(110, audioCtx.currentTime);
      nitroGain = audioCtx.createGain();
      nitroGain.gain.setValueAtTime(0, audioCtx.currentTime);
      nitroOsc.connect(nitroGain);
      nitroGain.connect(sfxGain);
      nitroOsc.start();

      // --- horn (H key) — short honk, auto-rickshaw style
      const hornOsc = audioCtx.createOscillator();
      hornOsc.type = "square";
      hornOsc.frequency.setValueAtTime(220, audioCtx.currentTime); // A3
      const hornGain = audioCtx.createGain();
      hornGain.gain.setValueAtTime(0, audioCtx.currentTime);
      hornOsc.connect(hornGain);
      hornGain.connect(sfxGain);
      hornOsc.start();

      // --- background music (procedural, loops) — theme-aware (day/sunset/night) ---
      musicStartTime = audioCtx.currentTime;

      buildMusicVoices("day");

      let musicDuck = 1;

      // --- music sequencer (theme-aware, beat-synced) ---
      let step = 0;
      let lastBeat = 0;
      const onBeat = () => {
        musicBeatRef.current = true;
        setTimeout(() => { musicBeatRef.current = false; }, 60);
      };
      const tick = () => {
        const ctx = audioCtx;
        if (!ctx) return;
        const t = ctx.currentTime;
        const cfg = MUSIC_THEMES[musicThemeRef.current];
        const bar = t - musicStartTime;
        const beatLen = cfg.beatLen;
        const beat = Math.floor(bar / beatLen);
        if (beat !== lastBeat) {
          lastBeat = beat;
          onBeat();
        }
        // bass changes every 4 beats
        const bassIdx = Math.floor(bar / (beatLen * 4)) % cfg.bassNotes.length;
        if (step % 4 === 0 && musicBassGain) {
          musicBassGain.gain.setValueAtTime(cfg.bassGain * musicDuck, t);
          musicBassGain.gain.exponentialRampToValueAtTime(0.03 * musicDuck, t + beatLen * 3.9);
          musicBass!.frequency.setValueAtTime(cfg.bassNotes[bassIdx], t);
        }

        // lead plays on beats 1 and 3
        if (step % 8 === 0 || step % 8 === 4) {
          const leadIdx = Math.floor(step / 8) % cfg.leadNotes.length;
          if (musicLeadGain) {
            musicLeadGain.gain.setValueAtTime(cfg.leadGain * musicDuck, t);
            musicLeadGain.gain.exponentialRampToValueAtTime(0.001 * musicDuck, t + 0.2);
            musicLead!.frequency.setValueAtTime(cfg.leadNotes[leadIdx], t);
          }
        }

        // arp on every 16th
        if (musicArpGain) {
          const arpIdx = step % cfg.arpNotes.length;
          musicArpGain.gain.setValueAtTime(cfg.arpGain * musicDuck, t);
          musicArpGain.gain.exponentialRampToValueAtTime(0.001 * musicDuck, t + beatLen * 0.9);
          musicArp!.frequency.setValueAtTime(cfg.arpNotes[arpIdx], t);
        }

        step = (step + 1) % 32;
        setTimeout(tick, beatLen * 1000 * 0.985);
      };
      tick();

      soundRef.current = {
        init: initAudio,
        updateEngine: (speed: number, throttle: boolean, nitro: boolean) => {
          if (!audioCtx || !engineBass || !engineBassGain || !engineLead || !engineLeadGain || !engineFilter) return;
          // richer RPM curve
          const base = 40 + speed * 2.4 + (throttle ? 24 : 0) + (nitro ? 38 : 0);
          const targetFreq = Math.min(260, base);
          engineBass.frequency.setTargetAtTime(targetFreq * 0.5, audioCtx.currentTime, 0.05);
          engineLead.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.05);
          const gv = 0.05 + Math.min(0.22, (speed / 55) * 0.16) + (throttle ? 0.05 : 0);
          engineBassGain.gain.setTargetAtTime(gv * 0.75, audioCtx.currentTime, 0.05);
          engineLeadGain.gain.setTargetAtTime(gv, audioCtx.currentTime, 0.05);
          engineFilter.frequency.setTargetAtTime(650 + speed * 13 + (nitro ? 450 : 0), audioCtx.currentTime, 0.07);
          // exhaust pop on throttle lift-off
          if (prevThrottleRef.current && !throttle && speed > 12) {
            soundRef.current?.playExhaustPop();
          }
          prevThrottleRef.current = throttle;
          // tire squeal when drifting at speed
          if (controlsRef.current?.drift && speed > 18) {
            soundRef.current?.playTireSqueal(Math.min(1, speed / 50));
            if (!prevDriftRef.current) soundRef.current?.playDrift(true);
          } else if (prevDriftRef.current) {
            soundRef.current?.playDrift(false);
          }
          prevDriftRef.current = controlsRef.current?.drift ?? false;
          // nitro whoosh on engage
          if (nitro && !prevNitroRef.current && playerNitroRef.current > 5) {
            soundRef.current?.playNitroWhoosh();
          }
          prevNitroRef.current = nitro;
        },
        playDrift: (d) => {
          if (!audioCtx || !driftGain) return;
          driftGain.gain.setTargetAtTime(d ? 0.22 : 0, audioCtx.currentTime, 0.06);
        },
        playNitro: (a) => {
          if (!audioCtx || !nitroGain) return;
          nitroGain.gain.setTargetAtTime(a ? 0.3 : 0, audioCtx.currentTime, 0.04);
        },
        playBeep: (high: boolean) => {
          if (!audioCtx || !sfxGain) return;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(high ? 1100 : 550, audioCtx.currentTime);
          g.gain.setValueAtTime(0.25, audioCtx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (high ? 0.4 : 0.2));
          osc.connect(g);
          g.connect(sfxGain);
          osc.start();
          osc.stop(audioCtx.currentTime + (high ? 0.4 : 0.2));
        },
        playCrash: () => {
          if (!audioCtx || !sfxGain) return;
          // noise burst + low thud
          const noise = audioCtx.createBufferSource();
          noise.buffer = noiseBuffer;
          const nf = audioCtx.createBiquadFilter();
          nf.type = "lowpass";
          nf.frequency.setValueAtTime(800, audioCtx.currentTime);
          const ng = audioCtx.createGain();
          ng.gain.setValueAtTime(0.35, audioCtx.currentTime);
          ng.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
          noise.connect(nf);
          nf.connect(ng);
          ng.connect(sfxGain);
          noise.start();
          noise.stop(audioCtx.currentTime + 0.4);
          // low thud
          const thud = audioCtx.createOscillator();
          thud.type = "sine";
          thud.frequency.setValueAtTime(60, audioCtx.currentTime);
          const tg = audioCtx.createGain();
          tg.gain.setValueAtTime(0.3, audioCtx.currentTime);
          tg.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
          thud.connect(tg);
          tg.connect(sfxGain);
          thud.start();
          thud.stop(audioCtx.currentTime + 0.3);
        },
        playCoin: () => {
          if (!audioCtx || !sfxGain) return;
          const ctx = audioCtx;
          const sfx = sfxGain;
          const t = ctx.currentTime;
          [1320, 1980, 2640].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, t);
            g.gain.setValueAtTime(0.18, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.15 + i * 0.08);
            osc.connect(g);
            g.connect(sfx);
            osc.start();
            osc.stop(t + 0.15 + i * 0.08);
          });
        },
        playThud: () => {
          if (!audioCtx || !sfxGain) return;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(100, audioCtx.currentTime);
          g.gain.setValueAtTime(0.25, audioCtx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          osc.connect(g);
          g.connect(sfxGain);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.15);
        },
        playCountdown: () => {
          if (!audioCtx || !sfxGain) return;
          const ctx = audioCtx;
          const sfx = sfxGain;
          const t = ctx.currentTime;
          [660, 880, 1100, 1320].forEach((f, i) => {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(f, t + i * 0.25);
            g.gain.setValueAtTime(0.2, t + i * 0.25);
            g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.25 + 0.2);
            osc.connect(g);
            g.connect(sfx);
            osc.start(t + i * 0.25);
            osc.stop(t + i * 0.25 + 0.2);
          });
        },
        playHorn: () => {
          if (!audioCtx || !hornOsc || !hornGain) return;
          const t = audioCtx.currentTime;
          hornOsc.frequency.setValueAtTime(220, t);
          hornGain.gain.setValueAtTime(0.18, t);
          hornGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        },
        // exhaust pop / backfire on lift-off
        playExhaustPop: () => {
          if (!audioCtx || !sfxGain) return;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(150 + Math.random() * 60, audioCtx.currentTime);
          g.gain.setValueAtTime(0.15, audioCtx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
          osc.connect(g);
          g.connect(sfxGain);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.12);
        },
        // tire squeal on drift / loss of grip
        playTireSqueal: (intensity: number) => {
          if (!audioCtx || !sfxGain) return;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          const f = audioCtx.createBiquadFilter();
          f.type = "bandpass";
          f.frequency.setValueAtTime(2500 + intensity * 1200, audioCtx.currentTime);
          f.Q.setValueAtTime(4, audioCtx.currentTime);
          osc.type = "square";
          osc.frequency.setValueAtTime(60 + intensity * 40, audioCtx.currentTime);
          g.gain.setValueAtTime(0.06 * intensity, audioCtx.currentTime);
          osc.connect(f);
          f.connect(g);
          g.connect(sfxGain);
          osc.start();
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
          osc.stop(audioCtx.currentTime + 0.5);
        },
        // nitro whoosh on engage
        playNitroWhoosh: () => {
          if (!audioCtx || !sfxGain) return;
          const osc = audioCtx.createOscillator();
          const g = audioCtx.createGain();
          const f = audioCtx.createBiquadFilter();
          f.type = "lowpass";
          f.frequency.setValueAtTime(400, audioCtx.currentTime);
          f.frequency.exponentialRampToValueAtTime(4000, audioCtx.currentTime + 0.5);
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(80, audioCtx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(900, audioCtx.currentTime + 0.5);
          g.gain.setValueAtTime(0.14, audioCtx.currentTime);
          osc.connect(f);
          f.connect(g);
          g.connect(sfxGain);
          osc.start();
          g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
          osc.stop(audioCtx.currentTime + 0.6);
        },
        duckMusic: (target: number, len: number) => {
          if (!audioCtx || !musicGain) return;
          const mg = musicGain;
          const ac = audioCtx;
          musicDuck = target;
          mg.gain.setValueAtTime(target, ac.currentTime);
          setTimeout(() => {
            musicDuck = 1;
            mg.gain.setValueAtTime(1, ac.currentTime);
          }, len);
        },
        setMuted: (muted: boolean) => {
          if (masterGain && audioCtx) {
            masterGain.gain.setTargetAtTime(muted ? 0 : 0.7, audioCtx.currentTime, 0.05);
          }
          if (musicGain && audioCtx) {
            musicGain.gain.setTargetAtTime(muted ? 0 : 0.5, audioCtx.currentTime, 0.05);
          }
          if (sfxGain && audioCtx) {
            sfxGain.gain.setTargetAtTime(muted ? 0 : 0.8, audioCtx.currentTime, 0.05);
          }
        },
        setMusicVolume: (v: number) => {
          if (musicGain && audioCtx) {
            musicGain.gain.setTargetAtTime(v / 100, audioCtx.currentTime, 0.05);
          }
        },
        setEffectsVolume: (v: number) => {
          if (sfxGain && audioCtx) {
            sfxGain.gain.setTargetAtTime(v / 100, audioCtx.currentTime, 0.05);
          }
        },
      };
      return () => {
        if (audioCtx && audioCtx.state !== "closed") audioCtx.close().catch(() => { });
        soundRef.current = null;
        audioCtx = null;
      };
    };
    initAudio();
  }, []);

  // beat-synced HUD pulse on music beat
  useEffect(() => {
    if (musicBeatRef.current) setBeatPulse(true);
    setTimeout(() => setBeatPulse(false), 60);
  }, [musicBeatRef.current]);

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
    // Daily streak: if the last race was yesterday, keep the streak; if today, keep it too;
    // if more than a day passed, reset.
    const lastRaceRaw = window.localStorage.getItem(STORAGE_KEYS.dailyLastRace);
    const streakRaw = window.localStorage.getItem(STORAGE_KEYS.dailyStreak);
    if (lastRaceRaw && streakRaw) {
      const lastRace = new Date(lastRaceRaw).getTime();
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const diffDays = Math.floor((now - lastRace) / oneDay);
      if (diffDays <= 1) {
        setDailyStreak(parseInt(streakRaw, 10) || 0);
      } else {
        setDailyStreak(0);
        try { window.localStorage.setItem(STORAGE_KEYS.dailyStreak, "0"); } catch { /* ignore */ }
      }
    }
    // Daily challenges: regenerate once per day (seed resets at midnight)
    const challengeDateRaw = window.localStorage.getItem(STORAGE_KEYS.dailyChallengeDate);
    const todayStr = new Date().toDateString();
    if (challengeDateRaw !== todayStr) {
      const challenges = generateDailyChallenges();
      setDailyChallenges(challenges);
      const prog: Record<string, number> = {};
      const comp: Record<string, boolean> = {};
      const cl: Record<string, boolean> = {};
      challenges.forEach((c) => { prog[c.id] = 0; comp[c.id] = false; cl[c.id] = false; });
      setChallengeProgress(prog);
      setChallengeCompleted(comp);
      setChallengeClaimed(cl);
      try { window.localStorage.setItem(STORAGE_KEYS.dailyChallengeDate, todayStr); } catch { /* ignore */ }
      try { window.localStorage.setItem(STORAGE_KEYS.dailyChallenges, JSON.stringify(challenges.map((c) => c.id))); } catch { /* ignore */ }
    }
    // Vehicle upgrades: load saved per-vehicle upgrade levels
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.upgradeLevels);
      if (raw) setUpgradeLevels(JSON.parse(raw) as Record<string, Record<string, number>>);
    } catch { /* ignore */ }
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

  const buyUpgrade = useCallback((statId: string) => {
    const v = vehicleById(selectedVehicle);
    if (!v || v.price > 0 && !readUnlocked().includes(v.id)) return;
    const levels = upgradeLevels[selectedVehicle] ?? {};
    const curLevel = levels[statId] ?? 0;
    if (curLevel >= MAX_UPGRADE_LEVEL) return;
    const cost = upgradeCost(statId, curLevel);
    if (cost <= 0) return;
    const curBank = readBank();
    if (curBank < cost) return;
    writeBank(curBank - cost);
    setBank(curBank - cost);
    setUpgradeLevels((prev) => ({
      ...prev,
      [selectedVehicle]: { ...(prev[selectedVehicle] ?? {}), [statId]: curLevel + 1 },
    }));
    try {
      window.localStorage.setItem(STORAGE_KEYS.upgradeLevels, JSON.stringify({
        ...upgradeLevels,
        [selectedVehicle]: { ...(upgradeLevels[selectedVehicle] ?? {}), [statId]: curLevel + 1 },
      }));
    } catch { /* ignore */ }
    soundRef.current?.playCoin();
  }, [selectedVehicle, upgradeLevels, readBank, writeBank]);

  // =============================================================
  // THREE.JS 3D RACE ENGINE (built once per run)
  // =============================================================
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let renderer!: THREE.WebGLRenderer;
    let scene!: THREE.Scene;
    let camera!: THREE.PerspectiveCamera;
    let skyDome: THREE.Mesh | null = null;
    let skyUniforms: {
      cTop: { value: THREE.Color };
      cMid: { value: THREE.Color };
      cBot: { value: THREE.Color };
    } | null = null;
    let ambientLight!: THREE.HemisphereLight;
    let dirLight!: THREE.DirectionalLight;
    let headLight!: THREE.SpotLight;
    let animId = 0;
    let disposed = false;

    // ---- spline
    const splinePoints = TRACK.points.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const spline = new THREE.CatmullRomCurve3(splinePoints, true, "centripetal");
    const trackLength = spline.getLength();

    // ---- engine-local state
    const vehicleDef = upgradedVehicle;
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
      isFlipping?: boolean;
      flipTimer?: number;
      flipVelocity?: THREE.Vector3;
      flipAxis?: THREE.Vector3;
    }
    const rivals: AIRivalInstance[] = [];
    const rivalTagMeshes: THREE.Mesh[] = [];
    const tagAim = new THREE.Vector3();
    const windowMats: THREE.MeshStandardMaterial[] = [];
    const obstacles: Obstacle[] = [];
    const coinRows: CoinRow[] = [];
    const lapSummaries: LapSummary[] = [];

    // ---------------------------------------------------------
    // 3D Procedural Auto-Rickshaw Builder — Karachi Suzuki Bolan / Auto
    // Features:
    // - Authentic two-tone body paint & chamakpatti floral waist trims
    // - Boxy passenger cabin with open safety mesh and rear door bar
    // - Prominent Suzuki-style chrome front bumper & bull bar
    // - Twin rectangular chrome side mirrors & dual round yellow fog lamps
    // - Overhead luggage carrier with crossbars
    // - Rear mudflaps with white reflective reflector strips
    // ---------------------------------------------------------
    function createRickshawModel(bodyHex: string, canopyHex: string, frameHex: string, isPlayerVehicle = false, nameTag = "AI RACER") {
      const group = new THREE.Group();
      const bodyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(bodyHex), metalness: 0.35, roughness: 0.4 });
      const canopyMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(canopyHex), metalness: 0.15, roughness: 0.6 });
      const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(frameHex), metalness: 0.8, roughness: 0.25 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.95, roughness: 0.08 });
      const rubberMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.95 });
      const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xb5e0f8, transparent: true, opacity: 0.4, roughness: 0.05, transmission: 0.85 });
      const lightMat = new THREE.MeshStandardMaterial({ color: 0xfff3a0, emissive: 0xffdf40, emissiveIntensity: 1.4 });
      const amberMat = new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff7700, emissiveIntensity: 1.0 });
      const tailMat = new THREE.MeshStandardMaterial({ color: 0xff1122, emissive: 0xff0022, emissiveIntensity: 1.1 });
      const trimMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.6, roughness: 0.3 }); // Karachi chamakpatti gold
      const mudflapMat = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.9 });

      // ── CHASSIS / FLOOR ─────────────────────────────────────────
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.22, 3.4), frameMat);
      chassis.position.set(0, 0.72, -0.1);
      chassis.castShadow = true;
      group.add(chassis);

      // CNG Cylinder Tanks (under rear bench - classic Karachi CNG auto trait)
      const cngTankMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.3 });
      for (const sx of [-0.45, 0.45]) {
        const cngTank = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.8, 12), cngTankMat);
        cngTank.rotation.z = Math.PI / 2;
        cngTank.position.set(0, 0.78, sx - 0.7);
        group.add(cngTank);
      }

      // ── MAIN PASSENGER CABIN ────────────────────────────────────
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.15, 2.35), bodyMat);
      body.position.set(0, 1.42, -0.52);
      body.castShadow = true;
      group.add(body);

      // Open side safety mesh rails (Karachi rickshaw passenger protection)
      for (const sx of [-1.05, 1.05]) {
        for (const sy of [1.35, 1.55, 1.75]) {
          const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6), chromeMat);
          rail.rotation.x = Math.PI / 2;
          rail.position.set(sx, sy, -0.5);
          group.add(rail);
        }
      }

      // Chamakpatti decorative side strip (Karachi truck art floral waistline)
      for (const sx of [-1.04, 1.04]) {
        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 2.3), trimMat);
        strip.position.set(sx, 1.35, -0.52);
        group.add(strip);
      }

      // ── FRONT ENGINE HOOD (tapered Suzuki front) ────────────────
      const hood = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.6, 1.25), bodyMat);
      hood.position.set(0, 0.98, 1.25);
      hood.castShadow = true;
      group.add(hood);

      // Front nose panel slope
      const noseGeo = new THREE.CylinderGeometry(0.42, 0.78, 1.1, 6);
      const nose = new THREE.Mesh(noseGeo, bodyMat);
      nose.position.set(0, 0.95, 1.88);
      nose.rotation.x = Math.PI / 2;
      nose.castShadow = true;
      group.add(nose);

      // Suzuki grille / badge plate
      const grille = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.22, 0.08), chromeMat);
      grille.position.set(0, 0.92, 2.45);
      group.add(grille);

      // Karachi Meter Box (authentic green & red fare meter on dashboard)
      const meterBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.22, 0.15),
        new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.5, roughness: 0.5 })
      );
      meterBox.position.set(0.42, 1.35, 1.15);
      group.add(meterBox);
      const meterFlag = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.12, 0.02),
        new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.6 })
      );
      meterFlag.position.set(0.42, 1.48, 1.15);
      group.add(meterFlag);

      // ── WINDSHIELD & CABIN PILLARS ──────────────────────────────
      const windshield = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 0.92), glassMat);
      windshield.position.set(0, 1.7, 0.76);
      windshield.rotation.x = -Math.PI / 7.2;
      group.add(windshield);

      // Windshield wiper
      const wiper = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 4), frameMat);
      wiper.rotation.z = Math.PI / 3.8;
      wiper.position.set(-0.1, 1.62, 0.82);
      group.add(wiper);

      // ── ROOF / CANOPY (classic curved canopy) ───────────────────
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.06, 0.2, 2.55), canopyMat);
      roof.position.set(0, 2.54, -0.32);
      roof.castShadow = true;
      group.add(roof);

      // Roof luggage rack side rails
      const rackRailGeo = new THREE.CylinderGeometry(0.035, 0.035, 2.15, 6);
      for (const sx of [-0.94, 0.94]) {
        const rail = new THREE.Mesh(rackRailGeo, chromeMat);
        rail.position.set(sx, 2.68, -0.2);
        group.add(rail);
      }
      // Roof rack crossbars
      const rackCrossGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.95, 6);
      for (const sz of [-1.2, -0.6, 0.0, 0.6]) {
        const bar = new THREE.Mesh(rackCrossGeo, chromeMat);
        bar.rotation.z = Math.PI / 2;
        bar.position.set(0, 2.68, sz);
        group.add(bar);
      }

      // ── ROOF SUPPORT FRAME PILLARS ──────────────────────────────
      const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.45, 6);
      for (const sx of [-0.96, 0.96]) {
        for (const sz of [-1.5, 0.7]) {
          const pillar = new THREE.Mesh(pillarGeo, frameMat);
          pillar.position.set(sx, 1.82, sz);
          group.add(pillar);
        }
      }

      // ── HEAVY-DUTY SUZUKI BULL BAR ───────────────────────────────
      const mainBumper = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.7, 8), chromeMat);
      mainBumper.rotation.z = Math.PI / 2;
      mainBumper.position.set(0, 0.78, 2.52);
      group.add(mainBumper);

      for (const sx of [-0.75, 0.75]) {
        const vbar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.54, 6), chromeMat);
        vbar.position.set(sx, 1.02, 2.52);
        group.add(vbar);
      }

      // Upper wrap-around bull bar guard
      const upperGuard = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.25, 8), chromeMat);
      upperGuard.rotation.z = Math.PI / 2;
      upperGuard.position.set(0, 1.22, 2.5);
      group.add(upperGuard);

      // ── HEADLIGHT & FOG LIGHTS ──────────────────────────────────
      const centerHeadlight = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.22, 0.2, 14), lightMat);
      centerHeadlight.rotation.x = Math.PI / 2;
      centerHeadlight.position.set(0, 1.02, 2.56);
      group.add(centerHeadlight);

      // Dual yellow fog lamps on bumper
      for (const sx of [-0.55, 0.55]) {
        const fog = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.12, 10), amberMat);
        fog.rotation.x = Math.PI / 2;
        fog.position.set(sx, 0.78, 2.6);
        group.add(fog);
      }

      // ── CHROME SIDE MIRRORS ──────────────────────────────────────
      for (const sx of [-1.08, 1.08]) {
        const mirrorStem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 6), chromeMat);
        mirrorStem.rotation.z = (sx > 0 ? -1 : 1) * Math.PI / 3;
        mirrorStem.position.set(sx, 1.62, 0.85);
        group.add(mirrorStem);

        const mirrorGlass = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.12), chromeMat);
        mirrorGlass.position.set(sx > 0 ? sx + 0.18 : sx - 0.18, 1.72, 0.85);
        group.add(mirrorGlass);
      }

      // ── REAR TAIL LIGHTS & NUMBER PLATE ─────────────────────────
      for (const sx of [-0.78, 0.78]) {
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), tailMat);
        tail.position.set(sx, 1.3, -1.74);
        group.add(tail);
      }

      // Karachi license plate on rear bumper ("KHI - 786")
      const plateMesh = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.24, 0.05),
        new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5 }));
      plateMesh.position.set(0, 0.88, -1.74);
      group.add(plateMesh);

      // ── EXHAUST PIPE ─────────────────────────────────────────────
      const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.07, 0.6, 8), chromeMat);
      exhaust.rotation.x = Math.PI / 2;
      exhaust.position.set(0.68, 0.58, -1.98);
      group.add(exhaust);

      // ── REAR STEP FOOTREST BARS ──────────────────────────────────
      for (const sy of [0.72, 0.52]) {
        const stepBar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.7, 8), chromeMat);
        stepBar.rotation.z = Math.PI / 2;
        stepBar.position.set(0, sy, -1.78);
        group.add(stepBar);
      }

      // ── REAR MUDFLAPS (Karachi auto style) ──────────────────────
      for (const sx of [-0.98, 0.98]) {
        const flap = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.45, 0.04), mudflapMat);
        flap.position.set(sx, 0.42, -1.45);
        group.add(flap);

        const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.08, 0.05), amberMat);
        reflector.position.set(sx, 0.32, -1.47);
        group.add(reflector);
      }

      // ── WHEELS ───────────────────────────────────────────────────
      const tireGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.34, 18);
      tireGeo.rotateZ(Math.PI / 2);
      const hubGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.36, 12);
      hubGeo.rotateZ(Math.PI / 2);

      // Front fork & wheel
      const fork = new THREE.Group();
      fork.position.set(0, 0.52, 1.72);
      const fTire = new THREE.Mesh(tireGeo, rubberMat);
      fTire.castShadow = true;
      fork.add(fTire);
      const fHub = new THREE.Mesh(hubGeo, chromeMat);
      fork.add(fHub);
      group.add(fork);

      // Rear axle wheels
      for (const sx of [-1.1, 1.1]) {
        const rTire = new THREE.Mesh(tireGeo, rubberMat);
        rTire.position.set(sx, 0.52, -1.05);
        rTire.castShadow = true;
        group.add(rTire);
        const rHub = new THREE.Mesh(hubGeo, chromeMat);
        rHub.position.set(sx, 0.52, -1.05);
        group.add(rHub);
      }

      // ── NAME TAG (AI rivals only) ────────────────────────────────
      if (!isPlayerVehicle) {
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "rgba(14, 10, 20, 0.88)";
          ctx.fillRect(4, 4, 248, 56);
          ctx.strokeStyle = bodyHex;
          ctx.lineWidth = 3;
          ctx.strokeRect(4, 4, 248, 56);
          ctx.font = "700 24px sans-serif";
          ctx.fillStyle = "#f0ece0";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(nameTag, 128, 33);
        }
        const tex = new THREE.CanvasTexture(canvas);
        const tag = new THREE.Mesh(
          new THREE.PlaneGeometry(2.4, 0.6),
          new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide })
        );
        tag.position.set(0, 3.6, 0);
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
        GROUND_Y,
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
    // The spline's y runs from −4 to 12, so a flat ground at 0 would bury the
    // road at its lowest point and leave the crest floating. The ground sits
    // below the lowest point of the track and the road's outer edge is skirted
    // down to it, so the climb reads as an embankment instead of a ribbon.
    const GROUND_Y = Math.min(...TRACK.points.map((p) => p.y)) - 2;

    function initScene() {
      if (!viewport) return;
      const width = viewport.clientWidth || 850;
      const height = viewport.clientHeight || 500;

      scene = new THREE.Scene();
      scene.background = new THREE.Color(TRACK.daySky);
      scene.fog = new THREE.FogExp2(TRACK.daySky, 0.0011);
      camera = new THREE.PerspectiveCamera(60, width / height, 0.5, 3000);

      // Sky dome. scene.background can only be one flat hex, which read as a
      // cyan void behind the skyline. This sphere is drawn from the inside with
      // a three-stop vertical gradient and is re-centred on the camera every
      // frame, so it never clips. It deliberately opts out of fog: fog is what
      // makes distant blocks dissolve into the horizon colour, and the bottom
      // stop is set to that same colour so the join is invisible.
      skyUniforms = {
        cTop: { value: new THREE.Color(0x2f6d94) },
        cMid: { value: new THREE.Color(0x6aa9c9) },
        cBot: { value: new THREE.Color(TRACK.daySky) },
      };
      const skyMat = new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 cTop;
          uniform vec3 cMid;
          uniform vec3 cBot;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
            vec3 c = mix(cBot, cMid, smoothstep(0.50, 0.60, h));
            c = mix(c, cTop, smoothstep(0.60, 0.98, h));
            gl_FragColor = vec4(c, 1.0);
          }
        `,
      });
      skyDome = new THREE.Mesh(new THREE.SphereGeometry(2000, 32, 16), skyMat);
      skyDome.renderOrder = -1;
      scene.add(skyDome);

      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.6;
      viewport.innerHTML = "";
      viewport.appendChild(renderer.domElement);

      // ---- HD post-processing: bloom + ACES output tone mapping composer
      composerRef.current = new EffectComposer(renderer);
      composerRef.current.addPass(new RenderPass(scene, camera));
      const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.4, 0.4, 0.9);
      bloomPass.threshold = 0.85;
      bloomPass.strength = 0.4;
      bloomPass.radius = 0.45;
      bloomPassRef.current = bloomPass;
      composerRef.current.addPass(bloomPass);
      const outputPass = new OutputPass();
      composerRef.current.addPass(outputPass);

      ambientLight = new THREE.HemisphereLight(0xddeeff, 0xccaa88, 2.4);
      scene.add(ambientLight);
      dirLight = new THREE.DirectionalLight(0xfff8e8, 4.5);
      dirLight.position.set(180, 320, 140);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 4096;
      dirLight.shadow.mapSize.height = 4096;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 1200;
      const d = 350;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      scene.add(dirLight);
      headLight = new THREE.SpotLight(0xfff6c5, 0, 180, Math.PI / 4, 0.4, 1.2);
      headLight.position.set(0, 2, 2);
      scene.add(headLight);

      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshStandardMaterial({ color: 0x5a6350, roughness: 0.85 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = GROUND_Y;
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
      const roadUvs: number[] = [];
      const curbL: number[] = [];
      const curbR: number[] = [];
      const skirtL: number[] = [];
      const skirtR: number[] = [];

      for (let i = 0; i <= segments; i++) {
        const u = i / segments;
        const { pt, tangent, normal } = splineFrame(u);
        const leftPt = new THREE.Vector3().copy(pt).addScaledVector(normal, halfW);
        const rightPt = new THREE.Vector3().copy(pt).addScaledVector(normal, -halfW);

        roadPositions.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
        roadPositions.push(rightPt.x, rightPt.y + 0.05, rightPt.z);
        roadUvs.push(0, u * 40, 1, u * 40);

        const curbWidth = 1.4;
        const curbLOuter = new THREE.Vector3().copy(leftPt).addScaledVector(normal, curbWidth);
        curbL.push(leftPt.x, leftPt.y + 0.15, leftPt.z, curbLOuter.x, curbLOuter.y + 0.1, curbLOuter.z);
        const curbROuter = new THREE.Vector3().copy(rightPt).addScaledVector(normal, -curbWidth);
        curbR.push(rightPt.x, rightPt.y + 0.15, rightPt.z, curbROuter.x, curbROuter.y + 0.1, curbROuter.z);

        // Embankment skirt — from each curb's outer edge straight down to the
        // ground, so the elevated parts of the circuit have a base.
        skirtL.push(curbLOuter.x, curbLOuter.y + 0.05, curbLOuter.z, curbLOuter.x, GROUND_Y, curbLOuter.z);
        skirtR.push(curbROuter.x, curbROuter.y + 0.05, curbROuter.z, curbROuter.x, GROUND_Y, curbROuter.z);
      }

      // splineFrame's normal is (−t.z, 0, t.x) and the vertex pair is
      // (left = +normal, right = −normal), so the intuitive a,b,c winding
      // produces a face normal of −Y and FrontSide culls the whole road.
      // Reversing the two triangles puts the surface back.
      const roadIndices: number[] = [];
      const curbIndicesL: number[] = [];
      const curbIndicesR: number[] = [];
      for (let i = 0; i < segments; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d2 = (i + 1) * 2 + 1;
        roadIndices.push(a, c, b, b, c, d2);
        // The left curb's outer edge runs along +normal and the right curb's
        // along −normal, so the pair needs opposite winding to both face up.
        curbIndicesL.push(a, b, c, b, d2, c);
        curbIndicesR.push(a, c, b, b, c, d2);
      }

      const roadGeo = new THREE.BufferGeometry();
      roadGeo.setAttribute("position", new THREE.Float32BufferAttribute(roadPositions, 3));
      roadGeo.setAttribute("uv", new THREE.Float32BufferAttribute(roadUvs, 2));
      roadGeo.setIndex(roadIndices);
      roadGeo.computeVertexNormals();
      const roadMesh = new THREE.Mesh(roadGeo, new THREE.MeshStandardMaterial({ color: 0x3a3f4a, roughness: 0.8, metalness: 0.05 }));
      roadMesh.receiveShadow = true;
      scene.add(roadMesh);

      const curbDefs: Array<[number[], number[], number]> = [
        [curbL, curbIndicesL, 0xd90429],
        [curbR, curbIndicesR, 0xf2f0e8],
      ];
      for (const [pts, idx, color] of curbDefs) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        g.setIndex(idx);
        g.computeVertexNormals();
        scene.add(new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.7 })));
      }

      const skirtIndices: number[] = [];
      for (let i = 0; i < segments; i++) {
        const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d2 = (i + 1) * 2 + 1;
        skirtIndices.push(a, b, c, b, d2, c);
      }
      const skirtMat = new THREE.MeshStandardMaterial({ color: 0x24262b, roughness: 0.95, side: THREE.DoubleSide });
      for (const pts of [skirtL, skirtR]) {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
        g.setIndex(skirtIndices);
        g.computeVertexNormals();
        const skirt = new THREE.Mesh(g, skirtMat);
        skirt.receiveShadow = true;
        scene.add(skirt);
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
      pillarL.position.set(-halfW - 2, GROUND_Y + 6, 0);
      gantry.add(pillarL);
      const pillarR = new THREE.Mesh(pillarGeo, pillarMat);
      pillarR.position.set(halfW + 2, GROUND_Y + 6, 0);
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
      const winTex = makeWindowTexture();
      // Karachi's own facade range: sandstone and limewash against the dark
      // glass of the newer towers on II Chundrigar.
      const bldgPalette = [0x8d99ae, 0x33415c, 0x7a5a4a, 0x9c8d7a, 0x51607a];
      const lampMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
      const lampGeo = new THREE.CylinderGeometry(0.2, 0.3, 10, 8);
      for (let i = 0; i < 90; i++) {
        const u = (i / 90 + rng() * 0.05) % 1.0;
        const { pt, normal } = splineFrame(u);
        const side = i % 2 === 0 ? 1 : -1;
        const bw = 18 + rng() * 26;
        const bd = 18 + rng() * 26;
        // Skewed low so the skyline is mostly three-to-six storey blocks with
        // the occasional tower, instead of 90 slabs at a uniform 100 m.
        const bh = 24 + Math.pow(rng(), 1.8) * 125;

        // Clearance measured to the *near face*, not the centre. The old
        // `roadWidth + 16` put a 50 m deep block centred 38 m out, which reached
        // the curb and turned the whole circuit into a canyon.
        const clearance = TRACK.roadWidth / 2 + 12 + Math.max(bw, bd) / 2;
        const dist = clearance + rng() * 55;

        // Per-building lightness jitter. Three shared materials made every
        // neighbouring pair read as one continuous wall.
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(bldgPalette[i % bldgPalette.length]).offsetHSL(0, 0, (rng() - 0.5) * 0.13),
          roughness: 0.9,
        });
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Grouped so the window strip rides on the road-facing face whichever
        // way the block is turned. Local +Z points at the road.
        const group = new THREE.Group();
        const toRoad = new THREE.Vector3(-normal.x * side, 0, -normal.z * side);
        group.rotation.y = Math.atan2(toRoad.x, toRoad.z) + (rng() - 0.5) * 0.44;
        group.position.set(pt.x + normal.x * side * dist, GROUND_Y + bh / 2, pt.z + normal.z * side * dist);
        group.add(mesh);
        scene.add(group);

        if (i % 3 === 1) {
          // Neutral glass by day; the amber comes entirely from emissive,
          // which applyTimeMode raises at dusk and night.
          const winMat = new THREE.MeshStandardMaterial({
            color: 0x35425c,
            emissive: 0xffb84d,
            emissiveIntensity: 0.06,
            map: winTex,
            alphaMap: winTex,
            transparent: true,
            depthWrite: false,
            roughness: 0.35,
            metalness: 0.2,
          });
          windowMats.push(winMat);
          const winW = bw * 0.9;
          const winH = bh * 0.74;
          const winGeo = new THREE.PlaneGeometry(winW, winH);
          // UVs scaled by facade size: one texture tile per ~6 m, so window
          // cells land around 2 m on every building regardless of its height.
          const uv = winGeo.attributes.uv as THREE.BufferAttribute;
          const repX = Math.max(1, Math.round(winW / 6));
          const repY = Math.max(1, Math.round(winH / 6));
          for (let k = 0; k < uv.count; k++) uv.setXY(k, uv.getX(k) * repX, uv.getY(k) * repY);
          const win = new THREE.Mesh(winGeo, winMat);
          win.position.set(0, 0, bd / 2 + 0.4);
          group.add(win);
        }
        if (i % 2 === 0) {
          const lampPost = new THREE.Mesh(lampGeo, lampMat);
          const dk = TRACK.roadWidth / 2 + 2;
          lampPost.position.set(pt.x + normal.x * side * dk, GROUND_Y + 5, pt.z + normal.z * side * dk);
          scene.add(lampPost);
        }
      }

      // far skyline ring — pushed out past 250 m so the fog does the work of
      // flattening it into haze instead of it standing at full contrast.
      const rng2 = mulberry32(9091);
      const skyMat = new THREE.MeshStandardMaterial({ color: 0x6b7794, roughness: 1, metalness: 0 });
      for (let i = 0; i < 26; i++) {
        const u = (i / 26 + rng2() * 0.1) % 1.0;
        const { pt, normal } = splineFrame(u);
        const side = i % 2 === 0 ? 1 : -1;
        const dist = TRACK.roadWidth * 0.6 + 260 + rng2() * 420;
        const bw = 60 + rng2() * 80;
        const bd = 60 + rng2() * 80;
        const bh = 70 + Math.pow(rng2(), 1.5) * 180;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), skyMat);
        mesh.position.set(pt.x + normal.x * side * dist, GROUND_Y + bh / 2, pt.z + normal.z * side * dist);
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
      // OBSTACLE_TUNING.minGapMeters (60 m) for fairness
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

    // nitro flame visual (autorush style)
    const nitroFlame = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.4),
      new THREE.MeshBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0, side: THREE.DoubleSide })
    );
    nitroFlame.position.set(0, 0, 2.6);
    nitroFlame.rotation.x = Math.PI;
    playerRickshaw.group.add(nitroFlame);

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
    function applyTimeMode(mode: TimeMode, weather: "clear" | "rain" = "clear") {
      if (!scene || !ambientLight || !dirLight || !headLight) return;
      if (mode === "day") {
        scene.background = new THREE.Color(TRACK.daySky);
        scene.fog = new THREE.FogExp2(0xd6dde4, 0.0011);
        skyUniforms?.cTop.value.set(0x2f6fd0);
        skyUniforms?.cMid.value.set(0x7fb2ea);
        skyUniforms?.cBot.value.set(0xd6dde4);
        ambientLight.intensity = 1.65;
        ambientLight.color.set(0xc4d6ea);
        ambientLight.groundColor.set(0xbba27f);
        dirLight.intensity = 3.2;
        dirLight.color.set(0xfff0d8);
        dirLight.position.set(180, 320, 140);
        headLight.intensity = 0;
        if (renderer) renderer.toneMappingExposure = 1.25;
      } else if (mode === "sunset") {
        scene.background = new THREE.Color(TRACK.sunsetSky);
        scene.fog = new THREE.FogExp2(0xf2a57a, 0.0013);
        skyUniforms?.cTop.value.set(0x8a1c62);
        skyUniforms?.cMid.value.set(0xf06a3a);
        skyUniforms?.cBot.value.set(0xffc978);
        ambientLight.intensity = 1.50;
        ambientLight.color.set(0xc89ad8);
        ambientLight.groundColor.set(0xc48a6c);
        dirLight.intensity = 2.8;
        dirLight.color.set(0xffc88a);
        dirLight.position.set(-280, 120, 100);
        headLight.intensity = 3500;
        if (renderer) renderer.toneMappingExposure = 1.22;
      } else {
        scene.background = new THREE.Color(TRACK.nightSky);
        scene.fog = new THREE.FogExp2(0x10131b, 0.0017);
        skyUniforms?.cTop.value.set(0x04060d);
        skyUniforms?.cMid.value.set(0x0c1428);
        skyUniforms?.cBot.value.set(0x1d2232);
        ambientLight.intensity = 1.40;
        ambientLight.color.set(0x405584);
        ambientLight.groundColor.set(0x262330);
        dirLight.intensity = 0.85;
        dirLight.color.set(0x9cb4e4);
        dirLight.position.set(140, 240, -120);
        headLight.intensity = 18000;
        headLight.distance = 95;
        headLight.decay = 1.1;
        if (renderer) renderer.toneMappingExposure = 1.20;
      }
      // Rain: denser fog and soft glistening light
      if (weather === "rain") {
        scene.fog = new THREE.FogExp2(
          scene.background as THREE.Color,
          mode === "night" ? 0.0028 : 0.0022
        );
        ambientLight.intensity *= 0.88;
        dirLight.intensity *= 0.85;
      }
      const winInt = mode === "night" ? 1.4 : mode === "sunset" ? 0.85 : 0.2;
      for (const m of windowMats) m.emissiveIntensity = winInt;

      // Switch music theme to match time of day — each district gets its own sound
      musicThemeRef.current = mode === "sunset" ? "sunset" : mode === "night" ? "night" : "day";
    }
    applyTimeMode("day");

    // Broadcast the player's live state to room peers via BroadcastChannel.
    // Multiplayer lobby is out of scope for the bounded loop, but the channel
    // ref and join/host UI exist; this keeps the game loop call site defined.
    const broadcastState = (pos: THREE.Vector3) => {
      if (!channelRef.current) return;
      channelRef.current.postMessage({
        type: "rush:state",
        u: playerU,
        lateral: playerLateral,
        speed: playerSpeed,
        lap: playerLap,
        pos: { x: pos.x, y: pos.y, z: pos.z },
      });
    };

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
      // Reset per-race challenge progress
      raceChallenge.current = { traps: 0, driftMeters: 0, coins: 0, crashes: 0 };
      try {
        const blRaw = window.localStorage.getItem(STORAGE_KEYS.bestLap);
        bestLapSec = blRaw ? parseFloat(blRaw) || null : null;
      } catch { bestLapSec = null; }

      clearRaceObjects();
      generateRaceObjects(difficultyRef.current);
      // Lap 1 opens on the menu's chosen TIME (default is day, as before);
      // each subsequent district rolls its own phase from lap 2 on.
      applyTimeMode(menuTimeModeRef.current, menuWeatherRef.current);
      onBanner({ district: "SADAR", tagline: "EMPRESS MARKET • CHAAR MINAR", lap: 1, coins: -1, traps: 0, time: 0 });
      rivals.forEach((rival, idx) => {
        const startDist = -(12 + idx * 6);
        rival.dist = startDist;
        rival.u = ((startDist / trackLength) % 1 + 1) % 1;
        rival.speed = 10;
      });

      setPhaseState("countdown");
      setCountdownNum(3);
      soundRef.current?.playCountdown();
      let count = 3;
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdownNum(count);
          soundRef.current?.playCountdown();
        } else if (count === 0) {
          setCountdownNum("GO!");
          soundRef.current?.playCountdown();
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
        else if (curBg.getHex() === TRACK.sunsetSky) applyTimeMode("night", menuWeatherRef.current);
        else applyTimeMode("day", menuWeatherRef.current);
      },
      setTimeMode: (m: TimeMode) => applyTimeMode(m, menuWeatherRef.current),
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
      // Live time-of-day toggle (day → sunset → night) and abandon race.
      cycleTimeMode: () => engineRef.current?.cycleTimeMode(),
      quitRace: () => engineRef.current?.quitRace(),
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
      // Daily streak: increment if racing today (or yesterday keeps streak), reset if >1 day gap
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      const lastRaceRaw = window.localStorage.getItem(STORAGE_KEYS.dailyLastRace);
      const streakRaw = window.localStorage.getItem(STORAGE_KEYS.dailyStreak);
      let streak = 0;
      if (lastRaceRaw && streakRaw) {
        const lastRace = new Date(lastRaceRaw).getTime();
        const diffDays = Math.floor((now - lastRace) / oneDay);
        streak = diffDays <= 1 ? Math.max(0, parseInt(streakRaw, 10) || 0) + 1 : 1;
      } else {
        streak = 1;
      }
      try {
        window.localStorage.setItem(STORAGE_KEYS.dailyLastRace, String(now));
        window.localStorage.setItem(STORAGE_KEYS.dailyStreak, String(streak));
      } catch { /* ignore */ }
      setDailyStreak(streak);
      const streakBonus = streak > 1 ? streak * 100 : 0;
      setDailyBonus(streakBonus);
      if (streakBonus > 0) {
        const bonusBank = readBank() + streakBonus;
        writeBank(bonusBank);
      }
      // Daily challenges: sync session progress, award rewards for completed ones
      const nextProgress = { ...challengeProgress };
      const nextCompleted = { ...challengeCompleted };
      const nextClaimed = { ...challengeClaimed };
      let challengeReward = 0;
      const newlyCompleted: string[] = [];
      const race = raceChallenge.current;
      for (const c of dailyChallenges) {
        if (nextCompleted[c.id]) continue;
        let val = 0;
        if (c.kind === "traps") val = race.traps;
        else if (c.kind === "drift") val = Math.round(race.driftMeters);
        else if (c.kind === "coins") val = race.coins;
        else if (c.kind === "laps") val = playerLap;
        else if (c.kind === "distance") val = Math.round(distanceMeters / 1000);
        nextProgress[c.id] = Math.max(nextProgress[c.id] ?? 0, val);
        if (val >= c.target && !nextCompleted[c.id]) {
          nextCompleted[c.id] = true;
          newlyCompleted.push(c.id);
          challengeReward += c.reward;
        }
      }
      setChallengeProgress(nextProgress);
      setChallengeCompleted(nextCompleted);
      if (newlyCompleted.length > 0) {
        const rewardBank = readBank() + challengeReward;
        writeBank(rewardBank);
      }
      // Persist completed challenges
      try {
        window.localStorage.setItem(STORAGE_KEYS.dailyChallenges, JSON.stringify(
          dailyChallenges.map((c) => ({ id: c.id, completed: !!nextCompleted[c.id] }))
        ));
      } catch { /* ignore */ }
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
        rankings: rankRows,
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
      if (e.code === "KeyH") soundRef.current?.playHorn();
      if (e.code === "KeyC") setCameraMode((m) => (m === "chase" ? "hood" : m === "hood" ? "cinematic" : "chase"));
      if (e.code === "KeyM") setSoundEnabled((v) => !v);
      if (e.code === "KeyR" && manPhase === "racing") {
        // back on track: reset to track center, small speed penalty
        playerU = ((playerU % 1) + 1) % 1;
        playerLateral = 0;
        playerSpeed = Math.max(0, playerSpeed * 0.5);
        crashTimer = 0.3;
        soundRef.current?.playThud();
      }
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
    let fpsLastTime = performance.now();
    let fpsFrameCount = 0;
    let currentFps = 60;

    function gameLoop(now: number) {
      if (disposed) return;
      animId = requestAnimationFrame(gameLoop);
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // FPS counter
      fpsFrameCount++;
      if (now - fpsLastTime >= 1000) {
        currentFps = fpsFrameCount;
        fpsFrameCount = 0;
        fpsLastTime = now;
      }
      fpsRef.current = currentFps;

      if (manPhase === "paused") {
        composerRef.current?.render();
        return;
      }
      const ctrl = controlsRef.current;
      const diff = difficultyRef.current;
      const isRacing = manPhase === "racing";
      const isMenuIdle = manPhase === "menu";
      // rival name tags are canvas-texture planes: only part of the race,
      // never part of the menu showroom shot
      for (const tag of rivalTagMeshes) {
        tag.visible = !isMenuIdle;
        // Aim the plate at the camera on yaw only; from behind, a fixed plate
        // showed every rival's name mirrored.
        tag.getWorldPosition(tagAim);
        tag.lookAt(camera.position.x, tagAim.y, camera.position.z);
      }

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
        // nitro flame pulse
        const flame = Math.random() * 0.4 + 0.6;
        nitroFlame.material.opacity = flame;
        nitroFlame.scale.setScalar(0.8 + Math.random() * 0.5);
      } else {
        soundRef.current?.playNitro(false);
        nitroFlame.material.opacity = 0;
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

      // drift scoring + drift distance (for daily challenge)
      isDriftingNow = isRacing && ctrl.drift && Math.abs(ctrl.steer) > 0.2 && playerSpeed > 20;
      if (isDriftingNow) {
        totalScore += Math.round(150 * dt * diff.scoreMult);
        raceChallenge.current.driftMeters += playerSpeed * dt;
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

      // broadcast player state for multiplayer
      broadcastState(playerPos);
      playerRickshaw.group.lookAt(new THREE.Vector3().copy(playerPos).add(playerTangent));
      if (crashTimer > 0) {
        // keep a subtle shake without deforming the model
        playerRickshaw.group.rotation.y += dt * 9;
        // maintain original scale to avoid screen bounce
        playerRickshaw.group.scale.set(1, 1, 1);
      } else {
        playerRickshaw.group.scale.set(1, 1, 1);
      }

      // drift flash on body
      if (ctrl.drift && playerSpeed > 18) {
        const driftFlash = 0;
        playerRickshaw.group.traverse((n) => {
          if (n instanceof THREE.Mesh && n.material && n.material.color) {
            n.material.color.setHex(0xffffff).lerp(new THREE.Color(0xffd700), driftFlash);
          }
        });
      }
      const targetRoll = -ctrl.steer * 0.12 * (playerSpeed / 40) + (gripLossTimer > 0 ? -0.09 : 0);
      playerRickshaw.group.rotation.z = THREE.MathUtils.lerp(playerRickshaw.group.rotation.z, targetRoll, 0.15);
      if (isMenuIdle) {
        // idle life: steady front wheel, no bounce
        playerRickshaw.frontWheel.rotation.y = 0;
      }

      headLight.position.set(playerPos.x, playerPos.y + 2, playerPos.z);
      headLight.target.position.set(playerPos.x + playerTangent.x * 20, playerPos.y, playerPos.z + playerTangent.z * 20);
      scene.add(headLight.target);

      // 3. camera
      if (isMenuIdle) {
        // Hero shot: steady three-quarter rear, no camera breathing drift
        const t = now / 1000;
        const back = 11.5;
        const side = 5.4;
        camera.position.set(
          playerPos.x - playerTangent.x * back + playerNormal.x * side,
          playerPos.y + 4.6,
          playerPos.z - playerTangent.z * back + playerNormal.z * side
        );
        camera.lookAt(
          new THREE.Vector3(
            playerPos.x + playerTangent.x * 8,
            playerPos.y + 1.9,
            playerPos.z + playerTangent.z * 8
          )
        );
      } else if (cameraMode === "hood") {
        const hoodCam = new THREE.Vector3()
          .copy(playerPos)
          .addScaledVector(playerTangent, -3.2)
          .add(new THREE.Vector3(0, 3.4, 0));
        camera.position.lerp(hoodCam, 0.15);
        camera.lookAt(
          new THREE.Vector3(
            playerPos.x + playerTangent.x * 12,
            playerPos.y + 1.2,
            playerPos.z + playerTangent.z * 12
          )
        );
      } else if (cameraMode === "cinematic") {
        // Cinematic: low side-track angle, steady (no sway)
        const back = 10;
        const side = 0;
        const cinCam = new THREE.Vector3()
          .copy(playerPos)
          .addScaledVector(playerTangent, -back)
          .addScaledVector(playerNormal, side)
          .add(new THREE.Vector3(0, 2.6, 0));
        camera.position.lerp(cinCam, 0.1);
        camera.lookAt(
          new THREE.Vector3(
            playerPos.x + playerTangent.x * 10,
            playerPos.y + 1.6,
            playerPos.z + playerTangent.z * 10
          )
        );
      } else {
        // Chase cam (default): behind and above, portrait-safe
        const portraitBoost = THREE.MathUtils.clamp(0.78 / camera.aspect, 1, 1.9);
        const camFollowDist = (ctrl.nitro && playerNitro > 1 ? 13 : 11) * portraitBoost;
        // Camera view height offset (autorush: Low / Normal / High / Roof)
        const viewHeight = camView === "low" ? 3.2 : camView === "high" ? 6.4 : camView === "roof" ? 9.0 : 5.2;
        const viewBack = camView === "roof" ? 10 : camFollowDist;
        const targetCamPos = new THREE.Vector3()
          .copy(playerPos)
          .addScaledVector(playerTangent, -viewBack)
          .add(new THREE.Vector3(0, viewHeight + (portraitBoost - 1) * 3.4, 0));
        camera.position.lerp(targetCamPos, 0.12);
        camera.lookAt(new THREE.Vector3(playerPos.x, playerPos.y + 2.0, playerPos.z));
      }
      // The dome is huge but finite; re-centre it so it can never be escaped.
      skyDome?.position.copy(camera.position);
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
          mctx.fillStyle = "#241a30";
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
          // Backing store is 2× the CSS box (240px for a 120px frame), so every
          // stroke width and dot radius is doubled to keep the same visual weight.
          const pad = 18;
          const sx = (W - pad * 2) / (maxX - minX || 1);
          const sz = (H - pad * 2) / (maxZ - minZ || 1);
          const s = Math.min(sx, sz);
          const ox = pad + ((W - pad * 2) - (maxX - minX) * s) / 2 - minX * s;
          const oz = pad + ((H - pad * 2) - (maxZ - minZ) * s) / 2 - minZ * s;
          // The track is a long, thin loop, so on a square map it occupies one
          // axis only. Draw it as a dark casing under a lighter core so it
          // survives at 120px instead of disappearing into the panel.
          mctx.strokeStyle = "#4a3a58";
          mctx.lineWidth = 10;
          mctx.lineJoin = "round";
          mctx.lineCap = "round";
          mctx.beginPath();
          pts.forEach((p, i) => {
            const x = p.x * s + ox;
            const y = p.z * s + oz;
            if (i === 0) mctx.moveTo(x, y); else mctx.lineTo(x, y);
          });
          mctx.closePath();
          mctx.stroke();
          mctx.strokeStyle = "#7d6a8f";
          mctx.lineWidth = 3;
          mctx.stroke();
          // rival dots
          for (const rv of rivals) {
            const ru = ((rv.u % 1) + 1) % 1;
            const rp = spline.getPointAt(Math.min(0.999, ru));
            mctx.fillStyle = "#b9a992";
            mctx.beginPath();
            mctx.arc(rp.x * s + ox, rp.z * s + oz, 3.5, 0, Math.PI * 2);
            mctx.fill();
          }
          // player dot
          const pp = spline.getPointAt(Math.min(0.999, playerU));
          mctx.fillStyle = "#ffb020";
          mctx.beginPath();
          mctx.arc(pp.x * s + ox, pp.z * s + oz, 6, 0, Math.PI * 2);
          mctx.fill();
        }
      }

      // 4. rivals (traveled-distance model: dist grows monotonically, u derived)
      let rank = 1;
      const playerTotalDist = (playerLap - 1) * trackLength + playerU * trackLength;
      for (const rival of rivals) {
        // handle flipping animation if active
        if (rival.isFlipping) {
          rival.flipTimer = Math.max(0, (rival.flipTimer ?? 0) - dt);
          const axis = rival.flipAxis ?? new THREE.Vector3(1, 0, 0);
          const angle = (Math.PI * 2) * (dt / 2.5);
          rival.group.rotateOnAxis(axis, angle);
          // arc upward then fall — world-space only, no screen bounce
          const progress = 1 - (rival.flipTimer ?? 0) / 2.5;
          rival.group.position.y = Math.sin(progress * Math.PI) * 2.5;
          if ((rival.flipTimer ?? 0) <= 0) {
            rival.isFlipping = false;
            rival.group.position.y = 0;
            rival.group.rotation.set(0, rival.group.rotation.y, 0);
          }
        }
        // collision detection with player for flip
        if (!rival.isFlipping && isRacing) {
          const rivalPos = rival.group.position;
          const playerWorldPos = new THREE.Vector3().copy(playerPos0).addScaledVector(playerNormal, playerLateral);
          const dist = rivalPos.distanceTo(playerWorldPos);
          if (dist < 2.0 && playerSpeed > 12) {
            rival.isFlipping = true;
            rival.flipTimer = 2.5;
            rival.flipAxis = new THREE.Vector3(1, 0, Math.random() * 0.4 - 0.2).normalize();
            totalScore += 250;
            setDriftPopup({ text: 'TAKEDOWN! +250', id: Date.now() });
            soundRef.current?.playCrash();
          }
        }
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
        rival.frontWheel.rotation.y = 0;
      }
      positionRank = isRacing ? rank : positionRank;

      // 5. obstacles
      for (const o of obstacles) {
        if (o.speed > 0) {
          o.u = (o.u + (o.speed * dt) / trackLength) % 1.0;
          const { pt, tangent, normal } = splineFrame(o.u);
          const lat = Math.max(-TRACK.roadWidth * 0.44, Math.min(TRACK.roadWidth * 0.44, o.lateral));
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
              raceChallenge.current.crashes++;
              o.hitCooldown = 2.5;
              totalScore = Math.max(0, totalScore - 100);
              setDriftPopup({ text: "CRASH! −100", id: Date.now() });
              soundRef.current?.playCrash();
              // Cinematic crash: crash sound word
              setCrashWord("CRASH!");
              setCinematicShowing(true);
              setTimeout(() => setCinematicShowing(false), 1200);
              soundRef.current?.duckMusic(0.3, 700);
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
            raceChallenge.current.traps++;
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
          mesh.position.y = (mesh.userData as { baseY: number }).baseY;
          if (isRacing && rel >= -2 && rel <= OBSTACLE_TUNING.coinPickupRadius) {
            const latDiff = Math.abs(playerLateral - row.lateral);
            if (latDiff < OBSTACLE_TUNING.coinPickupRadius) {
              mesh.visible = false;
              runCoins += diff.coinValue;
              lapsRunCoins += diff.coinValue;
              raceChallenge.current.coins++;
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
      playerNitroRef.current = playerNitro;
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

      composerRef.current?.render();
    }

    animId = requestAnimationFrame(gameLoop);

    const onResize = () => {
      if (!viewport || !renderer || !camera) return;
      const w = viewport.clientWidth || 850;
      const h = viewport.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composerRef.current?.setSize(w, h);
      if (bloomPassRef.current) {
        bloomPassRef.current.resolution.set(w, h);
      }
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
      composerRef.current?.dispose();
      composerRef.current = null;
      bloomPassRef.current = null;
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

  // The race deposits coins straight into localStorage, so the wallet pill has
  // to re-read the bank when the run ends or the player returns to the menu.
  // Guarded so it only writes state when the value actually changed.
  useEffect(() => {
    const nextBank = readBank();
    if (nextBank !== bank) setBank(nextBank);
  }, [phase, readBank, bank]);

  // Districts roll day -> sunset -> night as laps advance, so a finished race
  // leaves the scene on the last district's phase. Restore the menu's TIME
  // preview whenever the menu comes back, otherwise the row says DAY over a
  // night sky.
  useEffect(() => {
    if (phase === "menu") engineRef.current?.setTimeMode(menuTimeMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, menuTimeMode]);

  // =============================================================
  // RENDER
  // =============================================================
  const curVehicle = vehicleById(selectedVehicle);
  const curDifficulty = difficultyById(difficultyId);
  const hudDistrict = DISTRICTS[Math.min(hud.lap - 1, DISTRICTS.length - 1)].name;
  const racers = RIVALS.length + 1;
  const playerRank = finalStats?.rankings.find((r) => r.name === "YOU")?.rank ?? 0;
  const resultsTitle =
    playerRank === 1 ? "CHAMPION" : playerRank > 0 ? `${ordinal(playerRank)} PLACE` : "RACE OVER";

  return (
    <div id="game-container">
      <div className="debug-tele">
        <div className="debug-row">
          <span className="debug-label">FPS</span>
          <span className="debug-val" id="debugFps">{fpsRef.current}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">LAP</span>
          <span className="debug-val">{hud.lap}/{totalLaps}</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">SPD</span>
          <span className="debug-val">{hud.speed} km/h</span>
        </div>
        <div className="debug-row">
          <span className="debug-label">BANK</span>
          <span className="debug-val">{bank}</span>
        </div>
      </div>
      {menuWeather === "rain" && (
        <div className="weather-drop" aria-hidden="true">
          {[...Array(120)].map((_, i) => (
            <div
              key={i}
              className="weather-drop-line"
              style={{
                left: `${Math.random() * 100}vw`,
                animationDelay: `${Math.random() * 0.8}s`,
                animationDuration: `${0.4 + Math.random() * 0.4}s`,
              }}
            />
          ))}
        </div>
      )}
      {loadingVisible && (
        <div className={`loading-screen ${loading ? "" : "loading-screen--out"}`}>
          <div className="loading-mark">
            <div className="loading-title">KARACHI RUSH</div>
            <div className="loading-subtitle">SADAR · CHUNDRIGAR · CLIFTON</div>
            <div className="loading-bar">
              <div className="loading-bar-fill" />
            </div>
            <div className="loading-msg">LOADING DISTRICTS…</div>
          </div>
        </div>
      )}
      <div id="viewport" ref={viewportRef} />

      {/* ---------------------------------------------------------
          HUD — three corners, empty middle
          --------------------------------------------------------- */}
      {(phase === "racing" || phase === "countdown" || phase === "paused") && (
        <div className="game-hud" style={{ transform: beatPulse ? "scale(1.03)" : "scale(1)", transition: "transform 60ms" }}>
          <div className="hud-panel hud-top-left">
            <div className="hud-pos">
              <span className="pos-main">{ordinal(hud.position)}</span>
              <span className="pos-total">/{racers}</span>
            </div>
            <div className="hud-row">
              <span className="hud-k">LAP</span>
              <span className="hud-v">
                {hud.lap}/{totalLaps}
              </span>
            </div>
            <div className="hud-row">
              <span className="hud-k">TIME</span>
              <span className="hud-v">{fmtTime(hud.lapTime)}</span>
            </div>
            <div className="hud-row">
              <span className="hud-k">BEST</span>
              <span className="hud-v dim">{hud.bestLap ? fmtTime(hud.bestLap) : "—"}</span>
            </div>
          </div>

          <div className="hud-top-right">
            <div className="minimap-frame">
              <canvas id="minimap" className="minimap" width={240} height={240} ref={minimapRef} />
            </div>
            <div className="hud-district">{hudDistrict}</div>
            <div className="hud-wallet">
              <CoinIcon size={14} />
              <span>{fmtNum(hud.runCoins)}</span>
            </div>
          </div>

          <div className="hud-bottom-left">
            <span className="speed-value">{hud.speed}</span>
            <span className="speed-unit">km/h</span>
          </div>

          {/* Car label: position + speed overlay (autorush style) */}
          {phase === "racing" && (
            <div className="car-label">
              <div className="cl-pos">{ordinal(hud.position)}</div>
              <div className="cl-spd"><span>{hud.speed}</span><small>km/h</small></div>
            </div>
          )}

          <div className="hud-bottom-right">
            <div className="nitro-ring" title={`Nitro ${hud.nitro}%`}>
              <svg className="nitro-arc" width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--edge)" strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--marigold)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={NITRO_CIRC}
                  strokeDashoffset={NITRO_CIRC * (1 - Math.min(100, Math.max(0, hud.nitro)) / 100)}
                />
              </svg>
              <div className="nitro-core">
                <BoltIcon size={16} />
                <span className="nitro-pct">{Math.round(hud.nitro)}</span>
              </div>
            </div>

            <div className="hud-tools hud-right">
              <button
                type="button"
                className="hud-btn icon-btn"
                aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                aria-pressed={!soundEnabled}
                onClick={() => setSoundEnabled((v) => !v)}
              >
                {soundEnabled ? <SpeakerIcon size={18} /> : <SpeakerOffIcon size={18} />}
              </button>
              <button
                type="button"
                className="hud-btn icon-btn"
                aria-label={`Time of day: ${TIME_LABELS[hud.timeMode]}. Change`}
                title={TIME_LABELS[hud.timeMode]}
                onClick={() => engineRef.current?.cycleTimeMode()}
              >
                <span className="hud-btn-label">{TIME_LABELS[hud.timeMode]}</span>
              </button>
              <button
                type="button"
                className="hud-btn icon-btn"
                aria-label={`Camera: ${cameraMode}. Change (C key)`}
                title={`CAM: ${cameraMode.toUpperCase()}`}
                onClick={() => setCameraMode((m) => (m === "chase" ? "hood" : m === "hood" ? "cinematic" : "chase"))}
              >
                <span className="hud-btn-label">CAM {cameraMode === "chase" ? "CHASE" : cameraMode === "hood" ? "HOOD" : "CINE"}</span>
              </button>
              <button
                type="button"
                className={`hud-btn icon-btn ${phase === "paused" ? "hud-btn--on" : ""}`}
                aria-label={phase === "paused" ? "Resume race" : "Pause race"}
                onClick={() => engineRef.current?.togglePause()}
              >
                {phase === "paused" ? <PlayIcon size={18} /> : <PauseIcon size={18} />}
              </button>
            </div>

            {/* Touch controls (shown on touch devices, autorush style) */}
            <div className="touch-controls">
              <button
                type="button"
                className="touch-btn touch-brake"
                aria-label="Brake / reverse"
                title="BRAKE"
                onTouchStart={(e) => { e.preventDefault(); controlsRef.current.brake = 1; }}
                onTouchEnd={(e) => { e.preventDefault(); controlsRef.current.brake = 0; }}
                onPointerDown={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.brake = 1; }}
                onPointerUp={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.brake = 0; }}
              >
                <span className="touch-label">↓ BRAKE</span>
              </button>
              <button
                type="button"
                className="touch-btn touch-gas"
                aria-label="Accelerate / gas"
                title="GAS"
                onTouchStart={(e) => { e.preventDefault(); controlsRef.current.throttle = 1; }}
                onTouchEnd={(e) => { e.preventDefault(); controlsRef.current.throttle = 0; }}
                onPointerDown={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.throttle = 1; }}
                onPointerUp={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.throttle = 0; }}
              >
                <span className="touch-label">↑ GAS</span>
              </button>
              <button
                type="button"
                className="touch-btn touch-drift"
                aria-label="Drift"
                title="DRIFT"
                onTouchStart={(e) => { e.preventDefault(); controlsRef.current.drift = true; }}
                onTouchEnd={(e) => { e.preventDefault(); controlsRef.current.drift = false; }}
                onPointerDown={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.drift = true; }}
                onPointerUp={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.drift = false; }}
              >
                <span className="touch-label">DRIFT</span>
              </button>
              <button
                type="button"
                className="touch-btn touch-nitro"
                aria-label="Nitro boost"
                title="N₂O"
                onTouchStart={(e) => { e.preventDefault(); controlsRef.current.nitro = true; }}
                onTouchEnd={(e) => { e.preventDefault(); controlsRef.current.nitro = false; }}
                onPointerDown={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.nitro = true; }}
                onPointerUp={(e) => { if (e.pointerType !== "touch") return; controlsRef.current.nitro = false; }}
              >
                <span className="touch-label">N₂O</span>
              </button>
            </div>
          </div>

          {driftPopup && (
            <div key={driftPopup.id} className="drift-tag-popup">
              {driftPopup.text}
            </div>
          )}

          {lapBanner && (
            <div className="lap-banner">
              <div className="lap-banner-kicker">LAP {lapBanner.lap}</div>
              <div className="lap-banner-district">{lapBanner.district}</div>
              <div className="lap-banner-tagline">{lapBanner.tagline}</div>
            </div>
          )}

          {wrongWay && (
            <div className="wrong-way">
              <WarningIcon size={22} />
              <span>WRONG WAY</span>
            </div>
          )}
        </div>
      )}

      {/* Countdown */}
      {phase === "countdown" && (
        <div className="countdown-overlay">
          <div className={`countdown-number ${countdownNum === "GO!" ? "is-go" : ""}`}>{countdownNum}</div>
        </div>
      )}

      {/* Cinematic crash: letterbox bars + crash sound word */}
      {cinematicShowing && crashWord && (
        <div className="cine-overlay">
          <i className="cine-bar top" />
          <i className="cine-bar bot" />
          <div className="cine-word">{crashWord}</div>
        </div>
      )}

      {/* ---------------------------------------------------------
          MENU — left rail, live scene on the right
          --------------------------------------------------------- */}
      {phase === "menu" && (
        <div className="screen-overlay menu-overlay">
          {/* Top Floating Wallet Bar (autorush style) */}
          <div className="wallet-bar">
            <div className="chip w-item pts" title="Bank balance">
              <CoinIcon size={16} />
              <span id="walletPts">{fmtNum(bank)}</span>
            </div>
            {dailyStreak > 0 && (
              <div className="chip w-item streak" title={`Daily streak: ${dailyStreak} days`}>
                <span>🔥 {dailyStreak}</span>
              </div>
            )}
            {/* Daily challenges chip */}
            {dailyChallenges.length > 0 && (
              <div
                className="chip w-item chal"
                title={`Daily challenges: ${dailyChallenges.filter((c) => challengeCompleted[c.id]).length}/${dailyChallenges.length} completed`}
                onClick={() => setSettingsOpen(false)}
              >
                <span className="chal-progress">
                  {dailyChallenges.filter((c) => challengeCompleted[c.id]).length}/{dailyChallenges.length}
                </span>
                <span className="chal-icon">🎯</span>
              </div>
            )}
            <div className="chip w-item streak" title="Best Lap">
              <span>BEST {hud.bestLap ? fmtTime(hud.bestLap) : "--:--"}</span>
            </div>
            <button
              type="button"
              className="chip set-btn"
              id="soundBtn"
              title={soundEnabled ? "Mute audio" : "Unmute audio"}
              aria-label={soundEnabled ? "Mute audio" : "Unmute audio"}
              onClick={() => setSoundEnabled((v) => !v)}
            >
              {soundEnabled ? <SpeakerIcon size={18} /> : <SpeakerOffIcon size={18} />}
            </button>
            <button
              type="button"
              className="chip set-btn"
              id="settingsBtn"
              title="Settings"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <GearIcon size={18} />
            </button>
          </div>

          {/* Audio unlock overlay — browsers block AudioContext until first gesture */}
          {!audioUnlocked && (
            <div className="audio-unlock" onClick={() => {
              soundRef.current?.init();
              setAudioUnlocked(true);
            }}>
              <span className="unlock-text">Tap to enable sound & music</span>
              <span className="unlock-icon">🔊</span>
            </div>
          )}

          <aside className="rail">
            <div className="rail-head">
              <div className="bank-pill">
                <CoinIcon size={16} />
                <span className="bank-value">{fmtNum(bank)}</span>
                <span className="bank-label">BANK</span>
              </div>
              {dailyStreak > 0 && (
                <div className="chip w-item streak" title={`Daily streak: ${dailyStreak} days`} style={{ marginLeft: 8 }}>
                  <span>🔥 {dailyStreak}</span>
                </div>
              )}
              <button
                type="button"
                className="rail-icon"
                aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                aria-pressed={!soundEnabled}
                onClick={() => setSoundEnabled((v) => !v)}
              >
                {soundEnabled ? <SpeakerIcon size={18} /> : <SpeakerOffIcon size={18} />}
              </button>
              <button
                type="button"
                className="rail-icon"
                aria-label="Settings"
                onClick={() => setSettingsOpen(true)}
              >
                <GearIcon size={18} />
              </button>
              <button
                type="button"
                className="chip w-item"
                style={{ marginLeft: 6, padding: "4px 10px", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer", background: "var(--panel-2)", border: "1px solid var(--edge)", color: "var(--marigold)" }}
                onClick={() => setMultiplayerOpen(true)}
              >
                {roomPin ? `PIN: ${roomPin}` : "FRIENDS"}
              </button>
            </div>

            {/* Everything above and below this wrapper is pinned; only the
                middle scrolls, so the one CTA is always on screen even at
                1280x720 without shrinking the type. */}
            <div className="rail-body scrollable">
              <header className="brand">
                <div className="game-title">KARACHI RICKSHAW RUSH</div>
                <div className="game-subtitle">کراچی کی سڑکوں پر ریس، چلو! · SADDAR · BURNS ROAD · SEA VIEW</div>
              </header>



              {/* Daily challenges (autorush style) */}
              {dailyChallenges.length > 0 && (
                <section className="rail-group">
                  <div className="section-label">Daily Challenges</div>
                  {dailyChallenges.map((c) => {
                    const prog = challengeProgress[c.id] ?? 0;
                    const done = challengeCompleted[c.id];
                    const pct = Math.min(100, Math.round((prog / c.target) * 100));
                    return (
                      <div key={c.id} className="chal-row">
                        <div className="chal-info">
                          <span className="chal-title">{c.title}</span>
                          <span className="chal-desc">{c.desc.replace("{target}", c.target.toString())}</span>
                        </div>
                        <div className="chal-bar">
                          <div
                            className={`chal-fill ${done ? "done" : ""}`}
                            style={{ width: done ? "100%" : `${pct}%` }}
                          />
                        </div>
                        <div className="chal-reward">
                          {done ? "✔" : `${prog}/${c.target}`}
                          <span className="chal-reward-coin">+{c.reward}</span>
                        </div>
                      </div>
                    );
                  })}
                </section>
              )}

              {/* Featured Auto Showcase Card with Arrow Pickers (autorush style) */}
              <section className="rail-group">
                <div className="section-label">Selected Rickshaw</div>
                <div className="home-picker">
                  <button
                    type="button"
                    className="arrow"
                    id="prevAuto"
                    aria-label="Previous auto"
                    onClick={() => {
                      const idx = VEHICLES.findIndex((v) => v.id === selectedVehicle);
                      const prevIdx = (idx - 1 + VEHICLES.length) % VEHICLES.length;
                      setSelectedVehicle(VEHICLES[prevIdx].id);
                    }}
                  >
                    ‹
                  </button>
                  <div className="auto-card" id="autoCard">
                    <div className="auto-card-top">
                      <div className="auto-name">{curVehicle.name}</div>
                      <span className={`tier tier-${curVehicle.id}`}>
                        {VEHICLE_TIERS[curVehicle.id] || "STANDARD"}
                      </span>
                    </div>
                    <div className="auto-tag">{curVehicle.subtitle}</div>
                    <div className="stats">
                      <span className="stat-label">TOP SPEED</span>
                      <div className="stat-bar">
                        <i style={{ width: `${Math.round((curVehicle.topSpeed / 50) * 100)}%` }} />
                      </div>
                      <span className="stat-label">ACCEL</span>
                      <div className="stat-bar">
                        <i style={{ width: `${Math.round((curVehicle.accel / 14) * 100)}%` }} />
                      </div>
                      <span className="stat-label">HANDLING</span>
                      <div className="stat-bar">
                        <i style={{ width: `${Math.round((curVehicle.handling / 1.2) * 100)}%` }} />
                      </div>
                      <span className="stat-label">NITRO</span>
                      <div className="stat-bar">
                        <i style={{ width: `${Math.round((curVehicle.nitroBonus / 24) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="card-foot">
                      <span className="auto-count">
                        {VEHICLES.findIndex((v) => v.id === selectedVehicle) + 1} / {VEHICLES.length}
                      </span>
                      {/* Upgrades (owned vehicles only) */}
                      {unlocked.includes(curVehicle.id) && (
                        <div className="upgrades">
                          {UPGRADE_STATS.map((s) => {
                            const levels = upgradeLevels[selectedVehicle] ?? {};
                            const lvl = levels[s.id] ?? 0;
                            const cost = upgradeCost(s.id, lvl);
                            const maxed = lvl >= MAX_UPGRADE_LEVEL;
                            return (
                              <button
                                key={s.id}
                                type="button"
                                className={`upg-btn ${maxed ? "maxed" : ""}`}
                                onClick={() => !maxed && buyUpgrade(s.id)}
                                title={`${s.label} L${lvl} — ${maxed ? "MAXED" : cost + " coins"}`}
                              >
                                <span className="upg-label">{s.label[0]}</span>
                                <span className="upg-lvl">L{lvl}</span>
                                {!maxed && <span className="upg-cost">{cost}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {curVehicle.price === 0 || unlocked.includes(curVehicle.id) ? (
                        <span className="owned-tag">EQUIPPED ✓</span>
                      ) : bank >= curVehicle.price ? (
                        <button
                          type="button"
                          className="buy-pill-btn"
                          onClick={() => buyVehicle(curVehicle.id)}
                        >
                          <CoinIcon size={12} />
                          UNLOCK FOR {fmtNum(curVehicle.price)}
                        </button>
                      ) : (
                        <span className="lock-note">
                          🔒 NEED {fmtNum(curVehicle.price)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="arrow"
                    id="nextAuto"
                    aria-label="Next auto"
                    onClick={() => {
                      const idx = VEHICLES.findIndex((v) => v.id === selectedVehicle);
                      const nextIdx = (idx + 1) % VEHICLES.length;
                      setSelectedVehicle(VEHICLES[nextIdx].id);
                    }}
                  >
                    ›
                  </button>
                </div>

                {/* Quick garage selector cards (preserves .select-card and .buy-btn for E2E tests) */}
                <div className="garage-grid mini-garage">
                  {VEHICLES.map((v) => {
                    const isOwned = v.price === 0 || unlocked.includes(v.id);
                    const isActive = selectedVehicle === v.id;
                    const canBuy = !isOwned && bank >= v.price;
                    return (
                      <button
                        key={v.id}
                        type="button"
                        className={`select-card ${isActive ? "active" : ""} ${isOwned ? "" : "locked"}`}
                        aria-pressed={isActive}
                        aria-disabled={!isOwned && !canBuy}
                        onClick={() => {
                          if (isOwned) setSelectedVehicle(v.id);
                          else if (canBuy) buyVehicle(v.id);
                          else setSelectedVehicle(v.id);
                        }}
                      >
                        <span className="select-card-name">{v.name}</span>
                        <span className="select-card-stats">
                          {v.topSpeed} <em>km/h</em>
                        </span>
                        <div className="select-card-stat-row">
                          <div className="select-card-stat">
                            <span className="select-card-stat-k">SPD</span>
                            <div className="select-card-stat-bar">
                              <span
                                className="select-card-stat-fill"
                                style={{ width: `${Math.round((v.topSpeed / 50) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="select-card-stat">
                            <span className="select-card-stat-k">ACC</span>
                            <div className="select-card-stat-bar">
                              <span
                                className="select-card-stat-fill"
                                style={{ width: `${Math.round((v.accel / 14) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="select-card-stat">
                            <span className="select-card-stat-k">HND</span>
                            <div className="select-card-stat-bar">
                              <span
                                className="select-card-stat-fill"
                                style={{ width: `${Math.round((v.handling / 1.2) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className="select-card-tail">
                          {isOwned ? (
                            isActive ? (
                              <span className="owned-tag">EQUIPPED</span>
                            ) : null
                          ) : (
                            <span
                              className="buy-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (canBuy) buyVehicle(v.id);
                              }}
                            >
                              <CoinIcon size={12} />
                              BUY {fmtNum(v.price)}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="rail-group">
                <div className="section-label">Difficulty</div>
                <div className="segmented" role="group" aria-label="Difficulty">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className={`seg ${difficultyId === d.id ? "is-on" : ""}`}
                      aria-pressed={difficultyId === d.id}
                      onClick={() => setDifficultyId(d.id)}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="seg-note">{curDifficulty.tagline}</div>
              </section>

              <section className="rail-group">
                <div className="section-label">Laps</div>
                <div className="segmented" role="group" aria-label="Race laps">
                  {[1, 3, 5].map((laps) => (
                    <button
                      key={laps}
                      type="button"
                      className={`seg ${totalLaps === laps ? "is-on" : ""}`}
                      aria-pressed={totalLaps === laps}
                      onClick={() => setTotalLaps(laps)}
                    >
                      {laps} {laps === 1 ? "LAP" : "LAPS"}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rail-group">
                <div className="section-label">Time</div>
                <div className="segmented" role="group" aria-label="Time of day">
                  {(["day", "sunset", "night"] as TimeMode[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`seg ${menuTimeMode === t ? "is-on" : ""}`}
                      aria-pressed={menuTimeMode === t}
                      onClick={() => {
                        menuTimeModeRef.current = t;
                        setMenuTimeMode(t);
                        engineRef.current?.setTimeMode(t);
                      }}
                    >
                      {TIME_LABELS[t]}
                    </button>
                  ))}
                </div>
              </section>

              {/* Weather toggle */}
              <section className="rail-group">
                <div className="section-label">Weather</div>
                <div className="segmented" role="group" aria-label="Weather">
                  <button
                    type="button"
                    className={`seg ${menuWeather === "clear" ? "is-on" : ""}`}
                    aria-pressed={menuWeather === "clear"}
                    onClick={() => {
                      menuWeatherRef.current = "clear";
                      setMenuWeather("clear");
                    }}
                  >
                    CLEAR ☀️
                  </button>
                  <button
                    type="button"
                    className={`seg ${menuWeather === "rain" ? "is-on" : ""}`}
                    aria-pressed={menuWeather === "rain"}
                    onClick={() => {
                      menuWeatherRef.current = "rain";
                      setMenuWeather("rain");
                    }}
                  >
                    RAIN 🌧️
                  </button>
                </div>
              </section>
            </div>

            <button type="button" className="action-btn big-btn" id="startBtn" onClick={() => engineRef.current?.startRace()}>
              <span>START RUSH</span>
              <span className="cta-start">START</span>
              <span className="go-arrow" aria-hidden="true">▶</span>
            </button>

            <div className="controls-hint">
              <span>
                <kbd>W</kbd>
                <kbd>S</kbd> throttle · <kbd>A</kbd>
                <kbd>D</kbd> steer
              </span>
              <span>
                <kbd>SPACE</kbd> drift · <kbd>N</kbd> nitro · <kbd>P</kbd> pause · <kbd>H</kbd> horn
              </span>
            </div>

            <nav className="rail-links site-links" aria-label="Game Guides">
              <a href="/how-to-play">How to Play</a>
              <span>·</span>
              <a href="/tracks">Tracks</a>
              <span>·</span>
              <a href="/autos">Autos</a>
              <span>·</span>
              <a href="/about">About</a>
              <span>·</span>
              <a href="/contact">Contact</a>
            </nav>
          </aside>
        </div>
      )}

      {/* ---------------------------------------------------------
          SETTINGS
          --------------------------------------------------------- */}
      {phase === "menu" && settingsOpen && (
        <div className="screen-overlay screen-overlay--sheet" onClick={() => setSettingsOpen(false)}>
          <div className="modal-panel panel-slim" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <h2 className="panel-title">SETTINGS</h2>
              <button
                type="button"
                className="panel-close"
                aria-label="Close settings"
                onClick={() => setSettingsOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="settings-scroll">
              <div className="setting-row">
                <span className="setting-k">Music</span>
                <div className="volume-row">
                  <button
                    type="button"
                    className="vol-btn"
                    aria-label="Music down"
                    onClick={() => setMusicVolume((v) => Math.max(0, v - 10))}
                  >
                    −
                  </button>
                  <span className="vol-val">{musicVolume}%</span>
                  <button
                    type="button"
                    className="vol-btn"
                    aria-label="Music up"
                    onClick={() => setMusicVolume((v) => Math.min(100, v + 10))}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="setting-row">
                <span className="setting-k">Effects</span>
                <div className="volume-row">
                  <button
                    type="button"
                    className="vol-btn"
                    aria-label="Effects down"
                    onClick={() => setEffectsVolume((v) => Math.max(0, v - 10))}
                  >
                    −
                  </button>
                  <span className="vol-val">{effectsVolume}%</span>
                  <button
                    type="button"
                    className="vol-btn"
                    aria-label="Effects up"
                    onClick={() => setEffectsVolume((v) => Math.min(100, v + 10))}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="setting-row credits-row">
                <span className="setting-k">Audio credits</span>
                <span className="setting-v">
                  Tyre squeal: audible-edge (CC BY 3.0). Nitro, coins, impacts:
                  Kenney, rubberduck (CC0). 3D models adapted: alnmathew,
                  Bongblender, 99.Miles, Nikitos & Nodeaxis Interactive.
                </span>
              </div>

              <div className="section-label">Controls</div>
              <dl className="keymap">
                <dt>
                  <kbd>W</kbd>
                  <kbd>S</kbd>
                </dt>
                <dd>Throttle and brake</dd>
                <dt>
                  <kbd>A</kbd>
                  <kbd>D</kbd>
                </dt>
                <dd>Steer left and right</dd>
                <dt>
                  <kbd>SPACE</kbd>
                </dt>
                <dd>Handbrake drift — scores while it holds</dd>
                <dt>
                  <kbd>N</kbd>
                </dt>
                <dd>Nitro boost</dd>
                <dt>
                  <kbd>P</kbd>
                  <kbd>ESC</kbd>
                </dt>
                <dd>Pause</dd>
              </dl>

              <div className="section-label">Camera View</div>
              <div className="segmented" role="group" aria-label="Camera view">
                {CAM_VIEW_OPTIONS.map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    className={`seg ${camView === v ? "is-on" : ""}`}
                    aria-pressed={camView === v}
                    onClick={() => setCamView(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="section-label">Vibration</div>
              <div className="segmented" role="group" aria-label="Vibration">
                {VIBRATION_OPTIONS.map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    className={`seg ${vibration === v ? "is-on" : ""}`}
                    aria-pressed={vibration === v}
                    onClick={() => setVibration(v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button type="button" className="action-btn" onClick={() => setSettingsOpen(false)}>
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          MULTIPLAYER PIN MODAL
          --------------------------------------------------------- */}
      {phase === "menu" && multiplayerOpen && (
        <div className="screen-overlay screen-overlay--sheet" onClick={() => setMultiplayerOpen(false)}>
          <div className="modal-panel panel-slim" onClick={(e) => e.stopPropagation()}>
            <div className="panel-head">
              <h2 className="panel-title">PLAY WITH FRIENDS</h2>
              <button
                type="button"
                className="panel-close"
                aria-label="Close multiplayer"
                onClick={() => setMultiplayerOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="settings-scroll" style={{ padding: "16px 20px" }}>
              <div style={{ marginBottom: 16 }}>
                <div className="section-label">Host a Game</div>
                <p style={{ color: "var(--cream-dim)", fontSize: 13, margin: "6px 0 12px" }}>
                  Generate a 4-digit PIN and share it with a friend in another window or tab to race together.
                </p>
                {isHost && roomPin ? (
                  <div style={{ textAlign: "center", padding: "12px", background: "var(--panel-2)", border: "1px solid var(--marigold)", borderRadius: 6, marginBottom: 12 }}>
                    <div style={{ fontSize: 12, color: "var(--marigold)", fontWeight: 700 }}>YOUR ROOM PIN</div>
                    <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "0.2em", color: "#fff", marginTop: 4 }}>
                      {roomPin}
                    </div>
                  </div>
                ) : (
                  <button type="button" className="action-btn" style={{ width: "100%", marginBottom: 12 }} onClick={hostRoom}>
                    CREATE ROOM PIN
                  </button>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--edge)", paddingTop: 16 }}>
                <div className="section-label">Join with PIN</div>
                <p style={{ color: "var(--cream-dim)", fontSize: 13, margin: "6px 0 12px" }}>
                  Enter your friend&apos;s 4-digit PIN to connect.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="e.g. 5482"
                    value={roomPin}
                    onChange={(e) => setRoomPin(e.target.value.replace(/\D/g, ""))}
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textAlign: "center",
                      background: "var(--panel-2)",
                      border: "1px solid var(--edge)",
                      color: "#fff",
                      borderRadius: 4,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    className="action-btn"
                    disabled={roomPin.length !== 4}
                    onClick={() => joinRoom(roomPin)}
                  >
                    JOIN
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn-ghost"
                style={{ width: "100%", marginTop: 20 }}
                onClick={() => setMultiplayerOpen(false)}
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          PAUSE
          --------------------------------------------------------- */}
      {phase === "paused" && (
        <div className="screen-overlay screen-overlay--center">
          <div className="modal-panel panel-slim pause-panel">
            <div className="panel-title">PAUSED</div>
            <div className="panel-sub">
              {curVehicle.name} · LAP {hud.lap} / {totalLaps}
            </div>
            <button type="button" className="action-btn" onClick={() => engineRef.current?.togglePause()}>
              RESUME
            </button>
            <button type="button" className="btn-ghost" onClick={() => engineRef.current?.quitRace()}>
              MAIN MENU
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          RESULTS
          --------------------------------------------------------- */}
      {phase === "finished" && finalStats && (
        <div className="screen-overlay screen-overlay--center">
          <div className="modal-panel panel-wide results">
            <div className="results-head">
              <div className="results-kicker">FINAL STANDINGS</div>
              <div className="results-title">{resultsTitle}</div>
              <div className="results-sub">
                {finalStats.difficulty.toUpperCase()} · {fmtTime(finalStats.raceTime)} · {finalStats.laps.length} LAP
                {finalStats.laps.length > 1 ? "S" : ""}
              </div>
            </div>

            <div className="results-body">
              <div className="results-col">
                <div className="section-label">Standings</div>
                <div className="rankings-list">
                  {finalStats.rankings.map((r) => (
                    <div key={`${r.rank}-${r.name}`} className={`ranking-row ${r.name === "YOU" ? "you" : ""}`}>
                      <span className="rank-n">{r.rank}</span>
                      <span className="rank-name">{r.name}</span>
                      <span className="rank-time tab">{fmtTime(r.time)}</span>
                    </div>
                  ))}
                </div>

                <div className="section-label" style={{ marginTop: 20 }}>
                  Laps
                </div>
                <div className="lap-summary-list">
                  {finalStats.laps.map((l) => (
                    <div key={l.lap} className="lap-summary-row">
                      <span className="lap-summary-k">
                        L{l.lap} · {l.district}
                      </span>
                      <span className="lap-summary-v">
                        {l.timeSec.toFixed(1)}s · {l.coins}c · {l.trapsDodged} traps
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="results-col">
                <div className="payout">
                  <span className="payout-num">
                    <CoinIcon size={28} />
                    {fmtNum(finalStats.coinsEarned)}
                  </span>
                  <span className="payout-label">Coins earned</span>
                </div>
                <div className="bank-line">
                  <span>New balance</span>
                  <strong>{fmtNum(bank)}</strong>
                </div>
                {dailyBonus > 0 && (
                  <div className="payout" style={{ marginTop: 10, borderTop: "1px solid var(--edge)", paddingTop: 8 }}>
                    <span className="payout-num" style={{ color: "var(--jade)" }}>
                      <CoinIcon size={20} />
                      +{fmtNum(dailyBonus)}
                    </span>
                    <span className="payout-label">Daily streak ×{dailyStreak}</span>
                  </div>
                )}
                {/* Daily challenge rewards */}
                {dailyChallenges.some((c) => challengeCompleted[c.id]) && (
                  <div className="payout" style={{ marginTop: 10, borderTop: "1px solid var(--edge)", paddingTop: 8 }}>
                    <span className="payout-num" style={{ color: "var(--marigold)" }}>
                      <CoinIcon size={20} />
                      +{fmtNum(
                        dailyChallenges
                          .filter((c) => challengeCompleted[c.id])
                          .reduce((sum, c) => sum + c.reward, 0)
                      )}
                    </span>
                    <span className="payout-label">Challenge rewards</span>
                  </div>
                )}

                <div className="stat-grid">
                  <div className="stat-box">
                    <span className="stat-num">{fmtTime(finalStats.raceTime)}</span>
                    <span className="stat-label">Race time</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{finalStats.bestLap ? fmtTime(finalStats.bestLap) : "—"}</span>
                    <span className="stat-label">Best lap</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{fmtNum(finalStats.distanceM)}m</span>
                    <span className="stat-label">Distance</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{fmtNum(finalStats.steps)}</span>
                    <span className="stat-label">Steps</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{finalStats.trapsDodged}</span>
                    <span className="stat-label">Traps</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{finalStats.crashes}</span>
                    <span className="stat-label">Crashes</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{fmtNum(finalStats.driftScore)}</span>
                    <span className="stat-label">Drift</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-num">{finalStats.laps.length}</span>
                    <span className="stat-label">Laps done</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="results-actions">
              <button type="button" className="action-btn" onClick={() => engineRef.current?.startRace()}>
                RACE AGAIN
              </button>
              <button type="button" className="btn-ghost" onClick={() => engineRef.current?.quitRace()}>
                MAIN MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------
          TOUCH CONTROLS
          --------------------------------------------------------- */}
      <div className="mobile-controls">
        <div className="touch-cluster-left">
          <button
            type="button"
            className="touch-btn"
            aria-label="Steer left"
            onPointerDown={() => (controlsRef.current.steer = -1)}
            onPointerUp={() => (controlsRef.current.steer = 0)}
            onPointerLeave={() => (controlsRef.current.steer = 0)}
            onPointerCancel={() => (controlsRef.current.steer = 0)}
          >
            <ArrowLeftIcon size={22} />
          </button>
          <button
            type="button"
            className="touch-btn"
            aria-label="Steer right"
            onPointerDown={() => (controlsRef.current.steer = 1)}
            onPointerUp={() => (controlsRef.current.steer = 0)}
            onPointerLeave={() => (controlsRef.current.steer = 0)}
            onPointerCancel={() => (controlsRef.current.steer = 0)}
          >
            <ArrowRightIcon size={22} />
          </button>
        </div>
        <div className="touch-cluster-right">
          <button
            type="button"
            className="touch-btn nitro"
            aria-label="Nitro"
            onPointerDown={() => (controlsRef.current.nitro = true)}
            onPointerUp={() => (controlsRef.current.nitro = false)}
            onPointerLeave={() => (controlsRef.current.nitro = false)}
            onPointerCancel={() => (controlsRef.current.nitro = false)}
          >
            <BoltIcon size={22} />
          </button>
          <button
            type="button"
            className="touch-btn drift"
            aria-label="Drift"
            onPointerDown={() => (controlsRef.current.drift = true)}
            onPointerUp={() => (controlsRef.current.drift = false)}
            onPointerLeave={() => (controlsRef.current.drift = false)}
            onPointerCancel={() => (controlsRef.current.drift = false)}
          >
            DRIFT
          </button>
          <button
            type="button"
            className="touch-btn"
            aria-label="Brake"
            onPointerDown={() => (controlsRef.current.brake = 1)}
            onPointerUp={() => (controlsRef.current.brake = 0)}
            onPointerLeave={() => (controlsRef.current.brake = 0)}
            onPointerCancel={() => (controlsRef.current.brake = 0)}
          >
            BRAKE
          </button>
          <button
            type="button"
            className="touch-btn go"
            aria-label="Throttle"
            onPointerDown={() => (controlsRef.current.throttle = 1)}
            onPointerUp={() => (controlsRef.current.throttle = 0)}
            onPointerLeave={() => (controlsRef.current.throttle = 0)}
            onPointerCancel={() => (controlsRef.current.throttle = 0)}
          >
            GO
          </button>
        </div>
      </div>
    </div>
  );
}
