"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { uploadImage } from "@/lib/admin";

export function RichTextEditor({
  initialHtml,
  onChange,
  editable = true,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  editable?: boolean;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image,
    ],
    content: initialHtml,
    editable,
    immediatelyRender: false,
    editorProps: { attributes: { class: "prose editor-content" } },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="editor">
      {editor && editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const s = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor.isActive("bold"),
      italic: editor.isActive("italic"),
      h2: editor.isActive("heading", { level: 2 }),
      h3: editor.isActive("heading", { level: 3 }),
      quote: editor.isActive("blockquote"),
      bullet: editor.isActive("bulletList"),
      ordered: editor.isActive("orderedList"),
      link: editor.isActive("link"),
    }),
  });

  const chain = () => editor.chain().focus();

  function setLink() {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = prompt("Link URL (leave empty to remove)", previous ?? "https://");
    if (url === null) return;
    if (url === "") chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: url }).run();
  }

  async function onImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const src = await uploadImage(file);
      chain().setImage({ src, alt: "" }).run();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const btn = (label: string, active: boolean, run: () => void, title: string) => (
    <button type="button" className={active ? "on" : ""} onClick={run} title={title} aria-pressed={active}>
      {label}
    </button>
  );

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      {btn("B", s.bold, () => chain().toggleBold().run(), "Bold")}
      {btn("I", s.italic, () => chain().toggleItalic().run(), "Italic")}
      <span className="sep" />
      {btn("H2", s.h2, () => chain().toggleHeading({ level: 2 }).run(), "Heading")}
      {btn("H3", s.h3, () => chain().toggleHeading({ level: 3 }).run(), "Subheading")}
      {btn("“ ”", s.quote, () => chain().toggleBlockquote().run(), "Quote")}
      <span className="sep" />
      {btn("• List", s.bullet, () => chain().toggleBulletList().run(), "Bulleted list")}
      {btn("1. List", s.ordered, () => chain().toggleOrderedList().run(), "Numbered list")}
      <span className="sep" />
      {btn("Link", s.link, setLink, "Add link")}
      <button type="button" onClick={() => fileInput.current?.click()} disabled={uploading} title="Insert image">
        {uploading ? "Uploading…" : "Image"}
      </button>
      {btn("—", false, () => chain().setHorizontalRule().run(), "Divider")}
      <span className="sep" />
      {btn("↶", false, () => chain().undo().run(), "Undo")}
      {btn("↷", false, () => chain().redo().run(), "Redo")}
      <input ref={fileInput} type="file" accept="image/*" hidden onChange={onImage} />
    </div>
  );
}
