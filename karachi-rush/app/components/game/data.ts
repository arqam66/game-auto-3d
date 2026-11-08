// =============================================================
// KARACHI RUSH — single source of truth for all game data
// =============================================================

export interface TrackPoint {
  x: number;
  y: number;
  z: number;
}

export interface VehicleDef {
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
  price: number; // coins; 0 = free
}

export interface RivalSpec {
  name: string;
  bodyColor: string;
  canopyColor: string;
  skill: number;
  targetOffset: number; // lateral offset on track (-0.6 to 0.6)
}

export interface DifficultyDef {
  id: "easy" | "medium" | "hard";
  label: string;
  tagline: string;
  rivalSpeedMult: number;
  obstacleDensityMult: number;
  coinValue: number;
  scoreMult: number;
}

export interface DistrictDef {
  lap: number;
  name: string;
  band: [number, number]; // u-range of the loop for landmark placement
  tagline: string;
  timeOfDay: "day" | "sunset" | "night";
}

// -------------------------------------------------------------
// THE KARACHI MAP — one complete closed circuit, 3 districts
// -------------------------------------------------------------
export const TRACK = {
  id: "karachi",
  name: "Karachi Rush Circuit",
  city: "KARACHI",
  tagline: "SADAR → II CHUNDRIGAR → CLIFTON",
  roadWidth: 28,
  daySky: 0x7ec8e3,
  sunsetSky: 0xff7043,
  nightSky: 0x0b1026,
  ambientDay: 0xfff3e0,
  groundColor: 0x6f6046,
  points: [
    { x: 0, y: 0, z: 0 }, // start/finish — Sadar gate
    { x: 50, y: 2, z: 350 },
    { x: 200, y: 8, z: 600 }, // curve up past Empress Market block
    { x: 450, y: 12, z: 700 }, // crest — II Chundrigar approach
    { x: 680, y: 6, z: 550 }, // Habib Bank Plaza sweep
    { x: 600, y: 0, z: 300 },
    { x: 400, y: -4, z: 100 }, // dip — Boulton Market cut
    { x: 550, y: 5, z: -150 }, // Clifton climb
    { x: 350, y: 8, z: -350 },
    { x: 100, y: 0, z: -250 }, // Sea View bend back to start
  ] as TrackPoint[],
};

export const DISTRICTS: DistrictDef[] = [
  {
    lap: 1,
    name: "SADAR",
    band: [0.0, 0.34],
    tagline: "EMPRESS MARKET • CHAAR MINAR",
    timeOfDay: "day",
  },
  {
    lap: 2,
    name: "II CHUNDRIGAR",
    band: [0.34, 0.68],
    tagline: "HABIB BANK PLAZA • BOULTON MARKET",
    timeOfDay: "sunset",
  },
  {
    lap: 3,
    name: "CLIFTON",
    band: [0.68, 1.0],
    tagline: "MAZAR-E-QUAID • SEA VIEW",
    timeOfDay: "night",
  },
];

// -------------------------------------------------------------
// RICKSHAW GARAGE (coins economy)
// -------------------------------------------------------------
export const VEHICLES: VehicleDef[] = [
  {
    id: "baba",
    name: "BABA AUTO",
    subtitle: "Classic green & white street legend",
    bodyColor: "#1E7A38",
    canopyColor: "#F7F7F2",
    frameColor: "#0E3B1A",
    topSpeed: 42,
    accel: 11,
    handling: 1.0,
    nitroBonus: 18,
    price: 0,
  },
  {
    id: "queen",
    name: "KARACHI QUEEN",
    subtitle: "Crimson high-speed tuned edition",
    bodyColor: "#B3122E",
    canopyColor: "#FFF3B0",
    frameColor: "#4A0612",
    topSpeed: 46,
    accel: 12.5,
    handling: 1.1,
    nitroBonus: 20,
    price: 2500,
  },
  {
    id: "hassan",
    name: "HASSAN SPECIAL",
    subtitle: "Chaudhry-tuned cyan prototype",
    bodyColor: "#00B8D9",
    canopyColor: "#0E1329",
    frameColor: "#005577",
    topSpeed: 48,
    accel: 13,
    handling: 1.15,
    nitroBonus: 22,
    price: 4500,
  },
  {
    id: "bhatta",
    name: "BHATTA EXPRESS",
    subtitle: "Golden turbo championship king",
    bodyColor: "#E3A008",
    canopyColor: "#17140A",
    frameColor: "#2B2105",
    topSpeed: 50,
    accel: 14,
    handling: 1.2,
    nitroBonus: 24,
    price: 10000,
  },
];

