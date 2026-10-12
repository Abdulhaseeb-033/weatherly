import { INSIGHT_THRESHOLDS } from "../thresholds.js";

/**
 * @param {Array} upcomingHours
 * @returns {import("../model.js").Insight | null}
 */
export function generateRainInsight(upcomingHours) {
    if (!Array.isArray(upcomingHours) || upcomingHours.length === 0) {
        return null;
    }

    let wetHours = [];

    for (const hour of upcomingHours) {
        const probability = hour.rainProbability;
        const precipitation = hour.precipitation;
        if (
            typeof probability !== "number" ||
            typeof precipitation !== "number"
        ) {
            continue;
        }

        if (
            probability >= INSIGHT_THRESHOLDS.rain.minimumProbability &&
            precipitation >= INSIGHT_THRESHOLDS.rain.minimumPrecipitation
        ) {
            wetHours.push(hour);
        }
    }

    if (wetHours.length === 0) {
        return null;
    }

    const maxProbability = Math.max(
        ...wetHours.map((hour) => hour.rainProbability)
    );

    const maxPrecipitation = Math.max(
        ...wetHours.map((hour) => hour.precipitation)
    );

    let severity = "info";

    if (
        maxPrecipitation >= INSIGHT_THRESHOLDS.rain.heavyPrecipitation
    ) {
        severity = "caution";
    } else if (
        maxProbability >= INSIGHT_THRESHOLDS.rain.noticeProbability
    ) {
        severity = "notice";
    }

    const start = wetHours[0].time;
    const end = wetHours[wetHours.length - 1].time;

    return {
        id: "rain-expected",
        type: "rain",
        severity,
        title:
            severity === "caution"
                ? "Heavy precipitation possible"
                : severity === "notice"
                    ? "Rain likely"
                    : "Chance of rain",
        message:
            severity === "caution"
                ? "Heavy precipitation may occur during the forecast period."
                : severity === "notice"
                    ? "Rain is likely during the upcoming hours."
                    : "Some rain is possible during the upcoming hours.",
        advice:
            severity === "caution"
                ? "Consider delaying outdoor plans and check local weather updates."
                : "Consider carrying an umbrella if you plan to go outside.",
        window: { start, end },
    };
}