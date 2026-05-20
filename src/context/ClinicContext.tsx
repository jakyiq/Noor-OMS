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
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>((localStorage.getItem("noor_lang") as Language) || "ar");
  const [user, setUser] = useState<User | null>({
    id: "u1",
    full_name: "Dr. Ahmed Ali",
    username: "ahmed_ali",
    role: "super_admin",
    clinic_id: "c1"
  });
  const [clinic, setClinic] = useState<Clinic | null>({
    id: "c1",
    name: "Noor Clinic",
    phone: "+964 7XX XXX XXXX",
    address: "Baghdad, Iraq"
  });
  const [currentSection, setCurrentSection] = useState<Section>("dashboard");
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
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

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

  const [lenses, setLenses] = useState<import("../types").LensItem[]>([
    { id: "1", lens_type: "Single Vision", material: "Plastic (CR-39)", coating: "Anti-Reflective Filter", sphere: -1.5, cylinder: -0.5, quantity: 15, min_stock: 4, cost_price: 5000, sell_price: 15000 },
    { id: "2", lens_type: "Bifocal", material: "Polycarbonate", coating: "Clear", sphere: +2.0, cylinder: 0, quantity: 2, min_stock: 5, cost_price: 10000, sell_price: 25000 },
    { id: "3", lens_type: "Single Vision", material: "Plastic (CR-39)", coating: "Blue Control", sphere: -0.5, cylinder: -1.25, quantity: 0, min_stock: 2, cost_price: 8000, sell_price: 20000 },
  ]);

  const [frames, setFrames] = useState<import("../types").FrameItem[]>([
    { id: "1", brand: "Ray-Ban", model: "Wayfarer Classic", color: "Black", type: "Full Rim", material: "Acetate", shape: "Square", quantity: 5, min_stock: 2, cost_price: 60000, sell_price: 150000 },
    { id: "2", brand: "Oakley", model: "Holbrook", color: "Matte Black", type: "Full Rim", material: "Plastic", shape: "Rectangle", quantity: 3, min_stock: 3, cost_price: 45000, sell_price: 110000 },
    { id: "3", brand: "Gucci", model: "GG0012S", color: "Havana", type: "Full Rim", material: "Acetate", shape: "Round", quantity: 1, min_stock: 2, cost_price: 150000, sell_price: 350000 }
  ]);

  useEffect(() => {
    // Simulate network delay for fetching initial data
    const timer = setTimeout(() => {
      setPatients([
        { 
          id: "1", 
          full_name: "Ali Mohammed", 
          phone: "07712345678", 
          age: 34, 
          last_visit: "2026-05-12", 
          outstanding: 25000, 
          gender: "male",
          visits: [
            { id: "v1", patient_id: "1", visit_date: "2026-05-12", diagnosis: "Myopia -1.50 OS/OD", total_amount: 50000, amount_paid: 25000, remaining: 25000 },
            { id: "v2", patient_id: "1", visit_date: "2025-11-20", diagnosis: "Initial checkup", total_amount: 15000, amount_paid: 15000, remaining: 0 },
          ] as any[]
        },
        { 
          id: "2", 
          full_name: "Sarah Ahmed", 
          phone: "07801234567", 
          age: 28, 
          last_visit: "2026-05-10", 
          outstanding: 0, 
          gender: "female",
          visits: [
            { id: "v3", patient_id: "2", visit_date: "2026-05-10", diagnosis: "Contact lenses fit", total_amount: 75000, amount_paid: 75000, remaining: 0 },
          ] as any[]
        },
        { 
          id: "3", 
          full_name: "Zaid Hassan", 
          phone: "07509876543", 
          age: 45, 
          last_visit: "2026-04-28", 
          outstanding: 120000, 
          gender: "male",
          visits: [
            { id: "v4", patient_id: "3", visit_date: "2026-04-28", diagnosis: "Progressive lenses needed", total_amount: 250000, amount_paid: 130000, remaining: 120000 },
          ] as any[]
        },
        { id: "4", full_name: "Layla Khalid", phone: "07701122334", age: 19, last_visit: "2026-05-15", outstanding: 0, gender: "female", visits: [] as any[] },
        { id: "5", full_name: "Omar Sharif", phone: "07812233445", age: 52, last_visit: "2026-05-01", outstanding: 15000, gender: "male", visits: [] as any[] },
      ]);
      setIsLoading(false);
    }, 1500); // 1.5s delay to show skeleton loaders

    return () => clearTimeout(timer);
  }, []);

  return (
    <ClinicContext.Provider value={{ 
      lang, setLang, user, setUser, clinic, setClinic, currentSection, setCurrentSection, t, 
      auditLogs, logAction, followupCount, setFollowupCount,
      triggerAddPatient, setTriggerAddPatient,
      patients, setPatients, isLoading, setIsLoading,
      lensCatalog, setLensCatalog,
      lenses, setLenses, frames, setFrames
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
