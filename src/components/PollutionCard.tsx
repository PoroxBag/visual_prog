import type { AirPollutionResponse } from "../types/weather";

type Props = {
  pollution: AirPollutionResponse["list"][number] | null;
};

function qualityLabel(aqi: number) {
  switch (aqi) {
    case 1:
      return "Хорошо";
    case 2:
      return "Удовлетворительно";
    case 3:
      return "Средне";
    case 4:
      return "Плохо";
    case 5:
      return "Очень плохо";
    default:
      return "Нет данных";
  }
}

function qualityClass(aqi: number) {
  if (aqi <= 1) return "aqi-good";
  if (aqi === 2) return "aqi-ok";
  if (aqi === 3) return "aqi-mid";
  if (aqi === 4) return "aqi-bad";
  return "aqi-worst";
}

export function PollutionCard({ pollution }: Props) {
  const aqi = pollution?.main.aqi ?? 0;

  return (
    <section className={`glass-card pollution-card ${qualityClass(aqi)}`}>
      <div className="panel-card__header">
        <h3>Загрязнение воздуха</h3>
        <span>AQI</span>
      </div>

      <div className="pollution-card__body">
        <div className="pollution-card__aqi">{aqi || "—"}</div>
        <div>
          <p className="pollution-card__label">{qualityLabel(aqi)}</p>
          <p className="pollution-card__hint">
            Показатель качества воздуха по данным OpenWeather
          </p>
        </div>
      </div>
    </section>
  );
}