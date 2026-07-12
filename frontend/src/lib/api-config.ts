const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) {
    return envUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.");
    if (!isLocal) {
      return window.location.origin; // fallback to same host
    }
    return `http://${host}:8000`;
  }
  return "http://localhost:8000";
};

export const API_BASE_URL: string = getApiBaseUrl();

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;