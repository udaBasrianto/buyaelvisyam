import { Eye, Clock, User, Share2, MessageCircle } from "lucide-react";
import type { Post } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_POST_IMAGE = "https://images.unsplash.com/photo-1564769625392-651b89c75a23?q=80&w=2070&auto=format&fit=crop";

interface PostCardV2Props {
  post: Post;
}

export function PostCardV2({ post }: PostCardV2Props) {
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

  return (
    <article className="group bg-card rounded-2xl overflow-hidden card-shadow hover:translate-y-[-4px] transition-all duration-300 border border-border/50">
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={post.image || DEFAULT_POST_IMAGE}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_POST_IMAGE;
          }}
        />
        <div className="absolute top-4 left-4">
          <span className="px-3 py-1 rounded-md bg-white/90 backdrop-blur-sm text-primary text-[10px] font-bold uppercase tracking-wider">
            {post.category}
          </span>
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold text-foreground leading-snug line-clamp-2 min-h-[56px] group-hover:text-primary transition-colors mb-3">
          {post.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
           <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-3 w-3 text-primary" />
           </div>
           <span className="text-xs font-medium text-muted-foreground">By {post.author}</span>
        </div>

        {/* Dashed Separator like in the image */}
        <div className="border-t border-dashed border-border/60 my-4" />

        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest">
           <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" /> {post.views} Views
              </span>
              {post.readingMinutes && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {post.readingMinutes} Min Read
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" /> {post.commentCount || 0}
              </span>
           </div>
           <button 
             onClick={handleShare}
             className="hover:text-primary transition-colors p-1 -m-1"
             title="Bagikan"
           >
              <Share2 className="h-3 w-3" />
           </button>
        </div>
      </div>
    </article>
  );
}
