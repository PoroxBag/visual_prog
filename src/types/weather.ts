export interface GeocodingItem {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
  };
  dt_txt: string;
}

export interface ForecastResponse {
  city: {
    name: string;
    country: string;
  };
  list: ForecastItem[];
}

export interface AirPollutionResponse {
  list: Array<{
    main: {
      aqi: number;
    };
    components: {
      co: number;
      no: number;
      no2: number;
      o3: number;
      so2: number;
      pm2_5: number;
      pm10: number;
      nh3: number;
    };
  }>;
}

export interface DailyForecast {
  dateLabel: string;
  temp: number;
  minTemp: number;
  maxTemp: number;
  icon: string;
  weatherId: number;
  description: string;
}

export interface CurrentWeatherView {
  city: string;
  country: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  icon: string;
  weatherId: number;
  description: string;
}