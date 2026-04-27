// npm run dev
// npm run test:run
// npm run build

import { CitySearch } from "./components/CitySearch";
import { CurrentCard } from "./components/CurrentCard";
import { ForecastList } from "./components/ForecastList";
import { HourlyForecast } from "./components/HourlyForecast";
import { PollutionCard } from "./components/PollutionCard";
import { WeatherShell } from "./components/WeatherShell";
import { useWeather } from "./hooks/useWeather";
import { getWeatherTheme } from "./utils/weatherTheme";

export default function App() {
  const { loading, error, cityQuery, current, daily, hourly, pollution, loadWeather } =
    useWeather();

  const theme = current
    ? getWeatherTheme(current.weatherId, current.icon)
    : getWeatherTheme(800, "01d");

  return (
    <WeatherShell
      title="Погода"
      subtitle="Братск по умолчанию, прогноз, почасовая погода и качество воздуха"
      theme={theme}
    >
      <div className="page-stack">
        <CitySearch defaultValue={cityQuery} onSearch={loadWeather} loading={loading} />

        {error ? <div className="error-box">{error}</div> : null}

        {loading && !current ? <div className="status-box">Загрузка погоды...</div> : null}

        {current ? <CurrentCard current={current} /> : null}

        <div className="cards-grid">
          <HourlyForecast items={hourly} />
          <ForecastList items={daily} />
        </div>

        <PollutionCard pollution={pollution} />
      </div>
    </WeatherShell>
  );
}