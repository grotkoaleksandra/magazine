import DOMPurify from "dompurify";

// Article bodies come from the rich-text editor; only allow the formatting
// it produces so stored HTML can be rendered safely.
export function sanitizeArticleHtml(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "h2", "h3", "h4", "strong", "em", "u", "s", "a",
      "ul", "ol", "li", "blockquote", "hr", "img", "figure", "figcaption", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title"],
  });
}
