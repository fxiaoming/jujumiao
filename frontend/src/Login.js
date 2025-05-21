import React, { useState } from 'react';
import { post } from './api';
import { message } from 'antd';

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!email || !password) {
      message.warning('请填写邮箱和密码');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const data = await post('/api/login', { email, password });
      if (data.code === 200) {
        // 保存 token
        localStorage.setItem('token', data.token);

        // 弹窗提示
        message.success('登录成功！即将进入聊天界面');

        // 跳转到聊天界面
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1000);

        // 兼容 onLogin 回调
        onLogin && onLogin(data.token, data.userId);
      } else {
        message.error(data.message || '登录失败');
      }
    } catch (e) {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>账号登录</h2>
      <div className="input-group">
        <label>邮箱</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
      </div>
      <div className="input-group">
        <label>密码</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
      </div>
      <button className="btn-main" onClick={login} disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
      <button className="btn-link" onClick={() => onSwitch('register')}>没有账号？去注册</button>
      <div className="msg">{msg}</div>
    </div>
  );
}