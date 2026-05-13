"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CloudSun,
  Waves,
  Wind,
  Droplets,
  Thermometer,
  Bell,
  Settings,
  Map,
  ChevronLeft,
  ChevronRight,
  Leaf,
  FileText,
  HardDrive,
  Info,
  Menu,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/weather", label: "Météo", icon: CloudSun },
  { href: "/floods", label: "Inondations", icon: Waves },
  { href: "/air-quality", label: "Qualité de l'air", icon: Wind },
  { href: "/drought", label: "Sécheresse", icon: Droplets },
  { href: "/climate", label: "Climat", icon: Thermometer },
  { href: "/map", label: "Carte interactive", icon: Map },
  { href: "/alerts", label: "Alertes", icon: Bell },
  { href: "/report", label: "Rapport", icon: FileText },
  { href: "/export", label: "Export données", icon: HardDrive },
  { href: "/about", label: "À propos", icon: Info },
  { href: "/system", label: "Système", icon: Settings },
];

const VERSION_TYPE_STYLE: Record<string, string> = {
  alpha:  "bg-orange-500/20 text-orange-300 border-orange-500/30",
  beta:   "bg-blue-500/20 text-blue-300 border-blue-500/30",
  rc:     "bg-purple-500/20 text-purple-300 border-purple-500/30",
  stable: "bg-green-500/20 text-green-300 border-green-500/30",
};

interface SidebarProps {
  appName: string;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ appName, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [versionType, setVersionType] = useState<string>("alpha");

  useEffect(() => {
    api.getConfig()
      .then((cfg: any) => {
        if (cfg?.app?.version) setVersion(cfg.app.version);
        if (cfg?.app?.version_type) setVersionType(cfg.app.version_type);
      })
      .catch(() => {});
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapsedChange?.(next);
  };

  const vtCls = VERSION_TYPE_STYLE[versionType] || VERSION_TYPE_STYLE.alpha;
  const vtLabel = versionType.charAt(0).toUpperCase() + versionType.slice(1);

  const NavContent = ({ forceExpanded = false }: { forceExpanded?: boolean }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {(!collapsed || forceExpanded) && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold leading-tight truncate">{appName}</h1>
            <p className="text-[10px] text-white/50 uppercase tracking-wider">Surveillance Environnementale</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all",
                isActive
                  ? "bg-primary text-white font-medium shadow-lg shadow-primary/20"
                  : "text-white/60 hover:bg-sidebar-hover hover:text-white"
              )}
              title={(!forceExpanded && collapsed) ? item.label : undefined}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {(!collapsed || forceExpanded) && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Version badge */}
      {version && (
        <div className={cn(
          "border-t border-white/10 transition-all",
          (!collapsed || forceExpanded) ? "px-4 py-3" : "px-2 py-3 flex justify-center"
        )}>
          {(!collapsed || forceExpanded) ? (
            <Link href="/about" className="flex items-center justify-between group">
              <span className="text-[11px] text-white/40 font-mono group-hover:text-white/70 transition">
                v{version}
              </span>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", vtCls)}>
                {vtLabel}
              </span>
            </Link>
          ) : (
            <span
              className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded border", vtCls)}
              title={`v${version} ${vtLabel}`}
            >
              {vtLabel[0]}
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* ── Mobile burger button ─────────────────────────────── */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-lg bg-sidebar text-white flex items-center justify-center shadow-lg"
        aria-label="Ouvrir le menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── Mobile overlay backdrop ──────────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <aside
        className={cn(
          "md:hidden fixed left-0 top-0 h-screen w-[280px] bg-sidebar text-white flex flex-col z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
          aria-label="Fermer le menu"
        >
          <X className="w-5 h-5" />
        </button>
        <NavContent forceExpanded />
      </aside>

      {/* ── Desktop sidebar ──────────────────────────────────── */}
      <aside
        className={cn(
          "hidden md:flex fixed left-0 top-0 h-screen bg-sidebar text-white flex-col transition-all duration-300 z-50",
          collapsed ? "w-[68px]" : "w-[260px]"
        )}
      >
        <NavContent />

        {/* Collapse toggle */}
        <button
          onClick={toggleCollapsed}
          className="flex items-center justify-center py-3 border-t border-white/10 text-white/40 hover:text-white transition"
          aria-label={collapsed ? "Développer" : "Réduire"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>
    </>
  );
}
