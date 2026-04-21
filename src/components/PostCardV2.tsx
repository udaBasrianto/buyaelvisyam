import { Eye, Clock, User, Share2, MessageCircle, Bookmark } from "lucide-react";
import type { Post } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import React, { useState, useEffect } from "react";

const DEFAULT_POST_IMAGE = "https://images.unsplash.com/photo-1564769625392-651b89c75a23?q=80&w=2070&auto=format&fit=crop";

interface PostCardV2Props {
  post: Post;
}

export function PostCardV2({ post }: PostCardV2Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (user) checkStatus();
  }, [post.id, user]);

  const checkStatus = async () => {
    try {
      const resp = await api.get(`/bookmarks/check/${post.id}`);
      setIsBookmarked(resp.data.is_bookmarked);
    } catch (err) {}
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Login diperlukan", description: "Silakan login untuk menyimpan kajian." });
      return;
    }
    try {
      const resp = await api.post(`/bookmarks/toggle/${post.id}`);
      setIsBookmarked(resp.data.status === "added");
      toast({ title: resp.data.message });
    } catch (err) {
      toast({ title: "Gagal menyimpan bookmark", variant: "destructive" });
    }
  };

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
        <div className="absolute top-4 right-4">
           <button 
             onClick={handleBookmark}
             className={`p-2 rounded-lg backdrop-blur-md transition-all duration-300 hover:scale-110 shadow-lg ${isBookmarked ? 'bg-primary text-white shadow-primary/20' : 'bg-white/90 text-primary hover:bg-primary hover:text-white'}`}
           >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
           </button>
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
