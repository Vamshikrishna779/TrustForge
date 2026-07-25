/**
 * Sanitizes any raw error objects, SQL PostgREST dicts ({'code': '42703', ...}),
 * stack traces, or technical error messages into clean, user-friendly text.
 */
export function sanitizeErrorMessage(error: any, fallbackMessage: string = 'Action could not be completed. Please try again.'): string {
  if (!error) return fallbackMessage;

  let msg = typeof error === 'string' ? error : error.message || error.detail || String(error);

  if (typeof msg !== 'string') {
    try {
      msg = JSON.stringify(msg);
    } catch (_) {
      return fallbackMessage;
    }
  }

  // Intercept raw SQL / Python dicts (e.g. {'code': '42703', ...} or Postgres errors)
  if (msg.includes("'code':") || msg.includes('"code":') || msg.includes('42703') || msg.includes('column') || msg.includes('user_plans')) {
    return 'Authentication service encountered a temporary sync issue. Please try again.';
  }

  // Intercept raw 500 / 502 / Internal Server errors
  if (msg.includes('500') || msg.includes('502') || msg.includes('Internal Server Error')) {
    return 'Server temporary issue. Please wait a moment and try again.';
  }

  // Intercept raw Gemini API strings
  if (msg.includes('Gemini API') || msg.includes('ResourceExhausted') || msg.includes('429')) {
    return 'AI Verification Engine is experiencing high traffic. Please wait a few seconds and retry.';
  }

  // Clean technical prefixes
  msg = msg.replace(/^(Error:|Failed to|HTTP \d+:|Exception:)/i, '').trim();

  // Capitalize first letter
  if (msg.length > 0) {
    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
  }

  return msg || fallbackMessage;
}
