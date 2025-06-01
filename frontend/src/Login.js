import React, { useState } from 'react';
import api from './api';
import { message } from 'antd';

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
  inputFocus: {
    borderColor: '#007bff',
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
  btnMainHover: {
    backgroundColor: '#0056b3',
  },
  btnMainDisabled: {
    backgroundColor: '#ccc',
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
};

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
      const response = await api.post('/api/login', { email, password });
      console.log(response);
      
      if (response.code === 200) {
        // 保存 token
        localStorage.setItem('token', response.token);

        // 弹窗提示
        message.success('登录成功！即将进入聊天界面');

        // 跳转到聊天界面
        setTimeout(() => {
          window.location.href = '/chat';
        }, 1000);

        // 兼容 onLogin 回调
        onLogin && onLogin(response.token, response.userId);
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (e) {
      message.error('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.body}>
      <div style={styles.card}>
        <h2>账号登录</h2>
        <div style={styles.inputGroup}>
          <label>邮箱</label>
          <input style={styles.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="请输入邮箱" />
        </div>
        <div style={styles.inputGroup}>
          <label>密码</label>
          <input type="password" style={styles.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" />
        </div>
        <button style={styles.btnMain} onClick={login} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
        <button style={styles.btnLink} onClick={() => onSwitch('register')}>没有账号？去注册</button>
        <div style={styles.msg}>{msg}</div>
      </div>
    </div>
  );
}