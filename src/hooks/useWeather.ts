import { useCallback, useEffect, useRef, useState } from "react";
import { geocodeCity, getAirPollution, getForecast } from "../api/openweather";
import { buildDailyForecast, buildHourlyForecast } from "../utils/groupForecast";
import type {
  AirPollutionResponse,
  CurrentWeatherView,
  DailyForecast,
  ForecastItem,
} from "../types/weather";

type WeatherState = {
  loading: boolean;
  error: string | null;
  cityQuery: string;
  current: CurrentWeatherView | null;
  daily: DailyForecast[];
  hourly: ForecastItem[];
  pollution: AirPollutionResponse["list"][number] | null;
};

const DEFAULT_CITY = "Братск";

export function useWeather() {
  const [state, setState] = useState<WeatherState>({
    loading: true,
    error: null,
    cityQuery: DEFAULT_CITY,
    current: null,
    daily: [],
    hourly: [],
    pollution: null,
  });

  const cityRef = useRef(DEFAULT_CITY);

  const loadWeather = useCallback(async (city: string) => {
    setState((prev) => ({
      ...prev,
      loading: true,
      error: null,
      cityQuery: city,
    }));
    cityRef.current = city;

    try {
      const geo = await geocodeCity(city);
      const [forecast, pollution] = await Promise.all([
        getForecast(geo.lat, geo.lon),
        getAirPollution(geo.lat, geo.lon),
      ]);

      const first = forecast.list[0];
      if (!first) {
        throw new Error("Нет данных прогноза");
      }

      const current: CurrentWeatherView = {
        city: forecast.city.name ?? geo.name,
        country: forecast.city.country ?? geo.country,
        temp: Math.round(first.main.temp),
        feelsLike: Math.round(first.main.feels_like),
        humidity: first.main.humidity,
        pressure: first.main.pressure,
        windSpeed: first.wind.speed,
        icon: first.weather[0]?.icon ?? "01d",
        weatherId: first.weather[0]?.id ?? 800,
        description: first.weather[0]?.description ?? "",
      };

      setState({
        loading: false,
        error: null,
        cityQuery: city,
        current,
        daily: buildDailyForecast(forecast.list),
        hourly: buildHourlyForecast(forecast.list),
        pollution: pollution.list[0] ?? null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Неизвестная ошибка",
      }));
    }
  }, []);

  useEffect(() => {
    void loadWeather(DEFAULT_CITY);

    const id = window.setInterval(() => {
      void loadWeather(cityRef.current);
    }, 1000 * 60 * 60 * 3);

    return () => window.clearInterval(id);
  }, [loadWeather]);

  return {
    ...state,
    loadWeather,
  };
}