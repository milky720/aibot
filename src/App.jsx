import { useState, useRef, useCallback, useEffect } from 'react';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import ConversationList from './components/ConversationList';
import {
  sendMessageBlocking,
  sendMessageStreaming,
  getConversations,
  getMessages,
} from './api/dify';
import './App.css';

const USER_ID = 'web-user-' + Date.now();

function App() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [convLoading, setConvLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [useStreaming, setUseStreaming] = useState(true);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);
  const abortRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // 加载会话列表
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const data = await getConversations(USER_ID);
      setConversations(data.data || []);
      setConvLoading(false);
      return data.data || [];
    } catch (err) {
      setError('加载会话列表失败: ' + err.message);
      setConvLoading(false);
      return [];
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 加载消息历史
  const loadMessages = useCallback(async (conversationId) => {
    try {
      const data = await getMessages(conversationId, USER_ID);
      const msgs = (data.data || []).map((m) => ({
        id: m.id,
        role: m.query ? 'user' : 'assistant',
        content: m.query || m.answer,
      }));
      // 按时间排序，交替排列
      const ordered = [];
      for (const m of msgs) {
        if (m.role === 'user') {
          ordered.push(m);
        } else {
          // 找到对应的 assistant 回答
          ordered.push(m);
        }
      }
      setMessages(ordered);
    } catch (err) {
      setError('加载消息历史失败: ' + err.message);
    }
  }, []);

  // 选择会话
  const handleSelectConversation = (conv) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setActiveConversationId(conv.id);
    setError('');
    setSending(false);
    loadMessages(conv.id);
  };

  // 新建会话
  const handleNewConversation = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    setActiveConversationId('');
    setMessages([]);
    setError('');
    setSending(false);
  };

  // 发送消息
  const handleSend = async (query) => {
    if (sending) return;
    setError('');

    const userMsg = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: query,
    };

    const assistantMsg = {
      id: 'assistant-' + Date.now(),
      role: 'assistant',
      content: '',
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setSending(true);

    if (useStreaming) {
      // 流式模式
      const assistantId = assistantMsg.id;
      abortRef.current = sendMessageStreaming(query, activeConversationId, USER_ID, {
        onMessage: (text, msgId, convId) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: m.content + text, isLoading: true }
                : m
            )
          );
          // 如果是新会话，更新 conversationId
          if (convId && !activeConversationId) {
            setActiveConversationId(convId);
          }
        },
        onEnd: (metadata, convId) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isLoading: false } : m
            )
          );
          setSending(false);
          abortRef.current = null;

          // 重新加载会话列表（如果有新会话）
          if (convId) {
            loadConversations();
          }
        },
        onError: (err) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, isLoading: false, error: err.message }
                : m
            )
          );
          setSending(false);
          abortRef.current = null;
          setError(err.message);
        },
      });
    } else {
      // 阻塞模式
      try {
        const data = await sendMessageBlocking(query, activeConversationId, USER_ID);
        const assistantId = assistantMsg.id;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: data.answer, isLoading: false, messageId: data.message_id }
              : m
          )
        );
        if (data.conversation_id && !activeConversationId) {
          setActiveConversationId(data.conversation_id);
          loadConversations();
        }
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, isLoading: false, error: err.message }
              : m
          )
        );
        setError(err.message);
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>💬 Dify Chat</h2>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          loading={convLoading}
        />
        <div className="sidebar-footer">
          <label className="stream-toggle">
            <input
              type="checkbox"
              checked={useStreaming}
              onChange={(e) => setUseStreaming(e.target.checked)}
            />
            <span>流式响应</span>
          </label>
        </div>
      </div>
      <div className="main">
        <div className="chat-header">
          <h3>
            {activeConversationId
              ? (conversations.find((c) => c.id === activeConversationId)?.name || '对话中...')
              : '新对话'}
          </h3>
        </div>
        <div className="message-list">
          {messages.length === 0 && (
            <div className="welcome">
              <div className="welcome-icon">🤖</div>
              <h2>有什么我可以帮助你的？</h2>
              <p>在下方输入你的问题，开始与 AI 对话</p>
            </div>
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {sending && useStreaming && (
            <div className="streaming-hint">AI 正在回复中...</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        {error && (
          <div className="error-bar">
            {error}
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={sending && !useStreaming} />
      </div>
    </div>
  );
}

export default App;
