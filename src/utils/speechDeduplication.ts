/**
 * Utility for speech recognition text deduplication, overlap removal,
 * and subtitle smoothing in Portuguese.
 */

// Helper to normalize word for comparison (lowercased, stripped of standard punctuation)
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
    .trim();
}

/**
 * Strips adjacent duplicate words and repeated short phrases (2, 3, or 4 words)
 * while preserving appropriate capitalization and punctuation.
 *
 * Examples:
 * - "o o professor" -> "o professor"
 * - "bom dia dia a todos" -> "bom dia a todos"
 * - "vamos começar vamos começar a aula" -> "vamos começar a aula"
 * - "para a para a escola" -> "para a escola"
 */
export function cleanRepeatedWords(text: string): { cleaned: string; removedCount: number } {
  if (!text || text.trim().length === 0) {
    return { cleaned: '', removedCount: 0 };
  }

  // Normalize excessive spaces and clean punctuation spacing
  const normalized = text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim();

  const tokens = normalized.split(' ');
  if (tokens.length <= 1) {
    return { cleaned: normalized, removedCount: 0 };
  }

  let totalRemoved = 0;

  // 1. Pass: Remove repeated multi-word phrases (phrases of length 4, 3, 2)
  for (let phraseLen = 4; phraseLen >= 2; phraseLen--) {
    let i = 0;
    while (i + phraseLen * 2 <= tokens.length) {
      const phrase1 = tokens.slice(i, i + phraseLen);
      const phrase2 = tokens.slice(i + phraseLen, i + phraseLen * 2);

      const norm1 = phrase1.map(normalizeWord).join(' ');
      const norm2 = phrase2.map(normalizeWord).join(' ');

      if (norm1.length > 0 && norm1 === norm2) {
        // Remove the second repeated phrase
        tokens.splice(i + phraseLen, phraseLen);
        totalRemoved += phraseLen;
        // Don't advance i so we can check if it repeated again
      } else {
        i++;
      }
    }
  }

  // 2. Pass: Remove consecutive duplicate single words (e.g. "vamos vamos", "o o")
  const dedupedTokens: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const currentToken = tokens[i];
    const prevToken = dedupedTokens[dedupedTokens.length - 1];

    if (!prevToken) {
      dedupedTokens.push(currentToken);
      continue;
    }

    const normCurrent = normalizeWord(currentToken);
    const normPrev = normalizeWord(prevToken);

    // If both normalize to non-empty identical words, skip the duplicate
    if (normCurrent.length > 0 && normCurrent === normPrev) {
      totalRemoved++;
      // If the duplicate has trailing punctuation that the original didn't, attach it
      const trailingPunct = currentToken.match(/[.,!?;:]+$/);
      if (trailingPunct && !prevToken.match(/[.,!?;:]+$/)) {
        dedupedTokens[dedupedTokens.length - 1] = prevToken + trailingPunct[0];
      }
    } else {
      dedupedTokens.push(currentToken);
    }
  }

  // Rebuild cleaned string
  const cleaned = dedupedTokens.join(' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { cleaned, removedCount: totalRemoved };
}

/**
 * Merges previous transcript with a newly arrived finalized text chunk,
 * detecting and removing any boundary/seam overlap between the tail of existingText
 * and the head of newChunk.
 */
export function mergeTranscriptWithOverlap(
  existingText: string,
  newChunk: string,
  antiRepeatEnabled: boolean = true
): { merged: string; removedOverlapCount: number } {
  const trimmedNew = newChunk.trim();
  if (!trimmedNew) {
    return { merged: existingText, removedOverlapCount: 0 };
  }

  if (!existingText || !existingText.trim()) {
    if (antiRepeatEnabled) {
      const { cleaned, removedCount } = cleanRepeatedWords(trimmedNew);
      return { merged: cleaned, removedOverlapCount: removedCount };
    }
    return { merged: trimmedNew, removedOverlapCount: 0 };
  }

  const existingTokens = existingText.trim().split(/\s+/);
  const newTokens = trimmedNew.split(/\s+/);

  // Look for max overlap of words between end of existing and start of new (up to 8 words)
  const maxCheck = Math.min(existingTokens.length, newTokens.length, 8);
  let overlapWordsCount = 0;

  for (let k = maxCheck; k >= 1; k--) {
    const tailSlice = existingTokens.slice(existingTokens.length - k);
    const headSlice = newTokens.slice(0, k);

    const tailNorm = tailSlice.map(normalizeWord).join(' ');
    const headNorm = headSlice.map(normalizeWord).join(' ');

    if (tailNorm.length > 0 && tailNorm === headNorm) {
      overlapWordsCount = k;
      break;
    }
  }

  let tokensToAdd = newTokens;
  if (overlapWordsCount > 0) {
    tokensToAdd = newTokens.slice(overlapWordsCount);
  }

  let rawMerged = existingText.trim();
  if (tokensToAdd.length > 0) {
    rawMerged += ' ' + tokensToAdd.join(' ');
  }

  if (antiRepeatEnabled) {
    const { cleaned, removedCount } = cleanRepeatedWords(rawMerged);
    return { 
      merged: cleaned, 
      removedOverlapCount: overlapWordsCount + removedCount 
    };
  }

  return { 
    merged: rawMerged, 
    removedOverlapCount: overlapWordsCount 
  };
}

/**
 * Strips overlapping prefix words from interim transcript so that the display
 * doesn't show duplicate words at the boundary between finalized and interim text.
 */
export function sanitizeInterimTranscript(
  finalText: string,
  interimText: string,
  antiRepeatEnabled: boolean = true
): string {
  const trimmedInterim = interimText.trim();
  if (!trimmedInterim) return '';
  if (!finalText || !finalText.trim()) {
    if (antiRepeatEnabled) {
      return cleanRepeatedWords(trimmedInterim).cleaned;
    }
    return trimmedInterim;
  }

  const finalTokens = finalText.trim().split(/\s+/);
  const interimTokens = trimmedInterim.split(/\s+/);

  // Check overlap of up to 6 words between tail of final and head of interim
  const maxCheck = Math.min(finalTokens.length, interimTokens.length, 6);
  let overlapWordsCount = 0;

  for (let k = maxCheck; k >= 1; k--) {
    const tailSlice = finalTokens.slice(finalTokens.length - k);
    const headSlice = interimTokens.slice(0, k);

    const tailNorm = tailSlice.map(normalizeWord).join(' ');
    const headNorm = headSlice.map(normalizeWord).join(' ');

    if (tailNorm.length > 0 && tailNorm === headNorm) {
      overlapWordsCount = k;
      break;
    }
  }

  let effectiveInterimTokens = interimTokens;
  if (overlapWordsCount > 0) {
    effectiveInterimTokens = interimTokens.slice(overlapWordsCount);
  }

  const resultInterim = effectiveInterimTokens.join(' ');
  if (antiRepeatEnabled && resultInterim) {
    return cleanRepeatedWords(resultInterim).cleaned;
  }

  return resultInterim;
}
