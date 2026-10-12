/**
 * @typedef {Object} WeatherCondition
 * @property {string} label
 * @property {string} icon
 */


/**
 * @typedef {Object} WeatherLocation
 * @property {number} id
 * @property {string} name
 * @property {string|null} region
 * @property {string|null} country
 * @property {string} countryCode
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} timezone
 */


/**
 * @typedef {Object} CurrentWeather
 * @property {string | null} time 
 * @property {number} temperature
 * @property {number} feelsLike
 * @property {number} humidity
 * @property {number} windSpeed
 * @property {WeatherCondition} condition
 * @property {number} weatherCode
 * @property {boolean} isDay
 */


/**
 * @typedef {Object} HourlyWeather
 * @property {string} time
 * @property {number} temperature
 * @property {number} feelsLike
 * @property {number} rainProbability
 * @property {number} precipitation
 * @property {number} weatherCode
 * @property {WeatherCondition} condition
 * @property {number} windSpeed
 * @property {number} visibility
 * @property {number} uvIndex
 * @property {boolean} isDay
 */


/**
 * @typedef {Object} DailyWeather
 * @property {string} date
 * @property {number} highTemperature
 * @property {number} lowTemperature
 * @property {number} rainProbability
 * @property {number} precipitation
 * @property {number} weatherCode
 * @property {WeatherCondition} condition
 * @property {number} uvIndex
 * @property {number} windGust
 * @property {string|null} sunrise
 * @property {string|null} sunset
 */


/**
 * @typedef {Object} WeatherData
 * @property {WeatherLocation} location
 * @property {CurrentWeather} current
 * @property {HourlyWeather[]} hourly
 * @property {DailyWeather[]} daily
 */