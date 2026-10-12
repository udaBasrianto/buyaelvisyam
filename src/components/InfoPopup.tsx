import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";
import api from "@/lib/api";

interface PopupData {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  button_text?: string;
  display_frequency?: string;
  is_active?: boolean;
}

export function InfoPopup() {
  const [popup, setPopup] = useState<PopupData | null>(null);
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get("/popups/active?platform=web");
        const data = res?.data?.data || null;
        if (!data || !isMounted) return;

        const today = new Date().toISOString().split("T")[0];
        const dismissKey = `popup_dismissed_${data.id}`;
        const dismissDayKey = `popup_dismissed_day_${data.id}`;

        if (data.display_frequency === "once_forever") {
          if (localStorage.getItem(dismissKey) === "true") return;
        } else if (data.display_frequency === "once_per_day" && localStorage.getItem(dismissDayKey) === today) {
          return;
        }

        const timer = setTimeout(() => {
          if (isMounted) {
            setPopup(data);
            setOpen(true);
          }
        }, 1200);
        return () => clearTimeout(timer);
      } catch (err) {
        console.warn("InfoPopup: No active popup or error fetching", err);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleClose = () => {
    if (!popup) {
      setOpen(false);
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const dismissKey = `popup_dismissed_${popup.id}`;
    const dismissDayKey = `popup_dismissed_day_${popup.id}`;

    if (popup.display_frequency === "once_forever" || dontShowAgain) {
      localStorage.setItem(dismissKey, "true");
    } else if (popup.display_frequency === "once_per_day") {
      localStorage.setItem(dismissDayKey, today);
    }
    setOpen(false);
  };

  const handleAction = () => {
    if (!popup?.action_url) {
      handleClose();
      return;
    }
    handleClose();
    if (popup.action_url.startsWith("http://") || popup.action_url.startsWith("https://")) {
      window.open(popup.action_url, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = popup.action_url;
    }
  };

  if (!popup) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-lg p-0 overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleClose}
          type="button"
          className="absolute right-3 top-3 z-20 rounded-full bg-background/80 p-2 text-foreground/80 hover:bg-background hover:text-foreground backdrop-blur-sm shadow-md transition-all focus:outline-none"
          aria-label="Tutup Popup"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.image_url && (
          <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] bg-muted overflow-hidden">
            <img
              src={popup.image_url}
              alt={popup.title}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-4">
          <DialogHeader className="text-left space-y-2">
            <DialogTitle className="text-lg sm:text-xl font-bold text-foreground leading-snug tracking-tight">
              {popup.title}
            </DialogTitle>
            {popup.description && (
              <DialogDescription className="text-sm sm:text-base text-muted-foreground whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto pr-1">
                {popup.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {popup.display_frequency !== "always" && (
            <label className="flex items-center gap-2 cursor-pointer pt-1 select-none text-xs text-muted-foreground hover:text-foreground transition-colors">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              <span>Jangan tampilkan lagi informasi ini</span>
            </label>
          )}

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full sm:w-auto rounded-xl px-5 text-sm"
            >
              {popup.action_url ? "Tutup" : (popup.button_text || "Tutup")}
            </Button>
            {popup.action_url && (
              <Button
                type="button"
                onClick={handleAction}
                className="w-full sm:w-auto rounded-xl px-5 text-sm islamic-gradient text-primary-foreground font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition-all gap-1.5"
              >
                <span>{popup.button_text || "Lihat Selengkapnya"}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
