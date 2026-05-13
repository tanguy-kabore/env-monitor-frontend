"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [appName, setAppName] = useState("EcoWatch Burkina");
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    api.getConfig()
      .then((cfg: any) => {
        if (cfg?.app?.name) setAppName(cfg.app.name);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-bg">
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
