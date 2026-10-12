import { describe, expect, it, vi } from "vitest";
import { searchLocations } from "../lib/server/providers/openMeteo/geocoding";

describe("searchLocations", () => {
    it("searches locations successfully", async () => {
        const mockResults = [
            {
                id: 1174872,
                name: "Karachi",
                latitude: 24.8608,
                longitude: 67.0104,
                country: "Pakistan",
                country_code: "PK",
                admin1: "Sindh",
                timezone: "Asia/Karachi",
            },
        ];

        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                results: mockResults,
            }),
        });

        const result = await searchLocations("Karachi");

        expect(result).toEqual(mockResults);
        expect(global.fetch).toHaveBeenCalledTimes(1);

        const requestUrl = global.fetch.mock.calls[0][0];

        expect(requestUrl).toContain("name=Karachi");
        expect(requestUrl).toContain("count=10");
        expect(requestUrl).toContain("language=en");
        expect(requestUrl).toContain("format=json");
    });

    it("returns an empty array when no locations are found", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({}),
        });

        const result = await searchLocations("UnknownCity");

        expect(result).toEqual([]);
    });

    it("throws an AppError when geocoding request fails", async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
        });

        await expect(
            searchLocations("Karachi")
        ).rejects.toMatchObject({
            name: "AppError",
            code: "UPSTREAM_UNAVAILABLE",
            status: 503,
            message: "Open-Meteo geocoding request failed: 500",
        });
    });

    it("throws an AppError when the request times out", async () => {
        vi.useFakeTimers();

        global.fetch = vi.fn((url, options) => {
            return new Promise((resolve, reject) => {
                options.signal.addEventListener("abort", () => {
                    reject(
                        new DOMException(
                            "The operation was aborted.",
                            "AbortError"
                        )
                    );
                });
            });
        });

        const promise = searchLocations("Karachi", "en", 1000);

        const expectation = expect(promise).rejects.toMatchObject({
            name: "AppError",
            code: "UPSTREAM_TIMEOUT",
            status: 504,
            message: "Open-Meteo geocoding request timed out.",
        });

        await vi.advanceTimersByTimeAsync(1000);

        await expectation;

        vi.useRealTimers();
    });

    it("throws an AppError when the network request fails", async () => {
        global.fetch = vi
            .fn()
            .mockRejectedValue(new Error("Network failure"));

        await expect(
            searchLocations("Karachi")
        ).rejects.toMatchObject({
            name: "AppError",
            code: "UPSTREAM_UNAVAILABLE",
            status: 503,
            message: "Unable to reach Open-Meteo geocoding service.",
        });
    });
});