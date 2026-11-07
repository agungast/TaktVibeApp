/**
 * Lightweight, zero-dependency, safe Markdown to HTML parser
 * Designed for SoloFlow Notion-Style Rich Workspace (PRD Section 4.2).
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function renderMarkdown(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') return ''

  // 1. Normalisasi line breaks
  const raw = markdown.replace(/\r\n/g, '\n')

  // 2. Ekstraksi Fenced Code Blocks (agar konten di dalamnya tidak terformat oleh parser lain)
  const codeBlocks: string[] = []
  let text = raw.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const safeCode = escapeHtml(code.trimEnd())
    const langBadge = lang ? `<span class="code-lang-badge">${escapeHtml(lang)}</span>` : ''
    const blockHtml = `<div class="md-code-block">${langBadge}<pre><code>${safeCode}</code></pre></div>`
    const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`
    codeBlocks.push(blockHtml)
    return placeholder
  })

  // 3. Escape HTML pada teks biasa untuk mencegah XSS
  text = escapeHtml(text)

  // 4. Inline code (`code`)
  text = text.replace(/`([^`]+)`/g, '<code class="md-inline-code">$1</code>')

  // 5. Horizontal rule (`---` atau `***`)
  text = text.replace(/^(?:---|\*\*\*|___)\s*$/gm, '<hr class="md-hr" />')

  // 6. Headings (# H1, ## H2, ### H3, #### H4)
  text = text.replace(/^#### (.*$)/gm, '<h5 class="md-h4">$1</h5>')
  text = text.replace(/^### (.*$)/gm, '<h4 class="md-h3">$1</h4>')
  text = text.replace(/^## (.*$)/gm, '<h3 class="md-h2">$1</h3>')
  text = text.replace(/^# (.*$)/gm, '<h2 class="md-h1">$1</h2>')

  // 7. Blockquotes (> quote)
  text = text.replace(/^> (.*$)/gm, '<blockquote class="md-quote">$1</blockquote>')

  // 8. Bold, Italic, Strikethrough
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/__(.*?)__/g, '<strong>$1</strong>')
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>')
  text = text.replace(/_(.*?)_/g, '<em>$1</em>')
  text = text.replace(/~~(.*?)~~/g, '<del>$1</del>')

  // 9. Links [text](url) — pastikan hanya URL http/https yang diizinkan
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="md-link">$1</a>')

  // 10. Lists (Unordered - / *)
  // Gabungkan baris list berurutan ke dalam <ul>
  text = text.replace(/(?:^[ \t]*[-*] .*\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^[ \t]*[-*] (.*)$/, '<li>$1</li>'))
      .join('')
    return `<ul class="md-ul">${items}</ul>\n`
  })

  // 11. Numbered Lists (1. 2. 3.)
  text = text.replace(/(?:^[ \t]*\d+\. .*\n?)+/gm, (match) => {
    const items = match
      .trim()
      .split('\n')
      .map(line => line.replace(/^[ \t]*\d+\. (.*)$/, '<li>$1</li>'))
      .join('')
    return `<ol class="md-ol">${items}</ol>\n`
  })

  // 12. Paragraphs & Line Breaks
  const paragraphs = text
    .split(/\n{2,}/)
    .map(para => {
      const trimmed = para.trim()
      if (!trimmed) return ''
      // Jika paragraf sudah berupa block element (heading, code block, list, blockquote, hr), jangan dibungkus <p>
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<blockquote') ||
        trimmed.startsWith('<hr') ||
        trimmed.startsWith('__CODE_BLOCK_')
      ) {
        return trimmed
      }
      return `<p class="md-p">${trimmed.replace(/\n/g, '<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')

  // 13. Kembalikan Fenced Code Blocks ke posisinya semula
  let finalHtml = paragraphs
  codeBlocks.forEach((block, idx) => {
    finalHtml = finalHtml.replace(`__CODE_BLOCK_${idx}__`, block)
  })

  return finalHtml
}
