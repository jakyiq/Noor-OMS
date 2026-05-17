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
  Printer
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Prescription, Patient } from "../types";
import { useScrollLock } from "../hooks/useScrollLock";

export function Prescriptions() {
  const { t, lang, logAction } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useScrollLock(isModalOpen);

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

  const handleDelete = (id: string) => {
    const pr = prescriptions.find(p => p.id === id);
    const patient = patients.find(p => p.id === pr?.patient_id);
    
    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه الوصفة؟' : 'Are you sure you want to delete this prescription?')) {
      setPrescriptions(prescriptions.filter(p => p.id !== id));
      logAction({
        action: "delete",
        entity_type: "prescription",
        entity_id: id,
        entity_name: `Prescription for ${patient?.full_name || 'Patient'}`,
        details: `Deleted prescription record for ${patient?.full_name}`
      });
    }
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
                    onClick={() => handleDelete(pr.id)}
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden overflow-y-auto max-h-[90vh]"
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
          <div id="print-area" className="hidden print:block p-8 bg-white text-ink font-serif">
            <div className="border-b-2 border-burgundy pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-burgundy">نـور OMS</h1>
                <p className="text-xs tracking-widest text-ink-light uppercase">Noor Optical Management System</p>
              </div>
              <div className="text-end">
                <p className="text-lg font-bold">{t("clinical_visit")}</p>
                <p className="text-sm font-medium">{printingPrescription.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <div className="border-b border-cream-border pb-2">
                  <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest">{t("name")}</p>
                  <p className="text-lg font-bold">{patients.find(p => p.id === printingPrescription.patient_id)?.full_name || "Unknown"}</p>
                </div>
                <div className="border-b border-cream-border pb-2">
                  <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest">{t("prescriber")}</p>
                  <p className="text-lg font-bold">{printingPrescription.prescriber}</p>
                </div>
              </div>
              <div className="flex flex-col justify-end items-end">
                <div className="p-4 bg-cream/30 rounded-xl border-2 border-burgundy/10 text-center min-w-[120px]">
                  <p className="text-[10px] font-bold text-burgundy uppercase mb-1">{t("pd")}</p>
                  <p className="text-2xl font-bold">{printingPrescription.pd} mm</p>
                </div>
              </div>
            </div>

            <table className="w-full border-collapse mb-12">
              <thead>
                <tr className="bg-cream">
                  <th className="border border-cream-border p-3 text-[10px] font-bold text-burgundy uppercase text-start">Eye</th>
                  <th className="border border-cream-border p-3 text-[10px] font-bold text-burgundy uppercase text-center">SPH</th>
                  <th className="border border-cream-border p-3 text-[10px] font-bold text-burgundy uppercase text-center">CYL</th>
                  <th className="border border-cream-border p-3 text-[10px] font-bold text-burgundy uppercase text-center">Axis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-cream-border p-4 font-bold">{t("od")}</td>
                  <td className="border border-cream-border p-4 text-center text-xl font-bold">{printingPrescription.od_sphere || "—"}</td>
                  <td className="border border-cream-border p-4 text-center text-xl font-bold">{printingPrescription.od_cylinder || "—"}</td>
                  <td className="border border-cream-border p-4 text-center text-xl font-bold">{printingPrescription.od_axis || "—"}</td>
                </tr>
                <tr>
                  <td className="border border-cream-border p-4 font-bold">{t("os")}</td>
                  <td className="border border-cream-border p-4 text-center text-xl font-bold">{printingPrescription.os_sphere || "—"}</td>
                  <td className="border border-cream-border p-4 text-center text-xl font-bold">{printingPrescription.os_cylinder || "—"}</td>
                  <td className="border border-cream-border p-4 text-center text-xl font-bold">{printingPrescription.os_axis || "—"}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-8">
              <div className="p-4 bg-cream/30 rounded-xl border border-cream-border">
                <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest mb-2">{t("lens_type")}</p>
                <p className="text-lg font-bold">{printingPrescription.lens_type}</p>
              </div>
              <div className="p-4 bg-cream/30 rounded-xl border border-cream-border">
                <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest mb-2">{t("frame_details")}</p>
                <p className="text-lg font-bold">{printingPrescription.frame_details || "—"}</p>
              </div>
            </div>

            <div className="mt-20 pt-12 border-t-2 border-burgundy/10 flex justify-between">
              <div className="text-sm font-medium text-ink-light">
                <p>Baghdad, Iraq • +964 7XX XXX XXXX</p>
                <p>Generated by Noor Optical Management System</p>
              </div>
              <div className="text-center">
                <div className="w-32 h-1 bg-burgundy/10 mb-2 invisible print:visible" />
                <p className="text-[10px] font-bold text-burgundy uppercase">{t("prescriber")} Signature</p>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
