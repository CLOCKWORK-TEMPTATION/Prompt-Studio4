import { useState, useEffect } from 'react';

interface CsrfState {
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook لإدارة CSRF token
 */
export function useCsrf() {
  const [state, setState] = useState<CsrfState>({
    token: null,
    loading: true,
    error: null,
  });

  // الحصول على CSRF token من الخادم
  const fetchCsrfToken = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/csrf-token', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setState({
        token: data.csrfToken,
        loading: false,
        error: null,
      });
      
      return data.csrfToken;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'فشل في الحصول على CSRF token';
      setState({
        token: null,
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  };

  // تحديث CSRF token
  const refreshToken = () => {
    return fetchCsrfToken();
  };

  // الحصول على token عند تحميل المكون
  useEffect(() => {
    fetchCsrfToken();
  }, []);

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    refreshToken,
  };
}

/**
 * إضافة CSRF token إلى headers الطلب
 */
export function addCsrfHeaders(token: string | null, headers: Record<string, string> = {}): Record<string, string> {
  if (token) {
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }
  return headers;
}

/**
 * إضافة CSRF token إلى body الطلب
 */
export function addCsrfToBody(token: string | null, body: any = {}): any {
  if (token && typeof body === 'object' && body !== null) {
    return {
      ...body,
      _csrf: token,
    };
  }
  return body;
}