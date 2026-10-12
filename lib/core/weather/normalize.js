import { WEATHER_CODES } from "./weatherCodes";

export function getWeatherCondition(weatherCode) {
  return WEATHER_CODES[weatherCode] ?? {
    label: "Unknown",
    icon: "unknown",
  };
}

export function normalizeLocation(location) {
    return {
        id: location.id,
        name: location.name,
        region: location.admin1 ?? null,
        country: location.country ?? null,
        countryCode: location.country_code,
        latitude: location.latitude,
        longitude: location.longitude,
        timezone: location.timezone,
        population: location.population ?? 0,
    };
};

export function normalizeCurrentWeather(current) {
    return {
        time: current.time ?? null,
        temperature: current.temperature_2m,
        feelsLike: current.apparent_temperature,
        humidity: current.relative_humidity_2m,
        windSpeed: current.wind_speed_10m,
        condition: getWeatherCondition(current.weather_code),
        weatherCode: current.weather_code,
        isDay: current.is_day === 1,
    };
};

export function normalizeHourlyWeather(hourly) {
    return hourly.time.map((time, index) => ({
        time,
        temperature: hourly.temperature_2m[index],
        feelsLike: hourly.apparent_temperature[index],
        rainProbability: hourly.precipitation_probability[index],
        precipitation: hourly.precipitation[index],
        weatherCode: hourly.weather_code[index],
        condition: getWeatherCondition(hourly.weather_code[index]),
        windSpeed: hourly.wind_speed_10m[index],
        visibility: hourly.visibility[index],
        uvIndex: hourly.uv_index[index],
        isDay: hourly.is_day[index] === 1,
    }));
};

export function normalizeDailyWeather(daily) {
    return daily.time.map((date, index) => ({
        date,
        highTemperature: daily.temperature_2m_max[index],
        lowTemperature: daily.temperature_2m_min[index],
        rainProbability: daily.precipitation_probability_max[index],
        precipitation: daily.precipitation_sum[index],
        weatherCode: daily.weather_code[index],
        condition: getWeatherCondition(daily.weather_code[index]),
        uvIndex: daily.uv_index_max[index],
        windGust: daily.wind_gusts_10m_max[index],
        sunrise: daily.sunrise[index] ?? null,
        sunset: daily.sunset[index] ?? null,
    }));
};


export function normalizeWeatherData(location, forecast) {
    return {
        location: normalizeLocation(location),
        current: normalizeCurrentWeather(forecast.current),
        hourly: normalizeHourlyWeather(forecast.hourly),
        daily: normalizeDailyWeather(forecast.daily),
    };
};