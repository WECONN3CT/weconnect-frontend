// ============================================
// SENTRY ERROR TRACKING - Frontend (Optional)
// ============================================
// Um Sentry zu aktivieren:
// 1. npm install @sentry/react
// 2. Setze VITE_SENTRY_DSN in .env.local
// 3. Importiere initSentry in main.tsx

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sentryModule: any = null;
let sentryInitialized = false;

/**
 * Sentry initialisieren (nur wenn DSN konfiguriert ist)
 *
 * Installation:
 * npm install @sentry/react
 *
 * Dann in main.tsx:
 * import { initSentry } from './lib/sentry';
 * initSentry();
 */
export const initSentry = async () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] Nicht konfiguriert - Error Tracking deaktiviert');
    return;
  }

  try {
    // Dynamischer Import um Bundle-Größe zu sparen wenn nicht verwendet
    // @ts-ignore - Sentry ist optional
    sentryModule = await import('@sentry/react').catch(() => null);

    if (!sentryModule) {
      console.log('[Sentry] @sentry/react nicht installiert - npm install @sentry/react');
      return;
    }

    sentryModule.init({
      dsn,
      environment: import.meta.env.VITE_APP_ENV || 'development',

      // Performance Monitoring
      tracesSampleRate: import.meta.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,

      // Session Replay (optional)
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,

      // Nur in Production senden
      enabled: import.meta.env.VITE_APP_ENV === 'production',

      // Sensitive Daten filtern
      beforeSend(event: any) {
        // Passwörter und Tokens entfernen
        if (event.request?.data) {
          const data = event.request.data as Record<string, unknown>;
          if (data.password) data.password = '[REDACTED]';
          if (data.token) data.token = '[REDACTED]';
        }
        return event;
      },
    });

    sentryInitialized = true;
    console.log('[Sentry] Error Tracking aktiviert');
  } catch (error) {
    console.warn('[Sentry] Konnte nicht initialisiert werden:', error);
  }
};

/**
 * Manuell einen Fehler an Sentry senden
 */
export const captureError = (error: Error, context?: Record<string, unknown>) => {
  if (!sentryInitialized || !sentryModule) {
    console.error('[Error]', error.message, context);
    return;
  }

  sentryModule.captureException?.(error, { extra: context });
};

/**
 * Benutzer-Kontext für Sentry setzen
 */
export const setUserContext = (user: { id: string; email: string } | null) => {
  if (!sentryInitialized || !sentryModule) return;

  if (user) {
    sentryModule.setUser?.({ id: user.id, email: user.email });
  } else {
    sentryModule.setUser?.(null);
  }
};
