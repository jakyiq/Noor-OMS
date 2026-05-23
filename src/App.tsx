/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./components/Dashboard";
import { Patients } from "./components/Patients";
import { Inventory } from "./components/Inventory";
import { Followups } from "./components/Followups";
import { Lenses } from "./components/Lenses";
import { Frames } from "./components/Frames";
import { AuditLog } from "./components/AuditLog";
import { Settings } from "./components/Settings";
import { Reports } from "./components/Reports";
import { Auth } from "./components/Auth";
import AdminPanel from "./components/AdminPanel";

import { ClinicProvider, useClinic } from "./context/ClinicContext";
import { cn } from "./lib/utils";
import { useScrollLock } from "./hooks/useScrollLock";

function useInteractionLock() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any modal is open.
      const hasModal = document.querySelector('.fixed.inset-0, .fixed.inset-px') !== null || document.body.classList.contains('modal-open');
      if (!hasModal) return;

      // Trap Tab & Shift+Tab focus inside the topmost modal
      if (e.key === "Tab") {
        const modals = Array.from(document.querySelectorAll('.fixed.inset-0, .fixed.inset-px'));
        if (modals.length === 0) return;

        // Get the active (topmost) modal wrapper
        const activeModal = modals[modals.length - 1] as HTMLElement;

        // Find focusable query selectors
        const focusableElements = activeModal.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]'
        );
        
        const focusables = Array.from(focusableElements).filter(el => {
          const tabIndex = el.getAttribute('tabindex');
          if (tabIndex && parseInt(tabIndex) < 0) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }) as HTMLElement[];

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !activeModal.contains(document.activeElement)) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement || !activeModal.contains(document.activeElement)) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    const handleFocus = (e: FocusEvent) => {
      const hasModal = document.querySelector('.fixed.inset-0, .fixed.inset-px') !== null || document.body.classList.contains('modal-open');
      if (!hasModal) return;

      const modals = Array.from(document.querySelectorAll('.fixed.inset-0, .fixed.inset-px'));
      if (modals.length === 0) return;
      const activeModal = modals[modals.length - 1] as HTMLElement;

      if (e.target && !activeModal.contains(e.target as Node)) {
        const focusableElements = activeModal.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]'
        );
        const focusable = Array.from(focusableElements).find(el => {
          const tabIndex = el.getAttribute('tabindex');
          if (tabIndex && parseInt(tabIndex) < 0) return false;
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }) as HTMLElement;

        if (focusable) {
          focusable.focus();
        } else {
          activeModal.focus();
        }
        e.preventDefault();
      }
    };

    // Prevent wheel/scroll on the layer below
    const handleWheel = (e: WheelEvent) => {
      const hasModal = document.querySelector('.fixed.inset-0, .fixed.inset-px') !== null || document.body.classList.contains('modal-open');
      if (!hasModal) return;

      const modals = Array.from(document.querySelectorAll('.fixed.inset-0, .fixed.inset-px'));
      if (modals.length === 0) return;
      const activeModal = modals[modals.length - 1] as HTMLElement;

      // Target must be inside the active modal, otherwise prevent scroll
      const modalBox = activeModal.querySelector('.bg-white, [role="dialog"], form');
      if (modalBox && !modalBox.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const hasModal = document.querySelector('.fixed.inset-0, .fixed.inset-px') !== null || document.body.classList.contains('modal-open');
      if (!hasModal) return;

      const modals = Array.from(document.querySelectorAll('.fixed.inset-0, .fixed.inset-px'));
      if (modals.length === 0) return;
      const activeModal = modals[modals.length - 1] as HTMLElement;

      const modalBox = activeModal.querySelector('.bg-white, [role="dialog"], form');
      if (modalBox && !modalBox.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("focus", handleFocus, true);
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("focus", handleFocus, true);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);
}

function AppContent() {
  const { user, currentSection, impersonatedClinic, setImpersonatedClinic, lang } = useClinic();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useScrollLock(mobileMenuOpen);
  useInteractionLock();

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
      case "frames":
        return <Frames />;
      case "inventory":
        return <Inventory />;
      case "audit":
        return <AuditLog />;
      case "settings":
        return <Settings />;
      case "reports":
        return <Reports />;
      case "superadmin":
        return <AdminPanel />;
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
      {impersonatedClinic && (
        <div className="bg-amber-600 text-amber-50 text-xs font-bold py-3 px-4 flex justify-between items-center gap-4 sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚠️</span>
            <span>
              {lang === "ar" 
                ? `أنت في وضع محاكاة عيادة: [ ${impersonatedClinic} ]` 
                : `Currently impersonating clinic account: [ ${impersonatedClinic} ]`}
            </span>
          </div>
          <button 
            onClick={() => setImpersonatedClinic(null)}
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-[10px] tracking-wide uppercase font-bold transition-all border border-white/20"
          >
            {lang === "ar" ? "إنهاء المحاكاة" : "Exit Impersonation"}
          </button>
        </div>
      )}
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
          <p>© {new Date().getFullYear()} NOOR OPTICAL MANAGEMENT SYSTEM · v2.0 MODERN REDESIGN</p>
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
