import { describe, expect, it } from "vitest";
import {
    normalizeLocation,
    normalizeCurrentWeather,
    normalizeHourlyWeather,
    normalizeDailyWeather,
    normalizeWeatherData,
} from "../lib/core/weather/normalize";

describe("normalizeLocation", () => {
    it("normalizes location correctly", () => {
        const location = {
            id: 1174872,
            name: "Karachi",
            latitude: 24.8608,
            longitude: 67.0104,
            country: "Pakistan",
            country_code: "PK",
            admin1: "Sindh",
            timezone: "Asia/Karachi",
        };

        const result = normalizeLocation(location);

        expect(result.name).toBe("Karachi");
        expect(result.region).toBe("Sindh");
        expect(result.country).toBe("Pakistan");
        expect(result.countryCode).toBe("PK");
        expect(result.latitude).toBe(24.8608);
        expect(result.longitude).toBe(67.0104);
        expect(result.timezone).toBe("Asia/Karachi");
    });
});

describe("normalizeCurrentWeather", () => {
    it("normalizes current weather correctly", () => {
        const current = {
            time: "2026-10-07T12:00",
            temperature_2m: 28.1,
            apparent_temperature: 32.2,
            relative_humidity_2m: 71,
            wind_speed_10m: 6.9,
            weather_code: 0,
            is_day: 0,
        };

        const result = normalizeCurrentWeather(current);

        expect(result.time).toBe("2026-10-07T12:00");
        expect(result.temperature).toBe(28.1);
        expect(result.feelsLike).toBe(32.2);
        expect(result.humidity).toBe(71);
        expect(result.windSpeed).toBe(6.9);
        expect(result.weatherCode).toBe(0);
        expect(result.isDay).toBe(false);

        expect(result.condition.label).toBe("Clear sky");
        expect(result.condition.icon).toBe("clear");
    });
});

describe("snow weather codes", () => {
    it("normalizes all snow weather codes correctly", () => {
        const snowCodes = [
            { code: 71, label: "Slight snow fall" },
            { code: 73, label: "Moderate snow fall" },
            { code: 75, label: "Heavy snow fall" },
            { code: 77, label: "Snow grains" },
            { code: 85, label: "Slight snow showers" },
            { code: 86, label: "Heavy snow showers" },
        ];

        snowCodes.forEach(({ code, label }) => {
            const current = {
                temperature_2m: -2,
                apparent_temperature: -5,
                relative_humidity_2m: 90,
                wind_speed_10m: 12,
                weather_code: code,
                is_day: 1,
            };

            const result = normalizeCurrentWeather(current);

            expect(result.weatherCode).toBe(code);
            expect(result.condition.label).toBe(label);
            expect(result.condition.icon).toBe("snow");
            expect(result.isDay).toBe(true);
        });
    });
});

describe("normalizeHourlyWeather", () => {
    it("normalizes hourly weather correctly", () => {
        const hourly = {
            time: [
                "2026-10-07T00:00",
                "2026-10-07T01:00",
            ],
            temperature_2m: [28.1, 27.8],
            apparent_temperature: [32.2, 31.9],
            precipitation_probability: [20, 40],
            precipitation: [0, 0.2],
            weather_code: [0, 61],
            wind_speed_10m: [6.9, 8.2],
            visibility: [10000, 8000],
            uv_index: [0, 0],
            is_day: [0, 0],
        };

        const result = normalizeHourlyWeather(hourly);

        expect(result).toHaveLength(2);

        expect(result[0].time).toBe("2026-10-07T00:00");
        expect(result[0].temperature).toBe(28.1);
        expect(result[0].feelsLike).toBe(32.2);
        expect(result[0].rainProbability).toBe(20);
        expect(result[0].precipitation).toBe(0);
        expect(result[0].weatherCode).toBe(0);
        expect(result[0].windSpeed).toBe(6.9);
        expect(result[0].visibility).toBe(10000);
        expect(result[0].uvIndex).toBe(0);
        expect(result[0].isDay).toBe(false);

        expect(result[0].condition.label).toBe("Clear sky");
        expect(result[0].condition.icon).toBe("clear");

        expect(result[1].temperature).toBe(27.8);
        expect(result[1].weatherCode).toBe(61);
        expect(result[1].isDay).toBe(false);

        expect(result[1].condition.label).toBe("Slight rain");
        expect(result[1].condition.icon).toBe("rain");
    });
});

