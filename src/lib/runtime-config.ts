const DEFAULT_PRODUCTION_SITE_URL = "https://buyaelvisyam.id";

const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const getConfiguredApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL?.trim();
  return apiUrl ? stripTrailingSlash(apiUrl) : "";
};

export const getSiteOrigin = () => {
  const siteUrl = import.meta.env.VITE_SITE_URL?.trim();
  if (siteUrl) return stripTrailingSlash(siteUrl);

  if (typeof window !== "undefined" && /^https?:$/.test(window.location.protocol)) {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      return window.location.origin;
    }
  }

  return DEFAULT_PRODUCTION_SITE_URL;
};

export const getBackendOrigin = () => {
  const apiUrl = getConfiguredApiUrl();
  if (apiUrl) {
    return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:4000";
  }

  return getSiteOrigin();
};

export const getApiBaseUrl = () => {
  const apiUrl = getConfiguredApiUrl();
  if (apiUrl) return apiUrl;
  return `${getBackendOrigin()}/api`;
};

export const getOfflineBackendMessage = () => {
  if (import.meta.env.DEV) {
    return "Backend tidak dapat diakses. Pastikan server berjalan di http://127.0.0.1:4000";
  }

  return "Backend tidak dapat diakses. Periksa koneksi internet atau konfigurasi VITE_API_URL untuk build mobile.";
};
