import { useEffect } from "react";
import api from "@/lib/api";

export function GoogleAnalytics() {
  useEffect(() => {
    const initGA = async () => {
      try {
        const { data } = await api.get("/settings");
        const gaId = data?.google_analytics_id;

        if (gaId && gaId.startsWith("G-")) {
          // Create script elements
          const script1 = document.createElement("script");
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script1);

          const script2 = document.createElement("script");
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(script2);
        }
      } catch (err) {
        console.error("Failed to load Google Analytics settings", err);
      }
    };

    initGA();
  }, []);

  return null;
}
