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
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Zap
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { LensItem, LensCatalog, CatalogItem } from "../types";
import { useScrollLock } from "../hooks/useScrollLock";

export function Lenses() {
  const { t, lang, lensCatalog, setLensCatalog, lenses, setLenses } = useClinic();

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isFlushConfirmOpen, setIsFlushConfirmOpen] = useState(false);
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingLens, setEditingLens] = useState<LensItem | null>(null);

  const [addLensData, setAddLensData] = useState({
    lens_type: lensCatalog?.type?.[0]?.value || "Single Vision",
    material: lensCatalog?.material?.[0]?.value || "Plastic (CR-39)",
    coating: lensCatalog?.coating?.[0]?.value || "Clear",
    sph: "",
    sphSign: "+",
    cyl: "",
    cylSign: "+",
    quantity: 10,
    min_stock: 2,
    cost_price: 5000,
    sell_price: 15000
  });

  const handleOpenAdd = () => {
    setEditingLens(null);
    setAddLensData({
      lens_type: lensCatalog?.type?.[0]?.value || "Single Vision", 
      material: lensCatalog?.material?.[0]?.value || "Plastic (CR-39)", 
      coating: lensCatalog?.coating?.[0]?.value || "Clear",
      sph: "", sphSign: "+", cyl: "", cylSign: "+", quantity: 10, min_stock: 2, cost_price: 5000, sell_price: 15000
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (l: LensItem) => {
    setEditingLens(l);
    setAddLensData({
      lens_type: l.lens_type,
      material: l.material,
      coating: l.coating,
      sph: Math.abs(l.sphere).toString(),
      sphSign: l.sphere < 0 ? "-" : "+",
      cyl: Math.abs(l.cylinder || 0).toString(),
      cylSign: (l.cylinder || 0) < 0 ? "-" : "+",
      quantity: l.quantity,
      min_stock: l.min_stock,
      cost_price: l.cost_price,
      sell_price: l.sell_price
    });
    setIsAddEditOpen(true);
  };

  const handleSaveAddEdit = () => {
    const sphVal = parseFloat(addLensData.sph) || 0;
    const cylVal = parseFloat(addLensData.cyl) || 0;
    
    const finalSph = addLensData.sphSign === "-" ? -sphVal : sphVal;
    const finalCyl = addLensData.cylSign === "-" ? -cylVal : cylVal;

    if (editingLens) {
      setLenses(prev => prev.map(l => l.id === editingLens.id ? {
        ...l,
        lens_type: addLensData.lens_type,
        material: addLensData.material,
        coating: addLensData.coating,
        sphere: finalSph,
        cylinder: finalCyl,
        quantity: addLensData.quantity,
        min_stock: addLensData.min_stock,
        cost_price: addLensData.cost_price,
        sell_price: addLensData.sell_price
      } : l));
    } else {
      setLenses(prev => [{
        id: Math.random().toString(36).substring(7),
        lens_type: addLensData.lens_type,
        material: addLensData.material,
        coating: isContact(addLensData.lens_type) ? 'Clear' : addLensData.coating,
        sphere: finalSph,
        cylinder: finalCyl,
        quantity: addLensData.quantity,
        min_stock: addLensData.min_stock,
        cost_price: addLensData.cost_price,
        sell_price: addLensData.sell_price
      }, ...prev]);
    }
    setIsAddEditOpen(false);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [restockLens, setRestockLens] = useState<LensItem | null>(null);
  const [restockAmount, setRestockAmount] = useState(10);
  const [isLowStockCollapsed, setIsLowStockCollapsed] = useState(true);

  useScrollLock(isWizardOpen || isAddEditOpen || !!deleteConfirmId || !!restockLens);
  
  // Wizard State
  // Helpers for flexible lens type checks
  const isContact = (t: string) => (t || "").toLowerCase().includes("contact");
  const isPlano = (t: string) => (t || "").toLowerCase().includes("plano");

  const [wizTypes, setWizTypes] = useState<string[]>(() => lensCatalog?.type?.[0] ? [lensCatalog.type[0].value] : []);
  const [wizMaterials, setWizMaterials] = useState<string[]>(() => lensCatalog?.material?.[0] ? [lensCatalog.material[0].value] : []);
  const [wizCoatings, setWizCoatings] = useState<string[]>(() => lensCatalog?.coating?.[0] ? [lensCatalog.coating[0].value] : []);
  
  const [wizSphStart, setWizSphStart] = useState(0);
  const [wizSphEnd, setWizSphEnd] = useState(-4);
  const [wizSphStep, setWizSphStep] = useState(0.25);
  
  const [wizCylStart, setWizCylStart] = useState(0);
  const [wizCylEnd, setWizCylEnd] = useState(-2);
  const [wizCylStep, setWizCylStep] = useState(0.25);
  
  const [wizDefaultQty, setWizDefaultQty] = useState(2);
  const [wizMinStock, setWizMinStock] = useState(1);
  const [wizClearExisting, setWizClearExisting] = useState(false);
  
  const generatedSphCount = Math.floor(Math.abs(wizSphEnd - wizSphStart) / Math.abs(wizSphStep || 0.25)) + 1;
  const generatedCylCount = Math.floor(Math.abs(wizCylEnd - wizCylStart) / Math.abs(wizCylStep || 0.25)) + 1;
  const baseCount = Math.max(0, generatedSphCount) * Math.max(0, generatedCylCount);
  
  const estimatedCount = wizTypes.reduce((acc, t) => {
    const matMult = isContact(t) ? 1 : Math.max(1, wizMaterials.length);
    const coatMult = isContact(t) ? 1 : Math.max(1, wizCoatings.length);
    const countMult = isPlano(t) ? 1 : baseCount;
    return acc + (countMult * matMult * coatMult);
  }, 0);

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

  const confirmDelete = () => {
    if (!deleteConfirmId) return;
    setLenses(lenses.filter(x => x.id !== deleteConfirmId));
    setDeleteConfirmId(null);
  };

  const handleWizardSubmit = () => {
    const newLenses: LensItem[] = [];
    
    // Validate range direction
    const sphStart = Math.max(wizSphStart, wizSphEnd);
    const sphEnd = Math.min(wizSphStart, wizSphEnd);
    const cylStart = Math.max(wizCylStart, wizCylEnd);
    const cylEnd = Math.min(wizCylStart, wizCylEnd);
    const sphStep = Math.abs(wizSphStep) || 0.25;
    const cylStep = Math.abs(wizCylStep) || 0.25;

    for (const t of wizTypes) {
      const activeMaterials = isContact(t) ? ['Plastic (CR-39)'] : wizMaterials;
      const activeCoatings = isContact(t) ? ['Clear'] : wizCoatings;

      for (const m of activeMaterials) {
        for (const c of activeCoatings) {
          if (isPlano(t)) {
            newLenses.push({
              id: Math.random().toString(36).substring(7),
              lens_type: t,
              material: m,
              coating: c,
              sphere: 0,
              cylinder: 0,
              quantity: wizDefaultQty,
              min_stock: wizMinStock,
              cost_price: 5000,
              sell_price: 15000,
            });
            continue;
          }

          // Loop from min to max, generating SPH
          for (let s = sphStart; s >= sphEnd; s -= sphStep) {
            for (let cy = cylStart; cy >= cylEnd; cy -= cylStep) {
              newLenses.push({
                id: Math.random().toString(36).substring(7),
                lens_type: t,
                material: m,
                coating: c,
                sphere: Number(s.toFixed(2)),
                cylinder: Number(cy.toFixed(2)),
                quantity: wizDefaultQty,
                min_stock: wizMinStock,
                cost_price: 5000,
                sell_price: 15000
              });
            }
          }
        }
      }
    }

    setLenses(prev => wizClearExisting ? newLenses : [...newLenses, ...prev]);
    setIsWizardOpen(false);
    setWizClearExisting(false);
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
          {lenses.length > 0 && (
            <button 
              onClick={() => setIsFlushConfirmOpen(true)} 
              className="px-4 py-3 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 font-bold hover:bg-rose-100 hover:text-rose-750 transition-all shadow-sm"
              title={lang === "ar" ? "حذف جميع العدسات الحالية" : "Delete all current lenses"}
            >
              <Trash2 size={16} />
              <span className="hidden md:inline">{lang === "ar" ? "تفريغ المستودع" : "Clear Catalog"}</span>
            </button>
          )}
          <button onClick={() => {
            setWizTypes(lensCatalog?.type?.[0] ? [lensCatalog.type[0].value] : []);
            setWizMaterials(lensCatalog?.material?.[0] ? [lensCatalog.material[0].value] : []);
            setWizCoatings(lensCatalog?.coating?.[0] ? [lensCatalog.coating[0].value] : []);
            setIsWizardOpen(true);
          }} className="px-4 py-3 flex items-center gap-2 rounded-xl bg-gradient-to-r from-burgundy/10 to-burgundy/5 border border-burgundy/20 text-burgundy font-bold hover:from-burgundy/20 hover:to-burgundy/10 transition-all shadow-sm">
            <Sparkles size={16} className="text-burgundy drop-shadow-sm" />
            <span className="hidden sm:inline">{lang === 'ar' ? 'معالج العدسات' : 'Lens Wizard'}</span>
          </button>
          <button onClick={handleOpenAdd} className="btn-burgundy px-4 sm:px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20">
            <Plus size={18} />
            <span>{t("add_item")}</span>
          </button>
        </div>
      </div>

      {lowStockLenses.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-amber-50 border-2 border-amber-100/50 rounded-2xl p-4 shadow-sm overflow-hidden"
        >
          <div 
            className="flex items-center gap-3 cursor-pointer select-none" 
            onClick={() => setIsLowStockCollapsed(!isLowStockCollapsed)}
          >
            <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-sm font-bold text-amber-900 uppercase tracking-widest">{lang === 'ar' ? 'تنبيه: مخزون منخفض' : 'Low Stock Alert'}</h3>
            <div className="ms-auto w-8 h-8 flex items-center justify-center text-amber-600 hover:bg-amber-100 rounded-lg transition-colors">
              {isLowStockCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </div>
          </div>
          <AnimatePresence>
            {!isLowStockCollapsed && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="flex flex-wrap gap-2 text-xs overflow-hidden"
              >
                {lowStockLenses.map(l => (
                  <span 
                    key={l.id} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setRestockLens(l);
                    }}
                    className="bg-amber-100/50 text-amber-900 px-3 py-1.5 rounded-full border border-amber-200/50 font-bold cursor-pointer hover:bg-amber-200/50 transition-colors"
                  >
                    SPH {l.sphere > 0 ? `+${l.sphere}` : l.sphere} CYL {l.cylinder || 0} — {l.quantity} {t("qty")}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-cream-border shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field min-w-[140px] flex-1 text-sm py-2">
            <option value="">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
            {lensCatalog.type.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={materialFilter} onChange={e => setMaterialFilter(e.target.value)} className="input-field min-w-[150px] flex-1 text-sm py-2">
            <option value="">{lang === 'ar' ? 'جميع المواد' : 'All Materials'}</option>
            {lensCatalog.material.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="input-field min-w-[140px] flex-1 text-sm py-2">
            <option value="">{lang === 'ar' ? 'مستوى المخزون' : 'Stock Level'}</option>
            <option value="low">{lang === 'ar' ? 'منخفض' : 'Low Stock Only'}</option>
            <option value="out">{t("out")}</option>
          </select>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 border-t border-cream-border pt-4">
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-ink-light uppercase tracking-widest w-8">SPH</span>
             <div className="flex items-center bg-cream/30 border border-cream-border rounded-lg p-1 gap-1">
                <div className="flex bg-cream/50 p-0.5 rounded gap-0.5">
                  <button 
                    onClick={() => {
                      if (!sphFilter) setSphFilter("+0");
                      else if (Number(sphFilter) < 0) setSphFilter(Math.abs(Number(sphFilter)).toString());
                    }} 
                    className={cn("w-6 h-6 flex items-center justify-center font-bold text-xs transition-all rounded-[3px]", (!sphFilter || Number(sphFilter) >= 0) && sphFilter !== "-0" ? "bg-white text-ink shadow-sm border border-cream-border/50" : "text-ink-light hover:text-ink")}
                  >
                    +
                  </button>
                  <button 
                    onClick={() => {
                      if (!sphFilter) setSphFilter("-0");
                      else if (Number(sphFilter) >= 0) setSphFilter(`-${Math.abs(Number(sphFilter))}`);
                    }} 
                    className={cn("w-6 h-6 flex items-center justify-center font-bold text-xs transition-all rounded-[3px]", (sphFilter && Number(sphFilter) < 0) || sphFilter === "-0" ? "bg-white text-ink shadow-sm border border-cream-border/50" : "text-ink-light hover:text-ink")}
                  >
                    -
                  </button>
                </div>
                <input 
                  type="number" step="0.25" min="0" max="20" placeholder="0.00" 
                  value={sphFilter ? Math.abs(Number(sphFilter)) : ""} 
                  onChange={e => {
                    let val = Math.abs(Number(e.target.value));
                    val = Math.min(20, val);
                    if (e.target.value === "") setSphFilter("");
                    else {
                      const isNeg = (sphFilter && Number(sphFilter) < 0) || sphFilter === "-0";
                      setSphFilter(isNeg ? `-${val}` : val.toString());
                    }
                  }} 
                  className="w-14 text-center font-mono text-sm bg-transparent border-none outline-none focus:ring-0 p-0 !appearance-none" 
                />
             </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-xs font-bold text-ink-light uppercase tracking-widest w-8">CYL</span>
             <div className="flex items-center bg-cream/30 border border-cream-border rounded-lg p-1 gap-1">
                <div className="flex bg-cream/50 p-0.5 rounded gap-0.5">
                  <button 
                    onClick={() => {
                      if (!cylFilter) setCylFilter("+0");
                      else if (Number(cylFilter) < 0) setCylFilter(Math.abs(Number(cylFilter)).toString());
                    }} 
                    className={cn("w-6 h-6 flex items-center justify-center font-bold text-xs transition-all rounded-[3px]", (!cylFilter || Number(cylFilter) >= 0) && cylFilter !== "-0" ? "bg-white text-ink shadow-sm border border-cream-border/50" : "text-ink-light hover:text-ink")}
                  >
                    +
                  </button>
                  <button 
                    onClick={() => {
                      if (!cylFilter) setCylFilter("-0");
                      else if (Number(cylFilter) >= 0) setCylFilter(`-${Math.abs(Number(cylFilter))}`);
                    }} 
                    className={cn("w-6 h-6 flex items-center justify-center font-bold text-xs transition-all rounded-[3px]", (cylFilter && Number(cylFilter) < 0) || cylFilter === "-0" ? "bg-white text-ink shadow-sm border border-cream-border/50" : "text-ink-light hover:text-ink")}
                  >
                    -
                  </button>
                </div>
                <input 
                  type="number" step="0.25" min="0" max="20" placeholder="0.00" 
                  value={cylFilter ? Math.abs(Number(cylFilter)) : ""} 
                  onChange={e => {
                    let val = Math.abs(Number(e.target.value));
                    val = Math.min(20, val);
                    if (e.target.value === "") setCylFilter("");
                    else {
                      const isNeg = (cylFilter && Number(cylFilter) < 0) || cylFilter === "-0";
                      setCylFilter(isNeg ? `-${val}` : val.toString());
                    }
                  }} 
                  className="w-14 text-center font-mono text-sm bg-transparent border-none outline-none focus:ring-0 p-0 !appearance-none" 
                />
             </div>
          </div>
        </div>
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
                className={cn("flex flex-col lg:grid lg:grid-cols-12 gap-3 px-4 sm:px-6 py-4 lg:py-3 items-start lg:items-center hover:bg-cream/30 transition-all", isOut ? "bg-rose-50/20" : "")}
              >
                <div className="col-span-2 w-full flex justify-between lg:block font-bold text-sm text-ink items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">{t("name")}</span>
                  <span>{getLabel('type', l.lens_type)}</span>
                </div>
                <div className="col-span-2 w-full flex justify-between lg:block text-sm text-ink-mid items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">{t("material")}</span>
                  <span>{getLabel('material', l.material)}</span>
                </div>
                <div className="col-span-2 w-full flex justify-between lg:block text-sm text-ink-mid items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">Coating</span>
                  <span>{getLabel('coating', l.coating)}</span>
                </div>
                <div className="col-span-1 w-full flex justify-between lg:block font-mono text-sm items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">SPH</span>
                  <span>{l.sphere > 0 ? `+${l.sphere}` : l.sphere}</span>
                </div>
                <div className="col-span-1 w-full flex justify-between lg:block font-mono text-sm items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">CYL</span>
                  <span>{l.cylinder || 0}</span>
                </div>
                <div className="col-span-1 w-full flex justify-between lg:block font-mono text-sm font-bold items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">{t("qty")}</span>
                  <span>{l.quantity}</span>
                </div>
                <div className="col-span-1 w-full flex justify-between lg:block items-center">
                  <span className="lg:hidden text-[10px] uppercase text-ink-light tracking-widest font-sans select-none">Status</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                    isOut ? "bg-rose-100 text-rose-700" :
                    isLow ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                  )}>
                    {isOut ? t("out") : isLow ? t("low") : 'OK'}
                  </span>
                </div>
                <div className="col-span-2 flex w-full lg:w-auto justify-end gap-2 border-t border-cream-border lg:border-none pt-3 lg:pt-0 mt-2 lg:mt-0">
                  <button onClick={() => setRestockLens(l)} className="flex-1 lg:flex-none p-2 text-ink-light hover:text-burgundy hover:bg-cream rounded-lg transition-colors border border-transparent hover:border-cream-border flex items-center justify-center" title="Restock">
                    <Plus size={16} />
                  </button>
                  <button onClick={() => handleOpenEdit(l)} className="flex-1 lg:flex-none p-2 text-ink-light hover:text-burgundy hover:bg-cream rounded-lg transition-colors border border-transparent hover:border-cream-border flex items-center justify-center" title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => {
                      setEditingLens(null);
                      setAddLensData({
                        lens_type: l.lens_type,
                        material: l.material,
                        coating: l.coating,
                        sph: Math.abs(l.sphere).toString(),
                        sphSign: l.sphere < 0 ? "-" : "+",
                        cyl: Math.abs(l.cylinder || 0).toString(),
                        cylSign: (l.cylinder || 0) < 0 ? "-" : "+",
                        quantity: 10,
                        min_stock: l.min_stock,
                        cost_price: l.cost_price,
                        sell_price: l.sell_price
                      });
                      setIsAddEditOpen(true);
                  }} className="flex-1 lg:flex-none p-2 text-ink-light hover:text-burgundy hover:bg-cream rounded-lg transition-colors border border-transparent hover:border-cream-border flex items-center justify-center" title="Duplicate">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(l.id)} className="flex-1 lg:flex-none p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 flex items-center justify-center" title="Delete">
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
        <div className="fixed inset-0 z-[9000] flex items-center justify-center sm:p-4 lg:p-8 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white sm:rounded-3xl lg:rounded-[2rem] w-full h-full sm:h-auto max-w-[72rem] shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 md:px-5 lg:px-8 lg:py-6 border-b border-cream-border bg-gradient-to-r from-cream-light to-white shrink-0">
              <div className="flex items-center gap-3 lg:gap-4">
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-burgundy to-[#5A0015] text-white rounded-xl lg:rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-burgundy/30">
                  <Sparkles size={20} className="lg:w-6 lg:h-6 fill-white/20" />
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
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-5 lg:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
                
                {/* Left Column: Properties */}
                <div className="lg:col-span-6 space-y-6 lg:space-y-8">
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-3 lg:mb-4 flex items-center gap-2">
                      <Layers size={16} className="text-burgundy" /> Target Properties
                    </h3>
                    
                    <div className="space-y-5 lg:space-y-6 bg-cream/30 p-4 rounded-2xl border border-cream-border lg:bg-transparent lg:p-0 lg:rounded-none lg:border-none">
                      {/* Types */}
                      <div>
                        <label className="block text-[10px] lg:text-xs font-bold text-ink-light uppercase tracking-widest mb-2.5 lg:mb-3">
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
                        <label className={cn("block text-[10px] lg:text-xs font-bold uppercase tracking-widest mb-2.5 lg:mb-3 mt-4 lg:mt-0", wizTypes.some(isContact) ? "text-ink-light/50" : "text-ink-light")}>
                          2. Materials
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {lensCatalog.material.map(t => (
                            <button
                              key={t.value}
                              disabled={wizTypes.some(isContact)}
                              onClick={() => toggleSelection(setWizMaterials, wizMaterials, t.value)}
                              className={cn(
                                "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all border-2",
                                wizTypes.some(isContact) ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400" :
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
                        <label className={cn("block text-[10px] lg:text-xs font-bold uppercase tracking-widest mb-2.5 lg:mb-3 mt-4 lg:mt-0", wizTypes.some(isContact) ? "text-ink-light/50" : "text-ink-light")}>
                          3. Coatings
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {lensCatalog.coating.map(t => (
                            <button
                              key={t.value}
                              disabled={wizTypes.some(isContact)}
                              onClick={() => toggleSelection(setWizCoatings, wizCoatings, t.value)}
                              className={cn(
                                "px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-xs lg:text-sm font-bold transition-all border-2",
                                wizTypes.some(isContact) ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400" :
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
                <div className="lg:col-span-6 space-y-6 lg:space-y-8 lg:border-l lg:border-cream-border pt-4 lg:pt-0 lg:pl-10 border-t border-cream-border lg:border-t-0">
                  <div>
                    <h3 className="text-sm font-bold text-ink uppercase tracking-widest mb-3 lg:mb-4 flex items-center gap-2">
                      <Settings2 size={16} className="text-burgundy" /> Power Ranges & Defaults
                    </h3>

                    <div className="space-y-4 lg:space-y-6">
                      {/* SPH Range */}
                      <div className={cn("bg-cream/30 border border-cream-border rounded-xl lg:rounded-2xl p-4 lg:p-5 transition-opacity", wizTypes.length === 1 && wizTypes.some(isPlano) ? "opacity-50 pointer-events-none grayscale" : "")}>
                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold font-mono text-xs lg:text-sm">S</div>
                          <h4 className="font-bold text-ink text-sm lg:text-base">Sphere (SPH)</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Start</label>
                            <input type="number" step="0.25" value={Math.max(wizSphStart, wizSphEnd)} onChange={e => setWizSphStart(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3 bg-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">End</label>
                            <input type="number" step="0.25" value={Math.min(wizSphStart, wizSphEnd)} onChange={e => setWizSphEnd(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3 bg-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Step</label>
                            <input type="number" step="0.25" min="0.25" value={wizSphStep} onChange={e => setWizSphStep(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg bg-cream/50 px-1 sm:px-3" />
                          </div>
                        </div>
                      </div>

                      {/* CYL Range */}
                      <div className={cn("bg-cream/30 border border-cream-border rounded-xl lg:rounded-2xl p-4 lg:p-5 transition-opacity", wizTypes.length === 1 && wizTypes.some(isPlano) ? "opacity-50 pointer-events-none grayscale" : "")}>
                        <div className="flex items-center gap-2 mb-3 lg:mb-4">
                          <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold font-mono text-xs lg:text-sm">C</div>
                          <h4 className="font-bold text-ink text-sm lg:text-base">Cylinder (CYL)</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Start</label>
                            <input type="number" step="0.25" value={Math.max(wizCylStart, wizCylEnd)} onChange={e => setWizCylStart(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3 bg-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">End</label>
                            <input type="number" step="0.25" value={Math.min(wizCylStart, wizCylEnd)} onChange={e => setWizCylEnd(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg px-1 sm:px-3 bg-white" />
                          </div>
                          <div>
                            <label className="block text-[9px] lg:text-[10px] text-ink-light font-bold uppercase tracking-widest mb-1 lg:mb-1.5 ml-1">Step</label>
                            <input type="number" step="0.25" min="0.25" value={wizCylStep} onChange={e => setWizCylStep(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg bg-cream/50 px-1 sm:px-3" />
                          </div>
                        </div>
                      </div>

                      {/* Defaults */}
                      <div className="grid grid-cols-2 gap-3 lg:gap-4">
                        <div className="bg-emerald-50/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-emerald-100 overflow-hidden flex flex-col justify-center">
                          <label className="block text-[10px] lg:text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1.5 lg:mb-2 ml-1 text-center sm:text-left">Default Qty</label>
                          <input type="number" value={wizDefaultQty} onChange={e => setWizDefaultQty(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500/20 bg-white" />
                        </div>
                        <div className="bg-amber-50/50 p-3 lg:p-4 rounded-xl lg:rounded-2xl border border-amber-100 overflow-hidden flex flex-col justify-center">
                          <label className="block text-[10px] lg:text-xs font-bold text-amber-800 uppercase tracking-widest mb-1.5 lg:mb-2 ml-1 text-center sm:text-left">Min Stock Alert</label>
                          <input type="number" value={wizMinStock} onChange={e => setWizMinStock(Number(e.target.value))} className="input-field w-full min-w-0 text-center font-mono py-2 lg:py-2.5 text-sm sm:text-base lg:text-lg border-amber-200 focus:border-amber-500 focus:ring-amber-500/20 bg-white" />
                        </div>
                      </div>

                      {/* Database Sync Mode */}
                      <div className="pt-4 mt-2 border-t border-cream-border/60">
                        <label className="block text-[10px] lg:text-xs font-bold text-ink-light uppercase tracking-widest mb-3">
                          {lang === 'ar' ? '٤. طريقة تحديث الكتالوج' : '4. Catalog Synchronization Mode'}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setWizClearExisting(false)}
                            className={cn(
                              "p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all",
                              !wizClearExisting
                                ? "bg-emerald-50/50 border-emerald-500 text-ink ring-2 ring-emerald-500/15"
                                : "bg-white border-cream-border text-ink hover:bg-cream"
                            )}
                          >
                            <span className="text-xs font-bold font-sans">
                              {lang === 'ar' ? 'إضافة وتوسيع الكتالوج' : 'Append & Expand'}
                            </span>
                            <span className="text-[9px] text-ink-light leading-snug">
                              {lang === 'ar' ? 'العدسات الجديدة تضاف بجانب المخزون الحالي' : 'Keep existing stock and insert new items.'}
                            </span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => setWizClearExisting(true)}
                            className={cn(
                              "p-3 rounded-xl border flex flex-col items-start gap-1 text-left transition-all",
                              wizClearExisting
                                ? "bg-rose-50/50 border-rose-500 text-rose-950 ring-2 ring-rose-500/15"
                                : "bg-white border-cream-border text-ink hover:bg-cream"
                            )}
                          >
                            <span className="text-xs font-bold font-sans text-rose-700">
                              {lang === 'ar' ? 'مسح الكتالوج بالكامل' : 'Clear & Rebuild'}
                            </span>
                            <span className="text-[9px] text-rose-600/80 leading-snug">
                              {lang === 'ar' ? 'تنظيف كافة المخزون وتوليد عدسات جديدة' : 'Permanently delete all existing lenses and regenerate.'}
                            </span>
                          </button>
                        </div>

                        {wizClearExisting && (
                          <motion.div 
                            initial={{ opacity: 0, y: 4 }} 
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl leading-normal flex items-start gap-2.5 animate-in fade-in"
                          >
                            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                            <div className="text-[10px] text-rose-800">
                              <span className="font-bold uppercase tracking-wider block mb-0.5">{lang === 'ar' ? 'تحذير تدمير البيانات' : 'Warning: High Impact Operation'}</span>
                              {lang === 'ar' 
                                ? 'سيتم مسح جميع سجلات العدسات المخزنة في النظام نهائياً بمجرد نقر زر إنتاج العدسات.'
                                : 'All currently cataloged lenses will be deleted permanently when you commit. Unsaved changes will be lost.'}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-5 lg:px-8 py-4 lg:py-5 border-t border-cream-border bg-cream/30 flex flex-col md:flex-row items-center justify-between gap-3 lg:gap-4 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-5">
              <div className="text-[10px] md:text-xs lg:text-sm font-medium text-ink-mid text-center md:text-left flex flex-col gap-1">
                <span>Will generate approximately <strong className="text-burgundy font-bold text-sm md:text-base lg:text-lg font-mono">{estimatedCount}</strong> lens entries.</span>
                {wizClearExisting && (
                  <span className="text-rose-600 font-bold uppercase tracking-wider text-[10px] animate-pulse">{lang === 'ar' ? 'تنبيه: سيتم تصفير المستودع' : 'DESTRUCTION WARNING: CURRENT LENSES WILL BE WIPED'}</span>
                )}
              </div>
              <div className="flex flex-row gap-2 sm:gap-3 w-full md:w-auto">
                <button onClick={() => setIsWizardOpen(false)} className="flex-1 md:flex-none py-2.5 lg:py-3 px-4 lg:px-6 text-xs sm:text-sm whitespace-nowrap font-bold text-ink-mid hover:text-ink bg-cream rounded-xl hover:bg-cream-dark transition-colors border border-cream-border">Cancel</button>
                <button 
                  onClick={handleWizardSubmit} 
                  className="flex-1 md:flex-none py-2.5 lg:py-3 px-4 lg:px-8 text-xs sm:text-sm whitespace-nowrap font-bold text-white bg-gradient-to-r from-burgundy to-[#5A0015] hover:from-[#5A0015] hover:to-[#400000] rounded-xl shadow-lg shadow-burgundy/30 transition-all flex flex-row items-center justify-center gap-2 group"
                >
                  <Zap size={16} className="text-white drop-shadow-sm group-hover:scale-110 transition-transform" /> Generate Lenses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center sm:p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full h-full sm:h-auto max-w-[32rem] shadow-2xl flex flex-col max-h-[100dvh] sm:max-h-[90vh] overflow-hidden mt-auto sm:mt-0">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-4 md:px-6 border-b border-cream-border bg-gradient-to-r from-cream-light to-white shrink-0">
              <h2 className="text-xl font-serif font-bold text-ink">
                {editingLens ? "Edit Lens" : "Add Lens"}
              </h2>
              <button 
                onClick={() => setIsAddEditOpen(false)} 
                className="w-10 h-10 flex items-center justify-center text-ink-light hover:text-burgundy hover:bg-burgundy/10 rounded-full transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-ink-light mb-1.5 ml-1">Type</label>
                  <select 
                    value={addLensData.lens_type} 
                    onChange={e => setAddLensData(prev => ({...prev, lens_type: e.target.value}))} 
                    className="input-field w-full text-sm"
                  >
                    {lensCatalog.type.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1", isContact(addLensData.lens_type) ? "text-ink-light/50" : "text-ink-light")}>Material</label>
                  <select 
                    value={addLensData.material} 
                    onChange={e => setAddLensData(prev => ({...prev, material: e.target.value}))} 
                    disabled={isContact(addLensData.lens_type)}
                    className="input-field w-full text-sm disabled:opacity-50 disabled:bg-gray-50"
                  >
                    {lensCatalog.material.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1", isContact(addLensData.lens_type) ? "text-ink-light/50" : "text-ink-light")}>Coating</label>
                <select 
                  value={addLensData.coating} 
                  onChange={e => setAddLensData(prev => ({...prev, coating: e.target.value}))} 
                  disabled={isContact(addLensData.lens_type)}
                  className="input-field w-full text-sm disabled:opacity-50 disabled:bg-gray-50"
                >
                  {lensCatalog.coating.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1", isPlano(addLensData.lens_type) ? "text-ink-light/50" : "text-ink-light")}>SPH</label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" step="0.25" min="0" max="20" placeholder="0.00" 
                      value={addLensData.sph} 
                      disabled={isPlano(addLensData.lens_type)}
                      onChange={e => {
                        let v = e.target.value;
                        if (parseFloat(v) > 20) v = "20";
                        setAddLensData(prev => ({...prev, sph: v}));
                      }}
                      className="input-field flex-1 text-center font-mono py-2 text-sm disabled:opacity-50 disabled:bg-gray-50"
                    />
                    <button 
                      disabled={isPlano(addLensData.lens_type)}
                      onClick={() => setAddLensData(prev => ({...prev, sphSign: prev.sphSign === "+" ? "-" : "+"}))}
                      className={cn("w-10 h-[38px] flex rounded-lg items-center justify-center font-bold text-sm transition-colors border disabled:opacity-50 disabled:cursor-not-allowed", addLensData.sphSign === "+" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}
                    >
                      {addLensData.sphSign}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1", isPlano(addLensData.lens_type) ? "text-ink-light/50" : "text-ink-light")}>CYL</label>
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="number" step="0.25" min="0" max="20" placeholder="0.00" 
                      value={addLensData.cyl} 
                      disabled={isPlano(addLensData.lens_type)}
                      onChange={e => {
                        let v = e.target.value;
                        if (parseFloat(v) > 20) v = "20";
                        setAddLensData(prev => ({...prev, cyl: v}));
                      }}
                      className="input-field flex-1 text-center font-mono py-2 text-sm disabled:opacity-50 disabled:bg-gray-50"
                    />
                    <button 
                      disabled={isPlano(addLensData.lens_type)}
                      onClick={() => setAddLensData(prev => ({...prev, cylSign: prev.cylSign === "+" ? "-" : "+"}))}
                      className={cn("w-10 h-[38px] flex rounded-lg items-center justify-center font-bold text-sm transition-colors border disabled:opacity-50 disabled:cursor-not-allowed", addLensData.cylSign === "+" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200")}
                    >
                      {addLensData.cylSign}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-ink-light mb-1.5 ml-1">Quantity</label>
                  <input type="number" value={addLensData.quantity} onChange={e => setAddLensData(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))} className="input-field w-full text-center text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-ink-light mb-1.5 ml-1">Min Stock</label>
                  <input type="number" value={addLensData.min_stock} onChange={e => setAddLensData(prev => ({...prev, min_stock: parseInt(e.target.value) || 0}))} className="input-field w-full text-center text-sm" />
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 py-4 border-t border-cream-border bg-cream/30 flex gap-3 shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <button onClick={() => setIsAddEditOpen(false)} className="flex-1 py-3 px-4 font-bold text-ink-mid hover:text-ink bg-white rounded-xl border border-cream-border transition-colors">
                Cancel
              </button>
              <button onClick={handleSaveAddEdit} className="flex-1 py-3 px-4 font-bold text-white bg-burgundy hover:bg-[#800020] rounded-xl shadow-lg shadow-burgundy/20 transition-all flex items-center justify-center gap-2">
                <Save size={18} /> Save Lens
              </button>
            </div>
          </div>
        </div>
      )}

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
                {lang === 'ar' ? 'حذف العدسة' : 'Delete Lens'}
              </h3>
              <p className="text-sm text-ink-light mb-6">
                {lang === 'ar' 
                  ? 'هل أنت متأكد من أنك تريد حذف هذا السجل بشكل دائم؟' 
                  : 'Are you sure you want to permanently delete this lens?'}
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

      {/* Restock Confirm Modal */}
      {restockLens && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setRestockLens(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-[21.6rem] overflow-hidden"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus size={32} className="text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">
                {lang === 'ar' ? 'إضافة مخزون' : 'Restock Lens'}
              </h3>
              <p className="text-sm text-ink-light mb-6">
                SPH {restockLens.sphere > 0 ? `+${restockLens.sphere}` : restockLens.sphere} CYL {restockLens.cylinder || 0} — Current: {restockLens.quantity}
              </p>
              
              <div className="mb-6 flex items-center gap-2 bg-cream/30 border border-cream-border rounded-xl p-2">
                 <button onClick={() => setRestockAmount(Math.max(1, restockAmount - 1))} className="w-10 h-10 flex items-center justify-center bg-white border border-cream-border rounded-lg text-ink font-bold hover:border-burgundy transition-colors shadow-sm">-</button>
                 <input type="number" value={restockAmount} onChange={(e) => setRestockAmount(parseInt(e.target.value) || 0)} className="w-full text-center bg-transparent border-none outline-none font-bold text-lg text-ink" />
                 <button onClick={() => setRestockAmount(restockAmount + 1)} className="w-10 h-10 flex items-center justify-center bg-white border border-cream-border rounded-lg text-ink font-bold hover:border-burgundy transition-colors shadow-sm">+</button>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setRestockLens(null);
                    setRestockAmount(10);
                  }}
                  className="flex-1 py-3 bg-cream hover:bg-cream-dark text-ink-mid font-bold rounded-xl transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    if (restockAmount > 0) {
                      setLenses(prev => prev.map(l => l.id === restockLens.id ? { ...l, quantity: l.quantity + restockAmount } : l));
                    }
                    setRestockLens(null);
                    setRestockAmount(10);
                  }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  {lang === 'ar' ? 'تاكيد' : 'Confirm'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => {
                setRestockLens(null);
                setRestockAmount(10);
              }}
              className="absolute top-4 end-4 text-ink-light hover:text-ink transition-colors p-1"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}

      {/* Flush Confirmation Modal */}
      {isFlushConfirmOpen && (
        <div className="fixed inset-0 z-[9999] pointer-events-auto flex items-center justify-center p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-[24rem] overflow-hidden opacity-100"
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} className="text-rose-600 animate-bounce" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">
                {lang === 'ar' ? 'تفريغ مستودع العدسات' : 'Clear All Lenses'}
              </h3>
              <p className="text-sm text-ink-light mb-6">
                {lang === 'ar' 
                  ? 'تحذير: هل أنت متأكد من أنك تريد حذف كافة سجلات العدسات الحالية وإفراغ الكتالوج بالكامل؟ هذا الإجراء لا يمكن التراجع عنه.' 
                  : 'Are you absolutely sure you want to permanently wipe your entire lens catalog? This will delete all cataloged items and cannot be undone.'}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsFlushConfirmOpen(false)}
                  className="flex-1 py-3 bg-cream hover:bg-cream-dark text-ink-mid font-bold rounded-xl transition-all"
                >
                  {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button 
                  onClick={() => {
                    setLenses([]);
                    setIsFlushConfirmOpen(false);
                  }}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-600/20"
                >
                  {lang === 'ar' ? 'تأكيد الحذف النهائي' : 'Yes, WIPE ALL'}
                </button>
              </div>
            </div>
            <button 
              onClick={() => setIsFlushConfirmOpen(false)}
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
