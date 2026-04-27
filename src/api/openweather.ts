import type {
  AirPollutionResponse,
  ForecastResponse,
  GeocodingItem,
} from "../types/weather";

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;
const BASE = "https://api.openweathermap.org";

function assertApiKey() {
  if (!API_KEY) {
    throw new Error("Нет VITE_OPENWEATHER_API_KEY в .env");
  }
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function geocodeCity(city: string): Promise<GeocodingItem> {
  assertApiKey();

  const url = `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`;
  const data = await requestJson<GeocodingItem[]>(url);

  if (!data.length) {
    throw new Error("Город не найден");
  }

  return data[0];
}

export async function getForecast(lat: number, lon: number): Promise<ForecastResponse> {
  assertApiKey();

  const url = `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=ru`;
  return requestJson<ForecastResponse>(url);
}

export async function getAirPollution(lat: number, lon: number): Promise<AirPollutionResponse> {
  assertApiKey();

  const url = `${BASE}/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
  return requestJson<AirPollutionResponse>(url);
}

export function getIconUrl(icon: string) {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}