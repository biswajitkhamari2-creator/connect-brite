const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  let url = envUrl || "http://localhost:8000";
  if (typeof window !== "undefined" && window.location.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      url = url.replace("localhost", host).replace("127.0.0.1", host);
    }
  }
  return url.replace(/\/$/, "");
};

export const API_BASE_URL: string = getApiBaseUrl();

export const apiUrl = (path: string): string =>
  `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;