import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { App as CapacitorApp } from "@capacitor/app";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { getSiteOrigin } from "@/lib/runtime-config";

const isNativeApp = () => Capacitor.isNativePlatform();

export function CapacitorAppBridge() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isNativeApp()) return;

    let backButtonListener: PluginListenerHandle | undefined;
    let appUrlOpenListener: PluginListenerHandle | undefined;

    const registerNativeListeners = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: "#ffffff" });
        await StatusBar.setOverlaysWebView({ overlay: false });
      } catch (error) {
        console.error("Failed to configure status bar", error);
      }

      try {
        await SplashScreen.hide();
      } catch (error) {
        console.error("Failed to hide splash screen", error);
      }

      appUrlOpenListener = await CapacitorApp.addListener("appUrlOpen", ({ url }) => {
        if (!url) return;

        try {
          const incomingUrl = new URL(url);
          const siteOrigin = new URL(getSiteOrigin()).origin;
          if (incomingUrl.origin !== siteOrigin) return;

          const nextPath = `${incomingUrl.pathname}${incomingUrl.search}${incomingUrl.hash}`;
          navigate(nextPath || "/", { replace: false });
        } catch (error) {
          console.error("Failed to handle app url open", error);
        }
      });

      backButtonListener = await CapacitorApp.addListener("backButton", ({ canGoBack }) => {
        const isHome = location.pathname === "/";

        if (canGoBack && !isHome) {
          window.history.back();
          return;
        }

        CapacitorApp.exitApp();
      });
    };

    registerNativeListeners();

    return () => {
      backButtonListener?.remove();
      appUrlOpenListener?.remove();
    };
  }, [location.pathname, navigate]);

  return null;
}
