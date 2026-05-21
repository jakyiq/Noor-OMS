import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, Save, Database, Printer, Building2, Bell, 
  Shield, Palette, List, Key, ShieldAlert, Download, RefreshCw, Layers,
  Lock, Upload, Trash2, AlertTriangle, Users
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { cn } from "../lib/utils";

// Theme config definitions
const BRAND_THEMES = [
  { id: "burgundy", nameEn: "Burgundy", nameAr: "عنابي", primary: "#6b1a2a", soft: "#8b2a3e", pale: "#f5e8eb" },
  { id: "navy", nameEn: "Navy", nameAr: "كحلي", primary: "#1e3a8a", soft: "#2563eb", pale: "#eff6ff" },
  { id: "emerald", nameEn: "Emerald", nameAr: "زمردي", primary: "#047857", soft: "#059669", pale: "#ecfdf5" },
  { id: "charcoal", nameEn: "Charcoal", nameAr: "فحمي", primary: "#1f2937", soft: "#4b5563", pale: "#f3f4f6" },
  { id: "terracotta", nameEn: "Terracotta", nameAr: "طيني", primary: "#9a3412", soft: "#ea580c", pale: "#fff7ed" }
];

export const getThemeColorHex = (themeId: string) => {
  const map = {
    burgundy: "#800020",
    navy: "#1a4a8d",
    emerald: "#064e3b",
    charcoal: "#1f2937",
    gold: "#b45309"
  };
  return map[themeId as keyof typeof map] || "#800020";
};

