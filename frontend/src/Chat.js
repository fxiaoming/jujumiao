// src/Chat.js
import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';

export default function Chat() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [msg, setMsg] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    // Fetch existing conversations
    const fetchConversations = async () => {
      const res = await api.post('/api/conversations', {});
      if (res.code === 200) {
        setConversations(res.conversations);
      }
    };
    fetchConversations();
  }, []);

  const createConversation = async () => {
    const res = await api.post('/api/conversation', {});
    if (res.code === 200) {
      setConversations([...conversations, res.conversation]);
      setSelectedConversation(res.conversation);
      setConversationId(res.conversation.id);
      setChatHistory([]);
      setMsg('新会话已创建');
    } else {
      setMsg(res.message);
    }
  };

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    setConversationId(conversation.id);
    // Fetch chat history for the selected conversation
    // This is a placeholder, replace with actual API call
    setChatHistory(conversation.history || []);
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim() || !conversationId) {
      setMsg('请先创建会话并输入内容');
      return;
    }
    setChatHistory([...chatHistory, { text: input, isUser: true }]);
    setInput('');
    const res = await api.post('/api/chat', { message: input, conversationId });
    setChatHistory(his => [...his, { text: res.data, isUser: false }]);
  };

  return (
    <div className="main-box" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ display: 'flex', flex: 1, backgroundColor: '#f0f2f5' }}>
        {/* 左侧导航栏 */}
        <div style={{ width: '250px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative' }}>
          <div style={{ marginBottom: '20px', textAlign: 'left', fontWeight: 'bold', fontSize: '22px' }}>JUJU MIAO</div>
          <button className="btn-main" onClick={createConversation} style={{ width: '60%' }}>开启新对话</button>
          {/* 底部信息栏 */}
          <div style={{ padding: '10px', position: 'absolute', bottom: '0', left: '0', width: '100%' }}>
            <p style={{ fontSize: '14px', color: '#888' }}>个人信息</p>
          </div>
        </div>
        {/* 主内容区域 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <div className="chat-history" style={{ width: '60%', flex: 1, overflowY: 'auto', padding: '20px', borderRadius: '8px' }}>
            {chatHistory.map((item, i) => (
              <div key={i} className={item.isUser ? 'user-msg' : 'ai-msg'} style={{ marginBottom: '10px', padding: '10px', borderRadius: '8px', backgroundColor: item.isUser ? '#e0e7ff' : '#f0f0f0', transition: 'background-color 0.3s' }}>
                {item.text}
              </div>
            ))}
          </div>
          {/* 输入区域 */}
          <form onSubmit={sendMsg} className="chat-form" style={{ width: '60%', display: 'flex', padding: '10px', backgroundColor: '#fff', borderRadius: '8px', marginTop: '10px' }}>
            <input className="input-code" value={input} onChange={e => setInput(e.target.value)} placeholder="输入内容" style={{ flex: 1, marginRight: '10px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
            <button className="btn-main" type="submit" style={{ padding: '10px 20px', borderRadius: '4px' }}>发送</button>
          </form>
        </div>
      </div>
    </div>
  );
}