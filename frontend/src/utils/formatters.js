/**
 * Format any ISO date string strictly in Indian Standard Time (IST - Asia/Kolkata).
 * Guaranteed to format consistently regardless of where the browser or server is deployed.
 */
export const formatIST = (dateString, options = {}) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const defaultOptions = {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  };

  const formatter = new Intl.DateTimeFormat('en-IN', {
    ...defaultOptions,
    ...options,
  });

  return `${formatter.format(date)} IST`;
};

/**
 * Sanitizes markdown text from LLMs:
 * - Strips unclosed or stray trailing asterisks (e.g. "...rate limiting**")
 * - Handles odd numbers of bold markers (**) and italics (*)
 * - Strips orphan separator dashes and markers
 */
export const sanitizeMarkdownText = (raw) => {
  if (!raw) return '';
  let str = raw.trim();

  // Strip trailing standalone asterisks e.g. "task name **" or "task name *"
  str = str.replace(/\s+\*\*+$/, '').replace(/\s+\*+$/, '');

  // Balance double asterisks if count is odd
  const doubleAsteriskMatches = str.match(/\*\*/g);
  if (doubleAsteriskMatches && doubleAsteriskMatches.length % 2 !== 0) {
    if (str.endsWith('**')) {
      str = str.slice(0, -2).trim();
    } else if (str.startsWith('**')) {
      str = str.slice(2).trim();
    } else {
      // If trailing part has unmatched **, remove last occurrence
      const lastIdx = str.lastIndexOf('**');
      if (lastIdx !== -1) {
        str = (str.slice(0, lastIdx) + str.slice(lastIdx + 2)).trim();
      }
    }
  }

  // Balance single asterisks if count is odd
  const singleAsterisks = str.match(/(?<!\*)\*(?!\*)/g);
  if (singleAsterisks && singleAsterisks.length % 2 !== 0) {
    if (str.endsWith('*')) {
      str = str.slice(0, -1).trim();
    } else if (str.startsWith('*')) {
      str = str.slice(1).trim();
    }
  }

  // Strip trailing placeholder hyphens e.g. " --"
  str = str.replace(/\s+[-—–]+$/, '').replace(/^[-—–]+\s+/, '');

  return str.trim();
};
