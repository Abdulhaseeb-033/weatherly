import { searchLocations } from "@/lib/server/providers/openMeteo/geocoding";
import { normalizeLocation } from "@/lib/core/weather/normalize";
import { geocodeQuerySchema } from "@/lib/server/validation/geocode";
import { AppError } from "@/lib/server/errors/AppError";
import { checkRateLimit } from "@/lib/server/rateLimit/rateLimiter";
import { getClientIp } from "@/lib/server/rateLimit/getClientIp";
import { rankLocations } from "@/lib/core/locations/rankLocations";
import { formatLocationLabel } from "@/lib/core/locations/formatLocationLabel";

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const validation = geocodeQuerySchema.safeParse({
        q: searchParams.get("q"),
        language: searchParams.get("language") ?? undefined,
    });

    if (!validation.success) {
        return Response.json(
            {
                error: {
                    code: "INVALID_INPUT",
                    message: validation.error.issues[0].message,
                },
            },
            { status: 400 }
        );
    }

    const { q: query, language } = validation.data;

    const ip = getClientIp(request);

    let rateLimit;

    try {
        rateLimit = await checkRateLimit(
            `rate-limit:geocode:${ip}`,
            Number(process.env.GEOCODE_RATE_LIMIT ?? 30),
            Number(process.env.RATE_LIMIT_WINDOW ?? 60)
        );
    } catch (error) {
        console.error("Geocoding rate limiter unavailable.");

        return Response.json(
            {
                error: {
                    code: "SERVICE_UNAVAILABLE",
                    message: "Location search is temporarily unavailable. Please try again shortly.",
                },
            },
            {
                status: 503,
                headers: {
                    "Retry-After": "5",
                },
            }
        );
    }

    if (!rateLimit.allowed) {
        return Response.json(
            {
                error: {
                    code: "RATE_LIMITED",
                    message: "Too many requests. Please try again later.",
                    retryAfter: rateLimit.retryAfter,
                },
            },
            {
                status: 429,
                headers: {
                    "Retry-After": String(rateLimit.retryAfter),
                },
            }
        );
    }

    try {
        const results = await searchLocations(query, language);

        const rankedResults = rankLocations(results, query);

        const locations = rankedResults.map((result) => {
            const location = normalizeLocation(result);

            return {
                ...location,
                label: formatLocationLabel(location),
            };
        });

        return Response.json({
            locations,
        });
    } catch (error) {
        if (error instanceof AppError) {
            return Response.json(
                {
                    error: {
                        code: error.code,
                        message: error.message,
                        ...(error.retryAfter !== null && {
                            retryAfter: error.retryAfter,
                        }),
                    },
                },
                { status: error.status }
            );
        }

        return Response.json(
            {
                error: {
                    code: "INTERNAL_ERROR",
                    message: "An unexpected error occurred.",
                },
            },
            { status: 500 }
        );
    }
}