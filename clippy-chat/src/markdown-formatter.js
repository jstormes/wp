/**
 * Markdown Formatter for Clippy Chat
 * Wraps marked.js with custom configuration and styling for chat bubbles
 */

import { marked, Marked } from 'marked';

/**
 * Escape HTML to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Custom renderer for chat bubble context
const chatRenderer = {
  // Headings - scaled for chat context
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens);
    const sizes = {
      1: '1.4em', 2: '1.3em', 3: '1.2em',
      4: '1.1em', 5: '1em', 6: '0.9em'
    };
    return `<h${depth} style="font-size: ${sizes[depth]}; margin: 8px 0 4px; font-weight: 600; line-height: 1.3;">${text}</h${depth}>`;
  },

  // Code blocks
  code({ text, lang }) {
    const langClass = lang ? ` class="language-${escapeHtml(lang)}"` : '';
    return `<pre style="background: #f4f4f4; padding: 8px; border-radius: 4px; overflow-x: auto; margin: 8px 0; font-size: 12px;"><code${langClass}>${escapeHtml(text)}</code></pre>`;
  },

  // Inline code
  codespan({ text }) {
    return `<code style="background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 13px;">${escapeHtml(text)}</code>`;
  },

  // Links
  link({ href, title, tokens }) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    // Sanitize href to prevent javascript: links
    const safeHref = href.toLowerCase().startsWith('javascript:') ? '#' : escapeHtml(href);
    return `<a href="${safeHref}"${titleAttr} target="_blank" rel="noopener noreferrer" style="color: #667eea; text-decoration: underline;">${text}</a>`;
  },

  // Images
  image({ href, title, text }) {
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttr} style="max-width: 100%; height: auto; border-radius: 4px; margin: 4px 0;">`;
  },

  // Blockquotes
  blockquote({ tokens }) {
    const body = this.parser.parse(tokens);
    return `<blockquote style="border-left: 3px solid #667eea; margin: 8px 0; padding: 4px 12px; color: #666; background: #f9f9f9;">${body}</blockquote>`;
  },

  // Tables
  table({ header, rows }) {
    const headerHtml = this.tablerow({ cells: header });
    let bodyHtml = '';
    for (const row of rows) {
      bodyHtml += this.tablerow({ cells: row });
    }
    return `<div style="overflow-x: auto; margin: 8px 0;"><table style="border-collapse: collapse; width: 100%; font-size: 13px;">
      <thead>${headerHtml}</thead>
      <tbody>${bodyHtml}</tbody>
    </table></div>`;
  },

  tablerow({ cells }) {
    let html = '';
    for (const cell of cells) {
      html += this.tablecell(cell);
    }
    return `<tr style="border-bottom: 1px solid #e0e0e0;">${html}</tr>`;
  },

  tablecell({ tokens, header, align }) {
    const tag = header ? 'th' : 'td';
    const alignStyle = align ? `text-align: ${align};` : '';
    const baseStyle = header
      ? `padding: 6px 8px; background: #f5f5f5; font-weight: 600; ${alignStyle}`
      : `padding: 6px 8px; ${alignStyle}`;
    const content = this.parser.parseInline(tokens);
    return `<${tag} style="${baseStyle}">${content}</${tag}>`;
  },

  // Lists
  list({ ordered, start, items }) {
    const tag = ordered ? 'ol' : 'ul';
    const startAttr = ordered && start !== 1 ? ` start="${start}"` : '';
    let body = '';
    for (const item of items) {
      body += this.listitem(item);
    }
    return `<${tag}${startAttr} style="margin: 8px 0; padding-left: 24px;">${body}</${tag}>`;
  },

  listitem({ tokens, task, checked }) {
    let content = this.parser.parse(tokens);

    if (task) {
      const checkbox = checked
        ? `<input type="checkbox" checked disabled style="margin-right: 6px;">`
        : `<input type="checkbox" disabled style="margin-right: 6px;">`;
      return `<li style="list-style: none; margin-left: -18px; margin-bottom: 4px;">${checkbox}${content}</li>`;
    }
    return `<li style="margin-bottom: 4px;">${content}</li>`;
  },

  // Horizontal rule
  hr() {
    return `<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 12px 0;">`;
  },

  // Strikethrough (GFM)
  del({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<del style="text-decoration: line-through; color: #999;">${text}</del>`;
  },

  // Paragraphs - minimal margins for chat
  paragraph({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<p style="margin: 4px 0;">${text}</p>`;
  },

  // Strong (bold)
  strong({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<strong>${text}</strong>`;
  },

  // Emphasis (italic)
  em({ tokens }) {
    const text = this.parser.parseInline(tokens);
    return `<em>${text}</em>`;
  },

  // Line breaks
  br() {
    return '<br>';
  }
};

// Highlight extension: ==highlighted text==
const highlightExtension = {
  name: 'highlight',
  level: 'inline',
  start(src) {
    return src.match(/==/)?.index;
  },
  tokenizer(src) {
    const match = src.match(/^==([^=]+)==/);
    if (match) {
      return {
        type: 'highlight',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token) {
    return `<mark style="background: #fff3cd; padding: 0 2px; border-radius: 2px;">${escapeHtml(token.text)}</mark>`;
  }
};

// Subscript extension: H~2~O
const subscriptExtension = {
  name: 'subscript',
  level: 'inline',
  start(src) {
    return src.match(/~(?!\s)/)?.index;
  },
  tokenizer(src) {
    const match = src.match(/^~([^~\s]+)~/);
    if (match) {
      return {
        type: 'subscript',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token) {
    return `<sub>${escapeHtml(token.text)}</sub>`;
  }
};

// Superscript extension: X^2^
const superscriptExtension = {
  name: 'superscript',
  level: 'inline',
  start(src) {
    return src.match(/\^(?!\s)/)?.index;
  },
  tokenizer(src) {
    const match = src.match(/^\^([^\^\s]+)\^/);
    if (match) {
      return {
        type: 'superscript',
        raw: match[0],
        text: match[1]
      };
    }
  },
  renderer(token) {
    return `<sup>${escapeHtml(token.text)}</sup>`;
  }
};

/**
 * MarkdownFormatter class for formatting chat messages
 */
class MarkdownFormatter {
  constructor(options = {}) {
    this.options = options;

    // Create a new marked instance with our configuration
    this.marked = new Marked();

    // Configure marked options
    this.marked.setOptions({
      gfm: true,           // GitHub Flavored Markdown (tables, strikethrough, etc.)
      breaks: true,        // Convert \n to <br>
    });

    // Use custom renderer
    this.marked.use({ renderer: chatRenderer });

    // Add custom extensions
    this.marked.use({
      extensions: [highlightExtension, subscriptExtension, superscriptExtension]
    });
  }

  /**
   * Format markdown text to HTML
   * @param {string} text - Markdown text to format
   * @returns {string} HTML output
   */
  format(text) {
    if (!text) return '';
    return this.marked.parse(text);
  }

  /**
   * Static method for HTML escaping (exposed for testing)
   * @param {string} str - String to escape
   * @returns {string} Escaped string
   */
  static escapeHtml(str) {
    return escapeHtml(str);
  }
}

// Export for ES modules
export { MarkdownFormatter, escapeHtml };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.MarkdownFormatter = MarkdownFormatter;
}
