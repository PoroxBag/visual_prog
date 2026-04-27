import { getIconUrl } from "../api/openweather";
import type { CurrentWeatherView } from "../types/weather";

type Props = {
  current: CurrentWeatherView;
};

export function CurrentCard({ current }: Props) {
  return (
    <section className="glass-card current-card">
      <div className="current-card__top">
        <div>
          <p className="card-label">Сейчас</p>
          <h2 className="current-card__city">
            {current.city}, {current.country}
          </h2>
          <p className="current-card__description">{current.description}</p>
        </div>

        <div className="current-card__temperature">
          <img alt={current.description} src={getIconUrl(current.icon)} />
          <span>{current.temp}°</span>
        </div>
      </div>

      <div className="current-card__meta">
        <div className="meta-pill">Ощущается: {current.feelsLike}°</div>
        <div className="meta-pill">Влажность: {current.humidity}%</div>
        <div className="meta-pill">Давление: {current.pressure} hPa</div>
        <div className="meta-pill">Ветер: {current.windSpeed} м/с</div>
      </div>
    </section>
  );
}