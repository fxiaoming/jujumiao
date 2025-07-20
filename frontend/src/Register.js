import React, { useState } from 'react';
import api from './api';

const styles = {
  body: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    margin: 0,
    background: 'linear-gradient(135deg, #e0e7ff 0%, #f0f2f5 100%)',
    fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    padding: '30px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '20px',
    textAlign: 'left',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    transition: 'border-color 0.3s',
  },
  btnMain: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background-color 0.3s',
  },
  btnLink: {
    marginTop: '15px',
    background: 'none',
    border: 'none',
    color: '#007bff',
    cursor: 'pointer',
    fontSize: '14px',
  },
  msg: {
    marginTop: '15px',
    color: 'red',
    textAlign: 'center',
  },
  inputGroupRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '18px',
  },
  inputCode: {
    flex: 1,
    padding: '12px 14px',
    border: '1px solid #e5e6eb',
    borderRadius: '8px',
    fontSize: '16px',
    background: '#f7f8fa',
    transition: 'border 0.2s',
    outline: 'none',
  },
  btnCode: {
    padding: '0 18px',
    height: '44px',
    background: 'linear-gradient(90deg, #6c63ff 0%, #4f8cff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
    boxShadow: '0 2px 8px rgba(76, 99, 255, 0.08)',
    whiteSpace: 'nowrap',
    marginLeft: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

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
    const data = await api.post('/backend/api/sendCode', { email });
    setMsg(data.message);
    setSending(false);
    setCount(60);
  };

  const register = async () => {
    if (!email || !code || !password) return setMsg('请填写完整信息');
    const data = await api.post('/backend/api/register', { email, password, code });
    setMsg(data.message);
    if (data.code === 200) setTimeout(() => onSwitch('login'), 1200);
  };

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        <h2>注册新账号</h2>
        <div style={styles.inputGroup}>
          <label>邮箱</label>
          <input style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
        </div>
        <div style={styles.inputGroupRow}>
          <input
            style={styles.inputCode}
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="请输入验证码"
          />
          <button
            style={styles.btnCode}
            onClick={sendCode}
            disabled={count > 0 || sending}
            type="button"
          >
            {count > 0 ? `${count}s后重发` : '获取验证码'}
          </button>
        </div>
        <div style={styles.inputGroup}>
          <label>密码</label>
          <input type="password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="设置密码" />
        </div>
        <button style={styles.btnMain} onClick={register}>注册</button>
        <button style={styles.btnLink} onClick={() => onSwitch('login')}>已有账号？去登录</button>
        <div style={styles.msg}>{msg}</div>
      </div>
    </div>
  );
}