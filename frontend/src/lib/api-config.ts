const getApiBaseUrl = (): string => {
  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
    if (!isLocal) {
      return ""; // Relative path /api in production
    }
    return `http://${host}:8000`;
  }
  return "http://localhost:8000";
};

export const API_BASE_URL: string = getApiBaseUrl();

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;