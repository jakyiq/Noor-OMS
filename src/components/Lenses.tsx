import React, { useState, useMemo } from "react";
import { 
  Disc, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle,
  Layers,
  Settings2,
  Save,
  Wand2,
  Trash2,
  Copy,
  Edit2
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { LensItem, LensCatalog, CatalogItem } from "../types";
import { useScrollLock } from "../hooks/useScrollLock";

export function Lenses() {
  const { t, lang } = useClinic();
  
  const [lensCatalog, setLensCatalog] = useState<LensCatalog>({
    type: [
      { label: "Single Vision", value: "single_vision", is_active: true },
      { label: "Bifocal", value: "bifocal", is_active: true },
      { label: "Progressive", value: "progressive", is_active: true }
    ],
    material: [
      { label: "CR-39", value: "cr39", is_active: true },
      { label: "Polycarbonate", value: "polycarbonate", is_active: true },
      { label: "High Index 1.6", value: "high_index_16", is_active: true },
      { label: "High Index 1.67", value: "high_index_167", is_active: true }
    ],
    coating: [
      { label: "Uncoated", value: "uncoated", is_active: true },
      { label: "Anti-Reflective", value: "ar", is_active: true },
      { label: "Blue Control", value: "blue_control", is_active: true },
      { label: "Photochromic", value: "photochromic", is_active: true }
    ],
    frame_type: [],
    frame_material: []
  });

  const [lenses, setLenses] = useState<LensItem[]>([
    { id: "1", lens_type: "single_vision", material: "cr39", coating: "ar", sphere: -1.5, cylinder: -0.5, quantity: 15, min_stock: 4, cost_price: 5000, sell_price: 15000 },
    { id: "2", lens_type: "bifocal", material: "polycarbonate", coating: "uncoated", sphere: +2.0, cylinder: 0, quantity: 2, min_stock: 5, cost_price: 10000, sell_price: 25000 },
    { id: "3", lens_type: "single_vision", material: "cr39", coating: "blue_control", sphere: -0.5, cylinder: -1.25, quantity: 0, min_stock: 2, cost_price: 8000, sell_price: 20000 },
  ]);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);

  useScrollLock(isWizardOpen || isAddEditOpen);
  
  // Wizard State
  const [wizTypes, setWizTypes] = useState<string[]>(["single_vision"]);
  const [wizMaterials, setWizMaterials] = useState<string[]>(["cr39"]);
  const [wizCoatings, setWizCoatings] = useState<string[]>(["uncoated"]);
  const [typeFilter, setTypeFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [sphFilter, setSphFilter] = useState("");
  const [cylFilter, setCylFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const filteredLenses = useMemo(() => {
    return lenses.filter(l => {
      if (typeFilter && l.lens_type !== typeFilter) return false;
      if (materialFilter && l.material !== materialFilter) return false;
      if (sphFilter !== "" && l.sphere !== parseFloat(sphFilter)) return false;
      if (cylFilter !== "" && (l.cylinder || 0) !== parseFloat(cylFilter)) return false;
      
      if (stockFilter === "low" && l.quantity > l.min_stock) return false;
      if (stockFilter === "out" && l.quantity !== 0) return false;
      return true;
    });
  }, [lenses, typeFilter, materialFilter, sphFilter, cylFilter, stockFilter]);

  const lowStockLenses = useMemo(() => lenses.filter(l => l.quantity <= l.min_stock).slice(0, 40), [lenses]);

  const getLabel = (cat: keyof LensCatalog, val: string) => {
    const item = lensCatalog[cat].find(c => c.value === val);
    return item ? item.label : val.replace(/_/g, " ");
  };

  const toggleSelection = (setter: React.Dispatch<React.SetStateAction<string[]>>, current: string[], value: string) => {
    if (current.includes(value)) setter(current.filter(v => v !== value));
    else setter([...current, value]);
  };

  const handleDuplicate = (l: LensItem) => {
    // Mock open modal with pre-filled form
    alert(`Duplicating ${l.lens_type} (not fully implemented in mock)`);
  };

  const handleDelete = (id: string) => {
    if (confirm(lang === 'ar' ? 'حذف هذه العدسة؟' : 'Delete lens?')) {
      setLenses(lenses.filter(x => x.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{t("lenses")}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            CATALOG & INVENTORY <span className="w-1 h-1 bg-cream-border rounded-full" /> {lenses.length} LENSES
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setIsWizardOpen(true)} className="btn-secondary px-4 py-3 flex items-center gap-2 border border-cream-border">
            <Wand2 size={16} />
            <span className="hidden sm:inline">{lang === 'ar' ? 'معالج العدسات' : 'Lens Wizard'}</span>
          </button>
          <button className="btn-burgundy px-4 sm:px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20">
            <Plus size={18} />
            <span>{t("add_item")}</span>
          </button>
        </div>
      </div>

      {lowStockLenses.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-amber-50 border-2 border-amber-100/50 rounded-2xl p-4 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest">{lang === 'ar' ? 'تنبيه: مخزون منخفض' : 'Low Stock Alert'}</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {lowStockLenses.map(l => (
              <span key={l.id} className="bg-amber-100/50 text-amber-900 px-3 py-1.5 rounded-full border border-amber-200/50 font-bold">
                SPH {l.sphere > 0 ? `+${l.sphere}` : l.sphere} CYL {l.cylinder || 0} — {l.quantity} {t("qty")}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-cream-border shadow-sm flex flex-wrap gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field max-w-[140px] text-sm py-2">
          <option value="">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
          {lensCatalog.type.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value)} className="input-field max-w-[150px] text-sm py-2">
          <option value="">{lang === 'ar' ? 'جميع المواد' : 'All Materials'}</option>
          {lensCatalog.material.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <div className="flex gap-2">
          <input type="number" step="0.25" placeholder="SPH" value={sphFilter} onChange={e => setSphFilter(e.target.value)} className="input-field w-20 text-center font-mono py-2 text-sm" />
          <input type="number" step="0.25" placeholder="CYL" value={cylFilter} onChange={e => setCylFilter(e.target.value)} className="input-field w-20 text-center font-mono py-2 text-sm" />
        </div>
        <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="input-field max-w-[140px] text-sm py-2">
          <option value="">{lang === 'ar' ? 'مستوى المخزون' : 'Stock Level'}</option>
          <option value="low">{lang === 'ar' ? 'منخفض' : 'Low Stock Only'}</option>
          <option value="out">{t("out")}</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
        <div className="hidden lg:grid grid-cols-12 gap-3 px-6 py-4 bg-cream/50 border-b border-cream-border items-center">
          <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest">{t("name")}</div>
          <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest">{t("material")}</div>
          <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest">Coating</div>
          <div className="col-span-1 text-[10px] font-bold text-ink-light uppercase tracking-widest">SPH</div>
          <div className="col-span-1 text-[10px] font-bold text-ink-light uppercase tracking-widest">CYL</div>
          <div className="col-span-1 text-[10px] font-bold text-ink-light uppercase tracking-widest">{t("qty")}</div>
          <div className="col-span-1 text-[10px] font-bold text-ink-light uppercase tracking-widest">Status</div>
          <div className="col-span-2 text-end"></div>
        </div>

        <div className="divide-y divide-cream-border">
          {filteredLenses.length > 0 ? filteredLenses.map((l, idx) => {
            const isOut = l.quantity === 0;
            const isLow = !isOut && l.quantity <= l.min_stock;
            return (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.02 }}
                key={l.id} 
                className={cn("lg:grid grid-cols-12 gap-3 px-6 py-3 items-center hover:bg-cream/30 transition-all", isOut ? "bg-rose-50/20" : "")}
              >
                <div className="col-span-2 font-bold text-sm text-ink">{getLabel('type', l.lens_type)}</div>
                <div className="col-span-2 text-sm text-ink-mid">{getLabel('material', l.material)}</div>
                <div className="col-span-2 text-sm text-ink-mid">{getLabel('coating', l.coating)}</div>
                <div className="col-span-1 font-mono text-sm">{l.sphere > 0 ? `+${l.sphere}` : l.sphere}</div>
                <div className="col-span-1 font-mono text-sm">{l.cylinder || 0}</div>
                <div className="col-span-1 font-mono text-sm font-bold">{l.quantity}</div>
                <div className="col-span-1">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                    isOut ? "bg-rose-100 text-rose-700" :
                    isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {isOut ? t("out") : isLow ? t("low") : 'OK'}
                  </span>
                </div>
                <div className="col-span-2 flex justify-end gap-2">
                  <button className="p-2 text-ink-light hover:text-burgundy hover:bg-cream rounded-lg transition-colors border border-transparent hover:border-cream-border" title="Restock">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => handleDuplicate(l)} className="p-2 text-ink-light hover:text-burgundy hover:bg-cream rounded-lg transition-colors border border-transparent hover:border-cream-border" title="Duplicate">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => handleDelete(l.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )
          }) : (
            <div className="p-12 text-center text-ink-light py-20 flex flex-col items-center gap-4 bg-white">
              <div className="w-16 h-16 bg-cream flex items-center justify-center rounded-full">
                <Disc size={32} className="opacity-20" />
              </div>
              <h3 className="font-bold text-ink">{t("no_data")}</h3>
            </div>
          )}
        </div>
      </div>
      
      {/* Wizard Modal mock */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 lg:p-8 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white sm:rounded-3xl lg:rounded-[2rem] w-full h-full sm:h-auto max-w-5xl shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 md:px-5 lg:px-8 lg:py-6 border-b border-cream-border bg-cream/30 shrink-0">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-burgundy/10 text-burgundy rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0">
                  <Wand2 size={20} className="lg:w-6 lg:h-6" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl lg:text-2xl font-serif font-bold text-ink leading-tight">Lens Matrix Wizard</h2>
                  <p className="text-[9px] md:text-[10px] lg:text-xs text-ink-light font-bold uppercase tracking-widest mt-0.5 lg:mt-1">Bulk Generate Inventory Combinations</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWizardOpen(false)} 
                className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-ink-light hover:text-burgundy hover:bg-burgundy/10 rounded-full transition-colors shrink-0 bg-cream lg:bg-transparent"
              >
                &times;
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                
                {/* Left Column: Properties */}
                <div className="lg:col-span-5 space-y-6 lg:space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-3 lg:mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-burgundy" /> Target Properties
                    </h3>
                    
                    <div className="space-y-5 lg:space-y-6 bg-cream/30 p-4 rounded-2xl border border-cream-border lg:bg-transparent lg:p-0 lg:rounded-none lg:border-none">
                      {/* Types */}
                      <div>
                        <label className="block text-[10px] lg:text-xs font-bold text-ink-light uppercase tracking-widest mb-2 5 lg:mb-3">
                          1. Lens Types (Select multiple)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {lensCatalog.type.map(t => (
                            <button
                              key={t.value}
                              onClick={() => toggleSelection(setWizTypes, wizTypes, t.value)}
                              className={cn(
                                "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all border-2",
                                wizTypes.includes(t.value)
                                  ? "bg-burgundy text-white border-burgundy shadow-md shadow-burgundy/20"
                                  : "bg-white text-ink-mid border-cream-border hover:border-burgundy/30 hover:bg-cream"
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Materials */}
                      <div>
                        <label className="block text-[10px] lg:text-xs font-bold text-ink-light uppercase tracking-widest mb-2.5 lg:mb-3 mt-4 lg:mt-0">
                          2. Materials
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {lensCatalog.material.map(t => (
                            <button
                              key={t.value}
                              onClick={() => toggleSelection(setWizMaterials, wizMaterials, t.value)}
                              className={cn(
                                "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all border-2",
                                wizMaterials.includes(t.value)
                                  ? "bg-burgundy text-white border-burgundy shadow-md shadow-burgundy/20"
                                  : "bg-white text-ink-mid border-cream-border hover:border-burgundy/30 hover:bg-cream"
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Coatings */}
                      <div>
                        <label className="block text-[10px] lg:text-xs font-bold text-ink-light uppercase tracking-widest mb-2.5 lg:mb-3 mt-4 lg:mt-0">
                          3. Coatings
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {lensCatalog.coating.map(t => (
                            <button
                              key={t.value}
                              onClick={() => toggleSelection(setWizCoatings, wizCoatings, t.value)}
                              className={cn(
                                "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all border-2",
                                wizCoatings.includes(t.value)
                                  ? "bg-burgundy text-white border-burgundy shadow-md shadow-burgundy/20"
                                  : "bg-white text-ink-mid border-cream-border hover:border-burgundy/30 hover:bg-cream"
                              )}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Ranges */}
                <div className="lg:col-span-7 space-y-6 lg:space-y-8 lg:border-l lg:border-cream-border pt-4 lg:pt-0 lg:pl-12 border-t border-cream-border lg:border-t-0">
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-3 lg:mb-4 flex items-center gap-2">
                      <Settings2 size={16} className="text-burgundy" /> Power Ranges & Defaults
                    </h3>

                    <div className="space-y-4 lg:space-y-6">
                      {/* SPH Range */}
                      <div className="bg-cream/30 border border-cream-border rounded-xl lg:rounded-2xl p-4 lg:p-5">
                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold font-mono text-xs lg:text-sm">S</div>
                          <h4 className="font-bold text-ink text-sm lg:text-base">Sphere (SPH)</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Start</label>
                            <input type="number" step="0.25" defaultValue="0" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">End</label>
                            <input type="number" step="0.25" defaultValue="-4" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Step</label>
                            <input type="number" step="0.25" defaultValue="0.25" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg bg-cream/50 px-1 sm:px-3" />
                          </div>
                        </div>
                      </div>

                      {/* CYL Range */}
                      <div className="bg-cream/30 border border-cream-border rounded-xl lg:rounded-2xl p-4 lg:p-5">
                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold font-mono text-xs lg:text-sm">C</div>
                          <h4 className="font-bold text-ink text-sm lg:text-base">Cylinder (CYL)</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Start</label>
                            <input type="number" step="0.25" defaultValue="0" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">End</label>
                            <input type="number" step="0.25" defaultValue="-2" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Step</label>
                            <input type="number" step="0.25" defaultValue="0.25" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg bg-cream/50 px-1 sm:px-3" />
                          </div>
                        </div>
                      </div>

                      {/* Defaults */}
                      <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="bg-emerald-50/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-emerald-100 overflow-hidden flex flex-col justify-center">
                          <label className="block text-[10px] lg:text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1.5 lg:mb-2 ml-1 text-center sm:text-left">Default Qty</label>
                          <input type="number" defaultValue="2" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white" />
                        </div>
                        <div className="bg-amber-50/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-amber-100 overflow-hidden flex flex-col justify-center">
                          <label className="block text-[10px] lg:text-xs font-bold text-amber-800 uppercase tracking-widest mb-1.5 lg:mb-2 ml-1 text-center sm:text-left">Min Stock Alert</label>
                          <input type="number" defaultValue="1" className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-5 lg:px-8 py-4 lg:py-5 border-t border-cream-border bg-cream/30 flex flex-col md:flex-row items-center justify-between gap-3 lg:gap-4 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-5">
              <div className="text-[10px] md:text-xs lg:text-sm font-medium text-ink-mid text-center md:text-left">
                Will generate approximately <strong className="text-burgundy font-bold text-sm md:text-base lg:text-lg font-mono">153</strong> lens entries.
              </div>
              <div className="flex flex-row gap-2 sm:gap-3 w-full md:w-auto">
                <button onClick={() => setIsWizardOpen(false)} className="btn-secondary flex-1 md:flex-none py-2.5 lg:py-3 px-4 lg:px-6 text-xs sm:text-sm whitespace-nowrap">Cancel</button>
                <button 
                  onClick={() => { setIsWizardOpen(false); alert('Generated 153 lens rows!'); }} 
                  className="btn-primary flex-1 md:flex-none py-2.5 lg:py-3 px-4 lg:px-8 shadow-lg shadow-burgundy/20 text-xs sm:text-sm whitespace-nowrap"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
