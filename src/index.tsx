
import React, { useState } from "react";
import ReactDOM from "react-dom/client";

const sampleHTML = `<section>
  <div>
    <h1>Hello World</h1>
    <p>This is my first Webflow converter.</p>
    <a href="#">Get Started</a>
  </div>
</section>`;

const allowedTags = new Set([
  "section", "div", "header", "footer", "main", "nav",
  "article", "aside", "h1", "h2", "h3", "h4", "h5",
  "h6", "p", "a", "img", "button", "ul", "ol", "li",
  "span", "br", "blockquote", "strong", "b", "em", "i"
]);

const voidTags = new Set(["img", "br"]);

function countElements(node: Node): number {
  let count = 0;

  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      count += 1;
      count += countElements(child);
    }
  });

  return count;
}

function renderNode(node: Node, key: number): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const element = node as HTMLElement;
  const originalTag = element.tagName.toLowerCase();

  if (!allowedTags.has(originalTag)) {
    return Array.from(element.childNodes).map((child, index) =>
      renderNode(child, index)
    );
  }

  const props: Record<string, string | number> = { key };

  // Only allow safe, relevant attributes in the preview.
  ["href", "src", "alt", "target", "rel", "type"].forEach((attr) => {
    const value = element.getAttribute(attr);

    if (value) {
      if (
        (attr === "href" || attr === "src") &&
        /^\s*javascript:/i.test(value)
      ) {
        return;
      }

      props[attr] = value;
    }
  });

  const children = Array.from(element.childNodes).map((child, index) =>
    renderNode(child, index)
  );

  return React.createElement(
    originalTag,
    props,
    voidTags.has(originalTag) ? undefined : children
  );
}

const App: React.FC = () => {
  const [html, setHtml] = useState(sampleHTML);
  const [preview, setPreview] = useState<Node[]>([]);
  const [elementCount, setElementCount] = useState(0);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = () => {
    setError("");
    setShowPreview(false);

    if (!html.trim()) {
      setError("Please enter some HTML first.");
      return;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const elements = Array.from(doc.body.childNodes).filter(
        (node) =>
          node.nodeType === Node.ELEMENT_NODE ||
          (node.nodeType === Node.TEXT_NODE &&
            !!node.textContent?.trim())
      );

      if (doc.querySelector("parsererror")) {
        setError("Invalid HTML. Please check your markup.");
        return;
      }

      setPreview(elements);
      setElementCount(
        elements.reduce((total, node) => total + countElements(node), 0)
      );
      setShowPreview(true);
    } catch {
      setError("Unable to parse this HTML.");
    }
  };

  const handleClear = () => {
    setHtml("");
    setPreview([]);
    setElementCount(0);
    setError("");
    setShowPreview(false);
  };

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>HTML to Webflow</h1>
          <p>Convert HTML into editable Webflow elements.</p>
        </div>
        <span className="version">V1.0</span>
      </header>

      <section className="editor-section">
        <div className="section-heading">
          <label htmlFor="html-input">HTML Input</label>
          <button className="text-button" onClick={handleClear}>
            Clear
          </button>
        </div>

        <textarea
          id="html-input"
          value={html}
          onChange={(e) => setHtml(e.target.value)}
          placeholder="Paste your HTML code here..."
          spellCheck={false}
        />

        <div className="editor-footer">
          <span>HTML only · CSS conversion coming later</span>
          <button className="primary-button" onClick={handlePreview}>
            Preview HTML
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}
      </section>

      <section className="preview-section">
        <div className="section-heading">
          <label>Preview</label>
          {showPreview && (
            <span className="element-count">
              {elementCount} HTML elements
            </span>
          )}
        </div>

        <div className="preview-canvas">
          {showPreview ? (
            preview.map((node, index) => renderNode(node, index))
          ) : (
            <div className="empty-preview">
              <span className="preview-icon">⌘</span>
              <p>Your HTML preview will appear here.</p>
              <span>Paste HTML and click Preview HTML.</span>
            </div>
          )}
        </div>
      </section>

      <footer className="app-footer">
        <span>HTML to Webflow</span>
        <button className="convert-button" disabled>
          Convert to Webflow
          <span>Coming next</span>
        </button>
      </footer>
    </main>
  );
};

const rootEl = document.getElementById("root");

if (!rootEl) {
  throw new Error('Could not find element with id "root"');
}

ReactDOM.createRoot(rootEl).render(<App />);
