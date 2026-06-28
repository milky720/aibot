import ReactMarkdown from './ReactMarkdown';

export default function ChatMessage({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🤖'}
      </div>
      <div className="message-content">
        {isUser ? (
          <p>{message.content}</p>
        ) : (
          <ReactMarkdown content={message.content} />
        )}
        {message.isLoading && <span className="typing-indicator">▋</span>}
        {message.error && <span className="error-text">⚠️ {message.error}</span>}
      </div>
    </div>
  );
}
