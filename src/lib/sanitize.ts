import DOMPurify from "dompurify";

// Sanitize rich-text HTML written in the CMS before rendering it with
// dangerouslySetInnerHTML. Keeps normal formatting and video embeds, strips
// scripts, event handlers and javascript: URLs.
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "target", "loading", "referrerpolicy"],
  });
}
