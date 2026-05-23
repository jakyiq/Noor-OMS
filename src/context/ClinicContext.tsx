import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, User, Clinic, Section, AuditEntry } from "../types";
import { TRANSLATIONS } from "../constants";

export interface ClinicContextType {
  lang: Language;
  setLang: (l: Language) => void;
  user: User | null;
  setUser: (u: User | null) => void;
  clinic: Clinic | null;
  setClinic: (c: Clinic | null) => void;
  currentSection: Section;
  setCurrentSection: (s: Section) => void;
  inventoryFilter: string;
  setInventoryFilter: (f: string) => void;
  t: (key: keyof typeof TRANSLATIONS["en"]) => string;
  auditLogs: AuditEntry[];
  logAction: (entry: Omit<AuditEntry, "id" | "timestamp" | "user_id" | "user_name">) => void;
  followupCount: number;
  setFollowupCount: (c: number) => void;
  triggerAddPatient: number;
  setTriggerAddPatient: React.Dispatch<React.SetStateAction<number>>;
  patients: any[];
  setPatients: React.Dispatch<React.SetStateAction<any[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  lensCatalog: import("../types").LensCatalog;
  setLensCatalog: React.Dispatch<React.SetStateAction<import("../types").LensCatalog>>;
  lenses: import("../types").LensItem[];
  setLenses: React.Dispatch<React.SetStateAction<import("../types").LensItem[]>>;
  frames: import("../types").FrameItem[];
  setFrames: React.Dispatch<React.SetStateAction<import("../types").FrameItem[]>>;

  inventoryTrigger: number;
  setInventoryTrigger: React.Dispatch<React.SetStateAction<number>>;
  impersonatedClinic: string | null;
  setImpersonatedClinic: (name: string | null) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>((localStorage.getItem("noor_lang") as Language) || "ar");
  const [user, setUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem("noor_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading saved user session:", e);
      }
    }
    return {
      id: "u1",
      full_name: "Dr. Ahmed Ali",
      username: "ahmed_ali",
      role: "super_admin",
      clinic_id: "c1"
    };
  });

  const setUser = (u: User | null) => {
    setUserState(u);
    if (u) {
      localStorage.setItem("noor_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("noor_user");
    }
  };

  const [clinic, setClinic] = useState<Clinic | null>(() => {
    const saved = localStorage.getItem("noor_clinic_settings");
    let currentClinic: Clinic = {
      id: "c1",
      name: "Noor Clinic",
      phone: "+964 7XX XXX XXXX",
      address: "Baghdad, Iraq",
      exclude_pos_from_patient_menu: false,
      plan: "trial",
      print_theme: "burgundy",
      doctor_credentials: "Dr. Ahmed Al-Rashid, Ophthalmic & Optics Specialist (Baghdad Board)",
      doctor_phone: "+964 770 123 4567",
      print_instructions: "1. يرجى مراجعة الطبيب المختص بعد ستة أشهر أو في حال حدوث صداع ومشاكل في النظر.\n2. احرص على ارتداء النظارة أثناء القراءة أو العمل الطويل أمام الشاشات.\n3. تجنب تنظيف العدسات بأقمشة خشنة لتلافي الخدوش.",
      show_staff_on_print: true,
      print_associates: "Dr. Sarah Jamil (Consultant Specialist) • Abeer Al-Sadi (Reception Head)"
    };
    if (saved) {
      try {
        currentClinic = { ...currentClinic, ...JSON.parse(saved) };
      } catch (e) {
        console.error("Error reading clinic settings library:", e);
      }
    }
    return currentClinic;
  });
  const [currentSection, setCurrentSection] = useState<Section>("dashboard");
  const [inventoryFilter, setInventoryFilter] = useState<string>("all");

  const [inventoryTrigger, setInventoryTrigger] = useState(0);

  const [impersonatedClinic, setImpersonatedClinicState] = useState<string | null>(
    () => localStorage.getItem("noor_impersonated_clinic")
  );

  const setImpersonatedClinic = (name: string | null) => {
    setImpersonatedClinicState(name);
    if (name) {
      localStorage.setItem("noor_impersonated_clinic", name);
    } else {
      localStorage.removeItem("noor_impersonated_clinic");
    }
  };
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
  const [followupCount, setFollowupCount] = useState<number>(0);
  const [triggerAddPatient, setTriggerAddPatient] = useState<number>(0);
  const [lensCatalog, setLensCatalog] = useState<import("../types").LensCatalog>(() => {
    const saved = localStorage.getItem("lensCatalog");
    if (saved) return JSON.parse(saved);
    return {
      type: [
        { label: "Single Vision", value: "Single Vision", is_active: true },
        { label: "Bifocal", value: "Bifocal", is_active: true },
        { label: "Trifocal", value: "Trifocal", is_active: true },
        { label: "Progressive", value: "Progressive", is_active: true },
        { label: "Reading", value: "Reading", is_active: true },
        { label: "Plano", value: "Plano", is_active: true },
        { label: "Prism", value: "Prism", is_active: true },
        { label: "Contact Lenses", value: "Contact Lenses", is_active: true }
      ],
      material: [
        { label: "Plastic (CR-39)", value: "Plastic (CR-39)", is_active: true },
        { label: "Glass", value: "Glass", is_active: true },
        { label: "High-Index", value: "High-Index", is_active: true },
        { label: "Trivex", value: "Trivex", is_active: true }
      ],
      coating: [
        { label: "Clear", value: "Clear", is_active: true },
        { label: "Blue Light Cut", value: "Blue Light Cut", is_active: true },
        { label: "Green Light Cut", value: "Green Light Cut", is_active: true },
        { label: "Photochromic", value: "Photochromic", is_active: true },
        { label: "Photochromic Blue", value: "Photochromic Blue", is_active: true },
        { label: "Photochromic Green", value: "Photochromic Green", is_active: true },
        { label: "Polarized Filter", value: "Polarized Filter", is_active: true },
        { label: "Tinted", value: "Tinted", is_active: true },
        { label: "UV 400", value: "UV 400", is_active: true },
        { label: "Mirror", value: "Mirror", is_active: true },
        { label: "Anti-Scratch", value: "Anti-Scratch", is_active: true },
        { label: "Anti-Fog", value: "Anti-Fog", is_active: true },
        { label: "Oleophobic", value: "Oleophobic", is_active: true },
        { label: "Anti-Reflective Filter", value: "Anti-Reflective Filter", is_active: true },
        { label: "AR+", value: "AR+", is_active: true },
        { label: "Blue Cut Combo", value: "Blue Cut Combo", is_active: true }
      ],
      frame_type: [
        { label: "Full Rim", value: "Full Rim", is_active: true },
        { label: "Half Rim", value: "Half Rim", is_active: true },
        { label: "Rimless", value: "Rimless", is_active: true }
      ],
      frame_material: [
        { label: "Metal", value: "Metal", is_active: true },
        { label: "Plastic", value: "Plastic", is_active: true },
        { label: "Titanium", value: "Titanium", is_active: true },
        { label: "Acetate", value: "Acetate", is_active: true }
      ],
      frame_brand: [
        { label: "Ray-Ban", value: "Ray-Ban", is_active: true },
        { label: "Gucci", value: "Gucci", is_active: true },
        { label: "Oakley", value: "Oakley", is_active: true }
      ],
      frame_shape: [
        { label: "Rectangle", value: "Rectangle", is_active: true },
        { label: "Round", value: "Round", is_active: true },
        { label: "Square", value: "Square", is_active: true },
        { label: "Aviator", value: "Aviator", is_active: true }
      ]
    };
  });

  useEffect(() => {
    localStorage.setItem("lensCatalog", JSON.stringify(lensCatalog));
  }, [lensCatalog]);

  useEffect(() => {
    if (clinic) {
      localStorage.setItem("noor_clinic_settings", JSON.stringify(clinic));
    }
  }, [clinic]);

  // Sync impersonated clinic settings and subscription plan in real time
  useEffect(() => {
    if (impersonatedClinic) {
      const savedAdminClinics = localStorage.getItem("noor_admin_clinics");
      if (savedAdminClinics) {
        try {
          const clinicsList = JSON.parse(savedAdminClinics);
          const found = clinicsList.find((c: any) => c.name === impersonatedClinic);
          if (found) {
            setClinic(prev => {
              if (prev && (prev.name !== found.name || prev.plan !== found.plan)) {
                return {
                  ...prev,
                  name: found.name,
                  plan: found.plan
                };
              }
              return prev;
            });
          }
        } catch (e) {
          console.error("Error matching impersonated group details:", e);
        }
      }
    }
  }, [impersonatedClinic]);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  // Apply saved branding theme or charcoal default to :root elements on load
  useEffect(() => {
    const savedTheme = localStorage.getItem("noor_theme_color") || "charcoal";
    const BRAND_THEMES = [
      { id: "burgundy", primary: "#6b1a2a", soft: "#8b2a3e", pale: "#f5e8eb" },
      { id: "navy", primary: "#1e3a8a", soft: "#2563eb", pale: "#eff6ff" },
      { id: "emerald", primary: "#047857", soft: "#059669", pale: "#ecfdf5" },
      { id: "charcoal", primary: "#1f2937", soft: "#4b5563", pale: "#f3f4f6" },
      { id: "terracotta", primary: "#9a3412", soft: "#ea580c", pale: "#fff7ed" }
    ];
    const selected = BRAND_THEMES.find(t => t.id === savedTheme);
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
  }, [currentSection]);

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("noor_lang", l);
  };

  const t = (key: keyof typeof TRANSLATIONS["en"]) => {
    return TRANSLATIONS[lang][key] || key;
  };

  const logAction = (entry: Omit<AuditEntry, "id" | "timestamp" | "user_id" | "user_name">) => {
    const newEntry: AuditEntry = {
      ...entry,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      user_id: user?.id || "anonymous",
      user_name: user?.full_name || "Anonymous User"
    };
    setAuditLogs(prev => [newEntry, ...prev]);
    console.log("Logged Action:", newEntry);
  };

  const [patients, setPatients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [lenses, setLenses] = useState<import("../types").LensItem[]>(() => {
    const saved = localStorage.getItem("noor_lenses");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading lenses:", e);
      }
    }
    return [];
  });

  const [frames, setFrames] = useState<import("../types").FrameItem[]>(() => {
    const saved = localStorage.getItem("noor_frames");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error loading frames:", e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("noor_lenses", JSON.stringify(lenses));
  }, [lenses]);

  useEffect(() => {
    localStorage.setItem("noor_frames", JSON.stringify(frames));
  }, [frames]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("noor_patients", JSON.stringify(patients));
    }
  }, [patients, isLoading]);

  useEffect(() => {
    // Clear old mock/hardcoded data to keep the database fully clean and dynamic
    const hasClearedOldMocks = localStorage.getItem("noor_wiped_legacy_mocks_v4");
    if (!hasClearedOldMocks) {
      localStorage.removeItem("noor_patients");
      localStorage.removeItem("noor_expenses");
      localStorage.removeItem("noor_capital");
      localStorage.removeItem("noor_prescriptions");
      localStorage.removeItem("noor_audit_logs");
      localStorage.removeItem("noor_lenses");
      localStorage.removeItem("noor_frames");
      setLenses([]);
      setFrames([]);
      setPatients([]);
      localStorage.setItem("noor_wiped_legacy_mocks_v4", "true");
    }
  }, []);

  useEffect(() => {
    // Simulate network delay for fetching initial data
    const timer = setTimeout(() => {
      const saved = localStorage.getItem("noor_patients");
      if (saved) {
        try {
          setPatients(JSON.parse(saved));
          setIsLoading(false);
          return;
        } catch (err) {
          console.error("Error loading patients from local storage", err);
        }
      }
      const defaults: any[] = [];
      setPatients(defaults);
      localStorage.setItem("noor_patients", JSON.stringify(defaults));
      setIsLoading(false);
    }, 1200); // 1.2s delay to show skeleton loaders

    return () => clearTimeout(timer);
  }, []);

  return (
    <ClinicContext.Provider value={{ 
      lang, setLang, user, setUser, clinic, setClinic, currentSection, setCurrentSection,
      inventoryFilter, setInventoryFilter, t, 
      auditLogs, logAction, followupCount, setFollowupCount,
      triggerAddPatient, setTriggerAddPatient,
      patients, setPatients, isLoading, setIsLoading,
      lensCatalog, setLensCatalog,
      lenses, setLenses, frames, setFrames,
      inventoryTrigger, setInventoryTrigger,
      impersonatedClinic, setImpersonatedClinic
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) throw new Error("useClinic must be used within ClinicProvider");
  return context;
}
