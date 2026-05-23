/**
 * Flatten API v3 responses ({ success, message, data: { ... } }) for storefront code.
 */
export function unwrapApiResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }

  const failed = payload.success === false || payload.error === true;

  if (payload.data !== undefined && payload.data !== null) {
    if (Array.isArray(payload.data)) {
      return {
        success: payload.success ?? !failed,
        error: failed,
        message: payload.message,
        data: payload.data,
      };
    }

    if (typeof payload.data === 'object') {
      return {
        ...payload.data,
        success: payload.success ?? !failed,
        error: failed,
        message: payload.message,
      };
    }
  }

  return {
    ...payload,
    success: payload.success ?? !failed,
    error: payload.error ?? failed,
  };
}

export function apiOk(res) {
  return res && res.success !== false && res.error !== true;
}

export function getProductsFromResponse(res) {
  if (!res) return [];
  if (Array.isArray(res.products)) return res.products;
  if (Array.isArray(res.data?.products)) return res.data.products;
  return [];
}
