import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Youtube from "@tiptap/extension-youtube";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Code, Link2, Image as ImageIcon, Youtube as YoutubeIcon, Table as TableIcon,
  Minus, Undo2, Redo2, Loader2,
} from "lucide-react";
import { apiUpload } from "./adminApi.js";
import "../prose.css";
import "./editor.css";

const lowlight = createLowlight();
lowlight.register({ javascript, js: javascript, typescript, ts: typescript, xml, html: xml, css, bash, shell: bash, json, python, sql });

function Btn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={active ? "is-active" : ""}
    >
      {children}
    </button>
  );
}

export default function TiptapEditor({ value, onChange, token, theme, onUploadError }) {
  const lastHtml = useRef(value || "");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, HTMLAttributes: { loading: "lazy" } }),
      Placeholder.configure({ placeholder: "Write your post… use the toolbar for headings, images, lists, and more." }),
      CharacterCount,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      CodeBlockLowlight.configure({ lowlight }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastHtml.current = html;
      onChange(html);
    },
  });

  // Sync external content changes (loading a post to edit, AI-generated content).
  useEffect(() => {
    if (!editor) return;
    if (value !== undefined && value !== lastHtml.current) {
      lastHtml.current = value || "";
      editor.commands.setContent(value || "", false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const addLink = () => {
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Link URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addYoutube = () => {
    const url = window.prompt("YouTube URL");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const onPickImage = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await apiUpload(token, file);
      const alt = window.prompt("Image alt text (for SEO & accessibility)", file.name.replace(/\.[^.]+$/, "")) || "";
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch (err) {
      if (onUploadError) onUploadError(err);
      else window.alert(`Image upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const cc = editor.storage.characterCount;
  const words = cc ? cc.words() : 0;
  const chars = cc ? cc.characters() : 0;

  const vars = {
    "--ed-border": theme.cardBorder,
    "--ed-bar": theme.card,
    "--ed-text": theme.text2,
    "--ed-hover": theme.chipBg,
    "--ed-active": theme.chipBg,
    "--ed-active-text": theme.chipC,
    "--ed-muted": theme.text3,
    "--ed-placeholder": theme.text3,
    "--prose-text": theme.text,
    "--prose-head": theme.text,
    "--prose-muted": theme.text2,
    "--prose-link": theme.a2,
    "--prose-accent": theme.a1,
    "--prose-border": theme.cardBorder,
    "--prose-inline-code": theme.chipC,
    "--prose-inline-code-bg": theme.chipBg,
  };

  return (
    <div style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: 12, background: theme.card, ...vars }}>
      <div className="ap-editor-toolbar">
        <Btn title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></Btn>
        <Btn title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></Btn>
        <Btn title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={16} /></Btn>
        <span className="sep" />
        <Btn title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></Btn>
        <Btn title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></Btn>
        <span className="sep" />
        <Btn title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></Btn>
        <Btn title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></Btn>
        <Btn title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></Btn>
        <Btn title="Code block" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code size={16} /></Btn>
        <span className="sep" />
        <Btn title="Link" active={editor.isActive("link")} onClick={addLink}><Link2 size={16} /></Btn>
        <Btn title="Insert image" onClick={() => fileInputRef.current?.click()}>
          {uploading ? <Loader2 size={16} className="ap-spin" /> : <ImageIcon size={16} />}
        </Btn>
        <Btn title="Embed YouTube" onClick={addYoutube}><YoutubeIcon size={16} /></Btn>
        <Btn title="Insert table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={16} /></Btn>
        <Btn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></Btn>
        <span className="sep" />
        <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={16} /></Btn>
        <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={16} /></Btn>
      </div>

      <div className="ap-editor-surface ap-prose">
        <EditorContent editor={editor} />
      </div>

      <div className="ap-editor-count">
        <span>{words} words · {chars} characters</span>
        <span>~{Math.max(1, Math.round(words / 200))} min read</span>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
      <style>{`.ap-spin { animation: apspin 0.8s linear infinite; } @keyframes apspin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
