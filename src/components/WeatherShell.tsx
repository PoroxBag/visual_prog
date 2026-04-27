import type { ReactNode } from "react";
import type { WeatherTheme } from "../utils/weatherTheme";

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  theme: WeatherTheme;
};

export function WeatherShell({ title, subtitle, children, theme }: Props) {
  return (
    <main className="weather-shell" style={{ background: theme.gradient }}>
      <div className="weather-shell__overlay" style={{ background: theme.overlay }} />
      <div className="weather-shell__glow weather-shell__glow--one" style={{ boxShadow: `0 0 140px 80px ${theme.softGlow}` }} />
      <div className="weather-shell__glow weather-shell__glow--two" style={{ boxShadow: `0 0 160px 90px ${theme.softGlow}` }} />

      <div className="weather-shell__inner">
        <header className="hero">
          <div>
            <p className="hero__eyebrow">OpenWeather • Братск • русский интерфейс</p>
            <h1 className="hero__title">{title}</h1>
            {subtitle ? <p className="hero__subtitle">{subtitle}</p> : null}
          </div>
        </header>

        {children}
      </div>
    </main>
  );
}