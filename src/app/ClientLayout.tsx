"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import { revalidationBus } from "@/lib/revalidationBus";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [appName, setAppName] = useState("EcoWatch Burkina");
  const [collapsed, setCollapsed] = useState(false);
  const [revalidating, setRevalidating] = useState(false);

  useEffect(() => {
    api.getConfig()
      .then((cfg: any) => {
        if (cfg?.app?.name) setAppName(cfg.app.name);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    return revalidationBus.subscribe((active: boolean) => setRevalidating(active));
  }, []);

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Global revalidation indicator */}
      <div className={`fixed top-0 left-0 right-0 z-[100] h-0.5 bg-primary/20 transition-opacity duration-300 ${revalidating ? "opacity-100" : "opacity-0"}`}>
        <div className="h-full bg-primary animate-revalidate-bar" />
      </div>

      <Sidebar appName={appName} onCollapsedChange={setCollapsed} />
      <main
        className={[
          "flex-1 transition-all duration-300",
          "pt-16 px-4 pb-6",
          "md:pt-6 md:px-6",
          collapsed ? "md:ml-[68px]" : "md:ml-[260px]",
        ].join(" ")}
      >
        {children}
      </main>
    </div>
  );
}
