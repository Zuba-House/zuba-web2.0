/**
 * Flatten API v3 responses ({ success, message, data }) for legacy admin UI code.
 * Preserves `data` so call sites using res.data.* keep working.
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