export const getPresetLogoSvg = (presetId: string, theme: string) => {
  const themeHexMap = {
    burgundy: "800020",
    navy: "1a4a8d",
    emerald: "064e3b",
    charcoal: "1f2937",
    gold: "b45309"
  };
  const color = themeHexMap[theme as keyof typeof themeHexMap] || "800020";
  
  if (presetId === "preset_1") {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="%23${color}" stroke-width="6"><path d="M10 50 Q50 15 90 50 Q50 85 10 50 Z"/><circle cx="50" cy="50" r="18" fill="%23${color}"/><circle cx="50" cy="50" r="8" fill="white"/></svg>`;
  }
  if (presetId === "preset_2") {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="%23${color}" stroke-width="6"><path d="M20 15 L50 7 L80 15 Q80 55 50 85 Q20 55 20 15 Z" fill="none"/><circle cx="50" cy="45" r="14" fill="%23${color}"/><path d="M40 45 H60 M50 35 V55" stroke="white" stroke-width="4"/></svg>`;
  }
  if (presetId === "preset_3") {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="%23${color}" stroke-width="6"><circle cx="30" cy="50" r="18" fill="none"/><circle cx="70" cy="50" r="18" fill="none"/><path d="M48 50 Q50 44 52 50" stroke="%23${color}" stroke-width="6"/><path d="M12 50 H15 M85 50 H88" stroke="%23${color}" stroke-width="4"/><path d="M30 32 L20 15 M70 32 L80 15" stroke="%23${color}" stroke-width="6"/></svg>`;
  }
  return "";
};

export function Settings() {
  const { lang, clinic, setClinic, logAction, lensCatalog, setLensCatalog, user } = useClinic();
  const [activeTab, setActiveTab] = useState("general");
  const [saveStatus, setSaveStatus] = useState("");

  // Receptionist management states
  const [receptionists, setReceptionists] = useState<any[]>(() => {
    const saved = localStorage.getItem("noor_receptionists");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => ({
          ...r,
          permissions: r.permissions || {
            viewFinancials: false,
            auditOrders: false,
            editPatients: false,
            editSettings: false
          }
        }));
      } catch (e) {
        console.error("Error loading receptionists:", e);
      }
    }
    return [
      { 
        id: "rec_1", 
        full_name: "Abeer Al-Sadi", 
        username: "abeer_rec", 
        password: "123",
        permissions: {
          viewFinancials: false,
          auditOrders: false,
          editPatients: false,
          editSettings: false
        }
      }
    ];
  });

  const [newRec, setNewRec] = useState({ 
    full_name: "", 
    username: "", 
    password: "",
    viewFinancials: false,
    auditOrders: false,
    editPatients: false,
    editSettings: false
  });
  const [recError, setRecError] = useState("");

  const handleTogglePermission = (recId: string, flag: "viewFinancials" | "auditOrders" | "editPatients" | "editSettings") => {
    const updated = receptionists.map(r => {
      if (r.id === recId) {
        const currentPermissions = r.permissions || {
          viewFinancials: false,
          auditOrders: false,
          editPatients: false,
          editSettings: false
        };
        return {
          ...r,
          permissions: {
            ...currentPermissions,
            [flag]: !currentPermissions[flag]
          }
        };
      }
      return r;
    });
    setReceptionists(updated);
    localStorage.setItem("noor_receptionists", JSON.stringify(updated));

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: recId,
      entity_name: "Receptionist Rules Updated",
      details: `Dr. modified permission [${flag}] for receptionist`
    });
  };

  const handleAddReceptionist = (e: React.FormEvent) => {
    e.preventDefault();
    setRecError("");
    if (!newRec.full_name.trim() || !newRec.username.trim() || !newRec.password.trim()) {
      setRecError(lang === 'ar' ? "يرجى ملء جميع الحقول المطلوبة." : "Please fill out all receptionist fields.");
      return;
    }

    const usernameLower = newRec.username.toLowerCase().trim();
    // Validate uniqueness
    const exists = receptionists.some(r => r.username.toLowerCase().trim() === usernameLower);
    if (usernameLower === "ahmed_ali" || usernameLower === "admin" || exists) {
      setRecError(lang === 'ar' ? "اسم المستخدم محجوز بالفعل لمستخدم آخر." : "This login username is already reserved or in use.");
      return;
    }

    const addedRec = {
      id: "rec_" + Math.random().toString(36).substr(2, 9),
      full_name: newRec.full_name.trim(),
      username: usernameLower,
      password: newRec.password,
      permissions: {
        viewFinancials: newRec.viewFinancials,
        auditOrders: newRec.auditOrders,
        editPatients: newRec.editPatients,
        editSettings: newRec.editSettings
      }
    };

    const updated = [...receptionists, addedRec];
    setReceptionists(updated);
    localStorage.setItem("noor_receptionists", JSON.stringify(updated));

    logAction({
      action: "create",
      entity_type: "settings",
      entity_id: addedRec.id,
      entity_name: "Receptionist Assignment",
      details: `Dr. assigned helper [${addedRec.full_name}] with login name: ${addedRec.username}`
    });

    setNewRec({ 
      full_name: "", 
      username: "", 
      password: "",
      viewFinancials: false,
      auditOrders: false,
      editPatients: false,
      editSettings: false
    });
    setSaveStatus(lang === 'ar' ? "تمت إضافة المساعد بنجاح!" : "Receptionist account created successfully!");
    setTimeout(() => setSaveStatus(""), 3500);
  };

  const handleDeleteReceptionist = (id: string, name: string) => {
    const updated = receptionists.filter(r => r.id !== id);
    setReceptionists(updated);
    localStorage.setItem("noor_receptionists", JSON.stringify(updated));

    logAction({
      action: "delete",
      entity_type: "settings",
      entity_id: id,
      entity_name: "Receptionist Revoked",
      details: `Revoked access rights for receptionist [${name}]`
    });

    setSaveStatus(lang === 'ar' ? "تم حذف وإلغاء حساب المساعد." : "Receptionist account deleted and access revoked.");
    setTimeout(() => setSaveStatus(""), 3500);
  };

  // Theme states
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("noor_theme_color") || "charcoal");

  // Security passcodes
  const [supervisorPin, setSupervisorPin] = useState(() => localStorage.getItem("noor_supervisor_pin") || "2026");

  // Printing Layout states
  const [printTheme, setPrintTheme] = useState<"burgundy" | "navy" | "emerald" | "charcoal" | "gold">(
    clinic?.print_theme || "burgundy"
  );
  const [doctorCredentials, setDoctorCredentials] = useState(
    clinic?.doctor_credentials || "Dr. Ahmed Al-Rashid, Ophthalmic & Optics Specialist (Baghdad Board)"
  );
  const [doctorPhone, setDoctorPhone] = useState(
    clinic?.doctor_phone || "+964 770 123 4567"
  );
  const [printInstructions, setPrintInstructions] = useState(
    clinic?.print_instructions || "1. يرجى مراجعة الطبيب المختص بعد ستة أشهر أو في حال حدوث صداع ومشاكل في النظر.\n2. احرص على ارتداء النظارة أثناء القراءة أو العمل الطويل أمام الشاشات.\n3. تجنب تنظيف العدسات بأقمشة خشنة لتلافي الخدوش."
  );
  const [printLogoBase64, setPrintLogoBase64] = useState(
    clinic?.print_logo_base64 || "preset_1"
  );
  const [showStaffOnPrint, setShowStaffOnPrint] = useState(
    clinic?.show_staff_on_print ?? true
  );
  const [printAssociates, setPrintAssociates] = useState(
    clinic?.print_associates || "Dr. Sarah Jamil (Consultant Specialist) • Abeer Al-Sadi (Reception Head)"
  );

  // General clinic inputs
  const [formData, setFormData] = useState({
    name: clinic?.name || "",
    phone: clinic?.phone || "",
    address: clinic?.address || "",
    wa_template_1: clinic?.wa_template_1 || "Hello {patient_name}, this is a reminder for your follow-up on {next_visit} from {clinic_name}.",
    wa_template_2: clinic?.wa_template_2 || "",
    wa_template_3: clinic?.wa_template_3 || "",
    default_followup_months: clinic?.default_followup_months ?? 3,
    exclude_pos_from_patient_menu: clinic?.exclude_pos_from_patient_menu ?? false
  });

  // Product configurations
  const serializeCatalog = (items: import("../types").CatalogItem[]) => (items || []).map(i => `${i.label} | ${i.value}`).join('\n');
  const [catalogText, setCatalogText] = useState({
    type: serializeCatalog(lensCatalog?.type || []),
    material: serializeCatalog(lensCatalog?.material || []),
    coating: serializeCatalog(lensCatalog?.coating || []),
    frame_brand: serializeCatalog(lensCatalog?.frame_brand || []),
    frame_type: serializeCatalog(lensCatalog?.frame_type || []),
    frame_material: serializeCatalog(lensCatalog?.frame_material || []),
    frame_shape: serializeCatalog(lensCatalog?.frame_shape || [])
  });

  const parseCatalog = (text: string): import("../types").CatalogItem[] => {
    return text.split('\n').filter(line => line.trim() !== "").map(line => {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length === 2) {
        return { label: parts[0], value: parts[1], is_active: true };
      }
      return { label: line.trim(), value: line.trim(), is_active: true };
    });
  };

  // Sync state if context loads late
  useEffect(() => {
    if (clinic) {
      setFormData({
        name: clinic.name || "",
        phone: clinic.phone || "",
        address: clinic.address || "",
        wa_template_1: clinic.wa_template_1 || "Hello {patient_name}, this is a reminder for your follow-up on {next_visit} from {clinic_name}.",
        wa_template_2: clinic.wa_template_2 || "",
        wa_template_3: clinic.wa_template_3 || "",
        default_followup_months: clinic.default_followup_months ?? 3,
        exclude_pos_from_patient_menu: clinic.exclude_pos_from_patient_menu ?? false
      });
      setPrintTheme(clinic.print_theme || "burgundy");
      setDoctorCredentials(clinic.doctor_credentials || "Dr. Ahmed Al-Rashid, Ophthalmic & Optics Specialist (Baghdad Board)");
      setDoctorPhone(clinic.doctor_phone || "+964 770 123 4567");
      setPrintInstructions(clinic.print_instructions || "1. يرجى مراجعة الطبيب المختص بعد ستة أشهر أو في حال حدوث صداع ومشاكل في النظر.\n2. احرص على ارتداء النظارة أثناء القراءة أو العمل الطويل أمام الشاشات.\n3. تجنب تنظيف العدسات بأقمشة خشنة لتلافي الخدوش.");
      setPrintLogoBase64(clinic.print_logo_base64 || "preset_1");
      setShowStaffOnPrint(clinic.show_staff_on_print ?? true);
      setPrintAssociates(clinic.print_associates || "Dr. Sarah Jamil (Consultant Specialist) • Abeer Al-Sadi (Reception Head)");
    }
  }, [clinic]);

  // Apply visual styles helper
  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("noor_theme_color", themeId);
    
    // Select styling targets and dynamically construct style sheets
    const selected = BRAND_THEMES.find(t => t.id === themeId);
    if (selected) {
      let cssBlock = document.getElementById("noor-brand-overrides");
      if (!cssBlock) {
        cssBlock = document.createElement("style");
        cssBlock.id = "noor-brand-overrides";
        document.head.appendChild(cssBlock);
      }
      cssBlock.innerHTML = `
        :root {
          --color-burgundy: ${selected.primary} !important;
          --color-burgundy-soft: ${selected.soft} !important;
          --color-burgundy-pale: ${selected.pale} !important;
        }
      `;
    }

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: "appearance_theme",
      entity_name: "Visual Theme Overrides",
      details: `Switched clinic theme profile to ${themeId}`
    });

    setSaveStatus(lang === 'ar' ? 'تم تحديث مظهر العيادة وجاري الحفظ!' : 'Clinic branding theme applied immediately!');
    setTimeout(() => setSaveStatus(""), 3000);
  };

  // Saved clinical security passcode
  const handleSaveSecurityPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (supervisorPin.trim().length === 0) return;

    localStorage.setItem("noor_supervisor_pin", supervisorPin);
    
    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: "clinical_security",
      entity_name: "Audit Security Bypass Code",
      details: "Altered supervisor passcode for locked periods"
    });

    setSaveStatus(lang === 'ar' ? 'تم تحديث رقم المرور للمشرف بنجاح!' : 'Supervisor bypass passcode locked successfully!');
    setTimeout(() => setSaveStatus(""), 3000);
  };

  // Saved general clinics settings parameters
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    const changes: string[] = [];
    if (formData.name !== clinic.name) changes.push(`Name code to "${formData.name}"`);
    if (formData.phone !== clinic.phone) changes.push(`Phone code to "${formData.phone}"`);
    if (formData.address !== clinic.address) changes.push(`Address code to "${formData.address}"`);
    if (formData.default_followup_months !== clinic.default_followup_months) changes.push(`Recall changed to ${formData.default_followup_months}`);
    if (formData.exclude_pos_from_patient_menu !== clinic.exclude_pos_from_patient_menu) changes.push(`Exclude shelf transactions changed to ${formData.exclude_pos_from_patient_menu}`);

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: clinic.id,
      entity_name: "Clinic Settings",
      details: `Modified clinical parameters: ${changes.join(", ") || 'General template properties'}`
    });

    setClinic({
      ...clinic,
      ...formData
    });

    setSaveStatus(lang === 'ar' ? 'تم حفظ التغييرات بنجاح' : 'General clinic modifications saved successfully');
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleSavePrintSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    setClinic({
      ...clinic,
      print_theme: printTheme,
      doctor_credentials: doctorCredentials,
      doctor_phone: doctorPhone,
      print_instructions: printInstructions,
      print_logo_base64: printLogoBase64,
      show_staff_on_print: showStaffOnPrint,
      print_associates: printAssociates
    });

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: clinic.id,
      entity_name: "Print Layout Settings",
      details: `Updated print config theme to ${printTheme}, doctor credentials to ${doctorCredentials}`
    });

    setSaveStatus(lang === 'ar' ? 'تم حفظ نموذج وإعدادات الطباعة بنجاح!' : 'Print design system and templates saved successfully!');
    setTimeout(() => setSaveStatus(""), 3500);
  };

  // Save product catalog text boxes
  const handleSaveCatalog = () => {
    setLensCatalog({
      type: parseCatalog(catalogText.type),
      material: parseCatalog(catalogText.material),
      coating: parseCatalog(catalogText.coating),
      frame_brand: parseCatalog(catalogText.frame_brand),
      frame_type: parseCatalog(catalogText.frame_type),
      frame_material: parseCatalog(catalogText.frame_material),
      frame_shape: parseCatalog(catalogText.frame_shape)
    });

    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: "catalog",
      entity_name: "Optical Catalog",
      details: "Updated structured lens & frames parameters formulas"
    });

    setSaveStatus(lang === 'ar' ? 'تم تحديث كتالوج المشتريات ومصنف البضائع بنجاح!' : 'Optical parameters catalog saved successfully!');
    setTimeout(() => setSaveStatus(""), 3000);
  };

  // Perform clinic full JSON backup download
  const handleGenerateBackup = () => {
    const backupObj: Record<string, string | null> = {};
    const localKeys = [
      "noor_clinic_settings",
      "noor_audited_months",
      "noor_audit_stamp",
      "noor_supervisor_pin",
      "lensCatalog",
      "noor_audit_logs",
      "noor_patients",
      "noor_visits",
      "noor_receptionists"
    ];

    localKeys.forEach(k => {
      backupObj[k] = localStorage.getItem(k);
    });

    const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: "application/json" });
    const fileUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = fileUrl;
    downloadAnchor.download = `noor_oms_database_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(fileUrl);

    logAction({
      action: "create",
      entity_type: "settings",
      entity_id: "database_full_backup",
      entity_name: "Database JSON Extraction",
      details: "Initiated direct database extraction stream to personal files"
    });

    setSaveStatus(lang === 'ar' ? 'تم تفريغ وتحميل مخرجات قاعدة البيانات بنجاح!' : 'Database archive extracted to clinical JSON folder successfully!');
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const tabs = [
    { id: 'general', label: lang === 'ar' ? 'إعدادات العيادة' : 'Clinic Settings', icon: Building2 },
    { id: 'catalog', label: lang === 'ar' ? 'كتالوج المواد' : 'Product Catalog', icon: List },
    { id: 'db', label: lang === 'ar' ? 'قاعدة البيانات' : 'Database & Backup', icon: Database },
    { id: 'print', label: lang === 'ar' ? 'إعدادات الطباعة' : 'Print Layouts', icon: Printer },
    { id: 'notifications', label: lang === 'ar' ? 'واتساب الذكي' : 'WhatsApp Outreach', icon: Bell },
    { id: 'security', label: lang === 'ar' ? 'صلاحيات الأمان' : 'Security Passcodes', icon: Shield },
    { id: 'appearance', label: lang === 'ar' ? 'الهوية البصرية' : 'Brand Theme', icon: Palette },
    ...(user?.role !== "receptionist" ? [{ id: 'roles', label: lang === 'ar' ? 'أدوار المساعدين' : 'Receptionist Roles', icon: Users }] : [])
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Settings Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink mb-1 flex items-center gap-2">
          <SettingsIcon size={28} className="text-burgundy animate-spin-slow" />
          {lang === 'ar' ? 'مركز التكوين والإعدادات' : 'System & Clinic Settings'}
        </h1>
        <p className="text-xs text-ink-light font-medium uppercase tracking-widest">
          {lang === 'ar' ? 'تخصيص الهوية البصرية، وصلاحيات الأمان، وكتالوج النظارات وهياكل البيانات المدعومة' : 'Customize diagnostic metadata catalogs, visual overrides, WhatsApp templates and ledgers rules'}
        </p>
      </div>

      {/* Main Split Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Left Col: Sticky vertical tab list items */}
        <div className="w-full lg:w-72 shrink-0 bg-white border border-cream-border rounded-2xl p-2.5 shadow-sm space-y-1">
          <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider px-3 py-1.5 border-b border-cream-border/60 mb-1">
            {lang === 'ar' ? 'مجموعات الإعداد الفردية' : 'Configuration Chapters'}
          </p>
          <div className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-visible gap-1 pb-2 lg:pb-0 scrollbar-hide">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap text-xs font-bold w-full select-none",
                    activeTab === tab.id
                      ? "bg-burgundy text-white shadow-md shadow-burgundy/15"
                      : "text-ink-mid hover:bg-cream hover:text-ink"
                  )}
                >
                  <TabIcon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Col: Active Content Section */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-cream-border p-6 shadow-sm min-h-[460px]">
          
          {/* General settings tab */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="space-y-5 max-w-xl">
              <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream">
                <Building2 size={18} className="text-burgundy" /> 
                <span>{lang === 'ar' ? 'إعدادات الهيكل والمقر الخاص بالعيادة' : 'General Practice Configuration'}</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-ink-light uppercase tracking-wider">
                    {lang === 'ar' ? 'الاسم التجاري للعيادة' : 'Clinic Commercial Name'}
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field w-full text-xs"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-ink-light uppercase tracking-wider">
                    {lang === 'ar' ? 'رقم الهاتف المعتمد' : 'Official WhatsApp/Hotline'}
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field w-full text-xs font-mono"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-ink-light uppercase tracking-wider">
                  {lang === 'ar' ? 'العنوان والمقر الدائم' : 'Clinic Permanent Address'}
                </label>
                <textarea
                  rows={2}
                  className="input-field w-full text-xs"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-ink-light uppercase tracking-wider">
                  {lang === 'ar' ? 'الفترة الافتراضية للمراجعة (بالأشهر)' : 'Default Recall / Follow-up Interval (Months)'}
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  className="input-field w-full text-xs"
                  value={formData.default_followup_months}
                  onChange={e => setFormData({ ...formData, default_followup_months: parseInt(e.target.value) || 3 })}
                />
              </div>

              <div className="pt-4 border-t border-cream-border/60">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-cream-border text-burgundy focus:ring-burgundy/20 mt-1 cursor-pointer"
                    checked={formData.exclude_pos_from_patient_menu}
                    onChange={e => setFormData({ ...formData, exclude_pos_from_patient_menu: e.target.checked })}
                  />
                  <div>
                    <span className="block text-xs font-bold text-ink">
                      {lang === 'ar' ? 'استثناء مبيعات الرف المباشرة (المخزن) من قائمة بحث المرضى' : 'Exclude shelf walk-in retail sales from patient selection index'}
                    </span>
                    <span className="block text-[10px] text-ink-light mt-0.5 leading-normal">
                      {lang === 'ar' 
                        ? 'عند التفعيل، سيتم تصفية مبيعات المواد الفورية الجاهزة وحجبها من ملف المرضى التراكمي لتقليل الضجيج البصري، مع إدراج أرباحها كاملة بالتقارير.'
                        : 'If ticked, instant stock-shelf retail transactions do not populate virtual index nodes under checkup files indices to isolate pure clinical optical registers.'}
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex flex-col items-start gap-3 pt-4 border-t border-cream mt-6">
                <button
                  type="submit"
                  className="btn-burgundy w-full flex items-center justify-center py-2.5 text-xs shadow-md font-bold"
                >
                  <Save size={15} className="mr-2" />
                  {lang === 'ar' ? 'حفظ إعدادات الهوية والتواصل' : 'Save Clinic Settings'}
                </button>
                {saveStatus && <span className="text-xs font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2">{saveStatus}</span>}
              </div>
            </form>
          )}

          {/* Product configuration tab */}
          {activeTab === 'catalog' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream">
                <List size={18} className="text-burgundy" /> 
                <span>{lang === 'ar' ? 'مكونات القياسات ومصنفات البضائع' : 'Optical Parameters Catalog Editor'}</span>
              </h2>
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100 text-[10px] text-amber-900 leading-relaxed">
                <p className="font-bold mb-1">{lang === 'ar' ? 'صيغة إدخال الخصائص الفحصيّة:' : 'Parameters syntax rule:'}</p>
                <p>{lang === 'ar' ? 'اكتب كل قيمة في سطر مستقل بالطريقة: الاسم المعروض | المعرّف الفريد أو فقط القيمة مباشرة.' : 'Enter one item per line using label | key values structure (e.g. Blue Cut | blue_cut) or just simple labels.'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">Lens Types (أنواع العدسات)</label>
                  <textarea 
                    className="input-field w-full h-[80px] font-mono text-xs" 
                    value={catalogText.type} 
                    onChange={e => setCatalogText(prev => ({ ...prev, type: e.target.value }))} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">Lens Materials (خامات الزجاج)</label>
                  <textarea 
                    className="input-field w-full h-[80px] font-mono text-xs" 
                    value={catalogText.material} 
                    onChange={e => setCatalogText(prev => ({ ...prev, material: e.target.value }))} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">Lens Coatings (طبقات الحماية والمعالجات)</label>
                  <textarea 
                    className="input-field w-full h-[80px] font-mono text-xs" 
                    value={catalogText.coating} 
                    onChange={e => setCatalogText(prev => ({ ...prev, coating: e.target.value }))} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">Frame Brands (العلامات التجارية للإطارات)</label>
                  <textarea 
                    className="input-field w-full h-[80px] font-mono text-xs" 
                    value={catalogText.frame_brand} 
                    onChange={e => setCatalogText(prev => ({ ...prev, frame_brand: e.target.value }))} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">Frame Types (نوع الهيكل)</label>
                  <textarea 
                    className="input-field w-full h-[80px] font-mono text-xs" 
                    value={catalogText.frame_type} 
                    onChange={e => setCatalogText(prev => ({ ...prev, frame_type: e.target.value }))} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">Frame Shapes (الأشكال الهندسية)</label>
                  <textarea 
                    className="input-field w-full h-[80px] font-mono text-xs" 
                    value={catalogText.frame_shape} 
                    onChange={e => setCatalogText(prev => ({ ...prev, frame_shape: e.target.value }))} 
                  />
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 pt-4 border-t border-cream mt-6">
                <button className="btn-burgundy w-full flex items-center justify-center py-2.5 text-xs font-bold" onClick={handleSaveCatalog}>
                  <Save size={15} className="mr-2" />
                  {lang === 'ar' ? 'حفظ إدخالات الكتالوج' : 'Save Catalog Layouts'}
                </button>
                {saveStatus && <span className="text-xs font-sans text-emerald-600 font-bold">{saveStatus}</span>}
              </div>
            </div>
          )}

          {/* Database & backup tab */}
          {activeTab === 'db' && (
            <div className="space-y-5 max-w-xl animate-in fade-in duration-200">
              <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream">
                <Database size={18} className="text-burgundy" /> 
                <span>{lang === 'ar' ? 'تخزين وإدارة قاعدة البيانات الفورية' : 'Database Offline Integrity Tools'}</span>
              </h2>

              <p className="text-xs text-ink-mid">
                {lang === 'ar' 
                  ? 'يتم تخزين جميع بيانات العيادة (المرضى، المبيعات، ومستندات الفحص ودفتر التدقيق) محلياً داخل المحفظة الآمنة وخوادم الحفظ السريع.' 
                  : 'All patient registers, medical prescriptions, sales billing files, expenditures and accountant closing stamps are permanently serialized to safe sandboxed indexes.'}
              </p>

              {/* Subscription Check for Trial Mode */}
              {(!clinic?.plan || clinic?.plan === "trial") ? (
                <div className="p-5 border-2 border-dashed border-burgundy/20 bg-burgundy/5 rounded-2xl space-y-4">
                  <div className="flex gap-3 items-start">
                    <div className="p-2 bg-burgundy/10 rounded-xl text-burgundy shrink-0">
                      <Lock size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-burgundy">{lang === 'ar' ? '🔒 ميزة النسخ واستعادة البيانات مقفلة (الحساب التجريبي)' : '🔒 Database Export & Import Locked (Trial Period)'}</h4>
                      <p className="text-xs text-ink-mid mt-1 leading-relaxed">
                        {lang === 'ar'
                          ? 'استخراج النسخة الاحتياطية (JSON Backup) واسترجاعها هي ميزات مخصصة للمشتركين فقط. الحساب التجريبي لا يملك صلاحية تصدير أو استيراد قاعدة البيانات.'
                          : 'Offline database backup file generation (.json) and recovery restoration are professional capabilities. Trial plans are restricted from exporting clinical logs.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white/60 border border-burgundy/15 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-start">
                      <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'الباقة التجريبية المحدودة' : 'CURRENT PLAN: FREE TRIAL'}</p>
                      <p className="text-xs font-semibold text-ink-mid mt-0.5">{lang === 'ar' ? 'يتوفر التصدير والاستيراد فقط على الترخيص المهني' : 'Unlock backup features instantly to test'}</p>
                    </div>
                    <button
                      onClick={() => {
                        const updated = { ...clinic, plan: "yearly" as const };
                        setClinic(updated);
                        logAction({
                          action: "update",
                          entity_type: "settings",
                          entity_id: "trial_self_upgrade",
                          entity_name: "Upgrade subscription",
                          details: "Doctor self-upgraded subscription to Yearly Professional to unlock offline database serialization tools."
                        });
                        setSaveStatus(lang === 'ar' ? "تمت الترقية بنجاح! تم إلغاء القفل لجميع الأدوات." : "Subscription activated! Database tools unlocked.");
                        setTimeout(() => setSaveStatus(""), 4000);
                      }}
                      className="px-4 py-2 bg-burgundy hover:bg-burgundy-soft text-white text-xs font-bold rounded-lg shadow-md transition-all active:scale-95 cursor-pointer"
                    >
                      {lang === 'ar' ? 'الترقية الآن (تفعيل مجاني)' : 'Activate Professional License (Free Upgrade)'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Backup Section */}
                  <div className="p-4 bg-cream/45 border border-cream-border rounded-xl space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-cream">
                      <div>
                        <h4 className="text-xs font-bold text-ink">{lang === 'ar' ? 'تصدير قاعدة البيانات الحالية' : 'Generate Local Database Backup'}</h4>
                        <p className="text-[10px] text-ink-light">{lang === 'ar' ? 'حفظ ملف مضغوط بصيغة JSON على جهازك' : 'Export and download complete database (.json)'}</p>
                      </div>
                      <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {lang === 'ar' ? 'متاح ومفعل' : 'UNLOCKED PROFESSIONAL'}
                      </span>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleGenerateBackup}
                        className="px-4 py-2.5 bg-neutral-900 border border-neutral-850 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 w-full hover:bg-neutral-850 transition-all hover:scale-[1.01] shadow-md cursor-pointer"
                      >
                        <Download size={14} />
                        <span>{lang === 'ar' ? 'تحميل ملف النسخة الاحتياطية (JSON Backup)' : 'Download Full Offline Database Backup (.json)'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Restore Section */}
                  <div className="p-4 bg-cream/45 border border-cream-border rounded-xl space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-cream">
                      <div>
                        <h4 className="text-xs font-bold text-ink">{lang === 'ar' ? 'استعادة قاعدة البيانات' : 'Restore Database Backup'}</h4>
                        <p className="text-[10px] text-ink-light">{lang === 'ar' ? 'رفع ملف JSON مستخرج مسبقاً لاسترجاع البيانات' : 'Import clinical registers back into local environment'}</p>
                      </div>
                      <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {lang === 'ar' ? 'استيراد آمن' : 'SECURE RESTORATION'}
                      </span>
                    </div>

                    <div className="pt-2">
                      <label className="border-2 border-dashed border-cream-border hover:border-burgundy/30 bg-white hover:bg-cream-light/35 p-6 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all">
                        <Upload size={22} className="text-burgundy/60" />
                        <span className="text-xs font-bold text-ink-mid text-center">{lang === 'ar' ? 'اختر ملف النسخ الاحتياطي المسترجع أو اسحبه هنا' : 'Choose backup JSON file to import'}</span>
                        <span className="text-[9px] text-ink-light uppercase tracking-wider">{lang === 'ar' ? 'تنسيق الملف: JSON فقط' : 'Format requirements: .json backups only'}</span>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              try {
                                const parsed = JSON.parse(event.target?.result as string);
                                if (!parsed || (!("noor_patients" in parsed) && !("noor_clinic_settings" in parsed))) {
                                  throw new Error("Missing structural elements.");
                                }
                                // Write database values
                                Object.keys(parsed).forEach(key => {
                                  if (parsed[key] !== null && parsed[key] !== undefined) {
                                    localStorage.setItem(key, parsed[key]);
                                  }
                                });
                                logAction({
                                  action: "update",
                                  entity_type: "settings",
                                  entity_id: "restore_action",
                                  entity_name: "Import Database Restoration",
                                  details: "Successfully uploaded JSON and synchronised local environment."
                                });
                                setSaveStatus(lang === 'ar' ? "تمت استعادة قاعدة البيانات بنجاح! جاري التحديث..." : "Database restored successfully! Reloading...");
                                setTimeout(() => window.location.reload(), 1500);
                              } catch (err: any) {
                                alert(lang === 'ar' ? `خطأ في استيراد البيانات: ملف غير صالح.` : `Restoration failed: Selected file is not a valid Noor backup JSON.`);
                              }
                            };
                            reader.readAsText(file);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {saveStatus && <p className="text-xs font-bold text-emerald-600 animate-pulse">{saveStatus}</p>}
            </div>
          )}

          {/* Roles & Receptionist assignment tab */}
          {activeTab === 'roles' && user?.role !== "receptionist" && (
            <div className="space-y-6 max-w-2xl animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-cream pb-3">
                <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2">
                  <Users size={18} className="text-burgundy" /> 
                  <span>{lang === 'ar' ? 'صلاحيات الاستقبال والمساعدين' : 'Receptionist Credentials & Roles'}</span>
                </h2>
                <span className="bg-burgundy/10 text-burgundy text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {lang === 'ar' ? 'فقط للدكتور' : 'DOCTOR ONLY CONTROL'}
                </span>
              </div>

              <p className="text-xs text-ink-mid leading-relaxed">
                {lang === 'ar' 
                  ? 'قم بتسجيل وتعيين مساعدين بأسماء دخول وكلمات مرور مخصصة. سيملك الحساب صلاحية محدودة (استعراض العيادة وتسجيل الفحوصات ومتابعة البضائع والنظارات دون الدخول للاشتراكات أو الهوية الرسومية أو السجلات المالية والتدقيق).' 
                  : 'Assign receptionist users with individual entry passwords. Assistance roles gain scoped write/view permissions blockaded from system settings, pricing overrides, financial metrics, and audit logs indexes.'}
              </p>

              {/* Add form */}
              <form onSubmit={handleAddReceptionist} className="bg-cream/45 border border-cream-border p-5 rounded-2xl space-y-4 shadow-sm">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 border-b border-cream pb-2">
                  {lang === 'ar' ? 'تعيين مساعد جديد' : 'Assign New Assistant Worker'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'الاسم الكامل للمساعد' : 'Full Name'}</label>
                    <input 
                      type="text"
                      className="input-field w-full text-xs py-2.5 px-3 bg-white border border-cream-border rounded-lg outline-none focus:border-burgundy"
                      placeholder={lang === 'ar' ? 'سحر الجبوري' : 'Sahar Al-Jubouri'}
                      value={newRec.full_name}
                      onChange={(e) => setNewRec(prev => ({ ...prev, full_name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'اسم المستخدم للدخول' : 'Login Username'}</label>
                    <input 
                      type="text"
                      className="input-field w-full text-xs py-2.5 px-3 bg-white border border-cream-border rounded-lg outline-none focus:border-burgundy font-mono"
                      placeholder="sahar_rec"
                      value={newRec.username}
                      onChange={(e) => setNewRec(prev => ({ ...prev, username: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'كلمة المرور' : 'Secure Password'}</label>
                    <input 
                      type="password"
                      className="input-field w-full text-xs py-2.5 px-3 bg-white border border-cream-border rounded-lg outline-none focus:border-burgundy"
                      placeholder="••••"
                      value={newRec.password}
                      onChange={(e) => setNewRec(prev => ({ ...prev, password: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                {/* Rule Assignment Section */}
                <div className="pt-3 border-t border-cream/50">
                  <h4 className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-2 text-start">
                    {lang === 'ar' ? 'صلاحيات المساعد (القواعد والامتيازات):' : 'Assistant Permissions (Rules & Privileges):'}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-white border border-cream-border hover:bg-cream-light/35 select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-cream-border text-burgundy focus:ring-burgundy/20 cursor-pointer"
                        checked={newRec.viewFinancials}
                        onChange={(e) => setNewRec(prev => ({ ...prev, viewFinancials: e.target.checked }))}
                      />
                      <div className="text-start">
                        <span className="font-bold text-ink">{lang === 'ar' ? 'عرض البيانات المالية والتقارير' : 'View Financials & Reports'}</span>
                        <p className="text-[9px] text-ink-light leading-normal">{lang === 'ar' ? 'التقارير وسجل المبيعات والأرباح بالكامل' : 'View financial summaries and analytics'}</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-white border border-cream-border hover:bg-cream-light/35 select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-cream-border text-burgundy focus:ring-burgundy/20 cursor-pointer"
                        checked={newRec.auditOrders}
                        onChange={(e) => setNewRec(prev => ({ ...prev, auditOrders: e.target.checked }))}
                      />
                      <div className="text-start">
                        <span className="font-bold text-ink">{lang === 'ar' ? 'تدقيق الطلبات والسجلات' : 'Audit System Logs'}</span>
                        <p className="text-[9px] text-ink-light leading-normal">{lang === 'ar' ? 'استعراض سجل الفحوصات والتعديلات والتدقيق المالي' : 'Inspect system audit trails to lock files'}</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-white border border-cream-border hover:bg-cream-light/35 select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-cream-border text-burgundy focus:ring-burgundy/20 cursor-pointer"
                        checked={newRec.editPatients}
                        onChange={(e) => setNewRec(prev => ({ ...prev, editPatients: e.target.checked }))}
                      />
                      <div className="text-start">
                        <span className="font-bold text-ink">{lang === 'ar' ? 'تعديل وحذف المرضى والزيارات' : 'Edit/Delete Patients & Visits'}</span>
                        <p className="text-[9px] text-ink-light leading-normal">{lang === 'ar' ? 'تعديل أو إلغاء ملفات الفحص والطلب' : 'Edit or delete checkup files'}</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer p-2 rounded bg-white border border-cream-border hover:bg-cream-light/35 select-none">
                      <input 
                        type="checkbox" 
                        className="rounded border-cream-border text-burgundy focus:ring-burgundy/20 cursor-pointer"
                        checked={newRec.editSettings}
                        onChange={(e) => setNewRec(prev => ({ ...prev, editSettings: e.target.checked }))}
                      />
                      <div className="text-start">
                        <span className="font-bold text-ink">{lang === 'ar' ? 'تعديل إعدادات العيادة والكتالوج' : 'Bypass Practice Settings'}</span>
                        <p className="text-[9px] text-ink-light leading-normal">{lang === 'ar' ? 'تعديل قالب الطباعة والكتالوج والواتساب' : 'Edit print forms and product catalogues'}</p>
                      </div>
                    </label>
                  </div>
                </div>

                {recError && <p className="text-[10px] text-rose-600 font-bold">{recError}</p>}

                <div className="text-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-xs font-bold text-white bg-burgundy rounded-xl shadow-md cursor-pointer"
                  >
                    {lang === 'ar' ? 'تأكيد وحفظ الصلاحيات' : 'Confirm & Provision Role'}
                  </button>
                </div>
              </form>

              {/* Active Receptionists List */}
              <div className="space-y-3 pt-4 border-t border-cream">
                <h3 className="text-xs font-bold text-ink uppercase tracking-wider text-start">
                  {lang === 'ar' ? `المساعدين المسجلين حالياً (${receptionists.length})` : `Currently Provisioned Assistants (${receptionists.length})`}
                </h3>

                {receptionists.length === 0 ? (
                  <div className="py-8 text-center bg-cream/20 border border-cream-border border-dashed rounded-xl text-ink-light text-xs">
                    {lang === 'ar' ? 'لا يوجد أي استقبال مسجل للعيادة حالياً.' : 'No reception assistants assigned to this optical workspace yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                    {receptionists.map((rec: any) => (
                      <div key={rec.id} className="p-4 bg-white border border-cream-border rounded-xl flex flex-col gap-3 shadow-xs">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 text-start">
                            <p className="text-xs font-bold text-ink">{rec.full_name}</p>
                            <div className="flex gap-3 text-[10px] font-mono text-ink-light">
                              <span>ID: <strong className="text-burgundy">{rec.username}</strong></span>
                              <span>PW: <strong className="text-ink-mid">{rec.password}</strong></span>
                            </div>
                            <span className="inline-block text-[8px] font-bold text-white bg-neutral-500 rounded px-1.5 py-0.2 tracking-widest uppercase">
                              {lang === 'ar' ? 'طاقم مساعد' : 'Scoped Receptionist'}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteReceptionist(rec.id, rec.full_name)}
                            className="p-1.5 text-ink-light/50 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Revoke and delete account credentials"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {/* Interactive permission rules list */}
                        <div className="pt-2.5 border-t border-cream-border/60 text-start">
                          <p className="text-[9px] font-bold text-ink-light uppercase tracking-wider mb-2">
                            {lang === 'ar' ? 'صلاحيات وقواعد المساعد:' : 'Rules & Privileges:'}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded text-burgundy cursor-pointer border-cream-border focus:ring-0 focus:ring-offset-0"
                                checked={rec.permissions?.viewFinancials || false}
                                onChange={() => handleTogglePermission(rec.id, "viewFinancials")}
                              />
                              <span className="truncate text-ink font-semibold">{lang === 'ar' ? 'عرض المالية' : 'View Financials'}</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded text-burgundy cursor-pointer border-cream-border focus:ring-0 focus:ring-offset-0"
                                checked={rec.permissions?.auditOrders || false}
                                onChange={() => handleTogglePermission(rec.id, "auditOrders")}
                              />
                              <span className="truncate text-ink font-semibold">{lang === 'ar' ? 'تدقيق العمليات' : 'Audit Logs'}</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded text-burgundy cursor-pointer border-cream-border focus:ring-0 focus:ring-offset-0"
                                checked={rec.permissions?.editPatients || false}
                                onChange={() => handleTogglePermission(rec.id, "editPatients")}
                              />
                              <span className="truncate text-ink font-semibold">{lang === 'ar' ? 'تعديل السجلات' : 'Edit Records'}</span>
                            </label>

                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input 
                                type="checkbox"
                                className="h-3.5 w-3.5 rounded text-burgundy cursor-pointer border-cream-border focus:ring-0 focus:ring-offset-0"
                                checked={rec.permissions?.editSettings || false}
                                onChange={() => handleTogglePermission(rec.id, "editSettings")}
                              />
                              <span className="truncate text-ink font-semibold">{lang === 'ar' ? 'إدارة الإعدادات' : 'Settings Control'}</span>
                            </label>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Print configuration templates */}
          {activeTab === 'print' && (
            <form onSubmit={handleSavePrintSettings} className="space-y-6 max-w-4xl animate-in fade-in duration-200 text-start">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-cream gap-2">
                <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2">
                  <Printer size={18} className="text-burgundy" /> 
                  <span>{lang === 'ar' ? 'تصميم الهوية البصرية والمستندات المطبوعة' : 'Prescription & Visit Document Branding'}</span>
                </h2>
                <span className="bg-amber-100 text-amber-900 text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-md tracking-wider font-sans">
                  {lang === 'ar' ? 'قوالب A5 الافتراضية' : 'A5 Document Engine'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Print Settings Form Controls */}
                <div className="lg:col-span-7 space-y-5">
                  {/* Color Theme Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-ink block uppercase tracking-wider">
                      {lang === 'ar' ? '1. طابع ولون المستندات المطبوعة' : '1. Document Theme Accent Color'}
                    </label>
                    <p className="text-[10px] text-ink-light leading-relaxed">
                      {lang === 'ar' ? 'حدد لون الترويسة والجداول والأكواد ليتطابق مع مظهر مركزك الطبي.' : 'Choose the signature branding color applied across print borders, tables, and highlights.'}
                    </p>
                    <div className="grid grid-cols-5 gap-2 pt-1 font-sans">
                      {[
                        { id: "burgundy", name: lang === 'ar' ? "عنابي" : "Burgundy", hex: "#800020" },
                        { id: "navy", name: lang === 'ar' ? "كحلي" : "Navy", hex: "#1a4a8d" },
                        { id: "emerald", name: lang === 'ar' ? "زمردي" : "Emerald", hex: "#064e3b" },
                        { id: "charcoal", name: lang === 'ar' ? "فحمي" : "Charcoal", hex: "#1f2937" },
                        { id: "gold", name: lang === 'ar' ? "ذهبي" : "Gold", hex: "#b45309" }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPrintTheme(t.id as any)}
                          className={cn(
                            "p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer hover:bg-cream-light/40",
                            printTheme === t.id ? "border-ink bg-cream/20 ring-2 ring-ink/5 scale-[1.03]" : "border-cream-border bg-white"
                          )}
                        >
                          <span className="w-5 h-5 rounded-full border border-ink/10 shadow-sm" style={{ backgroundColor: t.hex }} />
                          <span className="text-[9px] font-bold opacity-80">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Logo Options */}
                  <div className="space-y-3 pt-1">
                    <label className="text-xs font-bold text-ink block uppercase tracking-wider">
                      {lang === 'ar' ? '2. شعار العيادة (للمستند والـ QR كود)' : '2. Clinic Logo (For Paper & QR Code)'}
                    </label>
                    <p className="text-[10px] text-ink-light leading-relaxed">
                      {lang === 'ar' ? 'اختر أحد الشعارات الجاهزة المصممة خصيصاً أو ارفع شعارك المخصص.' : 'Select a premium vector preset matching your color theme, or upload your custom logo file.'}
                    </p>
                    
                    {/* Presets Grid */}
                    <div className="grid grid-cols-4 gap-2 pt-1 font-sans">
                      <button
                        type="button"
                        onClick={() => setPrintLogoBase64("preset_1")}
                        className={cn(
                          "p-2 border rounded-xl flex flex-col items-center gap-1.5 bg-white cursor-pointer transition-all hover:bg-cream-light/40 text-center",
                          printLogoBase64 === "preset_1" ? "border-ink ring-2 ring-ink/5 scale-[1.01]" : "border-cream-border"
                        )}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-cream/15 rounded-lg">
                          <img src={getPresetLogoSvg("preset_1", printTheme)} className="w-full h-full" alt="Preset 1" />
                        </div>
                        <span className="text-[9px] font-bold leading-tight">{lang === 'ar' ? 'عدسة نـور' : 'Optical Eye'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrintLogoBase64("preset_2")}
                        className={cn(
                          "p-2 border rounded-xl flex flex-col items-center gap-1.5 bg-white cursor-pointer transition-all hover:bg-cream-light/40 text-center",
                          printLogoBase64 === "preset_2" ? "border-ink ring-2 ring-ink/5 scale-[1.01]" : "border-cream-border"
                        )}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-cream/15 rounded-lg">
                          <img src={getPresetLogoSvg("preset_2", printTheme)} className="w-full h-full" alt="Preset 2" />
                        </div>
                        <span className="text-[9px] font-bold leading-tight">{lang === 'ar' ? 'درع البصريات' : 'Optic Shield'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPrintLogoBase64("preset_3")}
                        className={cn(
                          "p-2 border rounded-xl flex flex-col items-center gap-1.5 bg-white cursor-pointer transition-all hover:bg-cream-light/40 text-center",
                          printLogoBase64 === "preset_3" ? "border-ink ring-2 ring-ink/5 scale-[1.01]" : "border-cream-border"
                        )}
                      >
                        <div className="w-10 h-10 flex items-center justify-center p-1 bg-cream/15 rounded-lg">
                          <img src={getPresetLogoSvg("preset_3", printTheme)} className="w-full h-full" alt="Preset 3" />
                        </div>
                        <span className="text-[9px] font-bold leading-tight">{lang === 'ar' ? 'إطار نظارات' : 'Spectacles'}</span>
                      </button>

                      <label
                        className={cn(
                          "p-2 border rounded-xl flex flex-col items-center justify-center gap-1.5 bg-white cursor-pointer transition-all hover:bg-cream-light/40 text-center relative",
                          (printLogoBase64 && !printLogoBase64.startsWith("preset_")) ? "border-ink ring-2 ring-ink/5" : "border-cream-border"
                        )}
                      >
                        {printLogoBase64 && !printLogoBase64.startsWith("preset_") ? (
                          <div className="w-10 h-10 flex items-center justify-center p-0.5 rounded-lg overflow-hidden border">
                            <img src={printLogoBase64} className="w-full h-full object-contain" alt="Custom Logo" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 flex flex-col items-center justify-center rounded-lg bg-neutral-50 border border-dashed border-neutral-300">
                            <Upload size={14} className="text-neutral-500" />
                          </div>
                        )}
                        <span className="text-[9px] font-bold leading-tight">{lang === 'ar' ? 'شعارك الخاص' : 'Upload custom'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === "string") {
                                  setPrintLogoBase64(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 font-sans">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'الدرجة العلمية والشهادات (أعلى الورقة)' : 'Doctor Credentials / Bio'}</label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-medium"
                        value={doctorCredentials}
                        onChange={(e) => setDoctorCredentials(e.target.value)}
                        placeholder="Dr. Ahmed Al-Rashid, Optometrist Specialist"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'رقم الهاتف المطبوع في الترويسة' : 'Clinic / Doctor Printed Phone'}</label>
                      <input
                        type="text"
                        className="input-field w-full text-xs font-mono"
                        value={doctorPhone}
                        onChange={(e) => setDoctorPhone(e.target.value)}
                        placeholder="+964 770 123 4567"
                        required
                      />
                    </div>
                  </div>

                  {/* Custom Print Instructions */}
                  <div className="space-y-1 pt-1 font-sans">
                    <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? 'التعليمات الافتراضية أسفل الوصفة الطبية' : 'Default Prescription Instructions'}</label>
                    <textarea
                      className="input-field w-full text-xs font-medium"
                      rows={3}
                      value={printInstructions}
                      onChange={(e) => setPrintInstructions(e.target.value)}
                      placeholder={lang === 'ar' ? 'أضف تعليمات مخصصة للنظارات أو النصح الطبي...' : 'Append default advice on care, follow-up, or adaptation...'}
                    />
                  </div>

                  {/* Associates & Receptionists List */}
                  <div className="space-y-3 bg-cream/15 p-4 rounded-xl border border-cream-border font-sans">
                    <div className="flex justify-between items-center pb-2 border-b border-cream">
                      <div>
                        <h4 className="text-xs font-bold text-ink uppercase tracking-wider">{lang === 'ar' ? 'طاقم العمل والزملاء بالمركز' : 'Roster Team & Associates'}</h4>
                        <p className="text-[9px] text-ink-light">{lang === 'ar' ? 'سيتم طباعة أسمائهم وأرقام هواتفهم في ذيل الورقة لتسهيل التواصل' : 'Listed associates & reception helpers with contact numbers'}</p>
                      </div>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showStaffOnPrint}
                          onChange={(e) => setShowStaffOnPrint(e.target.checked)}
                          className="rounded text-burgundy focus:ring-burgundy/10 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-ink">{lang === 'ar' ? 'تضمين بالطبع' : 'Show in print'}</span>
                      </label>
                    </div>

                    {/* Integrated Receptionists from Local Storage */}
                    <div className="space-y-2 text-start">
                      <div className="flex flex-wrap gap-2">
                        {receptionists.map((rec: any) => (
                          <span key={rec.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-cream-border rounded text-[9px] text-ink-mid">
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            <strong>{rec.full_name}</strong>
                          </span>
                        ))}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-ink-light uppercase tracking-widest block">{lang === 'ar' ? 'أسماء أطباء مشاركين أو مساعدين إضافيين وهواتفهم' : 'Additional Associates & Assistants (Editable)'}</label>
                        <input
                          type="text"
                          className="input-field w-full text-xs font-medium"
                          value={printAssociates}
                          onChange={(e) => setPrintAssociates(e.target.value)}
                          placeholder="Name: +964 7XX ... • Name 2: +964 ..."
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="btn-burgundy w-full py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md rounded-xl hover:scale-[1.01] transition-all"
                  >
                    <Save size={14} />
                    <span>{lang === 'ar' ? 'حفظ هوية وتنسيق المطبوعات' : 'Save print configuration & brand'}</span>
                  </button>
                  {saveStatus && <p className="text-xs font-bold text-emerald-600 animate-pulse text-center">{saveStatus}</p>}
                </div>

                {/* Live Real-time Document Mockup Preview (A5 Size) */}
                <div className="lg:col-span-5 space-y-3">
                  <span className="text-xs font-bold text-ink block uppercase tracking-wider text-start">
                    {lang === 'ar' ? '👀 معاينة المستند المطبوع (A5 Live Preview)' : '👀 Live A5 Printed Document Preview'}
                  </span>
                  
                  {/* The A5 Mockup Card */}
                  <div className="border border-cream-border bg-white rounded-2xl shadow-xl overflow-hidden p-6 text-slate-800 font-serif relative text-start transition-all duration-300 min-h-[510px] flex flex-col justify-between" style={{ borderTop: `6px solid ${getThemeColorHex(printTheme)}` }}>
                    
                    {/* Header */}
                    <div>
                      <div className="flex justify-between items-start border-b pb-3" style={{ borderBottomColor: `${getThemeColorHex(printTheme)}33` }}>
                        <div className="flex gap-2 items-center text-start">
                          {printLogoBase64 ? (
                            <img 
                              src={printLogoBase64.startsWith("preset_") ? getPresetLogoSvg(printLogoBase64, printTheme) : printLogoBase64} 
                              className="w-10 h-10 object-contain" 
                              alt="Clinic Logo Preview" 
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-cream flex items-center justify-center text-xs font-bold text-ink-light">L</div>
                          )}
                          <div>
                            <h3 className="text-xs font-bold m-0" style={{ color: getThemeColorHex(printTheme) }}>{clinic?.name || "نور للعيون"}</h3>
                            <p className="text-[8px] text-slate-500 font-sans tracking-tight leading-normal">{clinic?.address || "Baghdad, Iraq"}</p>
                          </div>
                        </div>

                        <div className="text-end font-sans">
                          <p className="text-[9px] font-bold text-slate-900 leading-tight">{doctorCredentials}</p>
                          <p className="text-[8px] text-slate-500 mt-0.5">📞 {doctorPhone}</p>
                        </div>
                      </div>

                      {/* Patient details section */}
                      <div className="my-4 grid grid-cols-2 gap-4 text-[9px] font-sans">
                        <div className="p-1.5 rounded bg-slate-50">
                          <strong className="text-slate-500 uppercase tracking-wider text-[7px] block">{lang === 'ar' ? 'الاسم الكامل للمراجع' : 'PATIENT REGISTER'}</strong>
                          <span className="font-bold text-[10px]">فاطمة علي محمد</span>
                        </div>
                        <div className="p-1.5 rounded bg-slate-50 text-end">
                          <strong className="text-slate-500 uppercase tracking-wider text-[7px] block">{lang === 'ar' ? 'تاريخ الكشف والزيارة' : 'VISIT DATE'}</strong>
                          <span className="font-semibold text-[10px]">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                      </div>

                      {/* Prescription Lens details (Mockup grid) */}
                      <div className="my-3">
                        <table className="w-full text-center text-[9px] border-collapse font-sans">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-bold">
                              <th className="p-1 border text-start">Eye</th>
                              <th className="p-1 border">SPH</th>
                              <th className="p-1 border">CYL</th>
                              <th className="p-1 border">AXIS</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="p-1 border text-start font-bold" style={{ color: getThemeColorHex(printTheme) }}>OD (يمين)</td>
                              <td className="p-1 border text-slate-600">-2.00</td>
                              <td className="p-1 border text-slate-600">+0.75</td>
                              <td className="p-1 border text-slate-600 font-mono">180°</td>
                            </tr>
                            <tr>
                              <td className="p-1 border text-start font-bold" style={{ color: getThemeColorHex(printTheme) }}>OS (يسار)</td>
                              <td className="p-1 border text-slate-600">-1.75</td>
                              <td className="p-1 border text-slate-600 font-bold">—</td>
                              <td className="p-1 border text-slate-600 font-bold">—</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Instructions space */}
                      {printInstructions && (
                        <div className="mt-3 p-2 rounded border text-[8.5px] leading-relaxed bg-slate-50/50" style={{ borderLeft: `3px solid ${getThemeColorHex(printTheme)}` }}>
                          <strong className="block text-[7.5px] text-slate-500 uppercase tracking-widest font-sans mb-0.5">{lang === 'ar' ? '📋 إرشادات الطبيب واستخدام النظارة:' : '📋 Medical Instructions & Optics Advice:'}</strong>
                          <div className="whitespace-pre-line text-slate-700 font-sans leading-tight">{printInstructions}</div>
                        </div>
                      )}
                    </div>

                    {/* Footer Section */}
                    <div className="mt-auto pt-3 border-t border-dashed border-slate-200">
                      <div className="flex justify-between items-end gap-2">
                        {/* Associates & Staff listed at the bottom */}
                        <div className="space-y-0.5 text-left font-sans flex-1">
                          {showStaffOnPrint && (
                            <>
                              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest m-0 leading-tight">{lang === 'ar' ? 'الطاقم المساعد العامل بالمركز بالعيادة' : 'Active Clinic Staff & Care Associates'}</p>
                              <p className="text-[7.5px] text-slate-600 leading-normal m-0">{printAssociates}</p>
                              {receptionists.length > 0 && (
                                <p className="text-[7px] text-slate-500 italic m-0 leading-normal">
                                  {lang === 'ar' ? 'الاستقبال: ' : 'Receptionists: '}
                                  {receptionists.map((r: any) => `${r.full_name}`).join(', ')}
                                </p>
                              )}
                            </>
                          )}
                          <p className="text-[6.5px] text-slate-400 mt-1 m-0 font-mono">Noor Optical A5 Diagnostic template. Designed offline.</p>
                        </div>

                        {/* QR Code at the bottom containing logo inside */}
                        <div className="flex flex-col items-center shrink-0">
                          <div className="relative w-14 h-14 bg-white border border-slate-200 p-0.5 rounded flex items-center justify-center">
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent("Noor Optical security validation certificate code")}`} 
                              className="w-full h-full object-contain" 
                              alt="QR Code" 
                            />
                            {/* Logo centered inside QR */}
                            {printLogoBase64 && (
                              <div className="absolute w-3 h-3 bg-white rounded-full p-0.5 shadow flex items-center justify-center overflow-hidden">
                                <img 
                                  src={printLogoBase64.startsWith("preset_") ? getPresetLogoSvg(printLogoBase64, printTheme) : printLogoBase64} 
                                  className="w-full h-full object-contain rounded-full" 
                                  alt="Icon Center" 
                                />
                              </div>
                            )}
                          </div>
                          <span className="text-[6.5px] font-bold text-slate-500 mt-0.5 font-sans uppercase tracking-widest">{lang === 'ar' ? 'مسح الكود' : 'Verify Record'}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Outreach Templates config */}
          {activeTab === 'notifications' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream">
                <Bell size={18} className="text-burgundy" /> 
                <span>{lang === 'ar' ? 'إرسال الرسائل ومخطبات تذكير النظارات' : 'WhatsApp Client outreach configuration'}</span>
              </h2>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-[10px] text-blue-950 font-medium">
                <p className="font-bold flex items-center gap-1 mb-1">
                  <span>Variables allowed for automatic replacement:</span>
                </p>
                <ul className="list-disc leading-normal list-inside font-mono opacity-80 pl-1">
                  <li>{"{patient_name}"} : {lang === 'ar' ? 'اسم المراجع' : 'Patient full label value'}</li>
                  <li>{"{next_visit}"} : {lang === 'ar' ? 'تاريخ المراجعة الفنية' : 'Follow up appointment date'}</li>
                  <li>{"{clinic_name}"} : {lang === 'ar' ? 'اسم العيادة المقررة' : 'Clinic title property'}</li>
                </ul>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-wider block">
                    {lang === 'ar' ? 'نموذج تذكير الفحص الطبي العام' : 'Clinic General Appointment recall template'}
                  </label>
                  <textarea 
                    rows={3} 
                    className="input-field w-full text-xs" 
                    value={formData.wa_template_1}
                    onChange={e => setFormData({ ...formData, wa_template_1: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 border-t border-cream pt-4">
                <button className="btn-burgundy w-full flex items-center justify-center py-2.5 text-xs font-bold" onClick={handleSaveGeneral}>
                  <Save size={15} className="mr-2" />
                  {lang === 'ar' ? 'حفظ التغييرات وقالب الرسائل' : 'Save messaging outreach rules'}
                </button>
                {saveStatus && <span className="text-xs font-sans text-emerald-600 font-bold">{saveStatus}</span>}
              </div>
            </div>
          )}

          {/* Active clinical override security PIN settings - fully operational */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurityPin} className="space-y-5 max-w-xl">
              <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream">
                <Shield size={18} className="text-rose-800" /> 
                <span>{lang === 'ar' ? 'صلاحيات المشرف وحماية قفل الموازنة' : 'Clinical Administrative override Passcodes'}</span>
              </h2>

              <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl flex gap-3 text-rose-950">
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <p className="font-bold">{lang === 'ar' ? 'حماية قوية لدفتر الحسابات والتدقيق المالي' : 'Strict accountant seals activated'}</p>
                  <p className="text-rose-800/80 mt-0.5">
                    {lang === 'ar'
                      ? 'بمجرد توقيع التدقيق المالي للشهر، يتم إغلاق وتأمين كافة فواتير المصاريف والإقرارات المضافة من قبل الموظفين الفنيين تلقائياً. لا يمكن فك القفل أو إلغاء التوقيع إلا بإثبات رمز الأمان للمشرف.'
                      : 'Closing a fiscal period seals operating costs and owner equity lists from tampering. Standard receptionists cannot delete transactions without authorizing supervisor passcode clearance.'
                    }
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-ink-light uppercase tracking-wider">
                  {lang === 'ar' ? 'الرمز السري لتفويض وإلغاء إغلاق الكتب المالية (PIN Code)' : 'Supervisor lock override bypass passcode (PIN / Passcode)'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026"
                  className="input-field w-full text-xs font-mono font-bold tracking-widest"
                  value={supervisorPin}
                  onChange={e => setSupervisorPin(e.target.value)}
                />
                <p className="text-[9px] text-ink-light uppercase tracking-wide">
                  {lang === 'ar' ? 'الرمز الافتراضي المعتمد هو 2026 أو admin' : 'The pre-configured passcode value is 2026 or admin'}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 pt-4 border-t border-cream">
                <button type="submit" className="btn-burgundy w-full flex items-center justify-center py-2.5 text-xs font-bold gap-1 mt-2 cursor-pointer">
                  <Key size={14} />
                  <span>{lang === 'ar' ? 'تحديث وحفظ رمز المشرف الأمني' : 'Save Administrative security PIN'}</span>
                </button>
                {saveStatus && <span className="text-xs font-bold text-emerald-600 font-sans">{saveStatus}</span>}
              </div>
            </form>
          )}

          {/* Core Appearance / dynamic theme selection */}
          {activeTab === 'appearance' && (
            <div className="space-y-5 max-w-xl">
              <h2 className="text-lg font-serif font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream">
                <Palette size={18} className="text-burgundy" /> 
                <span>{lang === 'ar' ? 'واجهة التخصيص والمظهر المعتمد' : 'Clinic Aesthetic Brand Theme'}</span>
              </h2>

              <p className="text-xs text-ink-mid">
                {lang === 'ar' 
                  ? 'اختر لوحة الألوان التي توافق الهوية البصرية وشعار العيادة المطبق في مركز نور.' 
                  : 'Toggle custom styling palettes to coordinate your optical store management skin with offline clinic letterheads.'}
              </p>

              {/* Theme picker grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {BRAND_THEMES.map(theme => {
                  const isActive = currentTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={cn(
                        "p-4 rounded-xl border flex flex-col justify-between text-start transition-all cursor-pointer relative overflow-hidden active:scale-[0.98] select-none",
                        isActive 
                          ? "border-neutral-900 bg-white shadow-md ring-1 ring-neutral-900" 
                          : "border-cream-border hover:border-ink-light bg-cream/10"
                      )}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-ink">
                          {lang === 'ar' ? theme.nameAr : theme.nameEn}
                        </span>
                        {isActive && (
                          <span className="h-2 w-2 rounded-full bg-emerald-600 block animate-pulse" />
                        )}
                      </div>

                      {/* Small visual preview block of elements */}
                      <div className="flex items-center gap-1.5 mt-3 w-full">
                        <span className="w-5 h-5 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: theme.primary }} />
                        <span className="w-5 h-5 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: theme.soft }} />
                        <span className="w-5 h-5 rounded-md shadow-sm border border-black/5" style={{ backgroundColor: theme.pale }} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {saveStatus && <p className="text-xs font-mono font-bold text-emerald-600 mt-2">{saveStatus}</p>}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
