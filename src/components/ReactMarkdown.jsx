/**
 * 简单的 Markdown 渲染器
 * 支持：粗体、斜体、代码块、行内代码、链接、标题、列表
 */
export default function ReactMarkdown({ content }) {
  if (!content) return null;

  // 按行分割处理
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${i}`} className="md-code-block">
            <code>{codeBlockContent}</code>
          </pre>
        );
        codeBlockContent = '';
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent += (codeBlockContent ? '\n' : '') + line;
      continue;
    }

    if (line.trim() === '') {
      elements.push(<div key={i} className="md-empty" />);
      continue;
    }

    // 标题
    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="md-h4">{renderInline(line.slice(4))}</h4>);
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="md-h3">{renderInline(line.slice(3))}</h3>);
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={i} className="md-h2">{renderInline(line.slice(2))}</h2>);
    }
    // 无序列表
    else if (line.match(/^[\-\*]\s/)) {
      elements.push(<li key={i} className="md-li">{renderInline(line.replace(/^[\-\*]\s/, ''))}</li>);
    }
    // 有序列表
    else if (line.match(/^\d+\.\s/)) {
      elements.push(<li key={i} className="md-li">{renderInline(line.replace(/^\d+\.\s/, ''))}</li>);
    }
    // 引用
    else if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={i} className="md-quote">
          {renderInline(line.slice(2))}
        </blockquote>
      );
    }
    // 分割线
    else if (line.match(/^[\-\*\_]{3,}$/)) {
      elements.push(<hr key={i} className="md-hr" />);
    }
    // 普通段落
    else {
      elements.push(<p key={i} className="md-p">{renderInline(line)}</p>);
    }
  }

  // 处理未闭合的代码块
  if (inCodeBlock && codeBlockContent) {
    elements.push(
      <pre key="code-end" className="md-code-block">
        <code>{codeBlockContent}</code>
      </pre>
    );
  }

  return <div className="markdown-content">{elements}</div>;
}

/**
 * 渲染行内元素：粗体、斜体、代码、链接
 */
function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  // 按顺序匹配：行内代码、链接、粗体、斜体
  while (remaining.length > 0) {
    // 行内代码 `code`
    const codeMatch = remaining.match(/`([^`]+)`/);
    // 链接 [text](url)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // 粗体 **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    // 斜体 *text*
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    const matches = [
      codeMatch && { ...codeMatch, type: 'code', idx: codeMatch.index },
      linkMatch && { ...linkMatch, type: 'link', idx: linkMatch.index },
      boldMatch && { ...boldMatch, type: 'bold', idx: boldMatch.index },
      italicMatch && { ...italicMatch, type: 'italic', idx: italicMatch.index },
    ].filter(Boolean).sort((a, b) => a.idx - b.idx);

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    const match = matches[0];

    // 添加匹配前的普通文本
    if (match.idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, match.idx)}</span>);
    }

    // 渲染匹配的内容
    switch (match.type) {
      case 'code':
        parts.push(<code key={key++} className="md-inline-code">{match[1]}</code>);
        break;
      case 'link':
        parts.push(
          <a key={key++} href={match[2]} target="_blank" rel="noopener noreferrer" className="md-link">
            {match[1]}
          </a>
        );
        break;
      case 'bold':
        parts.push(<strong key={key++}>{match[1]}</strong>);
        break;
      case 'italic':
        parts.push(<em key={key++}>{match[1]}</em>);
        break;
    }

    remaining = remaining.slice(match.idx + match[0].length);
  }

  return parts;
}
