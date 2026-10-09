// El navegador de Samsung (Samsung Internet) instala la app como un APK propio armado
// para versiones viejas de Android, y Google Play Protect lo bloquea como "aplicación no segura".
// En ese navegador no usamos su instalador: mandamos a abrir la página en Chrome.
export function esSamsungInternet(): boolean {
  const ua = String((globalThis as any).navigator?.userAgent || '');
  return /SamsungBrowser/i.test(ua);
}

/** Link que abre la página actual en Chrome (Android). */
export function urlAbrirEnChrome(): string {
  const loc = (globalThis as any).location;
  if (!loc) return '#';
  return `intent://${loc.host}${loc.pathname}${loc.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(loc.href)};end`;
}
