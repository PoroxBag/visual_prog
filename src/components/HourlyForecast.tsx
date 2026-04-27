import { getIconUrl } from "../api/openweather";
import type { ForecastItem } from "../types/weather";

type Props = {
  items: ForecastItem[];
};

function formatTime(dtTxt: string) {
  return dtTxt.slice(11, 16);
}

export function HourlyForecast({ items }: Props) {
  return (
    <section className="glass-card panel-card">
      <div className="panel-card__header">
        <h3>Прогноз по часам</h3>
        <span>{items.length} точек</span>
      </div>

      <div className="hourly-list">
        {items.map((item) => (
          <article className="hourly-item" key={item.dt}>
            <div className="hourly-item__time">{formatTime(item.dt_txt)}</div>
            <img
              className="hourly-item__icon"
              alt={item.weather[0]?.description ?? "weather"}
              src={getIconUrl(item.weather[0]?.icon ?? "01d")}
            />
            <div className="hourly-item__temp">{Math.round(item.main.temp)}°</div>
            <div className="hourly-item__desc">
              {item.weather[0]?.description ?? ""}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}