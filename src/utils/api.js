export const fetchWithAuth = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tenant_token') : null;
  
  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Not authenticated');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  // Only set Content-Type to application/json if we are NOT sending FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const response = await fetch(`${baseUrl}${url}`, {
    cache: 'no-store',
    ...options,
    headers
  });

  if (!response.ok && response.status !== 401 && response.status !== 403) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Request Failed: ${response.status}`);
    } catch(e) {
      if (e.message && e.message !== 'Unexpected end of JSON input' && !e.message.includes('Unexpected token')) {
          throw e;
      }
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }
  }

  if (response.status === 401) {
    // Token expired or invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tenant_token');
      document.cookie = 'tenant_token=; path=/; max-age=0; SameSite=Lax';
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  if (response.status === 403) {
    // Could be subscription expired
    const clone = response.clone();
    try {
      const data = await clone.json();
      if (data.subscription_expired && typeof window !== 'undefined') {
        window.location.href = '/dashboard/billing';
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }

  return response;
};

// Separate helper for Super Admin API calls (uses super_admin_token)
export const fetchWithSuperAdminAuth = async (url, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('tenant_token') : null;

  if (!token) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error('Not authenticated as super admin');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  const response = await fetch(`${baseUrl}${url}`, {
    cache: 'no-store',
    ...options,
    headers
  });

  if (!response.ok && response.status !== 401) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `API Request Failed: ${response.status}`);
    } catch(e) {
      if (e.message && e.message !== 'Unexpected end of JSON input' && !e.message.includes('Unexpected token')) {
          throw e;
      }
      throw new Error(`API Request Failed: ${response.status} ${response.statusText}`);
    }
  }

  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tenant_token');
      window.location.href = '/login';
    }
    throw new Error('Session expired');
  }

  return response;
};
