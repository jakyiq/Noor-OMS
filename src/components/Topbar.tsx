import React from "react";
import { Search, Bell, Menu, Plus } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { cn } from "../lib/utils";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { currentSection, setCurrentSection, setTriggerAddPatient, t, lang } = useClinic();

  const handleGlobalAddPatient = () => {
    setCurrentSection("patients");
    setTriggerAddPatient(prev => prev + 1);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-white border-b border-cream-border flex items-center justify-between px-4 lg:px-8 shadow-sm">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-ink-mid hover:bg-cream rounded-lg transition-colors"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg lg:text-xl font-serif font-bold text-ink transition-all lg:ms-2">
          {t(currentSection as any)}
        </h2>

      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        <div className="hidden md:flex items-center relative group">
          <Search className="absolute start-3 text-ink-light group-focus-within:text-burgundy transition-colors" size={16} />
          <input 
            type="text" 
            placeholder={t("search_placeholder")}
            className="ps-10 pe-4 py-2 bg-cream border border-cream-border rounded-full text-sm outline-none focus:border-burgundy focus:ring-4 focus:ring-burgundy/5 w-64 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleGlobalAddPatient}
            className="flex items-center gap-2 px-3 py-1.5 md:py-2 md:px-4 bg-burgundy hover:bg-burgundy-light text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{lang === "ar" ? "اضافة مريض" : "Add Patient"}</span>
          </button>
          
          <button className="p-2 text-ink-mid hover:bg-cream rounded-lg transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 end-2 w-2 h-2 bg-burgundy rounded-full border-2 border-white ring-2 ring-burgundy/10" />
          </button>
          
          <div className="h-8 w-px bg-cream-border mx-1 hidden sm:block" />
          
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] text-ink-light uppercase tracking-widest font-bold">{t("current_date_label")}</span>
            <span className="text-xs font-medium text-ink">
              {new Date().toLocaleDateString("en-GB", { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'short' 
              })}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
