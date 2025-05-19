import React, { useState } from 'react';
import { post } from './api';

export default function Register({ onSwitch }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [count, setCount] = useState(0);

  // 倒计时
  React.useEffect(() => {
    if (count > 0) {
      const timer = setTimeout(() => setCount(count - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [count]);

  const sendCode = async () => {
    if (!email) return setMsg('请输入邮箱');
    setSending(true);
    const data = await post('/api/sendCode', { email });
    setMsg(data.message);
    setSending(false);
    setCount(60);
  };

  const register = async () => {
    if (!email || !code || !password) return setMsg('请填写完整信息');
    const data = await post('/api/register', { email, password, code });
    setMsg(data.message);
    if (data.code === 200) setTimeout(() => onSwitch('login'), 1200);
  };

  return (
    <div className="card">
      <h2>注册新账号</h2>
      <div className="input-group">
        <label>邮箱</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
      </div>
      <div className="input-group input-group-row">
        <input
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="请输入验证码"
          className="input-code"
        />
        <button
          className="btn-code"
          onClick={sendCode}
          disabled={count > 0 || sending}
          type="button"
        >
          {count > 0 ? `${count}s后重发` : '获取验证码'}
        </button>
      </div>
      <div className="input-group">
        <label>密码</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="设置密码" />
      </div>
      <button className="btn-main" onClick={register}>注册</button>
      <button className="btn-link" onClick={() => onSwitch('login')}>已有账号？去登录</button>
      <div className="msg">{msg}</div>
    </div>
  );
}