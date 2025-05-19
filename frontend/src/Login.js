import React, { useState } from 'react';
import { post } from './api';

export default function Login({ onLogin, onSwitch }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const login = async () => {
    if (!email || !password) return setMsg('请填写邮箱和密码');
    const data = await post('/api/login', { email, password });
    if (data.code === 200) {
      setMsg('登录成功');
      localStorage.setItem('userId', data.userId);
      onLogin && onLogin(data.userId);
    } else {
      setMsg(data.message);
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
      <button className="btn-main" onClick={login}>登录</button>
      <button className="btn-link" onClick={() => onSwitch('register')}>没有账号？去注册</button>
      <div className="msg">{msg}</div>
    </div>
  );
}