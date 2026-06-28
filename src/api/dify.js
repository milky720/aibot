const BASE_URL = 'https://api.dify.ai/v1';
const API_KEY = 'app-m50KD7lHbjPnygpC2NWUhVXl';

const headers = {
  'Authorization': `Bearer ${API_KEY}`,
  'Content-Type': 'application/json',
};

/**
 * 发送聊天消息 - 阻塞模式（等待完整响应）
 */
export async function sendMessageBlocking(query, conversationId = '', user = 'web-user') {
  const res = await fetch(`${BASE_URL}/chat-messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'blocking',
      conversation_id: conversationId,
      user,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }

  return res.json();
}

/**
 * 发送聊天消息 - 流式模式（SSE）
 * @param {string} query - 用户问题
 * @param {string} conversationId - 会话ID
 * @param {string} user - 用户标识
 * @param {function} onMessage - 收到增量消息时的回调 (text, messageId, conversationId)
 * @param {function} onEnd - 流结束时的回调 (metadata)
 * @param {function} onError - 错误回调
 * @returns {AbortController} 用于取消请求
 */
export function sendMessageStreaming(query, conversationId = '', user = 'web-user', { onMessage, onEnd, onError } = {}) {
  const controller = new AbortController();

  fetch(`${BASE_URL}/chat-messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: {},
      query,
      response_mode: 'streaming',
      conversation_id: conversationId,
      user,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        onError && onError(new Error(err.message || `API Error: ${response.status}`));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const data = JSON.parse(line.slice(5).trim());
              if (data.event === 'message') {
                onMessage && onMessage(data.answer || '', data.message_id, data.conversation_id);
              } else if (data.event === 'message_end') {
                onEnd && onEnd(data.metadata || {}, data.conversation_id, data.message_id);
              } else if (data.event === 'error') {
                onError && onError(new Error(data.message || 'Stream error'));
              }
            } catch (e) {
              // 跳过无法解析的行
            }
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError && onError(err);
      }
    });

  return controller;
}

/**
 * 获取会话列表
 */
export async function getConversations(user = 'web-user', limit = 50) {
  const res = await fetch(`${BASE_URL}/conversations?user=${encodeURIComponent(user)}&limit=${limit}`, {
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }

  return res.json();
}

/**
 * 获取消息历史
 */
export async function getMessages(conversationId, user = 'web-user', limit = 100) {
  const res = await fetch(
    `${BASE_URL}/messages?user=${encodeURIComponent(user)}&conversation_id=${encodeURIComponent(conversationId)}&limit=${limit}`,
    { headers }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API Error: ${res.status}`);
  }

  return res.json();
}
