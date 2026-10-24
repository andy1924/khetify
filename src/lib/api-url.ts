const loopback = (host: string) => ['localhost', '127.0.0.1', '0.0.0.0', '[::1]'].includes(host);
const privateHost = (host: string) => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) || host.endsWith('.local');

/** A phone's localhost is not the computer serving the Expo bundle. */
export function resolveApiUrl(configured: string, platform: string, hostUri: string | undefined, development: boolean) {
  if (!configured.trim()) return '';
  try {
    const url = new URL(configured.trim());
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    if (platform !== 'web' && development && loopback(url.hostname) && hostUri) {
      const host = new URL(hostUri.includes('://') ? hostUri.replace(/^[a-z][a-z\d+.-]*:\/\//i, 'http://') : `http://${hostUri}`).hostname;
      // Expo tunnels forward Metro, not the backend port. Do not rewrite to a
      // public tunnel hostname and imply that the API is forwarded as well.
      // React Native's URL implementation has a hostname getter but no setter.
      // Build a new string rather than mutating the URL (which fails in Hermes).
      if (privateHost(host)) return `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}${url.pathname}${url.search}${url.hash}`.replace(/\/$/, '');
    }
    return url.toString().replace(/\/$/, '');
  } catch { return ''; }
}