// -------------------------------------------------------------
// 7 AI RIVALS — Pakistani names
// -------------------------------------------------------------
export const RIVALS: RivalSpec[] = [
  { name: "TARIQ", bodyColor: "#003049", canopyColor: "#EAE2B7", skill: 0.96, targetOffset: -0.35 },
  { name: "ZAIN", bodyColor: "#F77F00", canopyColor: "#1D2D44", skill: 0.93, targetOffset: 0.35 },
  { name: "FARHAN", bodyColor: "#D62828", canopyColor: "#FDF0D5", skill: 0.91, targetOffset: -0.15 },
  { name: "BILAL", bodyColor: "#2A9D8F", canopyColor: "#264653", skill: 0.88, targetOffset: 0.2 },
  { name: "USMAN", bodyColor: "#6A0572", canopyColor: "#F5F5F5", skill: 0.85, targetOffset: -0.4 },
  { name: "IMRAN", bodyColor: "#38B000", canopyColor: "#004B23", skill: 0.82, targetOffset: 0.4 },
  { name: "HASSAM", bodyColor: "#E0A96D", canopyColor: "#201E20", skill: 0.79, targetOffset: 0.0 },
];

// -------------------------------------------------------------
// DIFFICULTY MODES
// -------------------------------------------------------------
export const DIFFICULTIES: DifficultyDef[] = [
  {
    id: "easy",
    label: "EASY",
    tagline: "Relaxed traffic, fat coins 2x",
    rivalSpeedMult: 0.86,
    obstacleDensityMult: 0.6,
    coinValue: 2,
    scoreMult: 0.8,
  },
  {
    id: "medium",
    label: "MEDIUM",
    tagline: "The true Karachi experience",
    rivalSpeedMult: 1.0,
    obstacleDensityMult: 1.0,
    coinValue: 1,
    scoreMult: 1.0,
  },
  {
    id: "hard",
    label: "HARD",
    tagline: "Bumper-car chaos, score 1.3x",
    rivalSpeedMult: 1.13,
    obstacleDensityMult: 1.5,
    coinValue: 1,
    scoreMult: 1.3,
  },
];

export function difficultyById(id: string): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[1];
}

export function vehicleById(id: string): VehicleDef {
  return VEHICLES.find((v) => v.id === id) ?? VEHICLES[0];
}

// -------------------------------------------------------------
// TRAP / OBSTACLE TUNING
// -------------------------------------------------------------
export const OBSTACLE_TUNING = {
  countsPerLap: { easy: 16, medium: 26, hard: 40 },
  coinRowsPerLap: 10,
  minGapMeters: 60, // fairness: min spacing between any two obstacles
  staticHalfLen: 3.4, // meters, collision depth for static traps
  zoneHalfLen: 4.2, // meters, collision depth for road zones
  gridHalfWidth: 2.6, // lateral collision tolerance (meters)
  rickshawSpeed: 3.0, // m/s, moving traps crawl forward
  coinPickupRadius: 3.0,
};

export const LAP_PHASES: Array<"day" | "sunset" | "night"> = ["day", "sunset", "night"];

// Deterministic RNG so every run with the same seed looks the same
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shortest signed distance (meters) between two u positions on a loop of `len`
export function uDistanceMeters(a: number, b: number, len: number): number {
  let du = a - b;
  du -= Math.round(du);
  return du * len;
}

export const STORAGE_KEYS = {
  bank: "rush_bank",
  unlocked: "rush_unlocked",
  vehicle: "rush_vehicle",
  bestLap: "rush_bestLap",
  difficulty: "rush_difficulty",
};
