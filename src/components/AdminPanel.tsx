import React, { useState, useEffect } from "react";
import { 
  Plus, Search, ChevronDown, Check, X, ShieldAlert, Trash2, Key, Database, RefreshCw, Star, ArrowRight, Save, LogIn
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { useScrollLock } from "../hooks/useScrollLock";
import { cn } from "../lib/utils";

interface ClinicRecord {
  id: string;
  name: string;
  owner_email: string;
  plan: "trial" | "quarterly" | "yearly" | "lifetime";
  expires_at: string;
  status: "active" | "expired" | "banned";
}

export default function AdminPanel() {
  const { lang, setCurrentSection, setImpersonatedClinic, logAction } = useClinic();
  
  // Safe loaded state
  const [clinics, setClinics] = useState<ClinicRecord[]>(() => {
    const saved = localStorage.getItem("noor_admin_clinics");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading admin clinics:", e);
      }
    }
    return [];
  });

  // Persist to local storage when clinics change
  useEffect(() => {
    localStorage.setItem("noor_admin_clinics", JSON.stringify(clinics));
  }, [clinics]);

  // Filters & query states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired" | "banned">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "trial" | "quarterly" | "yearly" | "lifetime">("all");

  // Interaction Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState<ClinicRecord | null>(null);
  const [showDeleteId, setShowDeleteId] = useState<string | null>(null);
  const [backingUpId, setBackingUpId] = useState<string | null>(null);
  
  useScrollLock(showAddModal || !!showSubModal || !!showDeleteId);
  
  // Notification logs
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Auto dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Form states for Add Clinic
  const [newClinicName, setNewClinicName] = useState("");
  const [newClinicEmail, setNewClinicEmail] = useState("");
  const [newClinicPlan, setNewClinicPlan] = useState<"trial" | "quarterly" | "yearly" | "lifetime">("trial");
  const [customDays, setCustomDays] = useState("30");

  // Form states for Edit Subscription
  const [editEmail, setEditEmail] = useState("");
  const [editPlan, setEditPlan] = useState<"trial" | "quarterly" | "yearly" | "lifetime">("trial");
  const [editDate, setEditDate] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "expired" | "banned">("active");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // Days left calculator (Current Local Time of reference inside metadata is 2026-05-21)
  const calculateDaysLeft = (clinic: ClinicRecord) => {
    if (clinic.status === "banned") {
      return lang === "ar" ? "محظور" : "Banned";
    }
    if (clinic.plan === "lifetime") {
      return lang === "ar" ? "مدى الحياة" : "Lifetime";
    }

    const expiry = new Date(clinic.expires_at);
    // Reference date: 2026-05-21 constant
    const today = new Date("2026-05-21");
    
    // Clear hours to calculate clean date difference
    expiry.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return lang === "ar" ? "منتهي الصلاحية" : "Expired";
    }
    return `${diffDays}d`;
  };

  // Perform Backup simulation
  const handleBackup = (clinic: ClinicRecord) => {
    setBackingUpId(clinic.id);
    showToast(
      lang === "ar" 
        ? `جاري إنشاء نسخة احتياطية مشفرة لعيادة [${clinic.name}]...` 
        : `Generating encrypted data payload archive for [${clinic.name}]...`, 
      "info"
    );

    setTimeout(() => {
      setBackingUpId(null);
      showToast(
        lang === "ar"
          ? `تم تنزيل النسخة الاحتياطية بنجاح! الملف: noor_backup_${clinic.id}_2026.sql`
          : `Backup archive downloaded successfully! File: noor_backup_${clinic.id}_2026.sql`,
        "success"
      );
      
      // Simulate file download
      const element = document.createElement("a");
      const file = new Blob([`-- NOOR OPTICAL MANAGEMENT SYSTEM BACKUP\n-- Clinic ID: ${clinic.id}\n-- Clinic Name: ${clinic.name}\n-- Generated: 2026-05-21`], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `noor_backup_${clinic.name.replace(/\s+/g, '_')}_2026.sql`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      logAction({
        action: "create",
        entity_type: "settings",
        entity_id: clinic.id,
        entity_name: "Clinic Data Backup",
        details: `Super Admin database backup downloaded for: ${clinic.name}`
      });
    }, 1200);
  };

  // Toggle Ban state
  const handleToggleBan = (clinic: ClinicRecord) => {
    const isBanning = clinic.status !== "banned";
    const nextStatus = isBanning 
      ? "banned" 
      : (new Date(clinic.expires_at) < new Date("2026-05-21") ? "expired" : "active");

    setClinics(prev => prev.map(c => c.id === clinic.id ? { ...c, status: nextStatus } : c));
    
    showToast(
      isBanning 
        ? (lang === "ar" ? `تم حظر وإيقاف اشتراك عيادة [${clinic.name}] بنجاح!` : `Clinic [${clinic.name}] account suspended successfully!`)
        : (lang === "ar" ? `تم إلغاء حظر عيادة [${clinic.name}] وتفعيل الحساب!` : `Clinic [${clinic.name}] suspension lifted successfully!`),
      isBanning ? "error" : "success"
    );

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: clinic.id,
      entity_name: "Clinic Suspension Change",
      details: `Suspension status of [${clinic.name}] updated to: ${nextStatus}`
    });
  };

  // Impersonate Clinic
  const handleImpersonate = (clinic: ClinicRecord) => {
    setImpersonatedClinic(clinic.name);
    showToast(
      lang === "ar" 
        ? `جاري بدء جلسة محاكاة لعيادة [${clinic.name}]. يتم الآن إعادة التوجيه للوحة التحكم العامة...` 
        : `Launching impersonation session for [${clinic.name}]. Redirecting to Dashboard...`, 
      "success"
    );
    
    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: clinic.id,
      entity_name: "Clinic Impersonation Launch",
      details: `Admin launched clinic impersonation environment for: ${clinic.name}`
    });

    setTimeout(() => {
      setCurrentSection("dashboard");
    }, 1000);
  };

  // Add Clinic Submission
  const handleAddClinic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicName.trim()) {
      showToast(lang === "ar" ? "يرجى كتابة اسم العيادة" : "Please provide a clinic name", "error");
      return;
    }

    // Calculate expiry date
    const days = newClinicPlan === "lifetime" ? 30000 : parseInt(customDays) || 30;
    const expiryDate = new Date("2026-05-21");
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const formattedExpiry = expiryDate.toISOString().split("T")[0];
    const initialStatus = days > 0 || newClinicPlan === "lifetime" ? "active" : "expired";

    const newRecord: ClinicRecord = {
      id: "clinic_" + Math.random().toString(36).substring(7),
      name: newClinicName,
      owner_email: newClinicEmail.trim() || "",
      plan: newClinicPlan,
      expires_at: formattedExpiry,
      status: initialStatus as any
    };

    setClinics(prev => [newRecord, ...prev]);
    showToast(
      lang === "ar"
        ? `تم إضافة العيادة الجديدة [${newClinicName}] وتفعيل الاشتراك بنجاح!`
        : `New clinical workspace [${newClinicName}] registered successfully!`,
      "success"
    );

    logAction({
      action: "create",
      entity_type: "settings",
      entity_id: newRecord.id,
      entity_name: "Register Clinic",
      details: `Added new clinic [${newClinicName}] with [${newClinicPlan}] plan, expires: ${formattedExpiry}`
    });

    // Reset fields & close modal
    setNewClinicName("");
    setNewClinicEmail("");
    setNewClinicPlan("trial");
    setCustomDays("30");
    setShowAddModal(false);
  };

  // Open Edit Subscription Modal
  const openEditSub = (clinic: ClinicRecord) => {
    setShowSubModal(clinic);
    setEditEmail(clinic.owner_email);
    setEditPlan(clinic.plan);
    setEditDate(clinic.expires_at);
    setEditStatus(clinic.status);
  };

  // Save Subscription Edits
  const handleSaveSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSubModal) return;

    setClinics(prev => prev.map(c => {
      if (c.id === showSubModal.id) {
        return {
          ...c,
          owner_email: editEmail,
          plan: editPlan,
          expires_at: editDate,
          status: editStatus
        };
      }
      return c;
    }));

    showToast(
      lang === "ar"
        ? `تم تحديث تفاصيل اشتراك ومحددات عيادة [${showSubModal.name}]!`
        : `Subscription parameters for [${showSubModal.name}] updated successfully!`,
      "success"
    );

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: showSubModal.id,
      entity_name: "Edit Clinic Subscription",
      details: `Modified subscription of [${showSubModal.name}] to plan ${editPlan}, status: ${editStatus}`
    });

    setShowSubModal(null);
  };

  // Delete Clinic Confirmation
  const confirmDelete = () => {
    if (!showDeleteId) return;
    const target = clinics.find(c => c.id === showDeleteId);
    if (!target) return;

    setClinics(prev => prev.filter(c => c.id !== showDeleteId));
    showToast(
      lang === "ar"
        ? `تم إزالة وحذف ملف عيادة [${target.name}] من النظام كلياً!`
        : `Clinical node index for [${target.name}] deleted completely!`,
      "error"
    );

    logAction({
      action: "delete",
      entity_type: "settings",
      entity_id: showDeleteId,
      entity_name: "Delete Clinic node",
      details: `Purged and deleted clinical account archive for: ${target.name}`
    });

    setShowDeleteId(null);
  };

  // Filtered Clinics
  const filteredClinics = clinics.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.owner_email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = c.status === statusFilter;
    }

    // Plan filter
    let matchesPlan = true;
    if (planFilter !== "all") {
      matchesPlan = c.plan === planFilter;
    }

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Toast Announcement */}
      {toast && (
        <div className={cn(
          "fixed bottom-6 start-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all transform animate-in slide-in-from-bottom duration-300",
          toast.type === "success" ? "bg-emerald-50 text-emerald-950 border-emerald-200" :
          toast.type === "error" ? "bg-rose-50 text-rose-950 border-rose-200" :
          "bg-zinc-900 text-zinc-50 border-zinc-700"
        )}>
          {toast.type === "error" ? <ShieldAlert size={16} className="text-rose-700" /> : <Check size={16} className="text-emerald-700" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Title area matching the layout precisely */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-5 gap-4">
        <div>
          <span className="text-[10px] font-bold text-amber-800 tracking-widest uppercase block mb-1">
            SUPER ADMIN
          </span>
          <h1 className="text-4xl font-serif font-bold text-ink-dark leading-tight">
            {lang === "ar" ? "إدارة العيادات المشتركة" : "Clinic Management"}
          </h1>
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-burgundy hover:bg-burgundy-soft text-white font-bold text-xs select-none px-5 py-3 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-2 md:text-sm"
        >
          <span>{lang === "ar" ? "إضافة عيادة +" : "Add Clinic +"}</span>
        </button>
      </div>

      {/* Search & Filter Controls matching screenshot perfectly */}
      <div className="bg-white/50 border border-cream-border p-3.5 rounded-2xl flex flex-col sm:flex-row flex-wrap gap-3 items-center w-full shadow-sm">
        
        {/* Search input with prefix glass icon */}
        <div className="relative w-full sm:flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-light" size={16} />
          <input 
            type="text" 
            placeholder={lang === "ar" ? "ابحث عن عيادة..." : "...Search clinic"} 
            className="w-full bg-white border border-cream-border rounded-xl text-xs sm:text-sm ps-9 pe-4 py-2.5 outline-none focus:border-burgundy/50 text-ink"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Dropdowns */}
        <div className="flex gap-2.5 w-full sm:w-auto self-stretch sm:self-auto">
          <div className="relative flex-1 sm:flex-none">
            <select 
              className="appearance-none bg-white border border-cream-border rounded-xl text-xs sm:text-sm ps-4 pe-9 py-2.5 font-semibold text-ink-mid focus:outline-none focus:border-burgundy/50 cursor-pointer w-full outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
              <option value="active">{lang === "ar" ? "نشط" : "Active"}</option>
              <option value="expired">{lang === "ar" ? "منتهي الصلاحية" : "Expired"}</option>
              <option value="banned">{lang === "ar" ? "محظور" : "Banned"}</option>
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" size={14} />
          </div>

          <div className="relative flex-1 sm:flex-none">
            <select 
              className="appearance-none bg-white border border-cream-border rounded-xl text-xs sm:text-sm ps-4 pe-9 py-2.5 font-semibold text-ink-mid focus:outline-none focus:border-burgundy/50 cursor-pointer w-full outline-none"
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value as any)}
            >
              <option value="all">{lang === "ar" ? "كل الاشتراكات" : "All Plans"}</option>
              <option value="trial">{lang === "ar" ? "تجريبي" : "trial"}</option>
              <option value="quarterly">{lang === "ar" ? "ربع سنوي" : "quarterly"}</option>
              <option value="yearly">{lang === "ar" ? "سنوي" : "yearly"}</option>
              <option value="lifetime">{lang === "ar" ? "مدى الحياة" : "lifetime"}</option>
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 text-ink-light pointer-events-none" size={14} />
          </div>
        </div>

      </div>

      {/* Grid Table Container */}
      <div className="space-y-3.5">
        
        {/* Table Head (Hidden on Mobile) */}
        <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-2 bg-transparent text-[10px] font-bold text-ink-light uppercase tracking-widest border-b border-cream-border">
          <div className="col-span-2 text-start">{lang === "ar" ? "العيادة" : "CLINIC"}</div>
          <div className="col-span-2 text-start">{lang === "ar" ? "المالك" : "OWNER"}</div>
          <div className="col-span-1 text-center">{lang === "ar" ? "الاشتراك" : "PLAN"}</div>
          <div className="col-span-1 text-center">{lang === "ar" ? "تاريخ الانتهاء" : "EXPIRES"}</div>
          <div className="col-span-1 text-center">{lang === "ar" ? "الأيام" : "DAYS LEFT"}</div>
          <div className="col-span-1 text-center">{lang === "ar" ? "الحالة" : "STATUS"}</div>
          <div className="col-span-4 text-center">{lang === "ar" ? "الإجراءات" : "ACTIONS"}</div>
        </div>

        {/* List of Clinic Cards */}
        <div className="space-y-3">
          {filteredClinics.length === 0 ? (
            <div className="bg-white border border-cream-border text-center py-16 rounded-2xl">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-sm font-bold text-ink-mid">
                {lang === "ar" ? "لم نجد أي عيادة مطابقة لخيارات التصفية الحالية" : "No clinics match your search filters."}
              </p>
            </div>
          ) : (
            filteredClinics.map((clinic) => {
              const daysLeftStr = calculateDaysLeft(clinic);
              const isExpired = clinic.status === "expired" || daysLeftStr === "Expired" || daysLeftStr === "منتهي الصلاحية";
              const isBanned = clinic.status === "banned";
              const isBackingUp = backingUpId === clinic.id;

              return (
                <div 
                  key={clinic.id} 
                  className={cn(
                    "bg-white border rounded-2xl p-4 md:px-6 md:py-5 shadow-sm transition-all hover:border-burgundy/10 hover:shadow-md",
                    isBanned ? "border-rose-100 bg-rose-50/5" : "border-cream-border"
                  )}
                >
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    
                    {/* Clinic Name Column */}
                    <div className="lg:col-span-2 flex justify-between lg:block items-center text-start">
                      <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans font-bold">
                        {lang === "ar" ? "العيادة" : "CLINIC"}
                      </span>
                      <h4 className="font-serif font-bold text-base text-ink leading-tight">
                        {clinic.name}
                      </h4>
                    </div>

                    {/* Owner Email Column */}
                    <div className="lg:col-span-2 flex justify-between lg:block items-center text-start text-sm font-medium">
                      <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans font-bold">
                        {lang === "ar" ? "المالك" : "OWNER"}
                      </span>
                      <span className="text-ink-mid font-mono break-all truncate block" title={clinic.owner_email}>
                        {clinic.owner_email || "—"}
                      </span>
                    </div>

                    {/* Plan Badge Column */}
                    <div className="lg:col-span-1 flex justify-between lg:justify-center items-center">
                      <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans font-bold">
                        {lang === "ar" ? "الاشتراك" : "PLAN"}
                      </span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full",
                        clinic.plan === "trial" ? "bg-zinc-100 text-zinc-700 border border-zinc-200" :
                        clinic.plan === "quarterly" ? "bg-burgundy/5 text-burgundy border border-burgundy/10" :
                        clinic.plan === "yearly" ? "bg-blue-50 text-blue-800 border border-blue-100" :
                        "bg-gold/10 text-gold-dark border border-gold/30"
                      )}>
                        {clinic.plan}
                      </span>
                    </div>

                    {/* Expires Column */}
                    <div className="lg:col-span-1 flex justify-between lg:justify-center items-center">
                      <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans font-bold">
                        {lang === "ar" ? "تاريخ الانتهاء" : "EXPIRES"}
                      </span>
                      <span className="font-mono text-xs font-semibold text-ink-mid">
                        {clinic.expires_at}
                      </span>
                    </div>

                    {/* Days Left Column */}
                    <div className="lg:col-span-1 flex justify-between lg:justify-center items-center">
                      <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans font-bold">
                        {lang === "ar" ? "الأيام" : "DAYS LEFT"}
                      </span>
                      <span className={cn(
                        "font-mono text-xs font-bold",
                        isExpired || isBanned ? "text-rose-600 uppercase" : "text-emerald-700"
                      )}>
                        {daysLeftStr}
                      </span>
                    </div>

                    {/* Status Badge Column */}
                    <div className="lg:col-span-1 flex justify-between lg:justify-center items-center">
                      <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans font-bold">
                        {lang === "ar" ? "الحالة" : "STATUS"}
                      </span>
                      <span className={cn(
                        "text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider",
                        isBanned ? "bg-rose-100 text-rose-800 border border-rose-200" :
                        isExpired ? "bg-rose-50 text-rose-700 border border-rose-100/55" :
                        "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      )}>
                        {isBanned ? (lang === "ar" ? "محظور" : "Banned") : 
                         isExpired ? (lang === "ar" ? "منتهي" : "Expired") : 
                         (lang === "ar" ? "نشط" : "Active")}
                      </span>
                    </div>

                    {/* Actions Group Column */}
                    <div className="lg:col-span-4 flex flex-col gap-2 pt-3.5 lg:pt-0 border-t border-cream-border lg:border-none w-full">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 w-full">
                        
                        <button 
                          onClick={() => handleBackup(clinic)}
                          disabled={isBackingUp}
                          className="bg-white border border-cream-border font-bold text-[11px] px-1 py-1.5 rounded-lg text-ink hover:bg-cream/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          {isBackingUp && (
                            <RefreshCw size={10} className="animate-spin text-burgundy" />
                          )}
                          <span>{lang === "ar" ? "احتياطي" : "Backup"}</span>
                        </button>

                        <button 
                          onClick={() => handleToggleBan(clinic)}
                          className={cn(
                            "border font-bold text-[11px] px-1 py-1.5 rounded-lg transition-all active:scale-95 flex items-center justify-center cursor-pointer whitespace-nowrap",
                            isBanned 
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100" 
                              : "bg-white text-ink border-cream-border hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100"
                          )}
                        >
                          {isBanned ? (lang === "ar" ? "تنشيط" : "Unban") : (lang === "ar" ? "حظر" : "Ban")}
                        </button>

                        <button 
                          onClick={() => handleImpersonate(clinic)}
                          className="bg-white border border-cream-border font-bold text-[11px] px-1 py-1.5 rounded-lg text-ink hover:bg-cream/40 transition-all active:scale-95 flex items-center justify-center cursor-pointer whitespace-nowrap"
                        >
                          <span>{lang === "ar" ? "محاكاة" : "Impersonate"}</span>
                        </button>

                        <button 
                          onClick={() => openEditSub(clinic)}
                          className="bg-white border border-cream-border font-bold text-[11px] px-1 py-1.5 rounded-lg text-ink hover:bg-cream/40 transition-all active:scale-95 flex items-center justify-center cursor-pointer whitespace-nowrap"
                        >
                          <span>{lang === "ar" ? "ترخيص" : "Subscription"}</span>
                        </button>
                      </div>

                      {/* Align Delete under as seen in first card row */}
                      <div className="flex justify-center pt-1.5">
                        <button 
                          onClick={() => setShowDeleteId(clinic.id)}
                          className="font-bold text-[11px] px-3.5 py-1.5 rounded-lg border border-rose-100 text-rose-500 bg-white hover:bg-rose-50 hover:border-rose-200 transition-all active:scale-95 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Trash2 size={11} />
                          <span>{lang === "ar" ? "حذف العيادة" : "Delete"}</span>
                        </button>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* MODAL 1: ADD CLINIC MODAL */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white border border-cream-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 end-4 p-1.5 rounded-lg text-ink-light hover:bg-cream text-ink-mid transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-serif font-bold text-ink mb-4 pb-2 border-b border-cream">
              {lang === "ar" ? "إضافة عيادة شريكة جديدة" : "Add New Clinical Node"}
            </h3>

            <form onSubmit={handleAddClinic} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                  {lang === "ar" ? "اسم العيادة" : "Clinic Workspace Name"}
                </label>
                <input 
                  type="text"
                  required
                  placeholder={lang === "ar" ? "مثال: بصريات نور الغد" : "e.g. Al-Nour Optics Node"}
                  className="input-field w-full text-xs bg-cream/40 border-cream-border rounded-xl px-3 py-2.5 text-ink hover:bg-white focus:bg-white outline-none focus:border-burgundy-soft border-2"
                  value={newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                  {lang === "ar" ? "البريد الإلكتروني للمالك" : "Owner / Clinical Email Address"}
                </label>
                <input 
                  type="email"
                  placeholder="name@example.com"
                  className="input-field w-full text-xs bg-cream/40 border-cream-border rounded-xl px-3 py-2.5 text-ink hover:bg-white focus:bg-white outline-none focus:border-burgundy-soft border-2"
                  value={newClinicEmail}
                  onChange={(e) => setNewClinicEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                    {lang === "ar" ? "باقة الاشتراك" : "License Tier"}
                  </label>
                  <select 
                    className="w-full bg-cream/40 border-cream-border border-2 text-xs rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-burgundy cursor-pointer outline-none"
                    value={newClinicPlan}
                    onChange={(e) => setNewClinicPlan(e.target.value as any)}
                  >
                    <option value="trial">Trial</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                    {lang === "ar" ? "أيام الصلاحية" : "Duration (Days)"}
                  </label>
                  <input 
                    type="number"
                    disabled={newClinicPlan === "lifetime"}
                    className="input-field w-full text-xs bg-cream/40 border-cream-border rounded-xl px-3 py-2 text-ink outline-none focus:border-burgundy-soft border-2 disabled:opacity-50"
                    value={newClinicPlan === "lifetime" ? "9999" : customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-ink-mid bg-cream hover:bg-cream-dark rounded-xl transition-colors cursor-pointer"
                >
                  {lang === "ar" ? "إلغاء الأمر" : "Cancel"}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-burgundy hover:bg-burgundy-soft text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{lang === "ar" ? "حفظ وإضافة" : "Register Node"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: EDIT SUBSCRIPTION MODAL */}
      {showSubModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowSubModal(null)}
        >
          <div 
            className="bg-white border border-cream-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowSubModal(null)}
              className="absolute top-4 end-4 p-1.5 rounded-lg text-ink-light hover:bg-cream text-ink-mid transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-serif font-bold text-ink mb-4 pb-2 border-b border-cream">
              {lang === "ar" ? "تعديل رخصة واشتراك العيادة" : "Parameters License Allocation"}
            </h3>

            <p className="text-xs text-ink-light mb-4">
              {lang === "ar" 
                ? `أنت تقوم بتعديل معايير البوابة وخوادم الترخيص الخاصة بـ: ${showSubModal.name}` 
                : `Modulating active lease limits, endpoints, and standing for: ${showSubModal.name}`}
            </p>

            <form onSubmit={handleSaveSub} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                  {lang === "ar" ? "البريد الإلكتروني للمالك" : "Owner Email Contact"}
                </label>
                <input 
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="input-field w-full text-xs bg-cream/30 border-cream-border rounded-xl px-3 py-2.5 text-ink hover:bg-white focus:bg-white outline-none focus:border-burgundy-soft border-2"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                    {lang === "ar" ? "ترخيص الاشتراك" : "License Plan"}
                  </label>
                  <select 
                    className="w-full bg-cream/30 border-cream-border border-2 text-xs rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-burgundy cursor-pointer outline-none"
                    value={editPlan}
                    onChange={(e) => setEditPlan(e.target.value as any)}
                  >
                    <option value="trial">Trial</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                    {lang === "ar" ? "تاريخ انتهاء الترخيص" : "Expiry Calendar Date"}
                  </label>
                  <input 
                    type="date"
                    required
                    className="input-field w-full text-xs bg-cream/30 border-cream-border rounded-xl px-3 py-2 text-ink outline-none focus:border-burgundy-soft border-2 cursor-pointer"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider ms-1">
                  {lang === "ar" ? "الحالة التشغيلية" : "Service Access Status"}
                </label>
                <select 
                  className="w-full bg-cream/30 border-cream-border border-2 text-xs rounded-xl px-3 py-2 text-ink focus:outline-none focus:border-burgundy cursor-pointer outline-none"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                >
                  <option value="active">{lang === "ar" ? "نشط ومفعل (Active)" : "Active / Operational"}</option>
                  <option value="expired">{lang === "ar" ? "منتهي الاشتراك (Expired)" : "Expired Contract"}</option>
                  <option value="banned">{lang === "ar" ? "محظور إدارياً (Suspended)" : "Administratively Suspended"}</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowSubModal(null)}
                  className="flex-1 py-2.5 text-xs font-bold text-ink-mid bg-cream hover:bg-cream-dark rounded-xl transition-colors cursor-pointer"
                >
                  {lang === "ar" ? "إلغاء التعديل" : "Cancel"}
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-burgundy hover:bg-burgundy-soft text-white rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{lang === "ar" ? "تثبيت البيانات" : "Save Changes"}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 3: CONSOLIDATED DELETION CHALLENGE CONTROL */}
      {showDeleteId && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowDeleteId(null)}
        >
          <div 
            className="bg-white border hover:border-rose-100 border-cream-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative animate-in zoom-in-95 duration-200 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 animate-bounce">
              <ShieldAlert size={22} />
            </div>

            <h3 className="text-lg font-serif font-bold text-rose-950 mb-1.5">
              {lang === "ar" ? "تأكيد إزالة ملف العيادة" : "Acknowledge Absolute Purge"}
            </h3>

            <p className="text-xs text-ink-light mb-6">
              {lang === "ar" 
                ? "هل أنت متأكد من حذف هذه العيادة من النظام؟ هذا الإجراء سيقوم بتعطيل حساب العيادة وحذف كافة البيانات المرتبطة بها نهائياً ولا يمكن استرجاعها مطلقاً." 
                : "Deleting this clinical node deletes patient backlogs, medical files, frame logs, and operational registers irreversibly."}
            </p>

            <div className="flex gap-2.5">
              <button 
                onClick={() => setShowDeleteId(null)}
                className="flex-1 py-2.5 text-xs font-bold text-ink-mid bg-cream hover:bg-cream-dark rounded-xl transition-colors cursor-pointer"
              >
                {lang === "ar" ? "إلغاء الحذف" : "Abort Delete"}
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
              >
                {lang === "ar" ? "تأكيد الحذف كلياً" : "Purge Block Index"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
