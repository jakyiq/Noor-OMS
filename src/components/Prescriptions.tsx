import React, { useState, useMemo } from "react";
import { 
  FileText, 
  Search, 
  Plus, 
  User, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  ChevronRight,
  Filter,
  Stethoscope,
  Maximize2,
  Trash2,
  Printer,
  AlertTriangle,
  X
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Prescription, Patient } from "../types";
import { useScrollLock } from "../hooks/useScrollLock";

const getThemeColorHex = (themeId: string) => {
  const map = {
    burgundy: "#800020",
    navy: "#1a4a8d",
    emerald: "#064e3b",
    charcoal: "#1f2937",
    gold: "#b45309"
  };
  return map[themeId as keyof typeof map] || "#800020";
};

const getPresetLogoSvg = (presetId: string, theme: string) => {
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

export function Prescriptions() {
  const { t, lang, logAction, clinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const receptionists = useMemo(() => {
    const saved = localStorage.getItem("noor_receptionists");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return [];
  }, []);

  useScrollLock(isModalOpen || !!deleteConfirmId);

  // Mock Data
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([
    { 
      id: "pr1", 
      patient_id: "1", 
      date: "2024-05-12", 
      prescriber: "Dr. Ahmed Ali", 
      lens_type: "Single Vision", 
      frame_details: "Ray-Ban RB2140",
      od_sphere: "-1.50",
      od_cylinder: "-0.50",
      od_axis: "180",
      os_sphere: "-1.25",
      os_cylinder: "-0.75",
      os_axis: "175",
      pd: "64"
    },
    { 
      id: "pr2", 
      patient_id: "2", 
      date: "2024-05-10", 
      prescriber: "Dr. Ahmed Ali", 
      lens_type: "Progressive", 
      frame_details: "Oakley Holbrook",
      od_sphere: "+1.00",
      os_sphere: "+1.00",
      pd: "62"
    }
  ]);

  const [patients] = useState<Patient[]>([
    { id: "1", full_name: "Ali Mohammed", phone: "07712345678", outstanding_remaining: 0, updated_at: "" },
    { id: "2", full_name: "Sarah Ahmed", phone: "07801234567", outstanding_remaining: 0, updated_at: "" },
  ]);

  const [formData, setFormData] = useState({
    patient_id: "",
    date: new Date().toISOString().split('T')[0],
    prescriber: "Dr. Ahmed Ali",
    lens_type: "",
    frame_details: "",
    od_sphere: "",
    od_cylinder: "",
    od_axis: "",
    os_sphere: "",
    os_cylinder: "",
    os_axis: "",
    pd: ""
  });

  const [printingPrescription, setPrintingPrescription] = useState<Prescription | null>(null);

  const handlePrint = (pr: Prescription) => {
    setPrintingPrescription(pr);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter(p => {
      const patient = patients.find(pat => pat.id === p.patient_id);
      const patientName = patient?.full_name.toLowerCase() || "";
      const matchesSearch = patientName.includes(searchTerm.toLowerCase()) || 
                           p.prescriber.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [prescriptions, patients, searchTerm]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrescription: Prescription = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData
    };
    setPrescriptions([newPrescription, ...prescriptions]);
    
    const patient = patients.find(p => p.id === formData.patient_id);
    logAction({
      action: "create",
      entity_type: "prescription",
      entity_id: newPrescription.id,
      entity_name: `Prescription for ${patient?.full_name || 'Patient'}`,
      details: `Added new prescription for ${patient?.full_name}. Lens: ${formData.lens_type}`
    });

    setIsModalOpen(false);
    setFormData({
      patient_id: "",
      date: new Date().toISOString().split('T')[0],
      prescriber: "Dr. Ahmed Ali",
      lens_type: "",
      frame_details: "",
      od_sphere: "",
      od_cylinder: "",
      od_axis: "",
      os_sphere: "",
      os_cylinder: "",
      os_axis: "",
      pd: ""
    });
  };

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    const pr = prescriptions.find(p => p.id === deleteConfirmId);
    const patient = patients.find(p => p.id === pr?.patient_id);
    
    setPrescriptions(prescriptions.filter(p => p.id !== deleteConfirmId));
    logAction({
      action: "delete",
      entity_type: "prescription",
      entity_id: deleteConfirmId,
      entity_name: `Prescription for ${patient?.full_name || 'Patient'}`,
      details: `Deleted prescription record for ${patient?.full_name}`
    });
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{t("prescriptions")}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            PRESCRIPTION RECORDS <span className="w-1 h-1 bg-cream-border rounded-full" /> {prescriptions.length} TOTAL ISSUED
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-burgundy px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20"
        >
          <Plus size={18} />
          <span>{t("add_prescription")}</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={t("search_placeholder")}
            className="w-full ps-12 pe-4 py-3 bg-white border-2 border-cream-border rounded-xl focus:border-burgundy focus:shadow-lg focus:shadow-burgundy/5 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Prescription Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPrescriptions.map((pr, idx) => {
          const patient = patients.find(p => p.id === pr.patient_id);
          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={pr.id} 
              className="card bg-white p-6 hover:border-burgundy/20 transition-all group"
            >
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-cream text-burgundy flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink group-hover:text-burgundy transition-colors">{patient?.full_name || "Unknown Patient"}</h3>
                    <p className="text-xs text-ink-light font-medium tracking-wide flex items-center gap-2">
                       <Calendar size={12} /> {pr.date} <span className="w-1 h-1 bg-cream-border rounded-full" /> <Stethoscope size={12} /> {pr.prescriber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-cream text-ink-mid text-[10px] font-bold uppercase tracking-widest rounded-full border border-cream-border">
                    {pr.lens_type}
                  </span>
                  <button 
                    onClick={() => handlePrint(pr)}
                    className="p-2 text-ink-light hover:text-burgundy transition-colors"
                    title={t("print_a5")}
                  >
                    <Printer size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteConfirmId(pr.id)}
                    className="p-2 text-rose-300 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button className="p-2 text-ink-light hover:text-burgundy transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>

              {/* Prescription Values Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-cream/50 rounded-xl border border-cream-border">
                  <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-3 border-b border-cream-border pb-1">{t("od")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] font-bold text-ink-light/70 uppercase">SPH</p>
                      <p className="text-sm font-bold text-ink">{pr.od_sphere || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-ink-light/70 uppercase">CYL</p>
                      <p className="text-sm font-bold text-ink">{pr.od_cylinder || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-ink-light/70 uppercase">Axis</p>
                      <p className="text-sm font-bold text-ink">{pr.od_axis || "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-cream/50 rounded-xl border border-cream-border">
                  <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-3 border-b border-cream-border pb-1">{t("os")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <p className="text-[8px] font-bold text-ink-light/70 uppercase">SPH</p>
                      <p className="text-sm font-bold text-ink">{pr.os_sphere || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-ink-light/70 uppercase">CYL</p>
                      <p className="text-sm font-bold text-ink">{pr.os_cylinder || "—"}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-bold text-ink-light/70 uppercase">Axis</p>
                      <p className="text-sm font-bold text-ink">{pr.os_axis || "—"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient and Frame Info Footer */}
              <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-dashed border-cream-border">
                {pr.frame_details && (
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-burgundy" />
                    <span className="text-[10px] font-bold text-ink-light uppercase">{t("frame_details")}:</span>
                    <span className="text-xs font-medium text-ink-mid">{pr.frame_details}</span>
                  </div>
                )}
                {pr.pd && (
                  <div className="flex items-center gap-2">
                    <Maximize2 size={14} className="text-burgundy" />
                    <span className="text-[10px] font-bold text-ink-light uppercase">{t("pd")}:</span>
                    <span className="text-xs font-medium text-ink-mid">{pr.pd} mm</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
        {filteredPrescriptions.length === 0 && (
          <div className="p-20 text-center text-ink-light py-24 bg-white rounded-2xl border border-dashed border-cream-border">
            <FileText size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest">{t("no_data")}</p>
          </div>
        )}
      </div>

      {/* Add Prescription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[37.8rem] overflow-hidden overflow-y-auto max-h-[90vh]"
          >
             <div className="bg-burgundy p-6 text-white sticky top-0 z-10">
              <h2 className="text-xl font-serif font-bold">{t("add_prescription")}</h2>
              <p className="text-xs text-white/60 uppercase tracking-widest font-bold mt-1">NEW OPHTHALMIC MEASUREMENT</p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("patients")}</label>
                  <select 
                    required
                    className="input-field w-full"
                    value={formData.patient_id}
                    onChange={e => setFormData({...formData, patient_id: e.target.value})}
                  >
                    <option value="">Select Patient</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.full_name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("date")}</label>
                  <input 
                    required
                    type="date" 
                    className="input-field w-full"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("prescriber")}</label>
                  <input 
                    required
                    type="text" 
                    className="input-field w-full"
                    value={formData.prescriber}
                    onChange={e => setFormData({...formData, prescriber: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("lens_type")}</label>
                  <input 
                    required
                    type="text" 
                    className="input-field w-full"
                    placeholder="Single Vision / Progressive / etc."
                    value={formData.lens_type}
                    onChange={e => setFormData({...formData, lens_type: e.target.value})}
                  />
                </div>
              </div>

              {/* Eye Measurements */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-burgundy uppercase tracking-widest border-b border-cream-border pb-1">{t("od")}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase">SPH</label>
                    <input type="text" className="input-field w-full" value={formData.od_sphere} onChange={e => setFormData({...formData, od_sphere: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase">CYL</label>
                    <input type="text" className="input-field w-full" value={formData.od_cylinder} onChange={e => setFormData({...formData, od_cylinder: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase">Axis</label>
                    <input type="text" className="input-field w-full" value={formData.od_axis} onChange={e => setFormData({...formData, od_axis: e.target.value})} />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-burgundy uppercase tracking-widest border-b border-cream-border pb-1 mt-4">{t("os")}</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase">SPH</label>
                    <input type="text" className="input-field w-full" value={formData.os_sphere} onChange={e => setFormData({...formData, os_sphere: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase">CYL</label>
                    <input type="text" className="input-field w-full" value={formData.os_cylinder} onChange={e => setFormData({...formData, os_cylinder: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase">Axis</label>
                    <input type="text" className="input-field w-full" value={formData.os_axis} onChange={e => setFormData({...formData, os_axis: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("pd")} (mm)</label>
                  <input type="text" className="input-field w-full" value={formData.pd} onChange={e => setFormData({...formData, pd: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("frame_details")}</label>
                  <input type="text" className="input-field w-full" placeholder="Brand, Model, Color..." value={formData.frame_details} onChange={e => setFormData({...formData, frame_details: e.target.value})} />
                </div>
              </div>

              <div className="pt-4 flex gap-3 sticky bottom-0 bg-white py-4 border-t border-cream-border">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-outline"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit"
                  className="flex-[2] btn-burgundy text-sm"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Print Template (Hidden in UI, visible in print) */}
      <AnimatePresence>
        {printingPrescription && (
          <div id="print-area" className="hidden print:block p-10 bg-white text-slate-800 font-serif text-start" style={{ minHeight: "297mm" }}>
            {/* Elegant Letterhead Top Border */}
            <div className="w-full h-1.5 mb-6" style={{ backgroundColor: getThemeColorHex(clinic?.print_theme || "burgundy") }} />
            
            {/* Header section with Dynamic Brand details */}
            <div className="border-b pb-4 mb-6 flex justify-between items-start" style={{ borderBottomColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}25` }}>
              <div className="flex gap-4 items-center">
                {clinic?.print_logo_base64 ? (
                  <img 
                    src={clinic.print_logo_base64.startsWith("preset_") ? getPresetLogoSvg(clinic.print_logo_base64, clinic.print_theme || "burgundy") : clinic.print_logo_base64} 
                    className="w-16 h-16 object-contain" 
                    alt="Clinic Logo" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">LOGO</div>
                )}
                <div>
                  <h1 className="text-2xl font-bold font-serif m-0" style={{ color: getThemeColorHex(clinic?.print_theme || "burgundy") }}>
                    {clinic?.name || "مركز نـور للعيون"}
                  </h1>
                  <p className="text-[10px] font-sans tracking-wide text-slate-500 uppercase m-0 mt-0.5">{clinic?.address || "Noor Optical Management System"}</p>
                  <p className="text-[9px] font-sans text-slate-400 m-0">Baghdad, Iraq</p>
                </div>
              </div>

              <div className="text-end font-sans">
                <h2 className="text-xs font-bold text-slate-900 leading-tight m-0">
                  {clinic?.doctor_credentials || "Dr. Ahmed Al-Rashid, Ophthalmic & Optics Specialist"}
                </h2>
                <p className="text-[10px] text-slate-500 mt-1 m-0">
                  📞 {clinic?.doctor_phone || "+964 770 123 4567"}
                </p>
                <div className="mt-2 text-[8px] font-bold text-white px-2 py-0.5 rounded inline-block uppercase tracking-wider" style={{ backgroundColor: getThemeColorHex(clinic?.print_theme || "burgundy") }}>
                  {t("clinical_visit")}
                </div>
                <p className="text-[9px] text-slate-400 mt-1 m-0">{printingPrescription.date}</p>
              </div>
            </div>

            {/* Patient Clinical Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-sans">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-start">
                <strong className="text-slate-400 uppercase tracking-widest text-[8px] block mb-1">{t("name")}</strong>
                <span className="font-bold text-slate-900 text-sm">
                  {patients.find(p => p.id === printingPrescription.patient_id)?.full_name || "Unknown"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-end">
                <strong className="text-slate-400 uppercase tracking-widest text-[8px] block mb-1">{t("pd")} (مسافة 동공거리)</strong>
                <span className="font-extrabold text-slate-900 text-lg" style={{ color: getThemeColorHex(clinic?.print_theme || "burgundy") }}>
                  {printingPrescription.pd} mm
                </span>
              </div>
            </div>

            {/* Main Clinical Prescription Table */}
            <table className="w-full text-center text-xs border-collapse font-sans mb-6">
              <thead>
                <tr className="text-slate-700 font-bold" style={{ backgroundColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}10` }}>
                  <th className="p-2 border text-start" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}25` }}>Eye</th>
                  <th className="p-2 border" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}25` }}>SPH</th>
                  <th className="p-2 border" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}25` }}>CYL</th>
                  <th className="p-2 border" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}25` }}>Axis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border font-extrabold text-start" style={{ color: getThemeColorHex(clinic?.print_theme || "burgundy"), borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>OD (يمين)</td>
                  <td className="p-3 border text-slate-700 font-bold text-sm" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>{printingPrescription.od_sphere || "—"}</td>
                  <td className="p-3 border text-slate-700 font-bold text-sm" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>{printingPrescription.od_cylinder || "—"}</td>
                  <td className="p-3 border text-slate-700 font-mono text-sm" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>{printingPrescription.od_axis ? `${printingPrescription.od_axis}°` : "—"}</td>
                </tr>
                <tr>
                  <td className="p-3 border font-extrabold text-start" style={{ color: getThemeColorHex(clinic?.print_theme || "burgundy"), borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>OS (يسار)</td>
                  <td className="p-3 border text-slate-700 font-bold text-sm" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>{printingPrescription.os_sphere || "—"}</td>
                  <td className="p-3 border text-slate-700 font-bold text-sm" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>{printingPrescription.os_cylinder || "—"}</td>
                  <td className="p-3 border text-slate-700 font-mono text-sm" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>{printingPrescription.os_axis ? `${printingPrescription.os_axis}°` : "—"}</td>
                </tr>
              </tbody>
            </table>

            {/* Lens & Frame Properties */}
            <div className="grid grid-cols-2 gap-4 text-xs font-sans mb-8">
              <div className="p-3 rounded-lg border bg-slate-50/20 text-start" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("lens_type")}</p>
                <p className="text-sm font-bold text-slate-800">{printingPrescription.lens_type}</p>
              </div>
              <div className="p-3 rounded-lg border bg-slate-50/20 text-start" style={{ borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">{t("frame_details")}</p>
                <p className="text-sm font-bold text-slate-800">{printingPrescription.frame_details || "—"}</p>
              </div>
            </div>

            {/* Specific Instructions (Printed Space Below Prescription) */}
            {clinic?.print_instructions && (
              <div className="p-4 rounded-xl border mb-10 text-xs font-sans leading-relaxed text-slate-700 bg-slate-50/30 text-start" style={{ borderLeft: `4px solid ${getThemeColorHex(clinic?.print_theme || "burgundy")}`, borderColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}15` }}>
                <strong className="block text-[8.5px] text-slate-500 uppercase tracking-widest font-sans mb-1.5">
                  {lang === 'ar' ? '📋 إرشادات الطبيب وملاحظات الرعاية:' : '📋 Optical Care Instructions & Dr. Advice:'}
                </strong>
                <div className="whitespace-pre-line text-slate-700 font-sans">{clinic.print_instructions}</div>
              </div>
            )}

            {/* Footer & QR Security Overlay */}
            <div className="mt-auto pt-6 border-t flex justify-between items-end gap-4" style={{ borderTopColor: `${getThemeColorHex(clinic?.print_theme || "burgundy")}25` }}>
              {/* Associates & Staff listed at the bottom */}
              <div className="space-y-1 font-sans flex-1 text-start">
                {clinic?.show_staff_on_print && (
                  <>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest m-0 leading-tight">
                      {lang === 'ar' ? 'أطباء وزملاء العمل المعتمدين بالمركز' : 'Active Clinic Staff & Care Associates'}
                    </p>
                    <p className="text-[9px] text-slate-600 leading-tight m-0">{clinic.print_associates}</p>
                    {receptionists.length > 0 && (
                      <p className="text-[8px] text-slate-500 italic mt-0.5 m-0 leading-tight">
                        {lang === 'ar' ? 'الاستقبال: ' : 'Reception Assistants: '}
                        {receptionists.map((r: any) => r.full_name).join(', ')}
                      </p>
                    )}
                  </>
                )}
                <p className="text-[7.5px] text-slate-400 mt-2 m-0 font-mono">
                  Noor Optical Print Service Engine A5 • Secure Digital Proof
                </p>
              </div>

              {/* Secure barcode lookup QR code containing logo inside */}
              <div className="flex flex-col items-center shrink-0">
                <div className="relative w-18 h-18 bg-white border border-slate-200 p-0.5 rounded-lg flex items-center justify-center shadow-xs">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`Secure prescription signed by ${clinic?.doctor_credentials || "Dr. Ahmed"} for Fatima`)}`} 
                    className="w-full h-full object-contain" 
                    alt="QR Code" 
                  />
                  {/* Logo centered inside QR */}
                  {clinic?.print_logo_base64 && (
                    <div className="absolute w-4 h-4 bg-white rounded-full p-0.5 shadow flex items-center justify-center overflow-hidden">
                      <img 
                        src={clinic.print_logo_base64.startsWith("preset_") ? getPresetLogoSvg(clinic.print_logo_base64, clinic.print_theme || "burgundy") : clinic.print_logo_base64} 
                        className="w-full h-full object-contain rounded-full" 
                        alt="Icon Center" 
                      />
                    </div>
                  )}
                </div>
                <span className="text-[7.5px] font-bold text-slate-500 mt-1 uppercase tracking-widest font-sans">{lang === 'ar' ? 'كود التحقق' : 'Verify Certificate'}</span>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-[21.6rem] overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={32} className="text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">
                {lang === 'ar' ? 'حذف الوصفة' : 'Delete Prescription'}
              </h3>
              <p className="text-sm text-ink-light mb-6">
                {lang === 'ar' 
                  ? 'هل أنت متأكد من أنك تريد حذف هذا السجل بشكل دائم؟' 
                  : 'Are you sure you want to permanently delete this record?'}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 bg-cream hover:bg-cream-dark text-ink-mid font-bold rounded-xl transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20"
                >
                  {lang === 'ar' ? 'حذف' : 'Yes, Delete'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => setDeleteConfirmId(null)}
              className="absolute top-4 end-4 text-ink-light hover:text-ink transition-colors p-1"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