describe("normalizeDailyWeather", () => {
    it("normalizes daily weather correctly", () => {
        const daily = {
            time: [
                "2026-10-07",
                "2026-10-08",
            ],
            temperature_2m_max: [30.9, 30.8],
            temperature_2m_min: [26.4, 24.8],
            precipitation_probability_max: [13, 0],
            precipitation_sum: [0.3, 0],
            weather_code: [51, 1],
            uv_index_max: [5.75, 6.6],
            wind_gusts_10m_max: [33.8, 39.6],
            sunrise: [
                "2026-10-07T06:26",
                "2026-10-08T06:26",
            ],
            sunset: [
                "2026-10-07T18:13",
                "2026-10-08T18:12",
            ],
        };

        const result = normalizeDailyWeather(daily);

        expect(result).toHaveLength(2);

        expect(result[0].date).toBe("2026-10-07");
        expect(result[0].highTemperature).toBe(30.9);
        expect(result[0].lowTemperature).toBe(26.4);
        expect(result[0].rainProbability).toBe(13);
        expect(result[0].precipitation).toBe(0.3);
        expect(result[0].weatherCode).toBe(51);
        expect(result[0].uvIndex).toBe(5.75);
        expect(result[0].windGust).toBe(33.8);
        expect(result[0].sunrise).toBe("2026-10-07T06:26");
        expect(result[0].sunset).toBe("2026-10-07T18:13");

        expect(result[0].condition.label).toBe("Light drizzle");
        expect(result[0].condition.icon).toBe("drizzle");

        expect(result[1].date).toBe("2026-10-08");
        expect(result[1].highTemperature).toBe(30.8);
        expect(result[1].lowTemperature).toBe(24.8);
        expect(result[1].weatherCode).toBe(1);

        expect(result[1].condition.label).toBe("Mainly clear");
        expect(result[1].condition.icon).toBe("clear");
    });
});

describe("normalizeWeatherData", () => {
    it("normalizes complete weather data correctly", () => {
        const location = {
            id: 1174872,
            name: "Karachi",
            latitude: 24.8608,
            longitude: 67.0104,
            country: "Pakistan",
            country_code: "PK",
            admin1: "Sindh",
            timezone: "Asia/Karachi",
        };

        const forecast = {
            current: {
                time: "2026-10-07T12:00",
                temperature_2m: 28.1,
                apparent_temperature: 32.2,
                relative_humidity_2m: 71,
                wind_speed_10m: 6.9,
                weather_code: 0,
                is_day: 0,
            },

            hourly: {
                time: ["2026-10-07T00:00"],
                temperature_2m: [28.1],
                apparent_temperature: [32.2],
                precipitation_probability: [20],
                precipitation: [0],
                weather_code: [0],
                wind_speed_10m: [6.9],
                visibility: [10000],
                uv_index: [0],
                is_day: [0],
            },

            daily: {
                time: ["2026-10-07"],
                temperature_2m_max: [30.9],
                temperature_2m_min: [26.4],
                precipitation_probability_max: [13],
                precipitation_sum: [0.3],
                weather_code: [51],
                uv_index_max: [5.75],
                wind_gusts_10m_max: [33.8],
                sunrise: ["2026-10-07T06:26"],
                sunset: ["2026-10-07T18:13"],
            },
        };

        const result = normalizeWeatherData(location, forecast);

        expect(result.location.name).toBe("Karachi");
        expect(result.location.timezone).toBe("Asia/Karachi");

        expect(result.current.time).toBe("2026-10-07T12:00");
        expect(result.current.temperature).toBe(28.1);
        expect(result.current.feelsLike).toBe(32.2);
        expect(result.current.isDay).toBe(false);

        expect(result.hourly).toHaveLength(1);
        expect(result.hourly[0].temperature).toBe(28.1);

        expect(result.daily).toHaveLength(1);
        expect(result.daily[0].highTemperature).toBe(30.9);
        expect(result.daily[0].lowTemperature).toBe(26.4);
    });
});
