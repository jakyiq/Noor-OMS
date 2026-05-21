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
  ChevronRight,
  Globe,
  ShoppingCart,
  Star
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { cn } from "../lib/utils";
import { Section } from "../types";
import { motion } from "motion/react";
import { EyeLensLogo } from "./EyeLensLogo";

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

  const menuGroups = [
    {
      groupLabel: t("main_nav") as string,
      items: [
        { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
        { id: "patients", label: t("patients"), icon: Users },
        { id: "followups", label: t("followups"), icon: CalendarClock, count: followupCount },
      ]
    },
    {
      groupLabel: t("inventory_nav") as string,
      items: [
        { id: "lenses", label: t("lenses"), icon: Disc },
        { id: "frames", label: t("frames"), icon: Glasses },
        { id: "inventory", label: t("inventory"), icon: ShoppingCart },
      ]
    },
    {
      groupLabel: t("reports_settings_nav") as string,
      items: [
        { id: "reports", label: t("reports"), icon: FileBarChart, role: "doctor" as const },
        { id: "settings", label: t("settings"), icon: Settings },
        { id: "audit", label: t("audit"), icon: ShieldCheck, role: "doctor" as const },
        { id: "superadmin", label: "Super Admin", icon: Star, role: "super_admin" as const },
      ]
    }
  ] as const;

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
        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center shrink-0 border border-white/15 shadow-sm">
          <EyeLensLogo size={24} className="text-white" />
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
      <nav className="flex-1 py-4 overflow-y-auto space-y-6">
        {menuGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {(!collapsed || mobileOpen) && group.groupLabel && (
              <div className="px-4 mb-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                {group.groupLabel}
              </div>
            )}
            {group.items.map((item) => {
              if (item.id === "superadmin" && user?.role !== "super_admin") return null;
              if (item.id === "reports") {
                const isDoc = user?.role === "doctor" || user?.role === "super_admin";
                const hasPerm = user?.role === "receptionist" && user?.permissions?.viewFinancials;
                if (!isDoc && !hasPerm) return null;
              }
              if (item.id === "audit") {
                const isDoc = user?.role === "doctor" || user?.role === "super_admin";
                const hasPerm = user?.role === "receptionist" && user?.permissions?.auditOrders;
                if (!isDoc && !hasPerm) return null;
              }
              if (item.id === "settings") {
                const isDoc = user?.role === "doctor" || user?.role === "super_admin";
                const hasPerm = user?.role === "receptionist" && user?.permissions?.editSettings;
                if (!isDoc && !hasPerm) return null;
              }
              const isActive = currentSection === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id as Section)}
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
                  {"count" in item && item.count !== undefined && item.count > 0 && (!collapsed || mobileOpen) && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-5 text-center">
                      {item.count}
                    </span>
                  )}
                  {"count" in item && item.count !== undefined && item.count > 0 && collapsed && !mobileOpen && (
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
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-4">
        {(!collapsed || mobileOpen) ? (
          <div className="bg-white/5 border border-white/10 p-[3px] rounded-xl flex items-center justify-between w-full relative z-10">
            <button 
              onClick={() => setLang("ar")}
              className={cn(
                "relative z-10 flex-1 py-1 px-3 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 h-8 outline-none",
                lang === "ar" 
                  ? "text-burgundy font-bold" 
                  : "text-white/70 hover:text-white"
              )}
            >
              {lang === "ar" && (
                <motion.div 
                  layoutId="activeLangIndicator"
                  className="absolute inset-0 bg-white rounded-lg -z-10 shadow-md"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span>العربية</span>
            </button>

            <button 
              onClick={() => setLang("en")}
              className={cn(
                "relative z-10 flex-1 py-1 px-3 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center justify-center gap-1.5 h-8 outline-none",
                lang === "en" 
                  ? "text-burgundy font-bold" 
                  : "text-white/70 hover:text-white"
              )}
            >
              {lang === "en" && (
                <motion.div 
                  layoutId="activeLangIndicator"
                  className="absolute inset-0 bg-white rounded-lg -z-10 shadow-md"
                  transition={{ type: "spring", stiffness: 350, damping: 28 }}
                />
              )}
              <span>English</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="w-full flex flex-col items-center justify-center py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all relative group text-white/75 hover:text-white outline-none"
            title={lang === "ar" ? "Switch to English" : "تغيير للعربية"}
          >
            <Globe className="w-4 h-4 text-white/70 group-hover:text-gold group-hover:scale-110 transition-all duration-300" />
            <span className="text-[8px] font-bold mt-1 text-white/50">{lang.toUpperCase()}</span>
            <span className={cn(
              "absolute bg-zinc-900 border border-white/15 text-white text-[10px] px-2.5 py-1.5 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl",
              lang === "ar" ? "end-16" : "start-16"
            )}>
              {lang === "ar" ? "English" : "العربية"}
            </span>
          </button>
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
