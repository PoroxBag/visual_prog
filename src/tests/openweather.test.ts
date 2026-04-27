import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  geocodeCity,
  getForecast,
  getAirPollution,
} from "../api/openweather";

import {
  mockGeocode,
  mockForecast,
  mockPollution,
} from "./mocks";

describe("OpenWeather API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("geocodeCity возвращает координаты", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockGeocode,
    });

    const result = await geocodeCity("Братск");

    expect(result.lat).toBe(56.132);
    expect(fetch).toHaveBeenCalled();
  });

  it("getForecast возвращает прогноз", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockForecast,
    });

    const result = await getForecast(1, 2);

    expect(result.list.length).toBeGreaterThan(0);
  });

  it("getAirPollution возвращает данные загрязнения", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPollution,
    });

    const result = await getAirPollution(1, 2);

    expect(result.list[0].main.aqi).toBe(2);
  });

  it("обрабатывает HTTP ошибку", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(getForecast(1, 2)).rejects.toThrow();
  });
});