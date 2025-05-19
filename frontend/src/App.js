// import React, { useState, useEffect } from 'react';
// import './App.css';
// import ReactMarkdown from 'react-markdown';
// import img from '@img/miaomiaoAi.png';


// function App() {
  
//   const [inputMessage, setInputMessage] = useState('');
//   const [chatHistory, setChatHistory] = useState([]);
//   const [currentConversationId, setCurrentConversationId] = useState(null);

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!inputMessage.trim()) return;

//     // 添加用户消息到聊天历史
//     setChatHistory(prev => [...prev, { text: inputMessage, isUser: true }]);
//     setInputMessage('');

//     const abortController = new AbortController();
//     const { signal } = abortController;

//     const startTime = Date.now();
//     fetch('http://localhost:8000/api/chat', { // 替换为实际后端URL
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ message: inputMessage }),
//       signal,
//     })
//     .then((response) => {
//       console.log(response);
      
//       if (!response.ok) {
//         throw new Error(`HTTP 错误! 状态码: ${response.status}`);
//       }
//       const reader = response.body.getReader();
//       const decoder = new TextDecoder();
//       let aiResponse = '';

//       const readStream = async () => {
//         while (true) {
//           const { done, value } = await reader.read();
          
//           if (done) {
//             const responseTime = `${(Date.now() - startTime) / 1000}s`;
//             setChatHistory(prev => [...prev, {
//               text: aiResponse,
//               isUser: false,
//               time: responseTime,
//               avatar: img // 添加随机头像
//             }]);
//             break;
//           }
//           const chunk = decoder.decode(value, { stream: true });
//           const res = JSON.parse(chunk)
//           if (+res.code === 200) {
//             aiResponse += res .data;
//           }
//         }
//       };

//       readStream();
//     })
//     .catch((error) => {
//       if (error.name !== 'AbortError') {
//         console.error('请求失败:', error);
//       }
//     });

//     return () => {
//       abortController.abort();
//     };
//   };

//   const createNewConversation = () => {
//     fetch('http://localhost:8000/api/conversation', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//     })
//     .then(response => response.json())
//     .then(data => {
//       if (data.code === 200) {
//         setCurrentConversationId(data.conversationId);
//         setChatHistory([]); // 清空聊天记录
//       }
//     })
//     .catch(error => console.error('创建会话失败:', error));
//   };

//   return (
//     <div className="App">
//       <h1>This is a chat</h1>
//       <button onClick={createNewConversation} className="new-conversation-button">
//         创建新会话
//       </button>
//       <div className="response-container">
//       {chatHistory.map((item, index) => (
//           <div 
//             key={index} 
//             className={`chat-item ${item.isUser ? 'user-message' : 'ai-message'}`}
//           >
//             <div className="message-content">
//               {item.isUser ? (
//                 <div>{item.text}</div>
//               ) : (
//                 <>
//                   <img 
//                     src={item.avatar} 
//                     alt="AI Avatar" 
//                     className="ai-avatar"
//                   />
//                   <ReactMarkdown>{item.text}</ReactMarkdown>
//                   <div className="time-info">用时: {item.time || '0s'}</div>
//                 </>
//               )}
//             </div>
//           </div>
//         ))}
//       </div>
//       <form onSubmit={handleSubmit} className="form-container">
//         <input
//           type="text"
//           value={inputMessage}
//           onChange={(e) => setInputMessage(e.target.value)}
//           placeholder="输入消息并发送"
//           className="input-box"
//         />
//         <button type="submit" className="send-button">
//           发送请求
//         </button>
//       </form>
//     </div>
//   );
// }

// export default App;

// src/App.js
// import React, { useState } from 'react';
// import Register from './Register';
// import Login from './Login';
// import Chat from './Chat';
// import './App.css';
// import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import ProtectedRoute from './ProtectedRoute';

// function App() {
//   const [page, setPage] = useState('login');
//   const [userId, setUserId] = useState(localStorage.getItem('userId') || '');

//   if (!userId) {
//     return (
//       <div className="main-box">
//         {page === 'login'
//           ? <Login onLogin={setUserId} onSwitch={setPage} />
//           : <Register onSwitch={setPage} />}
//       </div>
//     );
//   }

//   return (
//     <div className="main-box">
//       <button className="btn-link" style={{ float: 'right' }} onClick={() => { localStorage.removeItem('userId'); setUserId(''); }}>退出登录</button>
//       <Chat />
//     </div>
//   );
// }

// export default App;

import React from 'react';
import Register from './Register';
import Login from './Login';
import Chat from './Chat';
import './App.css';
import ProtectedRoute from './ProtectedRoute';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';

function AppRoutes() {
  const navigate = useNavigate();
  // 切换登录/注册
  const handleSwitch = (type) => {
    if (type === 'register') {
      navigate('/register');
    } else if (type === 'login') {
      navigate('/login');
    }
  };
  return (
    <Routes>
      <Route path="/login" element={<Login onSwitch={handleSwitch} />} />
      <Route path="/register" element={<Register onSwitch={handleSwitch} />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="main-box">
      <Router>
        <AppRoutes />
      </Router>
    </div>
  );
}

export default App;