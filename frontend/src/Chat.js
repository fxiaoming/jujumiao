// src/Chat.js
import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const res = await api.get('/api/conversation', {});
      if (res.code === 200) {
        setConversations(res.data);
      }
    };
    fetchConversations();
  }, []);

  const createConversation = async () => {
    const res = await api.post('/api/conversation', {});
    if (res.code === 200) {
      setConversations([...conversations, res.data]);
      setSelectedConversation(res.data);
      setChatHistory([]);
      toast.success('新会话已创建');
    } else {
      toast.error(res.message);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setConversationId(conversation.cid);
    const res = await api.get(`/api/conversation/${conversation.cid}/context`);
    if (res.code === 200) {
      const history = res.context.map(item => ({
        text: item.content,
        isUser: item.role === 'user'
      }));
      setChatHistory(history);
    } else {
      toast.error('获取会话详情失败');
    }
  };

  const sendMsg = async (e) => {
    e.preventDefault();
    if (!input.trim()) {
      toast.warning('请输入内容');
      return;
    }
    setChatHistory([...chatHistory, { text: input, isUser: true }]);
    setInput('');
    const res = await api.post('/api/chat', { message: input, conversationId });
    if (res.code === 200) {
      setConversationId(res.data.conversationId); // 更新会话ID
      setChatHistory(his => [...his, { text: res.data.content, isUser: false }]);
    } else {
      toast.error('消息发送失败');
    }
  };

  return (
    <div className="main-box" style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <div style={{ display: 'flex', flex: 1, backgroundColor: '#f0f2f5' }}>
        <div style={{ width: '250px', padding: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', position: 'relative' }}>
          <div style={{ marginBottom: '20px', textAlign: 'left', fontWeight: 'bold', fontSize: '22px' }}>JUJU MIAO</div>
          <button className="btn-main" onClick={createConversation} style={{ width: '60%' }}>开启新对话</button>
          <div style={{ marginTop: '20px' }}>
            {conversations.map((conv, index) => (
              <div
                key={index}
                onClick={() => selectConversation(conv)}
                style={{
                  cursor: 'pointer',
                  marginBottom: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  // backgroundColor: '#f5f5f5',
                  // boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e0e0'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f2f5'}
              >
                {conv.calMessage ? conv.calMessage.substring(0, 10) : '点击查看详情'}
              </div>
            ))}
          </div>
          <div style={{ padding: '10px', position: 'absolute', bottom: '0', left: '0', width: '100%' }}>
            <p style={{ fontSize: '14px', color: '#888' }}>个人信息</p>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <div className="chat-history" style={{ width: '60%', flex: 1, overflowY: 'auto', padding: '20px', borderRadius: '8px' }}>
            {chatHistory.map((item, i) => (
              <div key={i} className={item.isUser ? 'user-msg' : 'ai-msg'} style={{ marginBottom: '10px', padding: '10px', borderRadius: '8px', backgroundColor: item.isUser ? '#e0e7ff' : '#f0f0f0', transition: 'background-color 0.3s' }}>
                <ReactMarkdown>{item.text}</ReactMarkdown>
              </div>
            ))}
          </div>
          <form onSubmit={sendMsg} className="chat-form" style={{ width: '60%', display: 'flex', padding: '10px', backgroundColor: '#fff', borderRadius: '8px', marginTop: '10px' }}>
            <input className="input-code" value={input} onChange={e => setInput(e.target.value)} placeholder="输入内容" style={{ flex: 1, marginRight: '10px', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }} />
            <button className="btn-main" type="submit" style={{ padding: '10px 20px', borderRadius: '4px' }}>发送</button>
          </form>
        </div>
      </div>
    </div>
  );
}