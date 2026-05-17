import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  Disc, 
  Glasses, 
  Boxes,
  FileBarChart, 
  Settings, 
  ShieldCheck, 
  Lock,
  Stethoscope,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { cn } from "../lib/utils";
import { Section } from "../types";
import { motion } from "motion/react";

export function Sidebar({ 
  collapsed, 
  setCollapsed, 
  mobileOpen, 
  onClose 
}: { 
  collapsed: boolean; 
  setCollapsed: (c: boolean) => void;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const { lang, setLang, user, setUser, currentSection, setCurrentSection, t, followupCount } = useClinic();

  const menuItems: { id: Section; label: string; icon: any; role?: string; count?: number }[] = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "patients", label: t("patients"), icon: Users },
    { id: "followups", label: t("followups"), icon: CalendarClock, count: followupCount },
    { id: "inventory", label: t("inventory"), icon: Boxes },
    { id: "lenses", label: t("lenses"), icon: Disc },
    { id: "frames", label: t("frames"), icon: Glasses },
    { id: "reports", label: t("reports"), icon: FileBarChart },
    { id: "settings", label: t("settings"), icon: Settings },
    { id: "audit", label: t("audit"), icon: ShieldCheck },
    { id: "superadmin", label: "Admin", icon: Lock, role: "super_admin" },
  ];

  const handleLogout = () => {
    setUser(null);
  };

  const handleNavClick = (id: Section) => {
    setCurrentSection(id);
    if (mobileOpen) onClose();
  };

  return (
    <aside className={cn(
      "fixed inset-y-0 start-0 z-50 bg-burgundy text-white flex flex-col transition-all duration-300 shadow-xl lg:translate-x-0",
      collapsed ? "lg:w-16" : "lg:w-64",
      mobileOpen ? "translate-x-0 w-64" : (lang === "ar" ? "translate-x-full" : "-translate-x-full")
    )}>
      {/* Header */}
      <div className="p-4 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
          <Disc className="text-white w-6 h-6" />
        </div>
        {(!collapsed || mobileOpen) && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="overflow-hidden whitespace-nowrap"
          >
            <h1 className="font-serif text-xl font-bold">Noor OMS</h1>
            <p className="text-[10px] text-white/50 tracking-wider">OPTICAL MANAGEMENT</p>
          </motion.div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-1">
        {menuItems.map((item) => {
          if (item.role && user?.role !== item.role) return null;
          const isActive = currentSection === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 transition-all relative group",
                isActive ? "text-white bg-white/10" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-pill"
                  className="absolute start-0 inset-y-0 w-1 bg-gold rounded-e" 
                />
              )}
              <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-gold" : "")} />
              {(!collapsed || mobileOpen) && (
                <span className="text-sm font-medium flex-1 text-start">{item.label}</span>
              )}
              {!!item.count && item.count > 0 && (!collapsed || mobileOpen) && (
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                  {item.count}
                </span>
              )}
              {!!item.count && item.count > 0 && collapsed && !mobileOpen && (
                <span className="absolute top-2 start-6 w-2 h-2 bg-rose-500 rounded-full" />
              )}
              {collapsed && !mobileOpen && (
                <div className="absolute start-16 bg-ink text-white text-[10px] px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {(!collapsed || mobileOpen) && (
          <div className="flex bg-white/10 p-1 rounded-lg">
            <button 
              onClick={() => setLang("ar")}
              className={cn("flex-1 text-[10px] py-1 rounded", lang === "ar" ? "bg-white text-burgundy font-bold" : "text-white/60")}
            >
              العربية
            </button>
            <button 
              onClick={() => setLang("en")}
              className={cn("flex-1 text-[10px] py-1 rounded", lang === "en" ? "bg-white text-burgundy font-bold" : "text-white/60")}
            >
              English
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 px-1">
          <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-gold/30">
            {user?.full_name?.[0] || "A"}
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="flex-1 min-width-0 overflow-hidden">
              <p className="text-xs font-bold truncate">{user?.full_name || "Admin"}</p>
              <p className="text-[10px] text-white/40 truncate capitalize">{user?.role || "Doctor"}</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className="text-white/40 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex w-full items-center justify-center p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all"
        >
          {collapsed ? (lang === "ar" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />) : (lang === "ar" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />)}
        </button>
      </div>
    </aside>
  );
}
