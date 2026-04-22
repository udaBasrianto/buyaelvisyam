import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";

export function VisitorTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      try {
        // Ping backend to record the visit
        // We send the actual frontend path so the backend knows which page is being viewed
        await api.post("/analytics/track", {
          path: location.pathname,
          referrer: document.referrer,
          title: document.title
        });
      } catch (err) {
        // Silently fail to not disturb user
      }
    };

    trackVisit();
  }, [location.pathname]);

  return null;
}
