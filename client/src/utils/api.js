import axios from "axios";
import { getApiBaseUrl } from "./apiBaseUrl.js";
import {
  unwrapApiResponse,
  getAuthTokens,
  storeAuthTokens,
} from "./unwrapApiResponse.js";

const apiUrl = getApiBaseUrl();

export { getApiBaseUrl };

const AUTH_SKIP_REFRESH = [
  '/api/user/login',
  '/api/user/register',
  '/api/user/authWithGoogle',
  '/api/user/refresh-token',
  '/api/user/forgot-password',
  '/api/user/verifyEmail',
  '/api/user/verify-forgot-password-otp',
];

let isRefreshing = false;
let refreshQueue = [];

function shouldSkipRefresh(url) {
  return AUTH_SKIP_REFRESH.some((path) => url?.includes(path));
}

function processRefreshQueue(error, token = null) {
  refreshQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  refreshQueue = [];
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') {
    throw new Error('No refresh token');
  }

  const response = await fetch(`${apiUrl}/api/user/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid refresh response');
  }

  const unwrapped = unwrapApiResponse(data);

  if (!response.ok || unwrapped.error === true || unwrapped.success === false) {
    throw new Error(unwrapped.message || 'Token refresh failed');
  }

  const tokens = getAuthTokens(unwrapped);
  if (!tokens.accessToken) {
    throw new Error('No access token in refresh response');
  }

  storeAuthTokens(unwrapped);
  return tokens.accessToken;
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url) ||
      (status !== 401 && status !== 403)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        originalRequest._retry = true;
        return axios(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const newToken = await refreshAccessToken();
      processRefreshQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      processRefreshQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

function isAuthErrorStatus(status, data) {
  const msg = data?.message || '';
  return (
    status === 401 ||
    status === 403 ||
    msg === 'Authentication token required' ||
    msg === 'Invalid token' ||
    msg === 'Token expired' ||
    msg === 'You have not login'
  );
}

export const postData = async (url, formData, options = {}) => {
  try {
    const token = localStorage.getItem('accessToken');
    const validToken =
      token && token !== 'undefined' && token !== 'null' ? token : '';

    const response = await fetch(apiUrl + url, {
      method: 'POST',
      headers: {
        Authorization: validToken ? `Bearer ${validToken}` : '',
        'Content-Type': 'application/json',
      },
      credentials: options.withCredentials ? 'include' : 'same-origin',
      body: JSON.stringify(formData),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      return {
        error: true,
        success: false,
        message: `Server error (${response.status}): ${response.statusText}`,
      };
    }

    const unwrapped = unwrapApiResponse(data);

    if (response.ok) {
      return unwrapped;
    }

    if (
      isAuthErrorStatus(response.status, unwrapped) &&
      !shouldSkipRefresh(url) &&
      localStorage.getItem('refreshToken')
    ) {
      try {
        await refreshAccessToken();
        return postData(url, formData, options);
      } catch {
        /* fall through */
      }
    }

    return {
      ...unwrapped,
      error: true,
      success: false,
      isAuthError: isAuthErrorStatus(response.status, unwrapped),
      status: response.status,
    };
  } catch (error) {
    console.error('Network/Request Error:', error);
    return {
      error: true,
      success: false,
      message: error.message || 'Network error occurred. Please check your connection and try again.',
    };
  }
};

export const fetchDataFromApi = async (url) => {
  try {
    const token = localStorage.getItem('accessToken');
    const validToken =
      token && token !== 'undefined' && token !== 'null' ? token : '';

    const params = {
      headers: {
        Authorization: validToken ? `Bearer ${validToken}` : '',
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    };

    const { data } = await axios.get(apiUrl + url, params);
    return unwrapApiResponse(data);
  } catch (error) {
    const status = error.response?.status;
    const errorData = unwrapApiResponse(error.response?.data) || {};

    if (isAuthErrorStatus(status, errorData)) {
      return {
        success: false,
        error: true,
        isAuthError: true,
        message: errorData.message || 'Authentication failed',
        response: error.response,
      };
    }

    return (
      errorData || {
        success: false,
        error: true,
        message: error?.message || 'Request failed',
      }
    );
  }
};

/** POST without auth headers — for guest checkout when stale tokens would cause 401s */
export const postPublicData = async (url, formData) => {
  try {
    const response = await fetch(apiUrl + url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    let data;
    try {
      data = await response.json();
    } catch {
      return {
        error: true,
        success: false,
        message: `Server error (${response.status}): ${response.statusText}`,
      };
    }

    const unwrapped = unwrapApiResponse(data);

    if (response.ok) {
      return unwrapped;
    }

    return {
      ...unwrapped,
      error: true,
      success: false,
      status: response.status,
    };
  } catch (error) {
    console.error('Network/Request Error:', error);
    return {
      error: true,
      success: false,
      message: error.message || 'Network error occurred. Please check your connection and try again.',
    };
  }
};

export const uploadImage = async (url, updatedData) => {
  try {
    const token = localStorage.getItem('accessToken');
    const validToken =
      token && token !== 'undefined' && token !== 'null' ? token : '';

    const params = {
      headers: {
        Authorization: validToken ? `Bearer ${validToken}` : '',
        'Content-Type': 'multipart/form-data',
      },
    };

    const response = await axios.put(apiUrl + url, updatedData, params);
    return response;
  } catch (error) {
    console.error('Upload error:', error);
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { error: true, isAuthError: true, message: 'Authentication failed' };
    }
    return { error: true, message: error?.response?.data?.message || error.message };
  }
};

export const editData = async (url, updatedData) => {
  try {
    const token = localStorage.getItem('accessToken');
    const validToken =
      token && token !== 'undefined' && token !== 'null' ? token : '';

    const params = {
      headers: {
        Authorization: validToken ? `Bearer ${validToken}` : '',
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.put(apiUrl + url, updatedData, params);
    return unwrapApiResponse(response.data);
  } catch (error) {
    console.error('Edit error:', error);
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { error: true, isAuthError: true, message: 'Authentication failed' };
    }
    return { error: true, message: error?.response?.data?.message || error.message };
  }
};

export const deleteData = async (url) => {
  try {
    const token = localStorage.getItem('accessToken');
    const validToken =
      token && token !== 'undefined' && token !== 'null' ? token : '';

    const params = {
      headers: {
        Authorization: validToken ? `Bearer ${validToken}` : '',
        'Content-Type': 'application/json',
      },
    };

    const response = await axios.delete(apiUrl + url, params);
    return unwrapApiResponse(response?.data) || response?.data || response;
  } catch (error) {
    console.error('Delete error:', error);
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return { error: true, isAuthError: true, message: 'Authentication failed' };
    }
    return { error: true, message: error?.response?.data?.message || error.message };
  }
};
