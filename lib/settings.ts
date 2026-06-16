export interface Settings {
  showConfidence: boolean       // show/hide the confidence % badge
  showReason: boolean           // show/hide the pattern reason text
  animationsEnabled: boolean    // enable/disable motion animations
  confidenceThreshold: number   // how confident before switching from "Learning..."
}

export const DEFAULT_SETTINGS: Settings = {
  showConfidence:      true,
  showReason:          true,
  animationsEnabled:   true,
  confidenceThreshold: 0.2,
}