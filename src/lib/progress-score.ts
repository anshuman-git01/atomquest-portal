export function parseNumericValue(value: string): number | null {
  const cleaned = value.replace(/[$,%\s]/g, "").trim();
  if (!cleaned) return null;
  const num = Number.parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

export function calculateSystemProgressScore(
  uom: string,
  target: string,
  actualAchievement: string,
): { score: number | null; display: string } {
  switch (uom) {
    case "NUMERIC":
    case "PERCENTAGE": {
      const actual = parseNumericValue(actualAchievement);
      const targetVal = parseNumericValue(target);
      if (actual === null || targetVal === null || targetVal === 0) {
        return { score: null, display: "N/A" };
      }
      const score = (actual / targetVal) * 100;
      const rounded = Math.round(score * 10) / 10;
      return { score: rounded, display: `${rounded}%` };
    }
    case "ZERO_BASED": {
      const actual = parseNumericValue(actualAchievement);
      if (actual === null) {
        return { score: null, display: "N/A" };
      }
      if (actual === 0) {
        return { score: 100, display: "100%" };
      }
      return { score: 0, display: "0%" };
    }
    case "TIMELINE":
      return { score: null, display: "N/A" };
    default:
      return { score: null, display: "N/A" };
  }
}
