export function getWeather(city: string) {
  console.log(`Getting weather for ${city}...`);

  const weatherData = {
    Mumbai: {
      temperature: 29,
      condition: 'Rainy',
      humidity: 85,
    },
    Pune: {
      temperature: 27,
      condition: 'Cloudy',
      humidity: 70,
    },
    Delhi: {
      temperature: 35,
      condition: 'Sunny',
      humidity: 40,
    },
  };

  return (
    weatherData[city as keyof typeof weatherData] ?? {
      temperature: 25,
      condition: 'Unknown',
      humidity: 50,
    }
  );
}
