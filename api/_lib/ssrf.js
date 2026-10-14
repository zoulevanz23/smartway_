/**
 * CJS runtime copy of _lib/ssrf.ts.
 * api/*.js do require('./_lib/ssrf') without extension, which plain Node
 * (Docker) cannot resolve to .ts. Keeping this .js next to the .ts source
 * makes Vercel + Docker + local-api all work with zero build step.
 */
const ALLOWED_HOSTNAME_SUFFIXES = ['.supabase.co'];

function isAllowedFileUrl(fileUrl) {
  try {
    const url = new URL(fileUrl);
    return (
      ALLOWED_HOSTNAME_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix)) &&
      url.pathname.startsWith('/storage/v1/object/')
    );
  } catch {
    return false;
  }
}

function isAllowedDownloadSize(buffer) {
  return buffer.length <= parseInt(process.env.MAX_DOWNLOAD_BYTES || '10485760', 10);
}

module.exports = { isAllowedFileUrl, isAllowedDownloadSize };
