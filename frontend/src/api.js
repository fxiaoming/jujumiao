// src/api.js

class API {
  async get(url, options = {}) {
    const res = await fetch(url, {
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
    const res = await fetch(url, {
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
