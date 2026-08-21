/**
 * Format any ISO date string strictly in Indian Standard Time (IST - Asia/Kolkata).
 * Guaranteed to format consistently regardless of where the browser or server is deployed.
 * 
 * Handles:
 * - UTC ISO strings with or without trailing 'Z' (e.g. "2026-08-21T17:33:40Z" or "2026-08-21T17:33:40")
 * - SQLite raw date strings (e.g. "2026-08-21 17:33:40")
 * - Date objects and epoch timestamps
 */
export const formatIST = (dateInput, options = {}) => {
  if (!dateInput) return '';

  let parsedDate;

  if (dateInput instanceof Date) {
    parsedDate = dateInput;
  } else if (typeof dateInput === 'number') {
    parsedDate = new Date(dateInput);
  } else if (typeof dateInput === 'string') {
    let normalized = dateInput.trim();

    // Convert SQL "YYYY-MM-DD HH:MM:SS" to ISO "YYYY-MM-DDTHH:MM:SS"
    if (normalized.includes(' ') && !normalized.includes('T')) {
      normalized = normalized.replace(' ', 'T');
    }

    // If backend UTC string has no timezone offset or Z suffix, append 'Z'
    // to prevent browser from mistakenly parsing it as local system time
    const hasTimezone = normalized.endsWith('Z') || /[+-]\d{2}(:\d{2})?$/.test(normalized);
    if (!hasTimezone) {
      normalized = `${normalized}Z`;
    }

    parsedDate = new Date(normalized);

    // Fallback if parsing failed
    if (isNaN(parsedDate.getTime())) {
      parsedDate = new Date(dateInput);
    }
  }

  if (!parsedDate || isNaN(parsedDate.getTime())) {
    return '';
  }

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

  return `${formatter.format(parsedDate)} IST`;
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
