export const INSIGHT_THRESHOLDS = {
    lookAheadHours: 12,

    rain: {
        minimumProbability: 40,
        noticeProbability: 60,
        minimumPrecipitation: 0.1,
        heavyPrecipitation: 7.6,
    },

    temperature: {
        hotNotice: 35,
        hotCaution: 40,
        coldInfo: 5,
        coldNotice: 0,
        coldCaution: -10,
    },

    wind: {
        info: 30,
        notice: 40,
        caution: 60,
        gustNotice: 50,
        gustCaution: 75,
    },

    uv: {
        info: 6,
        notice: 8,
        caution: 11,
    },

    visibility: {
        info: 5000,
        notice: 1000,
    },

    temperatureChange: {
        info: 6,
        notice: 10,
    },

    humidity: {
        minimumHumidity: 80,
        minimumTemperature: 26,
    },
};
