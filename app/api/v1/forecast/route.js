import { normalizeWeatherData } from "@/lib/core/weather/normalize";
import { fetchForecast } from "@/lib/server/providers/openMeteo/client";
import { forecastQuerySchema } from "@/lib/server/validation/weather";
import { AppError } from "@/lib/server/errors/AppError";
import { checkRateLimit } from "@/lib/server/rateLimit/rateLimiter";
import { getClientIp } from "@/lib/server/rateLimit/getClientIp";
import {
    getCachedWeather,
    setCachedWeather,
} from "@/lib/server/cache/weatherCache";

function createErrorResponse(
    code,
    message,
    status,
    retryAfter = null
) {
    return Response.json(
        {
            error: {
                code,
                message,
                ...(retryAfter !== null && { retryAfter }),
            },
        },
        {
            status,
            ...(retryAfter !== null && {
                headers: {
                    "Retry-After": String(retryAfter),
                },
            }),
        }
    );
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const validation = forecastQuerySchema.safeParse({
        latitude: searchParams.get("latitude"),
        longitude: searchParams.get("longitude"),
    });

    if (!validation.success) {
        return createErrorResponse(
            "INVALID_INPUT",
            "Valid latitude and longitude are required.",
            400
        );
    }

    const { latitude, longitude } = validation.data;

    const ip = getClientIp(request);

    let rateLimit;

    try {
        rateLimit = await checkRateLimit(
            `rate-limit:forecast:${ip}`,
            Number(process.env.FORECAST_RATE_LIMIT ?? 30),
            Number(process.env.RATE_LIMIT_WINDOW ?? 60)
        );
    } catch {
        console.error("Forecast rate limiter unavailable.");

        return createErrorResponse(
            "SERVICE_UNAVAILABLE",
            "Weather service is temporarily unavailable. Please try again shortly.",
            503,
            5
        );
    }

    if (!rateLimit.allowed) {
        return createErrorResponse(
            "RATE_LIMITED",
            "Too many requests. Please try again later.",
            429,
            rateLimit.retryAfter
        );
    }

    try {
        const cachedWeather = await getCachedWeather(
            latitude,
            longitude
        );

        if (cachedWeather) {
            return Response.json(cachedWeather);
        }
    } catch {
        console.error("Forecast cache read failed.");
    }

    try {
        const forecast = await fetchForecast(
            latitude,
            longitude
        );

        const location = {
            id: 0,
            name: "Selected Location",
            latitude,
            longitude,
            timezone: forecast.timezone,
        };

        const weather = normalizeWeatherData(
            location,
            forecast
        );

        try {
            await setCachedWeather(
                latitude,
                longitude,
                weather
            );
        } catch {
            console.error("Forecast cache write failed.");
        }

        return Response.json(weather);
    } catch (error) {
        if (error instanceof AppError) {
            return createErrorResponse(
                error.code,
                error.message,
                error.status,
                error.retryAfter
            );
        }

        console.error("Unexpected forecast processing error.");

        return createErrorResponse(
            "INTERNAL_ERROR",
            "An unexpected error occurred.",
            500
        );
    }
}