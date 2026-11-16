// -------------------------------------------------------------
// i18n — English + Urdu (Karachi Rickshaw Rush)
// Full RTL UI: set `dir="rtl"` on <html> when `ur` is active.
// Preference persisted in localStorage (rush_lang).
// Keys missing from the Urdu dictionary fall back to English.
// -------------------------------------------------------------

export type Lang = "en" | "ur";

export const LANGUAGES: { id: Lang; name: string; dir: "ltr" | "rtl"; label: string }[] = [
  { id: "en", name: "English", dir: "ltr", label: "EN" },
  { id: "ur", name: "Urdu", dir: "rtl", label: "اردو" },
];

export const DEFAULT_LANG: Lang = "en";

export const STORAGE_KEY_LANG = "rush_lang";

const DICTIONARIES: Record<Lang, Record<string, string>> = {
  en: {
    // --- shell / branding ---
    "game.title": "KARACHI RICKSHAW RUSH",
    "game.subtitle": "Karachi ki sadkon par race · SADDAR · BURNS ROAD · SEA VIEW",
    "bank": "BANK",
    "start.rush": "START RUSH",
    "settings": "Settings",
    "mute": "Mute sound",
    "unmute": "Unmute sound",

    // --- HUD ---
    "hud.position": "POS",
    "hud.lap": "LAP",
    "hud.lapTime": "LAP TIME",
    "hud.bestLap": "BEST LAP",
    "hud.score": "SCORE",
    "hud.speed": "SPD",
    "hud.nitro": "NITRO",
    "hud.coins": "COINS",
    "hud.bank": "BANK",
    "hud.steps": "STEPS",
    "hud.distance": "DIST",
    "hud.traps": "DODGED",
    "hud.crashes": "CRASHES",
    "hud.difficulty": "DIFFICULTY",
    "hud.timeMode": "TIME",
    "hud.day": "DAY",
    "hud.sunset": "DUSK",
    "hud.night": "NIGHT",

    // --- alerts / banners ---
    "alert.wrongWay": "WRONG WAY",
    "alert.wardenChase": "WARDEN CHASE",
    "alert.busted": "BUSTED!",
    "alert.crash": "CRASH!",
    "alert.takedown": "TAKEDOWN!",
    "banner.lap": "LAP {{lap}}",
    "countdown.go": "GO!",

    // --- garage ---
    "garage.selected": "Selected Rickshaw",
    "garage.equipped": "EQUIPPED ✓",
    "garage.unlocked": "UNLOCKED ✓",
    "garage.unlockFor": "UNLOCK FOR {{price}}",
    "garage.need": "🔒 NEED {{price}}",
    "garage.buy": "BUY {{price}}",
    "garage.owned": "OWNED",
    "garage.city": "City Circuit",
    "garage.lockedCity": "LOCKED CITY",
    "garage.default": "DEFAULT",
    "garage.sp": "SPD",
    "garage.acc": "ACC",
    "garage.hnd": "HND",
    "garage.kmh": "km/h",

    // --- settings / menu sections ---
    "menu.dailyChallenges": "Daily Challenges",
    "menu.difficulty": "Difficulty",
    "menu.laps": "Laps",
    "menu.time": "Time",
    "menu.weather": "Weather",
    "menu.controls": "Controls",
    "menu.cameraView": "Camera View",
    "menu.vibration": "Vibration",
    "menu.language": "Language",
    "menu.host": "Host a Game",
    "menu.join": "Join with PIN",
    "menu.done": "DONE",

    // --- multiplayer ---
    "mp.hostRoom": "Host Room",
    "mp.joinRoom": "Join Room",
    "mp.pin": "PIN",
    "mp.isHost": "You are the host",

    // --- difficulty ---
    "diff.easy": "EASY",
    "diff.medium": "MEDIUM",
    "diff.hard": "HARD",

    // --- camera / vibration ---
    "cam.chase": "CHASE",
    "cam.hood": "HOOD",
    "cam.cinematic": "CINE",
    "cam.low": "Low",
    "cam.normal": "Normal",
    "cam.high": "High",
    "cam.roof": "Roof",
    "vib.off": "Off",
    "vib.light": "Light",
    "vib.full": "Full",

    // --- weather / time ---
    "weather.clear": "CLEAR",
    "weather.rain": "RAIN",

    // --- footer / misc ---
    "misc.back": "← Back to Play",

    // --- results screen ---
    "result.raceTime": "Race time",
    "result.bestLap": "Best lap",
    "result.distance": "Distance",
    "result.steps": "Steps",
    "result.traps": "Traps",
    "result.crashes": "Crashes",
    "result.drift": "Drift",
    "result.lapsDone": "Laps done",
  },
  ur: {
    // --- shell / branding ---
    "game.title": "کراچی Rickshaw RUSH",
    "game.subtitle": "کراچی کی سڑکوں پر ریس · سدر، برن روڈ، سی ویو",
    "bank": "بینک",
    "start.rush": "ریس شروع کریں",
    "mute": "آواز بند کریں",
    "unmute": "آواز چالو کریں",

    // --- HUD ---
    "hud.position": "مقام",
    "hud.lap": "لاپ",
    "hud.lapTime": "لاپ وقت",
    "hud.bestLap": "بہترین لاپ",
    "hud.score": "اسکور",
    "hud.speed": "رفتار",
    "hud.nitro": "نائٹرو",
    "hud.coins": "سکے",
    "hud.bank": "بینک",
    "hud.distance": "فاصلہ",
    "hud.traps": "بچائے",
    "hud.crashes": "مصیبت",
    "hud.difficulty": "سطح",
    "hud.timeMode": "وقت",
    "hud.day": "دن",
    "hud.sunset": "غروبِ آفتاب",
    "hud.night": "رات",

    // --- alerts / banners ---
    "alert.wrongWay": "غلط سمت",
    "alert.busted": "پکڑا گیا!",
    "alert.crash": "ڈھیر!",
    "banner.lap": "لاپ {{lap}}",
    "countdown.go": "جا!",

    // --- garage ---
    "garage.selected": "منتخب Rickshaw",
    "garage.equipped": "لگایا گیا ✓",
    "garage.unlocked": "کھولا گیا ✓",
    "garage.unlockFor": "کھولنے کے لیے {{price}}",
    "garage.need": "🔒 درکار {{price}}",
    "garage.buy": "خریدیں {{price}}",
    "garage.owned": "موجود",
    "garage.city": "شہری سرکٹ",
    "garage.lockedCity": "بند شہر",
    "garage.default": "ڈیفالٹ",
    "garage.sp": "رفتار",
    "garage.acc": "تیز رفتاری",
    "garage.hnd": "کنٹرول",
    "garage.kmh": "کلومیٹر فی گھنٹہ",

    // --- settings / menu sections ---
    "menu.dailyChallenges": "روزانہ چیلنج",
    "menu.laps": "لاپ",
    "menu.time": "وقت",
    "menu.weather": "موسم",
    "menu.controls": "کنٹرولز",
    "menu.cameraView": "کیمرہ منظر",
    "menu.vibration": "کمپن",
    "menu.language": "زبان",
    "menu.host": "گیم میزبان بنائیں",
    "menu.join": "پن کے ساتھ شامل ہوں",
    "menu.done": "ہو گیا",

    // --- multiplayer ---
    "mp.hostRoom": "کمرہ میزبان",
    "mp.joinRoom": "کمرہ میں شامل",
    "mp.pin": "پن",
    "mp.isHost": "آپ میزبان ہیں",

    // --- difficulty ---
    "diff.easy": "آسان",
    "diff.medium": "درمیانہ",
    "diff.hard": "سخت",

    // --- camera / vibration ---
    "cam.chase": "پیچھا",
    "cam.hood": "ہوڈ",
    "cam.cinematic": "سینیمیٹک",
    "cam.low": "نیچا",
    "cam.normal": "عادی",
    "cam.roof": "چھت",
    "vib.off": "بند",
    "vib.light": "ہلکا",
    "vib.full": "مکمل",

    // --- weather / time ---
    "weather.clear": "صاف",
    "weather.rain": "بارش",

    // --- footer / misc ---
    "misc.back": "← واپس کھیلنے کے لیے",

    // --- results screen ---
    "result.raceTime": "ریس کا وقت",
    "result.bestLap": "بہترین لاپ",
    "result.distance": "فاصلہ",
    "result.steps": "قدم",
    "result.traps": "بچائے",
    "result.crashes": "مصیبت",
    "result.drift": "ڈرافٹ",
    "result.lapsDone": "مکمل لاپ",
  },
};

export function t(key: string, lang: Lang = DEFAULT_LANG): string {
  // Fall back to English, then the raw key, when a translation is missing.
  return DICTIONARIES[lang]?.[key] ?? DICTIONARIES.en[key] ?? key;
}

export function isRTL(lang: Lang): boolean {
  return lang === "ur";
}

// Read persisted language, with SSR-safe fallback.
export function readPersistedLang(): Lang {
  if (typeof window === "undefined") return DEFAULT_LANG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LANG);
    if (raw === "en" || raw === "ur") return raw;
  } catch { /* ignore */ }
  return DEFAULT_LANG;
}

export function writePersistedLang(lang: Lang): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY_LANG, lang);
  } catch { /* ignore */ }
}
