import { INSIGHT_THRESHOLDS } from "../thresholds.js";

export function generateTemperatureInsight(current) {
    if (
        !current ||
        typeof current.feelsLike !== "number" ||
        !Number.isFinite(current.feelsLike)
    ) {
        return null;
    }

    const temperature = current.feelsLike;
    let severity;
    let title;
    let message;
    let advice;

    if (temperature >= INSIGHT_THRESHOLDS.temperature.hotCaution) {
        severity = "caution";
        title = "Extreme heat";
        message = `It feels like ${temperature}°C. Heat may cause discomfort or health risks.`;
        advice = "Drink water, limit strenuous outdoor activity, and seek shade.";
    } else if (
        temperature >= INSIGHT_THRESHOLDS.temperature.hotNotice
    ) {
        severity = "notice";
        title = "Hot conditions";
        message = `It feels like ${temperature}°C. Outdoor activities may feel uncomfortable.`;
        advice = "Stay hydrated and take breaks in the shade.";
    } else if (
        temperature <= INSIGHT_THRESHOLDS.temperature.coldCaution
    ) {
        severity = "caution";
        title = "Extreme cold";
        message = `It feels like ${temperature}°C. Prolonged exposure may be risky.`;
        advice = "Wear warm layers and limit prolonged exposure to the cold.";
    } else if (
        temperature <= INSIGHT_THRESHOLDS.temperature.coldNotice
    ) {
        severity = "notice";
        title = "Cold conditions";
        message = `It feels like ${temperature}°C. The weather may feel very cold.`;
        advice = "Wear warm clothing when going outside.";
    } else if (
        temperature <= INSIGHT_THRESHOLDS.temperature.coldInfo
    ) {
        severity = "info";
        title = "Cool conditions";
        message = `It feels like ${temperature}°C. The weather may feel chilly.`;
        advice = "Consider taking a light jacket.";
    } else {
        return null;
    }

    return {
        id: "temperature-conditions",
        type: "temperature",
        severity,
        title,
        message,
        advice,
        window: null,
    };
}