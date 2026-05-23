/**
 * Flatten API v3 responses ({ success, message, data }) for storefront code.
 * Keeps `data` so legacy call sites (res.data.*) and spread fields both work.
 */
export function unwrapApiResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const hasDataKey = Object.prototype.hasOwnProperty.call(payload, 'data');
  const inner = payload.data;

  const hasObjectWrapper =
    hasDataKey &&
    inner !== null &&
    typeof inner === 'object' &&
    !Array.isArray(inner);

  if (!hasObjectWrapper) {
    return {
      ...payload,
      success: payload.success ?? payload.error !== true,
      error: payload.error === true || payload.success === false,
    };
  }

  const failed = payload.success === false || payload.error === true;

  return {
    ...inner,
    data: inner,
    success: payload.success ?? !failed,
    error: failed,
    message: payload.message,
  };
}

export function apiOk(res) {
  return res && res.success !== false && res.error !== true;
}

export function apiFailed(res) {
  return !apiOk(res);
}

export function getAuthTokens(payload) {
  const res = unwrapApiResponse(payload);
  if (!res || typeof res !== 'object') {
    return { accessToken: null, refreshToken: null };
  }

  const nested = res.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : null;

  return {
    accessToken:
      res.accesstoken ||
      res.accessToken ||
      nested?.accesstoken ||
      nested?.accessToken ||
      null,
    refreshToken: res.refreshToken || nested?.refreshToken || null,
  };
}

export function storeAuthTokens(payload) {
  const { accessToken, refreshToken } = getAuthTokens(payload);
  if (accessToken && accessToken !== 'undefined' && accessToken !== 'null') {
    localStorage.setItem('accessToken', accessToken);
  }
  if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
    localStorage.setItem('refreshToken', refreshToken);
  }
  return { accessToken, refreshToken };
}

export function clearAuthTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function isUserProfile(obj) {
  return obj && typeof obj === 'object' && (obj._id || obj.id || obj.email);
}

export function getUserProfile(payload) {
  const res = unwrapApiResponse(payload);
  if (!res || apiFailed(res)) return null;
  if (isUserProfile(res.data)) return res.data;
  if (isUserProfile(res.user)) return res.user;
  if (isUserProfile(res)) return res;
  return null;
}

export function isFirebaseConfigured() {
  const key = import.meta.env.VITE_FIREBASE_APP_API_KEY;
  const domain = import.meta.env.VITE_FIREBASE_APP_AUTH_DOMAIN;
  const project = import.meta.env.VITE_FIREBASE_APP_PROJECT_ID;
  return Boolean(key && domain && project);
}

export function getProductsFromResponse(res) {
  if (!res) return [];
  if (Array.isArray(res.products)) return res.products;
  if (Array.isArray(res.data?.products)) return res.data.products;
  return [];
}
