import { getRedisClient } from "@/lib/server/redis/client";

const WEATHER_CACHE_TTL = 600;

function getWeatherCacheKey(latitude, longitude) {
    return `weather:forecast:${latitude}:${longitude}`;
}

function isValidWeatherData(weather) {
    return (
        weather !== null &&
        typeof weather === "object" &&
        !Array.isArray(weather) &&
        weather.location !== null &&
        typeof weather.location === "object" &&
        !Array.isArray(weather.location) &&
        weather.current !== null &&
        typeof weather.current === "object" &&
        !Array.isArray(weather.current) &&
        weather.hourly !== null &&
        typeof weather.hourly === "object" &&
        !Array.isArray(weather.hourly) &&
        weather.daily !== null &&
        typeof weather.daily === "object" &&
        !Array.isArray(weather.daily)
    );
}

export async function getCachedWeather(latitude, longitude) {
    const redis = await getRedisClient();
    const key = getWeatherCacheKey(latitude, longitude);
    const cachedWeather = await redis.get(key);

    if (!cachedWeather) {
        return null;
    }

    let weather;

    try {
        weather = JSON.parse(cachedWeather);
    } catch {
        await redis.del(key);
        return null;
    }

    if (!isValidWeatherData(weather)) {
        await redis.del(key);
        return null;
    }

    return weather;
}

export async function setCachedWeather(latitude, longitude, weather) {
    const redis = await getRedisClient();
    const key = getWeatherCacheKey(latitude, longitude);

    await redis.set(key, JSON.stringify(weather), {
        EX: WEATHER_CACHE_TTL,
    });
}
