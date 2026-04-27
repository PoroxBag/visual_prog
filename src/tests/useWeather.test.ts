import { renderHook, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useWeather } from "../hooks/useWeather";
import { mockGeocode, mockForecast, mockPollution } from "./mocks";

describe("useWeather", () => {
  it("загружает данные", async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeocode,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockForecast,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockPollution,
      });

    const { result } = renderHook(() => useWeather());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.current?.city).toBe("Братск");
    });

    expect(result.current.daily.length).toBeGreaterThan(0);
  });
});