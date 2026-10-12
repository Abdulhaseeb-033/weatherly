import { INSIGHT_THRESHOLDS } from "./thresholds.js";

export function getUpcomingHours(hourly, currentTime) {
    if (!Array.isArray(hourly) || !currentTime) {
        return [];
    }

    const currentHour = currentTime.slice(0, 13);

    const upcomingHours = hourly.filter((hour) => {
        if (!hour?.time) {
            return false;
        }

        return hour.time.slice(0, 13) >= currentHour;
    });

    return upcomingHours.slice(
        0,
        INSIGHT_THRESHOLDS.lookAheadHours
    );
}