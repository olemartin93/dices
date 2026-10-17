/** Total length of one throw, in ms. Keep in sync with the toss/tumble/shadow durations in index.css. */
export const ROLL_MS = 1150
/** Moment the die hits the table (72% keyframe in index.css). */
export const IMPACT_MS = Math.round(ROLL_MS * 0.72)
/** Each extra die lands a little later than the previous one. */
export const STAGGER_MS = 70
