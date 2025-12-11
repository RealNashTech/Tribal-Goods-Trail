// Lightweight telemetry helpers (console-based to avoid external deps)
type Props = Record<string, unknown>;

export function trackEvent(event: string, props: Props = {}) {
  try {
    // eslint-disable-next-line no-console
    console.log('[analytics]', event, props);
  } catch {
    // noop
  }
}

export function trackScreen(screen: string, props: Props = {}) {
  trackEvent('screen_view', { screen, ...props });
}
