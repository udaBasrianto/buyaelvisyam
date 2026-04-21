import React from "react";
import { Eye, Clock, Share2 } from "lucide-react";
import type { Post } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_POST_IMAGE = "https://images.unsplash.com/photo-1564769625392-651b89c75a23?q=80&w=2070&auto=format&fit=crop";

interface PostCardProps {
  post: Post;
  featured?: boolean;
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const { toast } = useToast();

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/artikel/${post.slug || post.id}`;
    const title = post.title;
    const text = `Baca artikel "${title}" di BlogUstad.`;

    if (navigator.share) {
      navigator.share({ title, text, url }).catch(() => {
        navigator.clipboard.writeText(url);
        toast({ title: "Tautan disalin ke clipboard!" });
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Tautan disalin ke clipboard!" });
    }
  };

  if (featured) {
    return (
      <article className="group relative rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 h-full min-h-[320px] md:min-h-[400px]">
        <img
          src={post.image || DEFAULT_POST_IMAGE}
          alt={post.title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          width={640}
          height={512}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
          }}
        />
        <div className="absolute inset-0 hero-overlay" />
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-xs font-bold rounded-lg px-3 py-1.5 text-center leading-tight">
          <div className="text-lg">{post.date.split(" ")[0]}</div>
          <div>{post.date.split(" ")[1]}</div>
        </div>
        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <span className="tag-badge gold-gradient text-primary-foreground text-xs w-fit mb-2">{post.category}</span>
          <h3 className="text-lg font-bold text-primary-foreground leading-snug line-clamp-2">{post.title}</h3>
          <div className="flex items-center gap-2 text-primary-foreground/70 text-sm mt-1.5">
            <span>{post.author}</span>
            {post.readingMinutes ? (
              <>
                <span>•</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingMinutes} mnt</span>
              </>
            ) : null}
            <span className="hidden md:inline-flex items-center gap-1">
              • <Eye className="h-3.5 w-3.5" /> {post.views}
            </span>
            <button 
              onClick={handleShare}
              className="p-1 -m-1 hover:text-primary transition-colors ml-auto"
              title="Bagikan"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group bg-card rounded-xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300">
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={post.image || DEFAULT_POST_IMAGE}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          width={640}
          height={512}
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
          }}
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        <div className="flex items-center gap-2 mt-2.5 text-muted-foreground text-xs flex-wrap">
          <span>{post.author}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views}</span>
          {post.readingMinutes ? (
            <>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {post.readingMinutes} mnt baca</span>
            </>
          ) : null}
          <button 
            onClick={handleShare}
            className="p-1 -m-1 hover:text-primary transition-colors ml-auto"
            title="Bagikan"
          >
            <Share2 className="h-3 w-3" />
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {post.tags.map((tag) => (
            <span key={tag} className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-medium">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
