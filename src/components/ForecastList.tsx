import { getIconUrl } from "../api/openweather";
import type { DailyForecast } from "../types/weather";

type Props = {
  items: DailyForecast[];
};

export function ForecastList({ items }: Props) {
  return (
    <section className="glass-card panel-card">
      <div className="panel-card__header">
        <h3>Прогноз на 5 дней</h3>
        <span>5 дней</span>
      </div>

      <div className="daily-list">
        {items.map((item) => (
          <article className="daily-item" key={`${item.dateLabel}-${item.weatherId}`}>
            <div className="daily-item__date">{item.dateLabel}</div>

            <div className="daily-item__middle">
              <img
                className="daily-item__icon"
                alt={item.description}
                src={getIconUrl(item.icon)}
              />
              <div>
                <div className="daily-item__temp">{item.temp}°</div>
                <div className="daily-item__desc">{item.description}</div>
              </div>
            </div>

            <div className="daily-item__range">
              <span>мин {item.minTemp}°</span>
              <span>макс {item.maxTemp}°</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}