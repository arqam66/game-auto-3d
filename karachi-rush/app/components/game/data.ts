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
// THE KARACHI MAP — one complete closed circuit, 6 tracks in 2 districts
// -------------------------------------------------------------
export const TRACK = {
  id: "karachi",
  name: "Karachi Rickshaw Rush Circuit",
  city: "KARACHI",
  tagline: "OLD KARACHI → CLIFTON AND SEA VIEW",
  roadWidth: 28,
  daySky: 0x7ec8e3,
  sunsetSky: 0xff7043,
  nightSky: 0x0b1026,
  ambientDay: 0xfff3e0,
  groundColor: 0x6f6046,
  points: [
    { x: 0, y: 0, z: 0 }, // start/finish — Saddar gate
    { x: 50, y: 2, z: 350 },
    { x: 200, y: 8, z: 600 }, // curve up past Empress Market block
    { x: 450, y: 12, z: 700 }, // crest — Burns Road approach
    { x: 680, y: 6, z: 550 }, // Native Jetty sweep
    { x: 600, y: 0, z: 300 },
    { x: 400, y: -4, z: 100 }, // dip — M.A. Jinnah Road cut
    { x: 550, y: 5, z: -150 }, // Clifton climb
    { x: 350, y: 8, z: -350 },
    { x: 100, y: 0, z: -250 }, // Sea View bend back to start
  ] as TrackPoint[],
};

export const DISTRICTS: DistrictDef[] = [
  {
    lap: 1,
    name: "OLD KARACHI",
    band: [0.0, 0.34],
    tagline: "EMPRESS MARKET • FRERE HALL • BURNS ROAD",
    timeOfDay: "day",
  },
  {
    lap: 2,
    name: "OLD KARACHI",
    band: [0.34, 0.68],
    tagline: "NATIVE JETTY • M.A. JINNAH ROAD • MAZAR-E-QUAID",
    timeOfDay: "sunset",
  },
  {
    lap: 3,
    name: "CLIFTON AND SEA VIEW",
    band: [0.68, 1.0],
    tagline: "TEEN TALWAR • BOAT BASIN • SEA VIEW PROMENADE",
    timeOfDay: "night",
  },
];

