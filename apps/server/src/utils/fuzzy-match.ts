/**
 * Computes the Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  const matrix: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) {
    const row = matrix[i];
    if (row) row[0] = i;
  }
  
  const firstRow = matrix[0];
  if (firstRow) {
    for (let j = 0; j <= m; j++) {
      firstRow[j] = j;
    }
  }

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const prevRow = matrix[i - 1];
      const currRow = matrix[i];
      
      if (prevRow && currRow) {
        currRow[j] = Math.min(
          prevRow[j]! + 1,      // deletion
          currRow[j - 1]! + 1,  // insertion
          prevRow[j - 1]! + cost // substitution
        );
      }
    }
  }
  
  const lastRow = matrix[n];
  return lastRow ? (lastRow[m] ?? n + m) : n + m;
}

/**
 * Checks if the input answer is "close enough" to the correct answer.
 * Accepted if similarity is > 85% or distance is <= 2 for short strings.
 */
export function isFuzzyMatch(input: string, correct: string): boolean {
  const s1 = input.trim().toLowerCase();
  const s2 = correct.trim().toLowerCase();

  if (s1 === s2) return true;

  const distance = levenshteinDistance(s1, s2);
  const maxLength = Math.max(s1.length, s2.length);

  // If very short, only allow 1 error
  if (maxLength <= 5) return distance <= 1;
  
  // Similarity threshold
  const similarity = 1 - distance / maxLength;
  return similarity >= 0.85;
}
