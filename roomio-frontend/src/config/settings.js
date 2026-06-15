/**
 * Application-wide configuration constants.
 *
 * @constant {Object} SETTINGS
 * @property {number} STATUS_BEFORE - Minutes before an event to trigger "startingSoon" / "finishingSoon" status
 * @property {number} DAY_START - Opening hour (8 AM, 24h format)
 * @property {number} DAY_END - Closing hour (8 PM, 24h format)
 * @property {number} INACTIVITY_TIMEOUT - Inactivity minutes on tablet before returning to home
 * @property {number} POLL_INTERVAL - Data refresh interval in milliseconds
 */
export const SETTINGS = {
  STATUS_BEFORE: 15,      // minutes before an event to trigger "startingSoon" / "finishingSoon" status
  DAY_START: 8,           // opening hour (8 AM)
  DAY_END: 20,            // closing hour (8 PM)
  INACTIVITY_TIMEOUT: 15, // inactivity minutes on tablet before returning to home
  POLL_INTERVAL: 30000,   // data refresh interval (ms)
};
