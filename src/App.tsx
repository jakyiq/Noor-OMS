/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./components/Dashboard";
import { Patients } from "./components/Patients";
import { Inventory } from "./components/Inventory";
import { Followups } from "./components/Followups";
import { Lenses } from "./components/Lenses";
import { AuditLog } from "./components/AuditLog";
import { Settings } from "./components/Settings";
import { Auth } from "./components/Auth";
import { ClinicProvider, useClinic } from "./context/ClinicContext";
import { cn } from "./lib/utils";
import { useScrollLock } from "./hooks/useScrollLock";

function AppContent() {
  const { user, currentSection } = useClinic();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useScrollLock(mobileMenuOpen);

  if (!user) {
    return <Auth />;
  }

  const renderCurrentSection = () => {
    switch (currentSection) {
      case "dashboard":
        return <Dashboard />;
      case "patients":
        return <Patients />;
      case "followups":
        return <Followups />;
      case "lenses":
        return <Lenses />;
      case "inventory":
        return <Inventory />;
      case "audit":
        return <AuditLog />;
      case "settings":
        return <Settings />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-ink-light space-y-4">
            <div className="w-20 h-20 bg-cream-dark rounded-full flex items-center justify-center">
              <span className="text-4xl">🚧</span>
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-ink">Section Under Overhaul</h2>
              <p className="text-sm">We are currently modernizing this part of the Noor OMS.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-cream selection:bg-burgundy/10 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      
      {/* Sidebar Overlay - Mobile */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden animate-in fade-in transition-all"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className={cn(
        "transition-all duration-300 min-h-screen flex flex-col w-full",
        collapsed ? "lg:ps-16" : "lg:ps-64"
      )}>
        {/* Mobile menu toggle button instead of Topbar */}
        <div className="lg:hidden p-4">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 text-ink-mid hover:bg-cream rounded-lg transition-colors border border-cream-border bg-white"
          >
            <Menu size={20} />
          </button>
        </div>
        
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto w-full">
            {renderCurrentSection()}
          </div>
        </main>


        <footer className="px-8 py-6 border-t border-cream-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold text-ink-light tracking-widest uppercase">
          <p>© 2024 NOOR OPTICAL MANAGEMENT SYSTEM · v2.0 MODERN REDESIGN</p>
          <div className="flex gap-4">
            <span className="hover:text-burgundy cursor-pointer transition-colors">Privacy Policy</span>
            <span className="hover:text-burgundy cursor-pointer transition-colors">Support</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ClinicProvider>
      <AppContent />
    </ClinicProvider>
  );
}
