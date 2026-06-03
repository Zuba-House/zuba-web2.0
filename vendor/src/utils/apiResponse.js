export function unwrapApiResponse(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return payload;
  const hasDataKey = Object.prototype.hasOwnProperty.call(payload, 'data');
  const inner = payload.data;
  const hasObjectWrapper = hasDataKey && inner !== null && typeof inner === 'object' && !Array.isArray(inner);
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

export function getAccessToken(res) {
  const body = unwrapApiResponse(res);
  return body?.accesstoken || body?.accessToken || body?.data?.accesstoken || body?.data?.accessToken || null;
}
