import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { UserPlus, Search, MoreHorizontal, Phone, Clock, FileText, ChevronRight, ChevronDown, Filter, ArrowLeft, Calendar, ClipboardList, Wallet, Plus, X, Trash2, Printer, History, ArrowDown, ArrowUp, Pencil, Banknote, CalendarClock } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion } from "motion/react";
import { subDays, isAfter, parseISO } from "date-fns";
import { useScrollLock } from "../hooks/useScrollLock";
import { NewVisitModal } from "./NewVisitModal";

export function Patients() {
  const { t, lang, logAction, triggerAddPatient, currentSection, patients, setPatients, setCurrentSection, clinic } = useClinic();
  const defaultFollowUpMonths = clinic?.default_followup_months ?? 3;
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("all");
  const [debtFilter, setDebtFilter] = useState("all");
  const [visitFilter, setVisitFilter] = useState("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showFinancialSummary, setShowFinancialSummary] = useState(false);
  const [expandedVisits, setExpandedVisits] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOldPrescriptionModalOpen, setIsOldPrescriptionModalOpen] = useState(false);
  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
  const [oldPrescriptionData, setOldPrescriptionData] = useState({
    ipd: "",
    od: { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" },
    os: { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" }
  });
  const [printingVisit, setPrintingVisit] = useState<any>(null);

  useScrollLock(isModalOpen || !!printingVisit || isOldPrescriptionModalOpen || isNewVisitModalOpen);

  useEffect(() => {
    if (triggerAddPatient > 0) {
      setSelectedPatientId(null);
      setEditingPatientId(null);
      setFormData({
        full_name: "",
        phone: "",
        age: "",
        gender: "male",
        outstanding: "",
      });
      setIsModalOpen(true);
    }
  }, [triggerAddPatient]);

  const handlePrintVisit = (visit: any) => {
    setPrintingVisit(visit);
    setTimeout(() => {
      window.print();
    }, 100);
  };
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
  const [visitToEdit, setVisitToEdit] = useState<any>(null);
  const [topUpPatientId, setTopUpPatientId] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    age: "",
    gender: "male",
    outstanding: "",
  });

  const [patientSortField, setPatientSortField] = useState<"last_visit" | "outstanding">("last_visit");
  const [patientSortOrder, setPatientSortOrder] = useState<"desc" | "asc">("desc");

  const filteredPatients = useMemo(() => {
    let result = patients.filter(p => {
      // Name/Phone search
      const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.phone.includes(searchTerm);
      if (!matchesSearch) return false;

      // Gender filter
      if (genderFilter !== "all" && p.gender !== genderFilter) return false;

      // Debt filter
      if (debtFilter === "has_debt" && p.outstanding <= 0) return false;
      if (debtFilter === "no_debt" && p.outstanding > 0) return false;

      // Visit filter
      if (visitFilter !== "all") {
        const days = visitFilter === "7days" ? 7 : visitFilter === "30days" ? 30 : 90;
        const cutoff = subDays(new Date(), days);
        try {
          if (!isAfter(parseISO(p.last_visit), cutoff)) return false;
        } catch (e) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
       if (patientSortField === "last_visit") {
          const dateA = new Date(a.last_visit).getTime();
          const dateB = new Date(b.last_visit).getTime();
          return patientSortOrder === "desc" ? dateB - dateA : dateA - dateB;
       } else if (patientSortField === "outstanding") {
          return patientSortOrder === "desc" ? b.outstanding - a.outstanding : a.outstanding - b.outstanding;
       }
       return 0;
    });

    return result;
  }, [searchTerm, genderFilter, debtFilter, visitFilter, patients, patientSortField, patientSortOrder]);

  const handleSavePatient = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPatientId) {
      setPatients(patients.map(p => {
        if (p.id === editingPatientId) {
          logAction({
            action: "update",
            entity_type: "patient",
            entity_id: p.id,
            entity_name: formData.full_name,
            details: `Updated info for ${formData.full_name}. Previous phone: ${p.phone}`
          });
          return {
            ...p,
            full_name: formData.full_name,
            phone: formData.phone,
            age: parseInt(formData.age) || 0,
            gender: formData.gender as "male" | "female",
            outstanding: parseInt(formData.outstanding) || 0,
          };
        }
        return p;
      }));
    } else {
      const newPatient = {
        id: Math.random().toString(36).substr(2, 9),
        full_name: formData.full_name,
        phone: formData.phone,
        age: parseInt(formData.age) || 0,
        gender: formData.gender as "male" | "female",
        last_visit: new Date().toISOString().split('T')[0],
        outstanding: parseInt(formData.outstanding) || 0,
        visits: [] as any[],
      };
      setPatients([newPatient, ...patients]);
      logAction({
        action: "create",
        entity_type: "patient",
        entity_id: newPatient.id,
        entity_name: newPatient.full_name,
        details: `Created new patient record for ${newPatient.full_name}`
      });
    }

    setIsModalOpen(false);
    setEditingPatientId(null);
    setFormData({
      full_name: "",
      phone: "",
      age: "",
      gender: "male",
      outstanding: "",
    });
  };

  const handleDeletePatient = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    if (confirm(lang === 'ar' ? `هل أنت متأكد من حذف ${patient.full_name}؟` : `Are you sure you want to delete ${patient.full_name}?`)) {
      setPatients(patients.filter(p => p.id !== patient.id));
      logAction({
        action: "delete",
        entity_type: "patient",
        entity_id: patient.id,
        entity_name: patient.full_name,
        details: `Deleted patient record for ${patient.full_name}`
      });
      if (selectedPatientId === patient.id) {
        setSelectedPatientId(null);
      }
    }
  };

  const handleDeleteVisit = (visitId: string) => {
    if (!selectedPatient) return;
    const visit = selectedPatient.visits?.find((v: any) => v.id === visitId);

    if (confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذه المراجعة؟' : 'Are you sure you want to delete this visit?')) {
      setPatients(patients.map(p => {
        if (p.id === selectedPatient.id) {
          return {
            ...p,
            visits: p.visits?.filter((v: any) => v.id !== visitId)
          };
        }
        return p;
      }));
      logAction({
        action: "delete",
        entity_type: "visit",
        entity_id: visitId,
        entity_name: `Visit for ${selectedPatient.full_name}`,
        details: `Deleted visit record from ${visit?.visit_date} for ${selectedPatient.full_name}`
      });
    }
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(topUpAmount) || 0;
    if (amount <= 0 || !topUpPatientId) return;

    setPatients(patients.map(p => {
      if (p.id === topUpPatientId) {
        if (amount > p.outstanding) {
          alert(lang === 'ar' ? 'المبلغ يجب أن لا يتجاوز الدين المتبقي' : 'Amount cannot exceed outstanding debt');
          return p;
        }

        let remainingTopUp = amount;
        
        // Create a copy of visits and sort oldest first to pay off oldest debts first
        const sortedVisits = [...(p.visits || [])].map(v => ({ ...v }));
        sortedVisits.sort((a, b) => new Date(a.visit_date).getTime() - new Date(b.visit_date).getTime());
        
        for (let i = 0; i < sortedVisits.length; i++) {
          if (remainingTopUp <= 0) break;
          const v = sortedVisits[i];
          if (v.remaining > 0) {
            const deduction = Math.min(v.remaining, remainingTopUp);
            v.remaining -= deduction;
            v.amount_paid += deduction;
            remainingTopUp -= deduction;
          }
        }
        
        // Map changes back to original order
        const updatedVisits = (p.visits || []).map(originalVisit => {
          const updated = sortedVisits.find(v => v.id === originalVisit.id);
          return updated ? updated : originalVisit;
        });

        logAction({
          action: "update",
          entity_type: "patient",
          entity_id: p.id,
          entity_name: p.full_name,
          details: `Topped up debt by ${amount}`
        });
        return {
          ...p,
          outstanding: p.outstanding - amount,
          visits: updatedVisits
        };
      }
      return p;
    }));
    
    setTopUpPatientId(null);
    setTopUpAmount("");
  };

  const handleSaveOldPrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !selectedPatient) return;
    
    // Create a diagnosis string out of the table data
    const od = oldPrescriptionData.od;
    const os = oldPrescriptionData.os;
    const diagnosisText = [
      lang === 'ar' ? "وصفة طبية سابقة:" : "Old Prescription:",
      `OD (R): SPH: ${od.sphSign}${od.sph || '0.00'}, CYL: ${od.cylSign}${od.cyl || '0.00'}, AXIS: ${od.axis || '0'}, ADD: +${od.add || '0.00'}, VA: ${od.va || '-'}, BCVA: ${od.bcva || '-'}`,
      `OS (L): SPH: ${os.sphSign}${os.sph || '0.00'}, CYL: ${os.cylSign}${os.cyl || '0.00'}, AXIS: ${os.axis || '0'}, ADD: +${os.add || '0.00'}, VA: ${os.va || '-'}, BCVA: ${os.bcva || '-'}`,
      oldPrescriptionData.ipd ? `IPD: ${oldPrescriptionData.ipd}` : "",
    ].filter(Boolean).join('\n');

    const newVisit = {
      id: Math.random().toString(36).substr(2, 9),
      patient_id: selectedPatientId,
      visit_date: new Date().toISOString().split('T')[0],
      diagnosis: diagnosisText,
      total_amount: 0,
      amount_paid: 0,
      remaining: 0,
      isOldRX: true,
      rxData: oldPrescriptionData
    };

    setPatients(patients.map(p => {
      if (p.id === selectedPatientId) {
        return {
          ...p,
          visits: [newVisit, ...(p.visits || [])]
        };
      }
      return p;
    }));
    
    logAction({
      action: "create",
      entity_type: "visit",
      entity_id: newVisit.id,
      entity_name: `Visit for ${selectedPatient.full_name}`,
      details: `Added old prescription for ${selectedPatient.full_name}`
    });
    
    setIsOldPrescriptionModalOpen(false);
  };

  const handleAddPrescription = () => {
    if (!selectedPatientId || !selectedPatient) return;
    setEditingVisitId(null);
    setVisitToEdit(null);
    setIsNewVisitModalOpen(true);
  };

  const handleEditVisit = (visit: any) => {
    setEditingVisitId(visit.id);
    setVisitToEdit(visit);
    setIsNewVisitModalOpen(true);
  };

  const handleSaveNewVisit = (visitData: any) => {
    if (!selectedPatientId || !selectedPatient) return;
    
    // Calculate totals based on visitData
    const fPrice = parseFloat(visitData.framePrice) || 0;
    const lPrice = parseFloat(visitData.lensPrice) || 0;
    const cFee = visitData.checkupDone ? (parseFloat(visitData.checkupFee) || 5000) : 0;
    const totalSelectedCost = (visitData.includeFrame ? fPrice : 0) + lPrice + cFee;
    const paid = parseFloat(visitData.paidAmount) || 0;

    const baseDate = visitToEdit?.visit_date || new Date().toISOString().split('T')[0];
    let nextVisitStr = undefined;
    
    if (visitData.checkupDone) {
      const baseDateObj = new Date(baseDate);
      baseDateObj.setMonth(baseDateObj.getMonth() + defaultFollowUpMonths);
      nextVisitStr = baseDateObj.toISOString().split('T')[0];
    }

    const newVisitObj = {
      id: editingVisitId || Math.random().toString(36).substr(2, 9),
      patient_id: selectedPatientId,
      visit_date: baseDate,
      next_visit_date: nextVisitStr,
      diagnosis: visitToEdit?.diagnosis || (lang === 'ar' ? 'بطاقة فحص جديدة' : 'New Prescription'),
      total_amount: totalSelectedCost,
      amount_paid: paid,
      remaining: Math.max(0, totalSelectedCost - paid),
      rawFormData: visitData,
      rxData: {
        od: visitData.eyesCount !== 'os' ? {
          sph: visitData.od.sph, sphSign: visitData.od.sphSign,
          cyl: visitData.od.cyl, cylSign: visitData.od.cylSign,
          axis: visitData.od.axis, add: visitData.od.add,
          va: visitData.od.va, bcva: visitData.od.bcva
        } : null,
        os: visitData.eyesCount !== 'od' ? {
          sph: visitData.os.sph, sphSign: visitData.os.sphSign,
          cyl: visitData.os.cyl, cylSign: visitData.os.cylSign,
          axis: visitData.os.axis, add: visitData.os.add,
          va: visitData.os.va, bcva: visitData.os.bcva
        } : null,
        ipd: visitData.ipd,
        lens: visitData.lensType,
        frame: visitData.includeFrame ? visitData.frameBrand : "",
      },
      notes: visitData.notes
    };

    setPatients(patients.map(p => {
      if (p.id === selectedPatientId) {
        if (editingVisitId) {
          const oldVisit = p.visits?.find((v: any) => v.id === editingVisitId);
          const diff = oldVisit ? newVisitObj.remaining - oldVisit.remaining : 0;
          return {
            ...p,
            outstanding: p.outstanding + diff,
            visits: p.visits.map((v: any) => v.id === editingVisitId ? newVisitObj : v)
          };
        } else {
          return {
            ...p,
            outstanding: p.outstanding + newVisitObj.remaining,
            visits: [newVisitObj, ...(p.visits || [])]
          };
        }
      }
      return p;
    }));
    
    logAction({
      action: editingVisitId ? "update" : "create",
      entity_type: "visit",
      entity_id: newVisitObj.id,
      entity_name: `Visit for ${selectedPatient.full_name}`,
      details: editingVisitId ? `Updated prescription/visit for ${selectedPatient.full_name}` : `Added new prescription/visit for ${selectedPatient.full_name}`
    });

    setIsNewVisitModalOpen(false);
    setEditingVisitId(null);
    setVisitToEdit(null);
  };

  const openAddModal = () => {
    setEditingPatientId(null);
    setFormData({
      full_name: "",
      phone: "",
      age: "",
      gender: "male",
      outstanding: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, patient: any) => {
    e.stopPropagation();
    setEditingPatientId(patient.id);
    setFormData({
      full_name: patient.full_name,
      phone: patient.phone,
      age: patient.age.toString(),
      gender: patient.gender,
      outstanding: patient.outstanding.toString(),
    });
    setIsModalOpen(true);
  };

  const selectedPatient = useMemo(() => {
    return patients.find(p => p.id === selectedPatientId);
  }, [patients, selectedPatientId]);

  const filteredVisits = useMemo(() => {
    if (!selectedPatient || !selectedPatient.visits) return [];
    
    let result = [...selectedPatient.visits];
    
    // Default sorting by date descending
    result.sort((a, b) => {
      const dateA = new Date(a.visit_date).getTime();
      const dateB = new Date(b.visit_date).getTime();
      return dateB - dateA;
    });

    return result;
  }, [selectedPatient]);

  const visitSummary = useMemo(() => {
    if (!selectedPatient || !selectedPatient.visits) return { count: 0, totalAmount: 0, totalPaid: 0, totalRemaining: 0 };
    return selectedPatient.visits.reduce((acc, v) => ({
      count: acc.count + 1,
      totalAmount: acc.totalAmount + (v.total_amount || 0),
      totalPaid: acc.totalPaid + (v.amount_paid || 0),
      totalRemaining: acc.totalRemaining + (v.remaining || 0),
    }), { count: 0, totalAmount: 0, totalPaid: 0, totalRemaining: 0 });
  }, [selectedPatient]);

  if (selectedPatient) {
    return (
      <>
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Detail Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSelectedPatientId(null)}
              className="p-2 bg-white border-2 border-cream-border rounded-xl text-ink-mid hover:text-burgundy hover:border-burgundy/20 transition-all shadow-sm"
            >
              {lang === 'ar' ? <ArrowLeft size={20} className="rotate-180" /> : <ArrowLeft size={20} />}
            </button>
            <div>
              <h1 className="text-3xl font-serif font-bold text-ink mb-1">{selectedPatient.full_name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-ink-light uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Phone size={12} /> {selectedPatient.phone}</span>
                <span className="w-1 h-1 bg-cream-border rounded-full" />
                <span>{selectedPatient.age} {lang === 'ar' ? 'سنة' : 'Years'}</span>
                <span className="w-1 h-1 bg-cream-border rounded-full" />
                <span>{lang === 'ar' ? (selectedPatient.gender === 'male' ? 'ذكر' : 'أنثى') : selectedPatient.gender}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0 flex-wrap md:flex-nowrap">
            {selectedPatient.outstanding > 0 && (
              <button 
                onClick={() => {
                  setTopUpPatientId(selectedPatient.id);
                  setTopUpAmount(selectedPatient.outstanding.toString());
                }}
                className="btn-outline px-6 py-3 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 text-sm flex items-center justify-center gap-2 font-bold w-full sm:w-auto"
              >
                <Banknote size={18} />
                {lang === "ar" ? "تسديد رصيد" : "Top up Balance"}
              </button>
            )}
            <button 
              onClick={handleAddPrescription}
              className="btn-burgundy px-6 py-3 text-sm flex items-center justify-center gap-2 font-bold shadow-lg shadow-burgundy/20 hover:shadow-xl hover:shadow-burgundy/30 transition-all w-full sm:w-auto"
            >
              <Plus size={18} />
              {t("add_prescription")}
            </button>
            <button 
              onClick={() => setIsOldPrescriptionModalOpen(true)}
              className="btn-outline px-6 py-3 text-sm flex items-center justify-center gap-2 font-bold w-full sm:w-auto"
            >
              <History size={18} />
              {lang === "ar" ? "أرشفة وصفة طبية سابقة" : "Archive Previous"}
            </button>
          </div>
        </div>

        {/* Quick Stats & Summary */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 bg-white flex items-center gap-4 border-none shadow-sm ring-1 ring-cream-border">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold">{t("last_visit")}</p>
                <p className="text-sm font-bold text-ink">{selectedPatient.last_visit}</p>
              </div>
            </div>
            <div className="card p-5 bg-white flex items-center gap-4 border-none shadow-sm ring-1 ring-cream-border">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <ClipboardList size={20} />
              </div>
              <div>
                <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold">{t("total_visits")}</p>
                <p className="text-sm font-bold text-ink">{visitSummary.count}</p>
              </div>
            </div>
            <div className="card p-5 bg-white flex items-center gap-4 border-none shadow-sm ring-1 ring-cream-border">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold">{t("outstanding_debt")}</p>
                <p className="text-lg font-bold text-rose-600">{formatIQD(selectedPatient.outstanding)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-xl font-serif font-bold text-ink">{t("prescription_history")}</h3>
          </div>

          <div className="space-y-4">
            {filteredVisits.length > 0 ? filteredVisits.map((visit: any, idx: number) => {
              const isOld = visit.isOldRX || (visit.diagnosis && (visit.diagnosis.includes("Old Prescription") || visit.diagnosis.includes("وصفة طبية سابقة:")));
              return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={visit.id} 
                className="bg-[#f0f7fa] border border-[#d0e3ec] rounded-xl overflow-hidden mb-4"
                dir={lang === "ar" ? "rtl" : "ltr"}
              >
                <div 
                  className="flex justify-between items-center p-4 cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setExpandedVisits(prev => ({...prev, [visit.id]: !prev[visit.id]}))}
                >
                  <div className="text-sm font-bold text-ink">
                     {!isOld && `IQD ${formatIQD(visit.total_amount)}`}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    {!isOld && visit.remaining === 0 && (
                       <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold">{t("fully_paid")}</span>
                    )}
                    {isOld && (
                       <span className="px-2 py-1 bg-[#e0eaef] text-[#55697a] rounded-md text-[10px] font-bold">
                         {lang === 'ar' ? 'وصفة قديمة' : 'Old RX'}
                       </span>
                    )}
                    <span className="text-sm font-bold text-ink whitespace-nowrap">{visit.visit_date}</span>
                    <ChevronDown size={16} className={cn("text-ink transition-transform", expandedVisits[visit.id] ? "rotate-180" : "rotate-0")} />
                  </div>
                </div>
                
                {expandedVisits[visit.id] && (
                  <div className="p-4 bg-white border-t border-[#d0e3ec] text-sm">
                     <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 w-full justify-between">
                        {/* RX / Diagnosis */}
                        <div className="flex-[2] space-y-3 order-2 lg:order-1">
                           <div className="text-xs font-bold text-[#55697a] border-b border-[#d0e3ec] pb-1 text-end">
                             {isOld ? "RX" : t("diagnosis_label")}
                           </div>
                           {visit.rxData ? (
                              <div className="w-full">
                                {/* Mobile Version */}
                                <div className="flex flex-col gap-3 sm:hidden mt-2">
                                  {visit.rxData.od && (
                                    <div className="border border-[#d0e3ec] rounded-lg p-3 bg-[#f8fbff]">
                                      <div className="font-bold text-blue-800 text-xs mb-2 border-b border-[#d0e3ec] pb-1">OD (R)</div>
                                      <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm text-center font-mono">
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">SPH</span>{visit.rxData.od.sphSign}{visit.rxData.od.sph || '0.00'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">CYL</span>{visit.rxData.od.cylSign}{visit.rxData.od.cyl || '0.00'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">AXIS</span>{visit.rxData.od.axis || '0'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">ADD</span>{visit.rxData.od.add || '0.00'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">VA</span>{visit.rxData.od.va || '-'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">BCVA</span>{visit.rxData.od.bcva || '-'}</div>
                                      </div>
                                    </div>
                                  )}
                                  {visit.rxData.os && (
                                    <div className="border border-[#d0e3ec] rounded-lg p-3 bg-[#f8fbff]">
                                      <div className="font-bold text-blue-800 text-xs mb-2 border-b border-[#d0e3ec] pb-1">OS (L)</div>
                                      <div className="grid grid-cols-3 gap-y-3 gap-x-2 text-sm text-center font-mono">
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">SPH</span>{visit.rxData.os.sphSign}{visit.rxData.os.sph || '0.00'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">CYL</span>{visit.rxData.os.cylSign}{visit.rxData.os.cyl || '0.00'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">AXIS</span>{visit.rxData.os.axis || '0'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">ADD</span>{visit.rxData.os.add || '0.00'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">VA</span>{visit.rxData.os.va || '-'}</div>
                                         <div><span className="text-[#55697a] text-[10px] block font-bold font-sans">BCVA</span>{visit.rxData.os.bcva || '-'}</div>
                                      </div>
                                    </div>
                                  )}
                                  <div className="text-[#55697a] text-xs mt-1 border border-[#d0e3ec] rounded-lg p-2 bg-[#f8fbff]">
                                    {visit.rxData.ipd && (
                                      <div className="flex justify-between items-center bg-white p-1.5 rounded border border-[#e0eaef] mb-1.5"><span className="font-bold text-[10px] uppercase tracking-wider">IPD</span> <span className="font-medium text-ink">{visit.rxData.ipd}</span></div>
                                    )}
                                    <div className="flex justify-between items-center bg-white p-1.5 rounded border border-[#e0eaef] mb-1.5"><span className="font-bold text-[10px] uppercase tracking-wider">Lens</span> <span className="font-medium text-ink">{visit.rxData.lens || 'clear'}</span></div>
                                    <div className="flex justify-between items-center bg-white p-1.5 rounded border border-[#e0eaef]"><span className="font-bold text-[10px] uppercase tracking-wider">Frame</span> <span className="font-medium text-ink">{visit.rxData.frame || '-'}</span></div>
                                  </div>
                                </div>
                                
                                {/* Desktop Version */}
                                <div className="hidden sm:block overflow-x-auto w-full">
                                  <table className="w-full text-center text-xs lg:text-sm border border-[#d0e3ec] rounded-lg overflow-hidden whitespace-nowrap">
                                    <thead className="bg-[#f0f7fa] text-[#55697a]">
                                      <tr>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">EYE</th>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">SPH</th>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">CYL</th>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">AXIS</th>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">ADD</th>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">VA</th>
                                        <th className="p-2 lg:p-3 border border-[#d0e3ec]">BCVA</th>
                                      </tr>
                                    </thead>
                                    <tbody className="font-mono">
                                      {visit.rxData.od && (
                                        <tr>
                                          <td className="p-2 lg:p-3 font-bold text-blue-800 border border-[#d0e3ec] font-sans">OD</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.od.sphSign}{visit.rxData.od.sph || '0.00'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.od.cylSign}{visit.rxData.od.cyl || '0.00'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.od.axis || '0'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.od.add || '0.00'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.od.va || '-'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.od.bcva || '-'}</td>
                                        </tr>
                                      )}
                                      {visit.rxData.os && (
                                        <tr>
                                          <td className="p-2 lg:p-3 font-bold text-blue-800 border border-[#d0e3ec] font-sans">OS</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.os.sphSign}{visit.rxData.os.sph || '0.00'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.os.cylSign}{visit.rxData.os.cyl || '0.00'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.os.axis || '0'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.os.add || '0.00'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.os.va || '-'}</td>
                                          <td className="p-2 lg:p-3 border border-[#d0e3ec]">{visit.rxData.os.bcva || '-'}</td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                  <div className="text-[#55697a] text-xs lg:text-sm text-end mt-3 flex flex-col items-end gap-1">
                                    {visit.rxData.ipd && (
                                      <div className="flex items-center gap-2"><span className="font-bold text-[10px] uppercase tracking-widest text-[#55697a]">IPD:</span> <span className="font-medium text-ink bg-white px-2 py-0.5 rounded border border-[#e0eaef] min-w-[100px] text-center">{visit.rxData.ipd}</span></div>
                                    )}
                                    <div className="flex items-center gap-2"><span className="font-bold text-[10px] uppercase tracking-widest text-[#55697a]">Lens:</span> <span className="font-medium text-ink bg-white px-2 py-0.5 rounded border border-[#e0eaef] min-w-[100px] text-center">{visit.rxData.lens || 'clear'}</span></div>
                                    <div className="flex items-center gap-2"><span className="font-bold text-[10px] uppercase tracking-widest text-[#55697a]">Frame:</span> <span className="font-medium text-ink bg-white px-2 py-0.5 rounded border border-[#e0eaef] min-w-[100px] text-center">{visit.rxData.frame || '-'}</span></div>
                                  </div>
                                </div>
                              </div>
                           ) : (
                              <p className="text-sm text-ink-mid leading-relaxed whitespace-pre-wrap mt-2">{visit.diagnosis || t("no_data")}</p>
                           )}
                           
                           {visit.notes && (
                             <div className="mt-3 pt-3 border-t border-[#e0eaef]">
                               <div className="font-bold text-xs text-[#55697a] mb-1">{lang === 'ar' ? 'الملاحظات' : 'Notes'}</div>
                               <p className="text-sm text-ink-mid whitespace-pre-wrap">{visit.notes}</p>
                             </div>
                           )}
                        </div>

                        {/* Financials */}
                        {!isOld && (
                          <div className="flex-[1] space-y-3 order-1 lg:order-2 self-start lg:min-w-[200px]">
                             <div className="text-xs font-bold text-[#55697a] border-b border-[#d0e3ec] pb-1 text-end">
                               {lang === 'ar' ? 'المالية' : 'Financial'}
                             </div>
                             <div className="flex justify-between items-center border-b border-[#d0e3ec] pb-1">
                               <span className="text-[#55697a] font-bold">{lang === 'ar' ? 'الإجمالي' : 'Total'}</span>
                               <span className="font-mono text-[#55697a]">{formatIQD(visit.total_amount)}</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-[#d0e3ec] pb-1">
                               <span className="text-[#55697a] font-bold">{lang === 'ar' ? 'المدفوع' : 'Paid'}</span>
                               <span className="font-mono text-[#55697a]">{formatIQD(visit.amount_paid)}</span>
                             </div>
                             <div className="flex justify-between items-center border-b border-[#d0e3ec] pb-1">
                               <span className="text-green-600 font-bold">{lang === 'ar' ? 'المتبقي' : 'Remaining'}</span>
                               <span className="font-mono text-green-600">{formatIQD(visit.remaining)}</span>
                             </div>
                          </div>
                        )}
                     </div>
                     
                     <div className="mt-4 pt-4 border-t border-[#d0e3ec] flex justify-end gap-2 text-sm">
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleDeleteVisit(visit.id); }}
                         className="px-4 py-2 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                       >
                         {lang === 'ar' ? 'حذف' : 'Delete'}
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); handleEditVisit(visit); }} className="px-4 py-2 text-[#55697a] border border-[#d0e3ec] rounded-lg hover:bg-black/5 flex items-center gap-2 transition-colors">
                         <span className="hidden sm:inline">{lang === 'ar' ? 'تعديل' : 'Edit'}</span>
                       </button>
                       <button onClick={(e) => { e.stopPropagation(); handlePrintVisit(visit); }} className="px-4 py-2 text-[#55697a] border border-[#d0e3ec] rounded-lg hover:bg-black/5 flex items-center gap-2 transition-colors">
                         {lang === 'ar' ? 'طباعة A5' : 'Print A5'}
                       </button>
                     </div>
                  </div>
                )}
              </motion.div>
              );
            }) : (
              <div className="p-12 text-center text-ink-light py-16 bg-white rounded-2xl border border-dashed border-cream-border flex flex-col items-center gap-4">
                <FileText size={32} className="opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">{t("no_data")}</p>
              </div>
            )}
          </div>
        </div>

        {/* Collapsible Financial Summary */}
        <div className="bg-cream/30 rounded-2xl border border-cream-border shadow-inner overflow-hidden transition-all">
          <button 
            onClick={() => setShowFinancialSummary(!showFinancialSummary)}
            className="w-full p-4 flex items-center justify-between hover:bg-cream/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wallet size={16} className="text-ink-mid" />
              <h4 className="text-xs font-bold text-ink-mid uppercase tracking-widest">{t("financial_summary")}</h4>
            </div>
            <ChevronDown 
              size={18} 
              className={cn("text-ink-light transition-transform duration-300", showFinancialSummary ? "rotate-180" : "rotate-0")} 
            />
          </button>
          
          {showFinancialSummary && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="p-6 pt-2 border-t border-cream-border/50"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-ink-light uppercase tracking-tight">{t("total_amount_summary")}</p>
                  <p className="text-xl font-mono font-bold text-ink">{formatIQD(visitSummary.totalAmount)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-ink-light uppercase tracking-tight">{t("total_paid_summary")}</p>
                  <p className="text-xl font-mono font-bold text-green-600">+{formatIQD(visitSummary.totalPaid)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-bold text-ink-light uppercase tracking-tight">{t("remaining")}</p>
                  <p className="text-xl font-mono font-bold text-burgundy">{formatIQD(visitSummary.totalRemaining)}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      <NewVisitModal 
        isOpen={isNewVisitModalOpen} 
        onClose={() => {
          setIsNewVisitModalOpen(false);
          setEditingVisitId(null);
          setVisitToEdit(null);
        }} 
        onSave={handleSaveNewVisit} 
        lang={lang} 
        visitToEdit={visitToEdit}
      />

      {/* Old Prescription Modal */}
      {isOldPrescriptionModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setIsOldPrescriptionModalOpen(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 flex justify-between items-center text-ink border-b border-cream-border pb-4">
              <h2 className="text-xl font-bold">
                {lang === "ar" ? "وصفة قديمة" : "Old Prescription"}
              </h2>
              <button 
                type="button" 
                onClick={() => setIsOldPrescriptionModalOpen(false)} 
                className="p-2 border border-cream-border rounded-xl text-ink-light hover:text-ink transition-colors bg-white hover:bg-cream/50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveOldPrescription} className="p-4 sm:p-8 space-y-6 flex-1 overflow-y-auto">
              
              <div className="border-b border-cream-border pt-2">
                <div className="text-lg font-bold text-blue-600 pb-2 border-b-2 border-blue-600 inline-block px-4">
                  {lang === "ar" ? "الوصفة" : "Prescription"}
                </div>
              </div>

              <div className="w-full">
                {/* Mobile View */}
                <div className="flex flex-col gap-4 sm:hidden">
                  <div className="border border-cream-border rounded-xl p-3 bg-white">
                    <div className="font-bold text-blue-800 text-sm mb-3 border-b border-cream-border pb-2">OD (R)</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">SPH</label>
                        <div className="flex items-center gap-1">
                          <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm" value={oldPrescriptionData.od.sph} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, od: {...prev.od, sph: v}})); }} />
                          <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, sphSign: prev.od.sphSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0", oldPrescriptionData.od.sphSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{oldPrescriptionData.od.sphSign}</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">CYL</label>
                        <div className="flex items-center gap-1">
                          <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm" value={oldPrescriptionData.od.cyl} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, od: {...prev.od, cyl: v}})); }} />
                          <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, cylSign: prev.od.cylSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0", oldPrescriptionData.od.cylSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{oldPrescriptionData.od.cylSign}</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">AXIS</label>
                        <input type="number" placeholder="0" min="1" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.od.axis} onChange={e => { let v = e.target.value; if (parseInt(v, 10) > 180) v = "180"; setOldPrescriptionData(prev => ({...prev, od: {...prev.od, axis: v}})); }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">ADD</label>
                        <input type="number" placeholder="0.00" min="0" step="0.25" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.od.add} onChange={e => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, add: e.target.value}}))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">VA</label>
                        <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.od.va} onChange={e => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, va: e.target.value}}))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">BCVA</label>
                        <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.od.bcva} onChange={e => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, bcva: e.target.value}}))} />
                      </div>
                    </div>
                  </div>

                  <div className="border border-cream-border rounded-xl p-3 bg-white">
                    <div className="font-bold text-blue-800 text-sm mb-3 border-b border-cream-border pb-2">OS (L)</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">SPH</label>
                        <div className="flex items-center gap-1">
                          <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm" value={oldPrescriptionData.os.sph} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, os: {...prev.os, sph: v}})); }} />
                          <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, sphSign: prev.os.sphSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0", oldPrescriptionData.os.sphSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{oldPrescriptionData.os.sphSign}</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">CYL</label>
                        <div className="flex items-center gap-1">
                          <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm" value={oldPrescriptionData.os.cyl} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, os: {...prev.os, cyl: v}})); }} />
                          <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, cylSign: prev.os.cylSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0", oldPrescriptionData.os.cylSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{oldPrescriptionData.os.cylSign}</button>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">AXIS</label>
                        <input type="number" placeholder="0" min="1" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.os.axis} onChange={e => { let v = e.target.value; if (parseInt(v, 10) > 180) v = "180"; setOldPrescriptionData(prev => ({...prev, os: {...prev.os, axis: v}})); }} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">ADD</label>
                        <input type="number" placeholder="0.00" min="0" step="0.25" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.os.add} onChange={e => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, add: e.target.value}}))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">VA</label>
                        <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.os.va} onChange={e => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, va: e.target.value}}))} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">BCVA</label>
                        <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={oldPrescriptionData.os.bcva} onChange={e => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, bcva: e.target.value}}))} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto border border-cream-border rounded-xl w-full">
                  <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap min-w-max">
                    <thead className="text-ink-light text-[10px] sm:text-xs font-bold uppercase tracking-widest border-b border-cream-border">
                      <tr>
                        <th className="p-3 sm:p-4 border-x border-cream-border">EYE</th>
                        <th className="p-3 sm:p-4 border-x border-cream-border">SPH</th>
                        <th className="p-3 sm:p-4 border-x border-cream-border">CYL</th>
                        <th className="p-3 sm:p-4 border-x border-cream-border">AXIS</th>
                        <th className="p-3 sm:p-4 border-x border-cream-border">ADD</th>
                        <th className="p-3 sm:p-4 border-x border-cream-border">VA</th>
                        <th className="p-3 sm:p-4 border-s border-cream-border">BCVA</th>
                      </tr>
                    </thead>
                    <tbody className="text-ink font-mono text-xs sm:text-sm divide-y divide-cream-border">
                      {/* OD (Right View) */}
                      <tr>
                        <td className="p-2 font-bold text-blue-800 border-x border-cream-border">OD (R)</td>
                        <td className="p-2 border-x border-cream-border">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md" value={oldPrescriptionData.od.sph} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, od: {...prev.od, sph: v}})); }} />
                            <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, sphSign: prev.od.sphSign === "+" ? "-" : "+"}}))} className={cn("p-1 border rounded w-7 font-bold transition-colors", oldPrescriptionData.od.sphSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100")}>{oldPrescriptionData.od.sphSign}</button>
                          </div>
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md" value={oldPrescriptionData.od.cyl} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, od: {...prev.od, cyl: v}})); }} />
                            <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, cylSign: prev.od.cylSign === "+" ? "-" : "+"}}))} className={cn("p-1 border rounded w-7 font-bold transition-colors", oldPrescriptionData.od.cylSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100")}>{oldPrescriptionData.od.cylSign}</button>
                          </div>
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <input type="number" placeholder="0" min="1" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.od.axis} onChange={e => { let v = e.target.value; if (parseInt(v, 10) > 180) v = "180"; setOldPrescriptionData(prev => ({...prev, od: {...prev.od, axis: v}})); }} />
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <input type="number" placeholder="0.00" min="0" step="0.25" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.od.add} onChange={e => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, add: e.target.value}}))} />
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.od.va} onChange={e => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, va: e.target.value}}))} />
                        </td>
                        <td className="p-2 border-s border-cream-border">
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.od.bcva} onChange={e => setOldPrescriptionData(prev => ({...prev, od: {...prev.od, bcva: e.target.value}}))} />
                        </td>
                      </tr>
                      {/* OS (Left View) */}
                      <tr>
                        <td className="p-2 font-bold text-blue-800 border-x border-cream-border">OS (L)</td>
                        <td className="p-2 border-x border-cream-border">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md" value={oldPrescriptionData.os.sph} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, os: {...prev.os, sph: v}})); }} />
                            <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, sphSign: prev.os.sphSign === "+" ? "-" : "+"}}))} className={cn("p-1 border rounded w-7 font-bold transition-colors", oldPrescriptionData.os.sphSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100")}>{oldPrescriptionData.os.sphSign}</button>
                          </div>
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <div className="flex items-center justify-center gap-1">
                            <input type="number" placeholder="0.00" min="0" max="20" step="0.25" className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md" value={oldPrescriptionData.os.cyl} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setOldPrescriptionData(prev => ({...prev, os: {...prev.os, cyl: v}})); }} />
                            <button type="button" onClick={() => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, cylSign: prev.os.cylSign === "+" ? "-" : "+"}}))} className={cn("p-1 border rounded w-7 font-bold transition-colors", oldPrescriptionData.os.cylSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100" : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100")}>{oldPrescriptionData.os.cylSign}</button>
                          </div>
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <input type="number" placeholder="0" min="1" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.os.axis} onChange={e => { let v = e.target.value; if (parseInt(v, 10) > 180) v = "180"; setOldPrescriptionData(prev => ({...prev, os: {...prev.os, axis: v}})); }} />
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <input type="number" placeholder="0.00" min="0" step="0.25" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.os.add} onChange={e => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, add: e.target.value}}))} />
                        </td>
                        <td className="p-2 border-x border-cream-border">
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.os.va} onChange={e => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, va: e.target.value}}))} />
                        </td>
                        <td className="p-2 border-s border-cream-border">
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded" value={oldPrescriptionData.os.bcva} onChange={e => setOldPrescriptionData(prev => ({...prev, os: {...prev.os, bcva: e.target.value}}))} />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="mt-4 flex max-w-xs">
                <div className="w-full">
                  <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">
                    {lang === "ar" ? "المسافة بين الحدقتين (IPD)" : "IPD"}
                  </label>
                  <input 
                    type="number" 
                    step="0.5" 
                    placeholder="e.g. 62.0"
                    className="w-full border px-3 py-2 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm" 
                    value={oldPrescriptionData.ipd || ""} 
                    onChange={e => setOldPrescriptionData(prev => ({...prev, ipd: e.target.value}))} 
                  />
                </div>
              </div>

              <div className="pt-6 flex gap-3">
                 <button 
                  type="submit"
                  className="px-8 py-2.5 bg-[#1a4a8d] text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:bg-blue-800 transition-all text-sm"
                >
                  {lang === "ar" ? "حفظ" : "Save"}
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOldPrescriptionModalOpen(false)}
                  className="px-8 py-2.5 bg-white text-ink border border-cream-border rounded-lg font-bold hover:bg-cream transition-all text-sm"
                >
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>,
        document.body
      )}

      {/* Print Template for Visit */}
      {printingVisit && selectedPatient && (
        <div id="print-area" className="hidden print:block p-8 bg-white text-ink font-serif absolute inset-0 z-[100]">
          <div className="border-b-2 border-burgundy pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-bold text-burgundy">نـور OMS</h1>
              <p className="text-xs tracking-widest text-ink-light uppercase">Noor Optical Management System</p>
            </div>
            <div className="text-end">
              <h2 className="text-xl font-bold uppercase tracking-tight">{t("financial_summary")}</h2>
              <p className="text-sm font-medium">{printingVisit.visit_date}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-12">
            <div className="space-y-4">
              <div className="border-b border-cream-border pb-2">
                <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest">{t("name")}</p>
                <p className="text-lg font-bold">{selectedPatient.full_name}</p>
              </div>
              <div className="border-b border-cream-border pb-2">
                <p className="text-[10px] font-bold text-burgundy uppercase tracking-widest">{t("phone")}</p>
                <p className="text-lg font-bold">{selectedPatient.phone}</p>
              </div>
            </div>
            <div className="flex flex-col justify-end items-end">
              <div className="p-4 bg-cream/30 rounded-xl border-2 border-burgundy/10 text-center min-w-[150px]">
                <p className="text-[10px] font-bold text-burgundy uppercase mb-1">{t("remaining")}</p>
                <p className="text-2xl font-bold text-rose-600">{formatIQD(printingVisit.remaining)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            <div className="p-6 bg-cream/30 rounded-2xl border border-cream-border">
              <h4 className="text-xs font-bold text-burgundy uppercase tracking-widest mb-3">{t("diagnosis_label")}</h4>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{printingVisit.diagnosis || "No specific diagnosis recorded"}</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border border-cream-border rounded-xl">
                <p className="text-[10px] font-bold text-ink-light uppercase mb-1">{t("total")}</p>
                <p className="text-xl font-bold font-mono">{formatIQD(printingVisit.total_amount)}</p>
              </div>
              <div className="p-4 border border-emerald-100 bg-emerald-50/30 rounded-xl">
                <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">{t("paid")}</p>
                <p className="text-xl font-bold font-mono text-emerald-700">+{formatIQD(printingVisit.amount_paid)}</p>
              </div>
              <div className="p-4 border border-rose-100 bg-rose-50/30 rounded-xl">
                <p className="text-[10px] font-bold text-rose-600 uppercase mb-1">{t("remaining")}</p>
                <p className="text-xl font-bold font-mono text-rose-700">{formatIQD(printingVisit.remaining)}</p>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-12 border-t-2 border-burgundy/10 flex justify-between">
            <div className="text-sm font-medium text-ink-light">
              <p>Baghdad, Iraq • +964 7XX XXX XXXX</p>
              <p>Thank you for choosing Noor Optical</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-1 bg-burgundy/10 mb-2 invisible print:visible" />
              <p className="text-[10px] font-bold text-burgundy uppercase">Official Clinic Stamp</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Up Debt Modal (Detail View) */}
      {topUpPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setTopUpPatientId(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="bg-emerald-600 p-6 text-white">
              <h2 className="text-xl font-serif font-bold">
                {lang === "ar" ? "تسديد الدين" : "Top Up Debt"}
              </h2>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                  {lang === "ar" ? "المبلغ (دينار)" : "Amount (IQD)"}
                </label>
                <input 
                  required
                  type="number" 
                  className="input-field w-full"
                  placeholder="0"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  max={patients.find(p => p.id === topUpPatientId)?.outstanding || 0}
                />
                <p className="text-xs text-ink-light px-1">
                  {lang === "ar" ? "أقصى مبلغ قابل للتسديد:" : "Maximum top up:"} {formatIQD(patients.find(p => p.id === topUpPatientId)?.outstanding || 0)}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setTopUpPatientId(null)}
                  className="flex-1 btn-outline"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit"
                  className="flex-[2] btn-burgundy bg-emerald-600 text-sm hover:shadow-emerald-600/30"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Patient Modal (Detail View) */}
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-burgundy p-6 text-white">
              <h2 className="text-xl font-serif font-bold">
                {editingPatientId ? t("edit") : t("add_patient")}
              </h2>
              <p className="text-xs text-white/60 uppercase tracking-widest font-bold mt-1">
                {editingPatientId ? t("patient_record") : "Create new clinical record"}
              </p>
            </div>

            <form onSubmit={handleSavePatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("name")}</label>
                  <input 
                    required
                    type="text" 
                    className="input-field w-full"
                    placeholder="Ali Mohammed"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("phone")}</label>
                  <input 
                    required
                    type="tel" 
                    className="input-field w-full font-mono text-sm"
                    placeholder="077XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("age")}</label>
                  <input 
                    type="number" 
                    className="input-field w-full"
                    placeholder="30"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("gender")}</label>
                  <select 
                    className="input-field w-full"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="male">{t("male")}</option>
                    <option value="female">{t("female")}</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
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

      </div>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{t("patients")}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            MANAGEMENT SYSTEM <span className="w-1 h-1 bg-cream-border rounded-full" /> {filteredPatients.length} MATCHING RECORDS
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="btn-burgundy px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20"
        >
          <UserPlus size={18} />
          <span>{t("add_patient")}</span>
        </button>
      </div>

      {/* Top Up Debt Modal */}
      {topUpPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setTopUpPatientId(null)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="bg-emerald-600 p-6 text-white">
              <h2 className="text-xl font-serif font-bold">
                {lang === "ar" ? "تسديد الدين" : "Top Up Debt"}
              </h2>
            </div>

            <form onSubmit={handleTopUpSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                  {lang === "ar" ? "المبلغ (دينار)" : "Amount (IQD)"}
                </label>
                <input 
                  required
                  type="number" 
                  className="input-field w-full"
                  placeholder="0"
                  value={topUpAmount}
                  onChange={e => setTopUpAmount(e.target.value)}
                  max={patients.find(p => p.id === topUpPatientId)?.outstanding || 0}
                />
                <p className="text-xs text-ink-light px-1">
                  {lang === "ar" ? "أقصى مبلغ قابل للتسديد:" : "Maximum top up:"} {formatIQD(patients.find(p => p.id === topUpPatientId)?.outstanding || 0)}
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setTopUpPatientId(null)}
                  className="flex-1 btn-outline"
                >
                  {t("cancel")}
                </button>
                <button 
                  type="submit"
                  className="flex-[2] btn-burgundy bg-emerald-600 text-sm hover:shadow-emerald-600/30"
                >
                  {t("save")}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Patient Modal */}
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-burgundy p-6 text-white">
              <h2 className="text-xl font-serif font-bold">
                {editingPatientId ? t("edit") : t("add_patient")}
              </h2>
              <p className="text-xs text-white/60 uppercase tracking-widest font-bold mt-1">
                {editingPatientId ? t("patient_record") : "Create new clinical record"}
              </p>
            </div>

            <form onSubmit={handleSavePatient} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("name")}</label>
                  <input 
                    required
                    type="text" 
                    className="input-field w-full"
                    placeholder="Ali Mohammed"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("phone")}</label>
                  <input 
                    required
                    type="tel" 
                    className="input-field w-full font-mono text-sm"
                    placeholder="077XXXXXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("age")}</label>
                  <input 
                    type="number" 
                    className="input-field w-full"
                    placeholder="30"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">{t("gender")}</label>
                  <select 
                    className="input-field w-full"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="male">{t("male")}</option>
                    <option value="female">{t("female")}</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
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

      {/* Filters Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative group">
            <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={t("search_placeholder")}
              className="w-full ps-12 pe-4 py-3 bg-white border-2 border-cream-border rounded-xl focus:border-burgundy focus:shadow-lg focus:shadow-burgundy/5 transition-all outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex bg-white border-2 border-cream-border rounded-xl overflow-hidden focus-within:border-burgundy transition-all">
              <select 
                value={patientSortField}
                onChange={(e) => setPatientSortField(e.target.value as any)}
                className="bg-transparent px-3 py-3 text-xs font-medium text-ink-mid outline-none cursor-pointer border-e border-cream-border"
              >
                <option value="last_visit">{t("last_visit")}</option>
                <option value="outstanding">{t("outstanding_debt") || "Debt"}</option>
              </select>
              <button 
                onClick={() => setPatientSortOrder(patientSortOrder === "desc" ? "asc" : "desc")}
                className="px-3 py-3 text-ink-mid flex items-center justify-center hover:text-burgundy hover:bg-burgundy-pale transition-all"
              >
                {patientSortOrder === "desc" ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Desktop / Cards Mobile */}
      <div className="card overflow-hidden bg-transparent border-none shadow-none">
        <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2.5 bg-white border border-cream-border border-b-0 rounded-t-2xl">
          <div className="col-span-3 text-[9px] font-bold text-ink-light uppercase tracking-widest">{t("name")}</div>
          <div className="col-span-2 text-[9px] font-bold text-ink-light uppercase tracking-widest">{t("phone")}</div>
          <div className="col-span-1 text-[9px] font-bold text-ink-light uppercase tracking-widest text-center">{t("age")}</div>
          <div className="col-span-1 text-[9px] font-bold text-ink-light uppercase tracking-widest text-center">{t("visits") || t("total_visits")}</div>
          <div className="col-span-1 text-[9px] font-bold text-ink-light uppercase tracking-widest text-center">{t("last_visit")}</div>
          <div className="col-span-2 text-[9px] font-bold text-ink-light uppercase tracking-widest text-end">{t("remaining")}</div>
          <div className="col-span-2" />
        </div>

        <div className="space-y-3 lg:space-y-0 lg:border lg:border-cream-border lg:rounded-b-2xl lg:bg-white/50 lg:divide-y lg:divide-cream-border">
          {filteredPatients.length > 0 ? filteredPatients.map((patient, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={patient.id}
              onClick={() => setSelectedPatientId(patient.id)}
              className="lg:grid lg:grid-cols-12 lg:gap-3 px-3 lg:px-4 py-3 lg:py-2 bg-white border border-cream-border lg:border-none rounded-xl lg:rounded-none items-center hover:bg-cream/50 transition-all group cursor-pointer relative shadow-sm lg:shadow-none pe-24 lg:pe-4"
            >

              {/* Name & Avatar */}
              <div className="col-span-3 flex items-center gap-2.5 mb-1.5 lg:mb-0">
                <div className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border",
                  patient.gender === 'female' ? "bg-burgundy-pale text-burgundy border-burgundy/20" : "bg-gold-pale text-gold border-gold/20"
                )}>
                  {patient.full_name[0]}
                </div>
                <div className="min-w-0 overflow-hidden">
                  <h4 className="text-sm font-bold text-ink truncate group-hover:text-burgundy transition-colors leading-tight">{patient.full_name}</h4>
                  <p className="text-[9px] font-bold text-ink-light lg:hidden flex items-center gap-1 uppercase tracking-tight mt-0.5">
                    <Clock size={8} className="shrink-0" /> {t("last_visit")}: {patient.last_visit} • {patient.visits?.length || 0}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="col-span-2 flex items-center gap-1.5 text-sm font-medium text-ink-mid mb-1.5 lg:mb-0">
                <div className="lg:hidden p-1 bg-cream rounded-md">
                  <Phone size={10} className="text-burgundy" />
                </div>
                <Phone size={10} className="hidden lg:block text-ink-light shrink-0" />
                <span className="font-mono text-xs pt-0.5">{patient.phone}</span>
              </div>


              {/* Age */}
              <div className="col-span-1 text-center hidden lg:block text-xs font-medium text-ink-mid">
                {patient.age}
              </div>

              {/* Visits */}
              <div className="col-span-1 text-center hidden lg:block text-xs font-bold text-burgundy">
                {patient.visits?.length || 0}
              </div>

              {/* Last Visit */}
              <div className="col-span-1 text-center hidden lg:block text-[9px] font-semibold text-ink-light uppercase tracking-tight">
                {patient.last_visit}
              </div>

              {/* Outstanding Debt */}
              <div className="col-span-2 text-start lg:text-end mb-2 lg:mb-0">
                <div className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-md text-xs sm:text-sm font-bold ring-1 ring-inset transition-all",
                  patient.outstanding > 0 
                  ? "bg-rose-50 text-rose-600 ring-rose-600/20" 
                  : "bg-emerald-50 text-emerald-600 ring-emerald-600/20"
                )}>
                  <span className="lg:hidden uppercase tracking-widest text-[10px] opacity-70 me-2 border-e border-current pe-2">{t("remaining")}</span>
                  {patient.outstanding > 0 ? formatIQD(patient.outstanding) : (lang === 'ar' ? 'لا يوجد ديون' : 'Paid')}
                </div>
              </div>


              {/* Action */}
              <div className="absolute top-1/2 -translate-y-1/2 end-3 lg:static lg:translate-y-0 lg:col-span-2 flex justify-end">
                <div className="flex gap-2 items-center lg:w-auto">
                   {patient.outstanding > 0 && (
                     <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTopUpPatientId(patient.id);
                          setTopUpAmount(patient.outstanding.toString());
                        }}
                        className="p-1.5 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        title={lang === "ar" ? "تسديد" : "Top Up"}
                     >
                       <Banknote size={18} />
                     </button>
                   )}
                   <button 
                    onClick={(e) => openEditModal(e, patient)}
                    className="p-1.5 text-ink-light hover:text-burgundy hover:bg-burgundy-pale rounded-md transition-colors"
                   >
                    <Pencil size={18} />
                   </button>
                   <button 
                    onClick={(e) => handleDeletePatient(e, patient)}
                    className="p-1.5 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                  >
                    <Trash2 size={18} />
                   </button>
                   <button className="hidden lg:flex p-1.5 text-ink-light hover:text-burgundy hover:bg-burgundy-pale rounded-md transition-all">
                    <ChevronRight size={18} className={cn("transition-transform", lang === "ar" ? "rotate-180 group-hover:-translate-x-1" : "group-hover:translate-x-1")} />
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="p-12 text-center text-ink-light py-20 flex flex-col items-center gap-4 bg-white rounded-xl lg:rounded-none">
              <div className="w-16 h-16 bg-cream flex items-center justify-center rounded-full">
                <Search size={32} className="opacity-20" />
              </div>
              <div>
                <h3 className="font-bold text-ink">{t("no_data")}</h3>
                <p className="text-sm">Try searching for a different name or phone number.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

