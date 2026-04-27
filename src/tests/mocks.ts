export const mockGeocode = [
  {
    name: "Братск",
    lat: 56.132,
    lon: 101.614,
    country: "RU",
  },
];

export const mockForecast = {
  city: {
    name: "Братск",
    country: "RU",
  },
  list: [
    {
      dt: 1710000000,
      main: {
        temp: 10,
        feels_like: 8,
        pressure: 1012,
        humidity: 70,
      },
      weather: [
        {
          id: 800,
          main: "Clear",
          description: "ясно",
          icon: "01d",
        },
      ],
      wind: { speed: 3 },
      dt_txt: "2024-03-09 12:00:00",
    },
  ],
};

export const mockPollution = {
  list: [
    {
      main: { aqi: 2 },
      components: {
        co: 200,
        no: 0,
        no2: 0,
        o3: 0,
        so2: 0,
        pm2_5: 5,
        pm10: 10,
        nh3: 0,
      },
    },
  ],
};