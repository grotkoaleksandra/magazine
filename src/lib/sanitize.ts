import sanitizeHtml from "sanitize-html";

// Article bodies are written in the rich-text editor; only allow the
// formatting it produces so stored HTML can be rendered safely.
export function sanitizeArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "a",
      "ul", "ol", "li", "blockquote", "hr", "img", "figure", "figcaption", "code", "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}
