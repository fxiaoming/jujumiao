// src/api.js

// API 基础路径配置
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/backend';

class API {
  async get(url, options = {}) {
    // 确保 URL 以 /backend 开头
    const fullUrl = url.startsWith('/backend') ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options,
      },
    });
    return this.handleResponse(res);
  }

  async post(url, data, options = {}) {
    // 确保 URL 以 /backend 开头
    const fullUrl = url.startsWith('/backend') ? url : `${API_BASE_URL}${url}`;
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: {  
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        ...options,
      },
      body: JSON.stringify(data),
    });
    return this.handleResponse(res);
  }

  async handleResponse(res) {
    if (res.status === 401) {
      // 清理 token
      localStorage.removeItem('token');
      // 重定向到登录页面
      window.location.href = '/login';
      return Promise.reject(new Error('未授权，请重新登录'));
    } else if (res.status === 500) {
      return Promise.reject(new Error('服务器错误'));
    }
    return res.json();
  }
}

const api = new API();
export default api;
