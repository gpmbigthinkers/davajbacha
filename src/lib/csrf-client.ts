export function getCsrfTokenFromDocument() {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith("csrf_token="));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice("csrf_token=".length));
}

export function csrfHeaders(
  extra: Record<string, string> = {}
): Record<string, string> {
  const token = getCsrfTokenFromDocument();

  if (!token) {
    return extra;
  }

  return {
    ...extra,
    "X-CSRF-Token": token,
  };
}