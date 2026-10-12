import { AppError } from "../../errors/AppError";

const OPEN_METEO_BASE_URL =
    "https://api.open-meteo.com/v1/forecast";

const REQUEST_TIMEOUT = 10_000;

function isValidForecastResponse(data) {
    return (
        data !== null &&
        typeof data === "object" &&
        !Array.isArray(data) &&
        typeof data.timezone === "string" &&
        data.current !== null &&
        typeof data.current === "object" &&
        !Array.isArray(data.current) &&
        Array.isArray(data.hourly?.time) &&
        Array.isArray(data.daily?.time)
    );
}

export async function fetchForecast(
    latitude,
    longitude,
    timeout = REQUEST_TIMEOUT
) {
    const params = new URLSearchParams({
        latitude,
        longitude,
        timezone: "auto",

        current: [
            "time",
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "wind_speed_10m",
            "weather_code",
            "is_day",
        ].join(","),

        hourly: [
            "temperature_2m",
            "apparent_temperature",
            "precipitation_probability",
            "precipitation",
            "weather_code",
            "wind_speed_10m",
            "visibility",
            "uv_index",
            "is_day",
        ].join(","),

        daily: [
            "temperature_2m_max",
            "temperature_2m_min",
            "precipitation_probability_max",
            "precipitation_sum",
            "weather_code",
            "uv_index_max",
            "wind_gusts_10m_max",
            "sunrise",
            "sunset",
        ].join(","),

        forecast_days: "7",
    });

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const response = await fetch(
            `${OPEN_METEO_BASE_URL}?${params}`,
            {
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            throw new AppError(
                `Open-Meteo request failed: ${response.status}`,
                "UPSTREAM_UNAVAILABLE",
                503
            );
        }

        let data;

        try {
            data = await response.json();
        } catch {
            throw new AppError(
                "Open-Meteo returned an invalid response.",
                "UPSTREAM_INVALID_RESPONSE",
                502
            );
        }

        if (!isValidForecastResponse(data)) {
            throw new AppError(
                "Open-Meteo returned an invalid forecast structure.",
                "UPSTREAM_INVALID_RESPONSE",
                502
            );
        }

        return data;

    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        if (error?.name === "AbortError") {
            throw new AppError(
                "Open-Meteo request timed out.",
                "UPSTREAM_TIMEOUT",
                504
            );
        }

        throw new AppError(
            "Unable to reach Open-Meteo.",
            "UPSTREAM_UNAVAILABLE",
            503
        );
    } finally {
        clearTimeout(timeoutId);
    }
}