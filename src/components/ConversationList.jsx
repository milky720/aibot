export default function ConversationList({ conversations, activeId, onSelect, onNew, loading }) {
  return (
    <div className="conversation-list">
      <button className="new-conversation-btn" onClick={onNew} disabled={loading}>
        + 新对话
      </button>
      <div className="conversation-items">
        {loading && <div className="loading-text">加载中...</div>}
        {!loading && conversations.length === 0 && (
          <div className="empty-text">暂无对话记录</div>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`conversation-item ${activeId === conv.id ? 'active' : ''}`}
            onClick={() => onSelect(conv)}
          >
            <span className="conv-icon">💬</span>
            <div className="conv-info">
              <div className="conv-name">{conv.name || '新对话'}</div>
              <div className="conv-time">
                {new Date(conv.updated_at * 1000).toLocaleString('zh-CN')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
