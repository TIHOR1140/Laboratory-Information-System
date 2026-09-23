/**
 * Parses reference range strings and evaluates if a numeric value falls within normal limits.
 * Handles formats like:
 * - "70 - 99" or "13.0 - 17.5 g/dL" (min - max range)
 * - "< 200" or "<= 100" (upper limit)
 * - "> 40" or ">= 60" (lower limit)
 */
export function checkIsNormal(valueStr, referenceRangeStr) {
  if (valueStr === undefined || valueStr === null) return true
  const trimmedValue = String(valueStr).trim()
  if (!trimmedValue) return true

  const num = parseFloat(trimmedValue)
  if (isNaN(num)) return true

  if (!referenceRangeStr || typeof referenceRangeStr !== 'string') return true
  const ref = referenceRangeStr.trim()

  // 1. Min - Max range (e.g., "70 - 99", "13.0 - 17.5", "0.4 - 4.0")
  const rangeMatch = ref.match(/([0-9.]+)\s*-\s*([0-9.]+)/)
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1])
    const max = parseFloat(rangeMatch[2])
    if (!isNaN(min) && !isNaN(max)) {
      return num >= min && num <= max
    }
  }

  // 2. Upper limit (e.g., "< 200", "<= 100")
  const lessMatch = ref.match(/<(=)?\s*([0-9.]+)/)
  if (lessMatch) {
    const isInclusive = Boolean(lessMatch[1])
    const max = parseFloat(lessMatch[2])
    if (!isNaN(max)) {
      return isInclusive ? num <= max : num < max
    }
  }

  // 3. Lower limit (e.g., "> 40", ">= 60")
  const greaterMatch = ref.match(/>(=)?\s*([0-9.]+)/)
  if (greaterMatch) {
    const isInclusive = Boolean(greaterMatch[1])
    const min = parseFloat(greaterMatch[2])
    if (!isNaN(min)) {
      return isInclusive ? num >= min : num > min
    }
  }

  return true
}
