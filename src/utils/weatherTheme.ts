export type WeatherTheme = {
  name: string;
  gradient: string;
  overlay: string;
  accent: string;
  softGlow: string;
};

export function getWeatherTheme(weatherId: number, icon: string): WeatherTheme {
  const isNight = icon.endsWith("n");

  if (weatherId >= 200 && weatherId < 300) {
    return {
      name: "storm",
      gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 45%, #111827 100%)",
      overlay: "radial-gradient(circle at top, rgba(148,163,184,0.18), transparent 55%)",
      accent: "#cbd5e1",
      softGlow: "rgba(148,163,184,0.18)",
    };
  }

  if (weatherId >= 300 && weatherId < 600) {
    return {
      name: "rain",
      gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 45%, #1e3a8a 100%)",
      overlay: "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 55%)",
      accent: "#e0f2fe",
      softGlow: "rgba(14,165,233,0.22)",
    };
  }

  if (weatherId >= 600 && weatherId < 700) {
    return {
      name: "snow",
      gradient: "linear-gradient(135deg, #dbeafe 0%, #93c5fd 45%, #64748b 100%)",
      overlay: "radial-gradient(circle at top, rgba(255,255,255,0.35), transparent 55%)",
      accent: "#f8fafc",
      softGlow: "rgba(255,255,255,0.35)",
    };
  }

  if (weatherId >= 700 && weatherId < 800) {
    return {
      name: "fog",
      gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 45%, #334155 100%)",
      overlay: "radial-gradient(circle at top, rgba(255,255,255,0.14), transparent 55%)",
      accent: "#f8fafc",
      softGlow: "rgba(148,163,184,0.22)",
    };
  }

  if (weatherId === 800) {
    return isNight
      ? {
          name: "clear-night",
          gradient: "linear-gradient(135deg, #020617 0%, #1e1b4b 45%, #312e81 100%)",
          overlay: "radial-gradient(circle at top, rgba(129,140,248,0.24), transparent 55%)",
          accent: "#e0e7ff",
          softGlow: "rgba(99,102,241,0.25)",
        }
      : {
          name: "clear-day",
          gradient: "linear-gradient(135deg, #fde68a 0%, #f59e0b 40%, #38bdf8 100%)",
          overlay: "radial-gradient(circle at top, rgba(255,255,255,0.22), transparent 55%)",
          accent: "#fff7ed",
          softGlow: "rgba(251,191,36,0.22)",
        };
  }

  return isNight
    ? {
        name: "cloudy-night",
        gradient: "linear-gradient(135deg, #0f172a 0%, #334155 45%, #111827 100%)",
        overlay: "radial-gradient(circle at top, rgba(226,232,240,0.16), transparent 55%)",
        accent: "#f8fafc",
        softGlow: "rgba(148,163,184,0.2)",
      }
    : {
        name: "cloudy-day",
        gradient: "linear-gradient(135deg, #94a3b8 0%, #64748b 40%, #1e3a8a 100%)",
        overlay: "radial-gradient(circle at top, rgba(255,255,255,0.18), transparent 55%)",
        accent: "#f8fafc",
        softGlow: "rgba(148,163,184,0.18)",
      };
}