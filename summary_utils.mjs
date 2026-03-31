/**
 * Summary generation utilities for FRA scanner
 * 
 * Generates unique summaries that don't duplicate content sentences
 * Ensures React Markdown compatibility
 */

/**
 * Generate a unique summary from content that doesn't duplicate sentences
 * @param {string} content - Full article content
 * @param {number} maxLength - Maximum summary length (default: 300)
 * @returns {string} Unique summary
 */
export function generateUniqueSummary(content, maxLength = 300) {
  if (!content || content.length < 100) {
    return content ? content.substring(0, maxLength).trim() : 'No summary available';
  }
  
  // Strip markdown artifacts before processing
  const cleanContent = content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')       // Remove ![img](url)
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')    // [text](url) → text
    .replace(/^#+\s*/gm, '')                     // Remove heading markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')           // **bold** → bold
    .replace(/\*([^*]+)\*/g, '$1')               // *italic* → italic
    .replace(/^>\s*/gm, '')                      // Remove blockquote markers
    .replace(/^-\s+/gm, '')                      // Remove list markers
    .replace(/\s+/g, ' ')
    .trim();
  
  // Split content into sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => {
    const trimmed = s.trim();
    return trimmed.length > 20 && trimmed.length < 500;
  });
  
  if (sentences.length === 0) {
    return cleanContent.substring(0, maxLength).trim() + 
           (cleanContent.length > maxLength ? '...' : '');
  }
  
  // Strategy 1: Try to find a good opening sentence that's not too long
  let candidate = sentences[0].trim();
  
  // Check if first sentence is a good summary (not too vague)
  const vaguePhrases = [
    'in recent', 'according to', 'it has been', 'there has been',
    'as we know', 'it is important', 'over the years', 'in the world of',
    'when it comes to', 'in terms of', 'with regard to', 'as far as',
    'it should be noted', 'it is worth mentioning'
  ];
  
  const candidateLower = candidate.toLowerCase();
  const isVague = vaguePhrases.some(phrase => candidateLower.startsWith(phrase));
  
  if (candidate.length > 40 && candidate.length < maxLength && !isVague) {
    return ensureProperEnding(candidate);
  }
  
  // Strategy 2: Look for a sentence with key indicators of a good summary
  const keyPhrases = [
    'announced', 'launched', 'released', 'premiered', 'won', 'awarded', 
    'selected', 'featured', 'revealed', 'unveiled', 'confirmed', 'signed',
    'acquired', 'partnered', 'collaborated', 'expanded', 'introduced'
  ];
  
  for (const sentence of sentences.slice(0, 6)) {
    const trimmed = sentence.trim();
    if (trimmed.length > 30 && trimmed.length < maxLength * 0.8) {
      const lower = trimmed.toLowerCase();
      if (keyPhrases.some(phrase => lower.includes(phrase))) {
        return ensureProperEnding(trimmed);
      }
    }
  }
  
  // Strategy 3: Take the first reasonable sentence
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 30 && trimmed.length < maxLength) {
      return ensureProperEnding(trimmed);
    }
  }
  
  // Strategy 4: Combine first two short sentences
  if (sentences.length >= 2) {
    const first = sentences[0].trim();
    const second = sentences[1].trim();
    const combined = `${first}. ${second}`;
    if (combined.length < maxLength) {
      return ensureProperEnding(combined);
    }
  }
  
  // Fallback: First maxLength chars with ellipsis if truncated
  const fallback = cleanContent.substring(0, maxLength).trim();
  if (cleanContent.length > maxLength) {
    // Try to end at a sentence boundary
    const lastPeriod = fallback.lastIndexOf('.');
    const lastExclamation = fallback.lastIndexOf('!');
    const lastQuestion = fallback.lastIndexOf('?');
    const lastBoundary = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastBoundary > maxLength * 0.5) {
      return fallback.substring(0, lastBoundary + 1).trim();
    }
    return fallback + '...';
  }
  return fallback;
}

/**
 * Ensure a string ends with proper punctuation
 * @param {string} text 
 * @returns {string}
 */
function ensureProperEnding(text) {
  if (!text) return text;
  if (text.endsWith('.') || text.endsWith('!') || text.endsWith('?')) {
    return text;
  }
  return text + '.';
}

/**
 * Check if summary contains sentences that duplicate content
 * @param {string} summary 
 * @param {string} content 
 * @returns {boolean} True if problematic duplicates found
 */
export function hasDuplicateSentences(summary, content) {
  if (!summary || !content || summary.length < 20 || content.length < 50) {
    return false;
  }
  
  // Check if summary is just a truncated version of content (the original problem)
  const first300OfContent = content.substring(0, 300).toLowerCase().replace(/\s+/g, ' ').trim();
  const summaryLower = summary.toLowerCase().replace(/\s+/g, ' ').trim();
  
  // If summary is essentially the first 300 chars of content, that's a problem
  if (first300OfContent.includes(summaryLower) && summaryLower.length > 100) {
    return true;
  }
  
  // Check for substantial sentence duplication
  const summarySentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const contentSentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  let duplicateCount = 0;
  
  for (const sSentence of summarySentences) {
    const cleanS = sSentence.trim().toLowerCase().replace(/\s+/g, ' ');
    for (const cSentence of contentSentences) {
      const cleanC = cSentence.trim().toLowerCase().replace(/\s+/g, ' ');
      
      // Check for near-exact match (problematic)
      if (cleanS === cleanC && cleanS.length > 40) {
        duplicateCount++;
      }
      
      // Check if one is mostly contained in the other (also problematic)
      if (cleanS.length > 40 && cleanC.length > 40) {
        const similarity = calculateSimilarity(cleanS, cleanC);
        if (similarity > 0.8) { // 80% similarity threshold
          duplicateCount++;
        }
      }
    }
  }
  
  // If more than half the summary sentences are duplicates, it's a problem
  return duplicateCount > 0 && (duplicateCount / summarySentences.length) > 0.5;
}

/**
 * Calculate similarity between two strings (0-1)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Check if shorter is contained in longer
  if (longer.includes(shorter)) {
    return shorter.length / longer.length;
  }
  
  // Simple character-based similarity
  let matches = 0;
  for (let i = 0; i < Math.min(shorter.length, longer.length); i++) {
    if (shorter[i] === longer[i]) matches++;
  }
  
  return matches / longer.length;
}

/**
 * Verify and fix a summary if it has duplicate sentences
 * @param {string} summary 
 * @param {string} content 
 * @param {number} maxLength 
 * @returns {string} Fixed summary
 */
export function verifyAndFixSummary(summary, content, maxLength = 300) {
  if (!summary || hasDuplicateSentences(summary, content)) {
    return generateUniqueSummary(content, maxLength);
  }
  return summary;
}