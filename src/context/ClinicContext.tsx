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

  const [patients, setPatients] = useState([
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

  return (
    <ClinicContext.Provider value={{ 
      lang, setLang, user, setUser, clinic, setClinic, currentSection, setCurrentSection, t, 
      auditLogs, logAction, followupCount, setFollowupCount,
      triggerAddPatient, setTriggerAddPatient,
      patients, setPatients
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
