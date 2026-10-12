import { AppError } from "../../errors/AppError";

const OPEN_METEO_GEOCODING_URL =
    "https://geocoding-api.open-meteo.com/v1/search";

const REQUEST_TIMEOUT = 10_000;

export async function searchLocations(
    query,
    language = "en",
    timeout = REQUEST_TIMEOUT
) {
    const params = new URLSearchParams({
        name: query,
        count: "10",
        language,
        format: "json",
    });

    const controller = new AbortController();

    const timeoutId = setTimeout(() => {
        controller.abort();
    }, timeout);

    try {
        const response = await fetch(
            `${OPEN_METEO_GEOCODING_URL}?${params}`,
            {
                signal: controller.signal,
            }
        );

        if (!response.ok) {
            throw new AppError(
                `Open-Meteo geocoding request failed: ${response.status}`,
                "UPSTREAM_UNAVAILABLE",
                503
            );
        }

        const data = await response.json();

        return data.results ?? [];
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        if (error?.name === "AbortError") {
            throw new AppError(
                "Open-Meteo geocoding request timed out.",
                "UPSTREAM_TIMEOUT",
                504
            );
        }

        throw new AppError(
            "Unable to reach Open-Meteo geocoding service.",
            "UPSTREAM_UNAVAILABLE",
            503
        );
    } finally {
        clearTimeout(timeoutId);
    }
}
