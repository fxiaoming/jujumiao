// src/Chat.js
import React, { useState } from 'react';
import { post } from './api';

export default function Chat() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [msg, setMsg] = useState('');

  const userId = localStorage.getItem('userId');

  const createConversation = async () => {
    const res = await fetch('/api/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });
    const data = await res.json();
    if (data.code === 200) {
      setConversationId(data.conversationId);
      setChatHistory([]);
      setMsg('新会话已创建');
    } else {
      setMsg(data.message);
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) {
      setMsg('请先创建会话并输入内容');
      return;
    }
    setChatHistory([...chatHistory, { text: input, isUser: true }]);
    setInput('');
    const res = await post('/api/chat', { message: input, conversationId });
    setChatHistory(his => [...his, { text: res.data, isUser: false }]);
  };

  return (
    <div>
      <h2>AI 聊天</h2>
      <button onClick={createConversation}>新建会话</button>
      <div className="msg">{msg}</div>
      <div className="chat-history">
        {chatHistory.map((item, i) => (
          <div key={i} className={item.isUser ? 'user-msg' : 'ai-msg'}>
            {item.text}
          </div>
        ))}
      </div>
      <form onSubmit={sendMsg} className="chat-form">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="输入内容" />
        <button type="submit">发送</button>
      </form>
    </div>
  );
}