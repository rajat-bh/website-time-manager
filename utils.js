/**
 * Extracts the site domain from a hostname by removing the 'www.' prefix
 * @param {string} hostname - The hostname to process
 * @returns {string} The site domain without 'www.' prefix
 */
function extractSite(hostname) {
  if (!hostname || typeof hostname !== 'string') {
    return '';
  }
  return hostname.replace(/^www\./, '');
}

export { extractSite }; 