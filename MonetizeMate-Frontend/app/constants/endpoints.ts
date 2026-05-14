const API_BASE_URL = process.env.FASTAPI_URL || '';

export const ENDPOINTS = {
    login: `${API_BASE_URL}/api/v1/token`,
    signup: `${API_BASE_URL}/api/v1/register`,
    logout: `${API_BASE_URL}/api/v1/logout`,
    session: `${API_BASE_URL}/api/v1/users/me`,
    apistats: `${API_BASE_URL}/api/apistats`,
    history: `${API_BASE_URL}/api/history`,
    monetization: `${API_BASE_URL}/api/monetization`,
    recommendation: `${API_BASE_URL}/api/recommendation`,
    strategy: `${API_BASE_URL}/api/strategy`,
    upload: `${API_BASE_URL}/api/upload`,
} as const
