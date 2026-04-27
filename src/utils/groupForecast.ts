import type { DailyForecast, ForecastItem } from "../types/weather";

function formatDateLabel(dateString: string) {
  const date = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "short",
  }).format(date);
}

function getDateKey(item: ForecastItem) {
  return item.dt_txt.slice(0, 10);
}

export function buildHourlyForecast(list: ForecastItem[], count = 8) {
  return list.slice(0, count);
}

export function buildDailyForecast(list: ForecastItem[]): DailyForecast[] {
  const grouped = new Map<string, ForecastItem[]>();

  for (const item of list) {
    const key = getDateKey(item);
    const existing = grouped.get(key) ?? [];
    grouped.set(key, [...existing, item]);
  }

  return Array.from(grouped.entries())
    .slice(0, 5)
    .map(([dateKey, items]) => {
      const midday = items.reduce((best, item) => {
        const bestHour = Number(best.dt_txt.slice(11, 13));
        const itemHour = Number(item.dt_txt.slice(11, 13));
        return Math.abs(itemHour - 12) < Math.abs(bestHour - 12) ? item : best;
      }, items[0]);

      const temps = items.map((item) => item.main.temp);
      const minTemp = Math.round(Math.min(...temps));
      const maxTemp = Math.round(Math.max(...temps));

      return {
        dateLabel: formatDateLabel(dateKey),
        temp: Math.round(midday.main.temp),
        minTemp,
        maxTemp,
        icon: midday.weather[0]?.icon ?? "01d",
        weatherId: midday.weather[0]?.id ?? 800,
        description: midday.weather[0]?.description ?? "",
      };
    });
}