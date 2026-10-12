/**
 * @typedef {"info" | "notice" | "caution"} InsightSeverity
 */

/**
 * @typedef {Object} Insight
 * @property {string} id 
 * @property {string} type 
 * @property {InsightSeverity} severity
 * @property {string} title 
 * @property {string} message
 * @property {string} advice 
 * @property {{ start: string, end: string } | null} window
 */