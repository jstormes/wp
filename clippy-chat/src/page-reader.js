/**
 * PageReader - Extract and format page content for AI context
 * Client-side tool that runs in the browser DOM
 */

class PageReader {
  constructor(config = {}) {
    this.maxTextLength = config.maxTextLength || 2000;
    this.maxHeadings = config.maxHeadings || 20;
    this.maxLinks = config.maxLinks || 15;
  }

  /**
   * Main extraction method - returns structured page data
   * This is called when the agent invokes the read_page tool
   */
  extractPageContext() {
    return {
      url: window.location.href,
      title: document.title,
      description: this._getMetaDescription(),
      headings: this._extractHeadings(),
      mainContent: this._extractVisibleText(),
      links: this._extractLinks(),
      images: this._extractImages(),
      forms: this._extractForms()
    };
  }

  /**
   * Format page context as markdown for LLM
   * Optimized to be token-efficient
   */
  formatAsMarkdown(context) {
    let markdown = `# Page Context\n\n`;

    // Basic info
    markdown += `**URL:** ${context.url}\n`;
    markdown += `**Title:** ${context.title}\n\n`;

    if (context.description) {
      markdown += `**Description:** ${context.description}\n\n`;
    }

    // Headings (page structure)
    if (context.headings.length > 0) {
      markdown += `## Page Structure\n\n`;
      context.headings.forEach(h => {
        const indent = '  '.repeat(h.level - 1);
        markdown += `${indent}- ${h.text}\n`;
      });
      markdown += '\n';
    }

    // Main content
    if (context.mainContent) {
      markdown += `## Main Content\n\n${context.mainContent}\n\n`;
    }

    // Links
    if (context.links.length > 0) {
      markdown += `## Links (${context.links.length})\n\n`;
      context.links.slice(0, 10).forEach(link => {
        markdown += `- [${link.text}](${link.href})\n`;
      });
      if (context.links.length > 10) {
        markdown += `- ... and ${context.links.length - 10} more\n`;
      }
      markdown += '\n';
    }

    // Forms
    if (context.forms.length > 0) {
      markdown += `## Forms\n\n`;
      context.forms.forEach(form => {
        markdown += `- Form with fields: ${form.fields.join(', ')}\n`;
      });
      markdown += '\n';
    }

    return markdown;
  }

  /**
   * Get meta description
   * @private
   */
  _getMetaDescription() {
    const meta = document.querySelector('meta[name="description"]');
    return meta ? meta.getAttribute('content') : '';
  }

  /**
   * Extract heading structure (h1-h3)
   * @private
   */
  _extractHeadings() {
    const headings = [];
    const selectors = ['h1', 'h2', 'h3'];

    selectors.forEach((selector, index) => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const text = el.textContent.trim();
        if (text && headings.length < this.maxHeadings) {
          headings.push({
            level: index + 1,
            text: text.substring(0, 100) // Limit heading length
          });
        }
      });
    });

    return headings;
  }

  /**
   * Extract visible text content
   * @private
   */
  _extractVisibleText() {
    // Get main content area (try common selectors)
    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '#content',
      'body'
    ];

    let mainElement = null;
    for (const selector of mainSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement) break;
    }

    if (!mainElement) {
      mainElement = document.body;
    }

    // Clone to avoid modifying actual DOM
    const clone = mainElement.cloneNode(true);

    // Remove unwanted elements
    const unwanted = clone.querySelectorAll(
      'script, style, nav, header, footer, .clippy, .clippy-bubble, aside, [role="navigation"]'
    );
    unwanted.forEach(el => el.remove());

    // Get text content
    let text = clone.textContent || '';

    // Clean up whitespace
    text = text
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();

    // Limit length
    if (text.length > this.maxTextLength) {
      text = text.substring(0, this.maxTextLength) + '... [content truncated]';
    }

    return text;
  }

  /**
   * Extract links
   * @private
   */
  _extractLinks() {
    const links = [];
    const anchors = document.querySelectorAll('a[href]');

    anchors.forEach(a => {
      const href = a.getAttribute('href');
      const text = a.textContent.trim();

      // Skip empty links, anchors, and javascript links
      if (!text || href.startsWith('#') || href.startsWith('javascript:')) {
        return;
      }

      if (links.length < this.maxLinks) {
        links.push({
          text: text.substring(0, 50),
          href: this._resolveUrl(href)
        });
      }
    });

    return links;
  }

  /**
   * Extract images with alt text
   * @private
   */
  _extractImages() {
    const images = [];
    const imgs = document.querySelectorAll('img[alt]');

    imgs.forEach(img => {
      const alt = img.getAttribute('alt');
      if (alt && alt.trim()) {
        images.push({
          alt: alt.trim(),
          src: this._resolveUrl(img.getAttribute('src'))
        });
      }
    });

    return images.slice(0, 10); // Limit to 10 images
  }

  /**
   * Extract form information
   * @private
   */
  _extractForms() {
    const forms = [];
    const formElements = document.querySelectorAll('form');

    formElements.forEach(form => {
      const fields = [];
      const inputs = form.querySelectorAll('input, textarea, select');

      inputs.forEach(input => {
        const label = this._getInputLabel(input);
        const type = input.getAttribute('type') || input.tagName.toLowerCase();

        if (label) {
          fields.push(`${label} (${type})`);
        }
      });

      if (fields.length > 0) {
        forms.push({ fields });
      }
    });

    return forms;
  }

  /**
   * Get label for an input element
   * @private
   */
  _getInputLabel(input) {
    // Try associated label
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) return label.textContent.trim();
    }

    // Try parent label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.trim();
    }

    // Try placeholder or name
    return input.getAttribute('placeholder') ||
           input.getAttribute('name') ||
           '';
  }

  /**
   * Resolve relative URLs to absolute
   * @private
   */
  _resolveUrl(url) {
    if (!url) return '';

    try {
      return new URL(url, window.location.href).href;
    } catch (e) {
      return url;
    }
  }
}

// Export for ES modules
export { PageReader };

// For browser usage via rollup build
if (typeof window !== 'undefined') {
  window.PageReader = PageReader;
}
