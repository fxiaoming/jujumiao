// src/Chat.js
import React, { useState, useEffect } from 'react';
import api from './api';
import './App.css';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { Button, Popover, Upload } from 'antd';
import { CloseOutlined, UploadOutlined } from '@ant-design/icons';

export default function Chat() {
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [conversationId, setConversationId] = useState('');
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [isDeepThinkSelected, setDeepThinkSelected] = useState(false);
  const [isWebSearchSelected, setWebSearchSelected] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [skill, setSkill] = useState(false);
  const [file, setFile] = useState(null);
  const [filename, setFileName] = useState(null);

  useEffect(() => {
    const fetchConversations = async () => {
      const res = await api.get('/backend/api/conversation', {});
      if (res.code === 200) {
        setConversations(res.data);
      }
    };
    fetchConversations();
  }, []);

  const createConversation = async () => {
    const res = await api.post('/backend/api/conversation', {});
    if (res.code === 200) {
      const newConversation = { cid: res.conversationId, calMessage: '' };
      setConversations([...conversations, newConversation]);
      setSelectedConversation(newConversation);
      setConversationId(res.conversationId);
      setChatHistory([]);
      toast.success('新会话已创建');
    } else {
      toast.error(res.message);
    }
  };

  const selectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setConversationId(conversation.cid);
    const res = await api.get(`/backend/api/conversation/${conversation.cid}/context`);
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
    let text = input;
    if (skill === '文件专家') {
      if (!file) return toast.warning('请上传文件');
      text += `文件：${filename}`
    }
    setChatHistory([...chatHistory, { text, isUser: true }]);
    setInput('');
    const res = await api.post('/backend/api/chat', { message: input, conversationId, filePath: file });
    if (res.code === 200) {
      setConversationId(res.data.conversationId); // 更新会话ID
      setChatHistory(his => [...his, { text: res.data.content, isUser: false }]);
    } else {
      toast.error('消息发送失败');
    }
  };

  const fetchUserInfo = async () => {
    const res = await api.get('/backend/api/userInfo');
    if (res.code === 200) {
      setUserEmail(res.email);
      setShowUserInfo(true);
    } else {
      toast.error('获取用户信息失败');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('已退出登录');
    window.location.href = '/login';
  };

  const handleModelSelect = (event) => {
    event.preventDefault();
    // 自定义模型选择逻辑
    console.log("模型选择");
  };

  const handleSkillSelect = (event) => {
    event.preventDefault();
    setShowUpload(true);
    console.log("技能选择");
  };

  const toggleDeepThink = (event) => {
    event.preventDefault();
    setDeepThinkSelected(!isDeepThinkSelected);
  };

  const toggleWebSearch = (event) => {
    event.preventDefault();
    setWebSearchSelected(!isWebSearchSelected);
  };

  const toggleUploadFile = (event) => {
    event.preventDefault();
  };

  const handleModelClick = (event, model) => {
    event.preventDefault();
    if (model) {
      setSelectedModel(model);
    }
    console.log(`Selected model: ${model}`);
  };

  const handleSkillClick = (event, skill) => {
    event.preventDefault();
    if (skill === '文件专家') {
      setShowUpload(true);
      setSkill('文件专家');
      setInput('将文件：  ');
    }
    console.log(`Selected skill: ${skill}`);
  };

  const handleCloseUpload = () => {
    setShowUpload(false);
    setInput('');
  };

  const handleUpload = ({ file }) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('filename', file.name);
  
    // formData
    fetch('/backend/api/upload', {
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(res => {
        console.log('File uploaded successfully:', res);
        setFile(res.data.file_path);
        setFileName(res.data.file_name);
      })
      .catch(error => {
        console.error('Error uploading file:', error);
      });
  };

  return (
    <div className="main-box" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', backgroundColor: '#f0f2f5' }}>
      <div style={{ display: 'flex', flex: 1, backgroundColor: '#f0f2f5' }}>
        <div style={{
          width: '250px',
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          position: 'relative'
        }}>
          <div style={{ marginBottom: '20px', textAlign: 'left', fontWeight: 'bold', fontSize: '22px' }}>JUJU MIAO</div>
          <button className="btn-main" onClick={createConversation} style={{ width: '60%' }}>开启新对话</button>
          <div style={{ marginTop: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)', borderRadius: '8px' }}>
            {conversations.map((conv, index) => (
              <div
                key={index}
                onClick={() => selectConversation(conv)}
                style={{
                  cursor: 'pointer',
                  marginBottom: '10px',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: selectedConversation && selectedConversation.cid === conv.cid ? '#e0e7ff' : '#f0f2f5',
                  transition: 'background-color 0.3s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedConversation && selectedConversation.cid === conv.cid ? '#e0e7ff' : '#f0f2f5'}
              >
                {conv.calMessage ? conv.calMessage.substring(0, 10) : '点击查看详情'}
              </div>
            ))}
          </div>
          <Popover
            content={
              <div>
                <p>邮箱: {userEmail}</p>
                <button onClick={handleLogout} style={{ marginTop: '10px' }}>退出登录</button>
              </div>
            }
            title="用户信息"
            trigger="click"
            open={showUserInfo}
            onOpenChange={(visible) => {
              if (visible) {
                fetchUserInfo();
              }
              setShowUserInfo(visible);
            }}
            placement="topLeft"
          >
            <div style={{
              padding: '10px',
              position: 'absolute',
              bottom: '0',
              left: '0',
              width: '250px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '10px', color: '#888' }} />
              <p style={{ fontSize: '14px', color: '#888' }}>个人信息</p>
            </div>
          </Popover>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
          <div className="chat-history" style={{ width: '45%', flex: 1, overflowY: 'auto', padding: '20px', borderRadius: '8px', maxHeight: 'calc(100vh - 200px)' }}>
            {chatHistory.map((item, i) => (
              <div key={i} className={item.isUser ? 'user-msg' : 'ai-msg'} style={{ marginBottom: '10px', padding: '10px', borderRadius: '8px', backgroundColor: item.isUser ? '#e0e7ff' : '#f0f0f0', transition: 'background-color 0.3s' }}>
                <ReactMarkdown>{item.text}</ReactMarkdown>
              </div>
            ))}
          </div>
          <form onSubmit={sendMsg} className="chat-form" style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', backgroundColor: '#f0f2f5', borderRadius: '8px', marginTop: '10px' }}>
            <div style={{ display: 'flex', width: '100%', marginBottom: '10px' }}>
              <input className="input-code" value={input} onChange={e => setInput(e.target.value)} placeholder="输入内容" style={{ flex: 1, marginRight: '10px', padding: '15px', borderRadius: '20px', border: '1px solid #ddd', backgroundColor: '#fff' }} />
            </div>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
              <div>
                <Popover
                  content={
                    <div
                      onClick={(e) => handleModelClick(e, 'DeepSeek-R1')}
                      style={{
                        width: '200px',
                        padding: '10px',
                        cursor: 'pointer',
                        backgroundColor: selectedModel === 'DeepSeek-R1' ? '#e0e7ff' : '#fff',
                        transition: 'background-color 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedModel === 'DeepSeek-R1' ? '#e0e7ff' : '#fff'}
                    >
                      DeepSeek-R1
                    </div>
                  }
                  trigger="click"
                  onOpenChange={(visible) => {
                    
                  }}
                >
                  <button className="option-btn" onClick={(e) => handleModelClick(e)} style={{ marginRight: '10px', padding: '10px 20px', borderRadius: '20px', backgroundColor: '#e0e7ff', color: '#007bff', border: 'none' }}>模型选择</button>
                </Popover>
                <Popover
                  content={
                    <div
                      onClick={(e) => handleSkillClick(e, '文件专家')}
                      style={{
                        width: '200px',
                        padding: '10px',
                        cursor: 'pointer',
                        backgroundColor: selectedModel === '文件专家' ? '#e0e7ff' : '#fff',
                        transition: 'background-color 0.3s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e0e7ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedModel === '文件专家' ? '#e0e7ff' : '#fff'}
                    >
                      文件专家
                    </div>
                  }
                  trigger="click"
                >
                  <button className="option-btn" onClick={(e) => handleSkillClick(e)} style={{ marginRight: '10px', padding: '10px 20px', borderRadius: '20px', backgroundColor: '#e0e7ff', color: '#007bff', border: 'none' }}>技能</button>
                </Popover>
                <button
                  className="option-btn"
                  onClick={toggleDeepThink}
                  style={{
                    marginRight: '10px',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    backgroundColor: isDeepThinkSelected ? '#007bff' : '#fff',
                    color: isDeepThinkSelected ? '#fff' : '#007bff',
                    border: '1px solid #007bff'
                  }}
                >
                  深度思考 (R1)
                </button>
                <button
                  className="option-btn"
                  onClick={toggleWebSearch}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    backgroundColor: isWebSearchSelected ? '#007bff' : '#fff',
                    color: isWebSearchSelected ? '#fff' : '#007bff',
                    border: '1px solid #007bff'
                  }}
                >
                  联网搜索
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                {showUpload && (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <Upload
                      onChange={handleUpload}
                      showUploadList={false}
                      beforeUpload={() => false}
                    >
                      <button
                        className="option-btn"
                        onClick={toggleUploadFile}
                        style={{
                          marginRight: '10px',
                          padding: '10px 20px',
                          borderRadius: '20px',
                          backgroundColor: '#fff',
                          color: '#007bff',
                          border: '1px solid #007bff',
                          position: 'relative'
                        }}
                      >
                        上传文件
                      </button>
                    </Upload>
                    <CloseOutlined
                      onClick={handleCloseUpload}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-2px',
                        fontSize: '17px',
                        cursor: 'pointer',
                        color: '#ff4d4f'
                      }}
                    />
                  </div>
                )}
                <button className="btn-main" type="submit" style={{ padding: '10px 20px', borderRadius: '20px', backgroundColor: '#007bff', color: '#fff', border: 'none' }}>发送</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}