// -------------------------------------------------------------
// RICKSHAW GARAGE (coins economy)
// -------------------------------------------------------------
export const VEHICLES: VehicleDef[] = [
  {
    id: "baba",
    name: "CHINGCHI CLASSIC",
    subtitle: "Qingqi motor rickshaw, light quick turns",
    bodyColor: "#1B7339",
    canopyColor: "#F5C518",
    frameColor: "#111827",
    topSpeed: 42,
    accel: 12,
    handling: 1.15,
    nitroBonus: 18,
    price: 0,
  },
  {
    id: "queen",
    name: "CNG AUTO",
    subtitle: "Green 3-wheel CNG rickshaw, balanced starter",
    bodyColor: "#0D6E38",
    canopyColor: "#FFF3B0",
    frameColor: "#1A2E1C",
    topSpeed: 45,
    accel: 11.5,
    handling: 1.05,
    nitroBonus: 20,
    price: 0,
  },
  {
    id: "hassan",
    name: "TRUCK ART AUTO",
    subtitle: "Hand-painted decorated rickshaw, great boost",
    bodyColor: "#0099B8",
    canopyColor: "#E63946",
    frameColor: "#053B48",
    topSpeed: 48,
    accel: 13,
    handling: 1.12,
    nitroBonus: 25,
    price: 1500,
  },
  {
    id: "mehran",
    name: "MEHRAN MAST",
    subtitle: "Mehran-style hatchback, high top speed",
    bodyColor: "#E2E8F0",
    canopyColor: "#1E293B",
    frameColor: "#334155",
    topSpeed: 52,
    accel: 14.5,
    handling: 1.1,
    nitroBonus: 22,
    price: 2500,
  },
  {
    id: "bolan",
    name: "BOLAN BHAI",
    subtitle: "Bolan-style van, heavy stable drifts",
    bodyColor: "#166534",
    canopyColor: "#FACC15",
    frameColor: "#0F172A",
    topSpeed: 47,
    accel: 12,
    handling: 1.25,
    nitroBonus: 22,
    price: 3500,
  },
  {
    id: "ravi",
    name: "RAVI RAJA",
    subtitle: "Ravi-style pickup, tough hard to push",
    bodyColor: "#2563EB",
    canopyColor: "#F8FAFC",
    frameColor: "#1E3A8A",
    topSpeed: 46,
    accel: 13.5,
    handling: 1.2,
    nitroBonus: 20,
    price: 4500,
  },
  {
    id: "seaview",
    name: "SEA VIEW CRUISER",
    subtitle: "Cultus-style hatchback, fast and smooth",
    bodyColor: "#0284C7",
    canopyColor: "#E0F2FE",
    frameColor: "#0369A1",
    topSpeed: 50,
    accel: 14,
    handling: 1.18,
    nitroBonus: 24,
    price: 6000,
  },
  {
    id: "bhatta",
    name: "GOLDEN CHINGCHI",
    subtitle: "Gold-plated chingchi, best all round",
    bodyColor: "#EAB308",
    canopyColor: "#713F12",
    frameColor: "#422006",
    topSpeed: 54,
    accel: 15,
    handling: 1.22,
    nitroBonus: 26,
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
  dailyLastRace: "rush_dailyLastRace",
  dailyStreak: "rush_dailyStreak",
  dailyChallengeDate: "rush_dailyChallengeDate",
  dailyChallenges: "rush_dailyChallenges",
  upgradeLevels: "rush_upgradeLevels",
};

// -------------------------------------------------------------
// DAILY CHALLENGES (autorush style)
// -------------------------------------------------------------

export interface ChallengeDef {
  id: string;
  title: string;
  desc: string;
  target: number; // target value to reach
  reward: number; // coin reward on completion
  // kind determines how progress is tracked
  kind: "traps" | "drift" | "coins" | "laps" | "distance";
}

export const CHALLENGE_POOL: ChallengeDef[] = [
  { id: "trap-dodger", title: "Trap Dodger", desc: "Dodge {target} hazards in a single race", target: 5, reward: 300, kind: "traps" },
  { id: "drift-king", title: "Drift King", desc: "Drift for {target} meters in a single race", target: 150, reward: 350, kind: "drift" },
  { id: "coin-collector", title: "Coin Collector", desc: "Collect {target} coins in a single race", target: 15, reward: 400, kind: "coins" },
  { id: "lap-master", title: "Lap Master", desc: "Complete {target} laps without crashing", target: 3, reward: 500, kind: "laps" },
  { id: "long-haul", title: "Long Haul", desc: "Travel {target} km in a single race", target: 8, reward: 450, kind: "distance" },
  { id: "clean-run", title: "Clean Run", desc: "Finish a race with zero crashes", target: 1, reward: 600, kind: "laps" },
];

// Deterministic daily challenge selection seeded by date
export function getDailyChallengeSeed(): number {
  const now = new Date();
  // Seed resets at midnight local time
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
}

// -------------------------------------------------------------
// VEHICLE UPGRADES (autorush style)
// Each owned vehicle can be upgraded 3 times per stat.
// -------------------------------------------------------------

export interface UpgradeStat {
  id: "topSpeed" | "accel" | "handling" | "nitroBonus";
  label: string;
  baseCost: number; // coins for level 1
  costMult: number; // multiplier per level
  boostPerLevel: number; // stat boost per level
}

export const UPGRADE_STATS: UpgradeStat[] = [
  { id: "topSpeed", label: "Top Speed", baseCost: 800, costMult: 1.6, boostPerLevel: 2 },
  { id: "accel", label: "Acceleration", baseCost: 700, costMult: 1.5, boostPerLevel: 0.5 },
  { id: "handling", label: "Handling", baseCost: 900, costMult: 1.7, boostPerLevel: 0.05 },
  { id: "nitroBonus", label: "Nitro", baseCost: 1000, costMult: 1.8, boostPerLevel: 2 },
];

export const MAX_UPGRADE_LEVEL = 3;

export function upgradeCost(statId: string, currentLevel: number): number {
  const stat = UPGRADE_STATS.find((s) => s.id === statId);
  if (!stat || currentLevel >= MAX_UPGRADE_LEVEL) return -1;
  return Math.round(stat.baseCost * Math.pow(stat.costMult, currentLevel));
}

export function getUpgradedStat(
  vehicle: VehicleDef,
  statId: string,
  level: number
): number {
  const stat = UPGRADE_STATS.find((s) => s.id === statId);
  if (!stat || level <= 0) return vehicle[statId as keyof VehicleDef] as number;
  return (vehicle[statId as keyof VehicleDef] as number) + stat.boostPerLevel * level;
}

export function generateDailyChallenges(): ChallengeDef[] {
  const seed = getDailyChallengeSeed();
  let a = seed >>> 0;
  const rng = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Fisher-Yates shuffle, pick 3
  const pool = [...CHALLENGE_POOL];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 3);
}
