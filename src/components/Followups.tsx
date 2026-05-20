import React, { useMemo, useEffect, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { CalendarClock, Search, MessageCircle } from "lucide-react";
import { motion } from "motion/react";

export function Followups() {
  const { t, lang, clinic, setFollowupCount, patients } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const followups = useMemo(() => {
    const list: any[] = [];
    patients.forEach((p: any) => {
      if (p.visits && p.visits.length > 0) {
        // Collect all visits with next_visit_date or just the most recent?
        // Usually follow-ups are based on the latest visit or any visit that has a future/upcoming next_visit_date
        // Let's just grab the most recent visit if it has a next_visit_date, or all visits with a next_visit_date
        p.visits.forEach((v: any) => {
          if (v.next_visit_date) {
            list.push({
              patient_id: p.id,
              patient_name: p.full_name,
              lens_type: v.lens_type || (p.prescriptions ? p.prescriptions[0]?.lens_type : "Diagnosis: " + (v.diagnosis || "-")),
              frame_brand: v.frame_brand || "-",
              remaining: p.outstanding || 0,
              od_sphere: p.prescriptions ? p.prescriptions[0]?.od?.sph : "-",
              od_cylinder: p.prescriptions ? p.prescriptions[0]?.od?.cyl : "-",
              od_axis: p.prescriptions ? p.prescriptions[0]?.od?.axis : "-",
              os_sphere: p.prescriptions ? p.prescriptions[0]?.os?.sph : "-",
              os_cylinder: p.prescriptions ? p.prescriptions[0]?.os?.cyl : "-",
              os_axis: p.prescriptions ? p.prescriptions[0]?.os?.axis : "-",
              patient_phone: p.phone,
              visit_date: v.visit_date,
              next_visit_date: v.next_visit_date
            });
          }
        });
      }
    });

    // For demonstration, include the original mock data if empty, but we actually want dynamic data only.
    // wait, we have some mocked visits in Patients.tsx but they don't have next_visit_date, so list will be empty
    // unless we check for it. Let's make sure our mock in ClinicContext has next_visit_dates where appropriate if needed.
    return list;
  }, [patients]);

  const processedData = useMemo(() => {
    const today = new Date();
    return followups.map(item => {
      const nextDate = new Date(item.next_visit_date);
      const days_until = differenceInDays(nextDate, today);
      return { ...item, days_until };
    }).sort((a, b) => a.days_until - b.days_until);
  }, [followups]);

  useEffect(() => {
    const count = processedData.filter(d => d.days_until <= 7).length;
    setFollowupCount(count);
  }, [processedData, setFollowupCount]);

  const filteredData = useMemo(() => {
    return processedData.filter(f => 
      f.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      f.patient_phone.includes(searchTerm)
    );
  }, [processedData, searchTerm]);

  const handleSendWA = (patient_id: string, next_visit_date: string, patient_name: string, phone: string) => {
    if (!phone) {
      alert("No phone number");
      return;
    }
    const tpl = clinic?.wa_template_1 || "Hello {patient_name}, this is a reminder for your follow-up on {next_visit} from {clinic_name}.";
    const msg = tpl
      .replace(/{patient_name}/g, patient_name)
      .replace(/{date}/g, format(new Date(), "yyyy-MM-dd"))
      .replace(/{next_visit}/g, next_visit_date)
      .replace(/{clinic_name}/g, clinic?.name || "Clinic");
    
    let waPhone = phone;
    if (waPhone.startsWith('0')) {
      waPhone = '+964' + waPhone.substring(1);
    }
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{t("followups")}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            MESSAGING & REMINDERS <span className="w-1 h-1 bg-cream-border rounded-full" /> {processedData.filter(d => d.days_until <= 7).length} UPCOMING
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-2">
          <div className="flex items-center gap-3 w-full md:w-auto flex-1">
            <div 
              className={cn(
                "relative group transition-all duration-300 ease-in-out h-full flex items-center",
                isSearchExpanded || searchTerm ? "w-full md:w-80" : "w-[46px]"
              )}
              onMouseEnter={() => setIsSearchExpanded(true)}
              onMouseLeave={() => {
                if (!searchTerm && document.activeElement?.id !== 'followups-search') {
                  setIsSearchExpanded(false);
                }
              }}
            >
              <div className={cn(
                "absolute inset-0 bg-white border-2 rounded-xl transition-all duration-300",
                isSearchExpanded || searchTerm ? "border-burgundy shadow-lg shadow-burgundy/5" : "border-cream-border hover:border-burgundy/50 cursor-pointer"
              )} onClick={() => { setIsSearchExpanded(true); setTimeout(() => document.getElementById('followups-search')?.focus(), 50); }} />
              <Search 
                className={cn(
                  "absolute start-3.5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none",
                  isSearchExpanded || searchTerm ? "text-burgundy" : "text-ink-light group-hover:text-burgundy"
                )} 
                size={18} 
              />
              <input 
                id="followups-search"
                type="text" 
                placeholder={isSearchExpanded || searchTerm ? (lang === 'ar' ? "البحث عن مراجع..." : "Search patient...") : ""}
                className={cn(
                  "w-full h-full min-h-[46px] ps-10 pe-4 bg-transparent transition-all outline-none text-sm relative z-10",
                  isSearchExpanded || searchTerm ? "opacity-100" : "opacity-0 cursor-pointer w-[46px]"
                )}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={() => {
                  if (!searchTerm) setIsSearchExpanded(false);
                }}
              />
            </div>
            <div className={cn("hidden md:block flex-1 transition-all", isSearchExpanded || searchTerm ? "w-0" : "w-auto")} />
          </div>
        </div>
      </div>

      <div className="card border-none bg-transparent shadow-none lg:bg-white lg:border lg:border-cream-border lg:shadow-sm overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-cream border-b border-cream-border transition-all">
          <div className="col-span-3 text-[10px] font-bold text-ink-light uppercase tracking-widest">{t("name")}</div>
          <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest">{t("phone")}</div>
          <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? "آخر زيارة" : "Last Visit"}</div>
          <div className="col-span-1 text-[10px] font-bold text-ink-light uppercase tracking-widest">{lang === 'ar' ? "الزيارة القادمة" : "Next Visit"}</div>
          <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest text-center">{lang === 'ar' ? "الأيام المتبقية" : "Days Left"}</div>
          <div className="col-span-2" />
        </div>

        <div className="space-y-4 lg:space-y-0 divide-y divide-cream-border lg:bg-white">
          {filteredData.length > 0 ? filteredData.map((item, idx) => {
            const isOverdue = item.days_until < 0;
            const isSoon = item.days_until >= 0 && item.days_until <= 3;
            const label = isOverdue 
              ? `${Math.abs(item.days_until)} ${lang === 'ar' ? 'أيام متأخرة' : 'days overdue'}`
              : item.days_until === 0 
                ? (lang === 'ar' ? 'اليوم' : 'Today') 
                : `${item.days_until} ${lang === 'ar' ? 'يوم' : 'days'}`;

            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={`${item.patient_id}-${item.visit_date}-${idx}`}
                className="lg:grid lg:grid-cols-12 lg:gap-4 px-4 lg:px-6 py-5 lg:py-4 bg-white border border-cream-border lg:border-none rounded-2xl lg:rounded-none items-center hover:bg-cream/50 transition-all relative shadow-sm lg:shadow-none"
              >
                <div className="col-span-3 flex flex-col justify-center mb-3 lg:mb-0">
                  <h4 className="text-sm font-bold text-ink leading-tight">{item.patient_name}</h4>
                  <div className="text-[10px] font-bold text-ink-light uppercase tracking-widest mt-1">
                    {item.lens_type} {item.frame_brand && `· ${item.frame_brand}`} 
                    {item.remaining > 0 && ` · ${formatIQD(item.remaining)} ${t("remaining")}`}
                    <br />
                    OD {item.od_sphere} / {item.od_cylinder} × {item.od_axis} · OS {item.os_sphere} / {item.os_cylinder} × {item.os_axis}
                  </div>
                </div>

                <div className="col-span-2 flex items-center lg:block text-sm font-medium text-ink-mid mb-2 lg:mb-0">
                  <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-ink-light me-2">{t("phone")}:</span>
                  <span className="font-mono text-xs">{item.patient_phone}</span>
                </div>

                <div className="col-span-2 flex items-center lg:block text-xs font-semibold text-ink-light mb-2 lg:mb-0">
                  <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-ink-light me-2">{lang === 'ar' ? "آخر زيارة" : "Last Visit"}:</span>
                  {item.visit_date}
                </div>

                <div className="col-span-1 flex items-center lg:block text-xs font-semibold text-burgundy mb-2 lg:mb-0">
                  <span className="lg:hidden text-[10px] font-bold uppercase tracking-widest text-ink-light me-2">{lang === 'ar' ? "القادمة" : "Next"}:</span>
                  {item.next_visit_date}
                </div>

                <div className="col-span-2 flex justify-start lg:justify-center mb-4 lg:mb-0">
                  <span className={cn(
                    "px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ring-1 ring-inset",
                    isOverdue ? "bg-rose-50 text-rose-600 ring-rose-600/20" : 
                    isSoon ? "bg-amber-50 text-amber-600 ring-amber-600/20" : 
                    "bg-emerald-50 text-emerald-600 ring-emerald-600/20"
                  )}>
                    {label}
                  </span>
                </div>

                <div className="col-span-2 flex justify-end">
                  <button 
                    onClick={() => handleSendWA(item.patient_id, item.next_visit_date, item.patient_name, item.patient_phone)}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </button>
                </div>
              </motion.div>
            )
          }) : (
            <div className="p-12 text-center text-ink-light py-20 flex flex-col items-center gap-4 bg-white rounded-xl lg:rounded-none">
              <div className="w-16 h-16 bg-cream flex items-center justify-center rounded-full">
                <CalendarClock size={32} className="opacity-20" />
              </div>
              <h3 className="font-bold text-ink">{t("no_data")}</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
