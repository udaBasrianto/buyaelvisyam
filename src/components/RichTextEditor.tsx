import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useMemo } from "react";
import {
  Bold, Italic, Strikethrough, Heading2, Heading3, List, ListOrdered,
  Quote, Undo, Redo, Link2, Image as ImageIcon, Code, Minus, Pilcrow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  uploadBucket?: string;
}

const ToolbarBtn = ({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean; title: string; children: React.ReactNode;
}) => (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn("h-8 w-8", active && "bg-accent text-accent-foreground")}
  >
    {children}
  </Button>
);

const Toolbar = ({ editor, onImageClick }: { editor: Editor; onImageClick: () => void }) => {
  const setLink = () => {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL link:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="border-b border-border bg-muted/30 p-1.5 flex flex-wrap items-center gap-0.5 sticky top-0 z-10">
      <ToolbarBtn title="Bold" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
        <Bold className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Italic" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
        <Italic className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Strikethrough" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
        <Strikethrough className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Inline code" onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>
        <Code className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn title="Paragraf" onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")}>
        <Pilcrow className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Heading 2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Heading 3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
        <Heading3 className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn title="List" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
        <List className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="List bernomor" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Kutipan" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
        <Quote className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Garis pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <Minus className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn title="Tambah link" onClick={setLink} active={editor.isActive("link")}>
        <Link2 className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Sisipkan gambar" onClick={onImageClick}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarBtn>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <ToolbarBtn title="Undo" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
        <Undo className="h-4 w-4" />
      </ToolbarBtn>
      <ToolbarBtn title="Redo" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
        <Redo className="h-4 w-4" />
      </ToolbarBtn>
    </div>
  );
};

export function RichTextEditor({
  value, onChange, placeholder = "Mulai menulis...", minHeight = "300px", uploadBucket = "article-covers",
}: RichTextEditorProps) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extensions = useMemo(() => [
    StarterKit.configure({ heading: { levels: [2, 3] } }),
    Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    Image.configure({ HTMLAttributes: { class: "rounded-lg my-3 max-w-full h-auto" } }),
    Placeholder.configure({ placeholder }),
  ], [placeholder]);

  const editor = useEditor({
    extensions,
    content: value || "",
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none p-4",
        style: `min-height: ${minHeight};`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g., when opening edit dialog)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current && value !== (current === "<p></p>" ? "" : current)) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Hanya file gambar", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Login diperlukan untuk upload", variant: "destructive" });
      return;
    }
    
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      editor.chain().focus().setImage({ src: data.url }).run();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      toast({ title: "Upload gagal", description: error.message, variant: "destructive" });
    }
  };

  if (!editor) return null;

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      <Toolbar editor={editor} onImageClick={() => fileInputRef.current?.click()} />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <EditorContent editor={editor} />
    </div>
  );
}
