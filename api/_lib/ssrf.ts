const ALLOWED_HOSTNAME_SUFFIXES = ['.supabase.co'];

export function isAllowedFileUrl(fileUrl: string): boolean {
  try {
    const url = new URL(fileUrl);
    return ALLOWED_HOSTNAME_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix)) && url.pathname.startsWith('/storage/v1/object/');
  } catch {
    return false;
  }
}

export function isAllowedDownloadSize(buffer: Buffer): boolean {
  return buffer.length <= (parseInt(process.env.MAX_DOWNLOAD_BYTES || '10485760', 10));
}
