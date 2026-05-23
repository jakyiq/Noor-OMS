import React, { useState, useMemo } from "react";
import { 
  Glasses, 
  Search, 
  Plus, 
  AlertTriangle,
  Boxes,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  Package
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { FrameItem, LensCatalog } from "../types";
import { useScrollLock } from "../hooks/useScrollLock";

export function Frames() {
  const { t, lang, lensCatalog, frames, setFrames } = useClinic();

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingFrame, setEditingFrame] = useState<FrameItem | null>(null);

  const [addFrameData, setAddFrameData] = useState({
    brand: lensCatalog?.frame_brand?.[0]?.value || "Ray-Ban",
    model: "",
    color: "",
    type: lensCatalog?.frame_type?.[0]?.value || "Full Rim",
    material: lensCatalog?.frame_material?.[0]?.value || "Acetate",
    shape: lensCatalog?.frame_shape?.[0]?.value || "Square",
    quantity: 5,
    min_stock: 2,
    cost_price: 20000,
    sell_price: 50000
  });

  const handleOpenAdd = () => {
    setEditingFrame(null);
    setAddFrameData({
      brand: lensCatalog?.frame_brand?.[0]?.value || "Ray-Ban",
      model: "",
      color: "",
      type: lensCatalog?.frame_type?.[0]?.value || "Full Rim",
      material: lensCatalog?.frame_material?.[0]?.value || "Acetate",
      shape: lensCatalog?.frame_shape?.[0]?.value || "Square",
      quantity: 5,
      min_stock: 2,
      cost_price: 20000,
      sell_price: 50000
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (f: FrameItem) => {
    setEditingFrame(f);
    setAddFrameData({
      brand: f.brand,
      model: f.model,
      color: f.color,
      type: f.type,
      material: f.material,
      shape: f.shape,
      quantity: f.quantity,
      min_stock: f.min_stock,
      cost_price: f.cost_price,
      sell_price: f.sell_price
    });
    setIsAddEditOpen(true);
  };

  const handleSaveAddEdit = () => {
    if (editingFrame) {
      setFrames(prev => prev.map(f => f.id === editingFrame.id ? {
        ...f,
        ...addFrameData
      } : f));
    } else {
      setFrames(prev => [{
        id: Math.random().toString(36).substring(7),
        ...addFrameData
      }, ...prev]);
    }
    setIsAddEditOpen(false);
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [restockFrame, setRestockFrame] = useState<FrameItem | null>(null);
  const [restockAmount, setRestockAmount] = useState(5);
  const [isLowStockCollapsed, setIsLowStockCollapsed] = useState(true);

  useScrollLock(isAddEditOpen || !!deleteConfirmId || !!restockFrame);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [brandFilter, setBrandFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");

  const filteredFrames = useMemo(() => {
    return frames.filter(f => {
      if (brandFilter && f.brand !== brandFilter) return false;
      if (typeFilter && f.type !== typeFilter) return false;
      if (stockFilter === "low" && f.quantity > f.min_stock) return false;
      if (stockFilter === "out" && f.quantity > 0) return false;
      if (stockFilter === "in" && f.quantity <= 0) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return f.brand.toLowerCase().includes(q) || f.model.toLowerCase().includes(q) || f.color.toLowerCase().includes(q);
      }
      return true;
    });
  }, [frames, brandFilter, typeFilter, stockFilter, searchTerm]);

  const lowStockFrames = useMemo(() => frames.filter(f => f.quantity <= f.min_stock).slice(0, 40), [frames]);

  const getLabel = (cat: keyof LensCatalog, val: string) => {
    const item = lensCatalog[cat]?.find(c => c.value === val);
    return item ? item.label : val.replace(/_/g, " ");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{t("frames")}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            CATALOG & INVENTORY <span className="w-1 h-1 bg-cream-border rounded-full" /> {frames.length} FRAMES
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOpenAdd} className="btn-burgundy px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
            <Plus size={18} />
            <span>{lang === 'ar' ? 'إضافة إطار' : 'Add Frame'}</span>
          </button>
        </div>
      </div>

      {lowStockFrames.length > 0 && (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 shadow-sm">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsLowStockCollapsed(!isLowStockCollapsed)}
          >
            <div className="flex items-center gap-3 text-rose-700">
              <AlertTriangle size={20} className="text-rose-600" />
              <div className="font-bold text-sm flex items-center gap-2">
                <span>Critical Stock Alerts</span>
                <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full">{lowStockFrames.length} Frames</span>
              </div>
            </div>
            {isLowStockCollapsed ? <ChevronDown size={20} className="text-rose-400" /> : <ChevronUp size={20} className="text-rose-400" />}
          </div>
          <AnimatePresence>
            {!isLowStockCollapsed && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-4 mt-4 border-t border-rose-100 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {lowStockFrames.map(f => (
                    <div key={f.id} className="bg-white p-3 rounded-lg border border-rose-100 flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 rounded flex items-center justify-center text-rose-600 shrink-0">
                        <Glasses size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-ink truncate">{f.brand} {f.model}</p>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 whitespace-nowrap ml-2">
                            {f.quantity} {t("left")}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-light truncate">{f.color} • {f.type}</p>
                      </div>
                      <button onClick={() => { setRestockAmount(5); setRestockFrame(f); }} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Restock">
                        <Plus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-cream-border shadow-sm flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} className="input-field min-w-[140px] flex-1 text-sm py-2">
            <option value="">{lang === 'ar' ? 'جميع الماركات' : 'All Brands'}</option>
            {lensCatalog.frame_brand?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="input-field min-w-[150px] flex-1 text-sm py-2">
            <option value="">{lang === 'ar' ? 'جميع الأنواع' : 'All Types'}</option>
            {lensCatalog.frame_type?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select value={stockFilter} onChange={e => setStockFilter(e.target.value)} className="input-field min-w-[140px] flex-1 text-sm py-2">
            <option value="">{lang === 'ar' ? 'مستوى المخزون' : 'Stock Level'}</option>
            <option value="low">{lang === 'ar' ? 'منخفض' : 'Low Stock Only'}</option>
            <option value="out">{t("out")}</option>
            <option value="in">{t("in_stock")}</option>
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-light" size={16} />
            <input 
              type="text" 
              placeholder={lang === 'ar' ? 'بحث...' : 'Search model or color...'}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field w-full ps-9 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {/* Desktop View (Visible on lg screens and up) */}
        <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-cream-border overflow-x-auto">
          <table className="w-full text-start whitespace-nowrap min-w-[700px]">
            <thead className="bg-cream/50 border-b border-cream-border text-[10px] uppercase tracking-widest text-ink-light">
              <tr>
                <th className="px-4 py-3 text-start font-bold">Brand & Model</th>
                <th className="px-4 py-3 text-start font-bold">Color</th>
                <th className="px-4 py-3 text-start font-bold">Type / Shape</th>
                <th className="px-4 py-3 text-center font-bold">Stock</th>
                <th className="px-4 py-3 text-start font-bold">Price</th>
                <th className="px-4 py-3 text-end font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border text-sm">
              {filteredFrames.map(f => (
                <tr key={f.id} className={cn("hover:bg-cream/20 transition-colors", f.quantity <= f.min_stock ? "bg-rose-50/20" : "")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded shrink-0 flex items-center justify-center", f.quantity <= f.min_stock ? "bg-rose-100 text-rose-600" : "bg-cream text-burgundy")}>
                        <Glasses size={16} />
                      </div>
                      <div>
                        <div className="font-bold text-ink">{getLabel('frame_brand', f.brand)}</div>
                        <div className="text-[10px] text-ink-light font-mono">{f.model}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="bg-cream-dark/30 px-2 py-1 rounded text-ink font-medium text-[11px]">{f.color || "-"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-ink">{getLabel('frame_type', f.type)}</div>
                    <div className="text-[10px] text-ink-light mt-0.5">{getLabel('frame_shape', f.shape)}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={cn("font-bold text-lg leading-none", f.quantity <= f.min_stock ? "text-rose-600" : "text-ink")}>
                        {f.quantity}
                      </span>
                      <span className="text-[9px] text-ink-light uppercase tracking-widest mt-1">Min: {f.min_stock}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold font-mono text-ink">{formatIQD(f.sell_price)}</div>
                    <div className="text-[9px] text-ink-light font-mono line-through mt-0.5">{formatIQD(f.cost_price)}</div>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setRestockAmount(5); setRestockFrame(f); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Restock">
                        <Plus size={16} />
                      </button>
                      <button onClick={() => handleOpenEdit(f)} className="p-1.5 text-ink-light hover:text-burgundy hover:bg-burgundy/5 rounded transition-colors" title="Edit">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirmId(f.id)} className="p-1.5 text-ink-light hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFrames.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-light italic text-sm">
                    {lang === 'ar' ? 'لم يتم العثور على إطارات تطابق بحثك.' : 'No frames found matching your criteria.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View (Visible on screens smaller than lg) */}
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFrames.map(f => {
            const isLowStock = f.quantity <= f.min_stock;
            return (
              <div 
                key={f.id} 
                className={cn(
                  "p-4 bg-white rounded-xl border flex flex-col justify-between shadow-sm transition-all gap-4",
                  isLowStock ? "border-rose-200 bg-rose-50/[0.15]" : "border-cream-border"
                )}
              >
                {/* Header Information */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border", isLowStock ? "bg-rose-100 text-rose-600 border-rose-200" : "bg-cream text-burgundy border-cream-dark/20")}>
                        <Glasses size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-ink text-[15px] truncate">{getLabel('frame_brand', f.brand)}</h4>
                        <p className="text-[11px] font-mono text-ink-light uppercase tracking-wider">{f.model || "-"}</p>
                      </div>
                    </div>
                    
                    {/* Stock status pill */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-black px-2 py-1 rounded-md", isLowStock ? "bg-rose-100 text-rose-700" : "bg-emerald-50 text-emerald-700 border border-emerald-100")}>
                          {f.quantity} {lang === 'ar' ? 'متبقي' : 'left'}
                        </span>
                      </div>
                      <span className="text-[9px] text-ink-light block mt-1 uppercase tracking-widest font-semibold">Min: {f.min_stock}</span>
                    </div>
                  </div>

                  {/* Attributes Section */}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-cream-border/60 text-xs">
                    <div>
                      <span className="text-ink-light text-[9px] uppercase font-bold tracking-widest block mb-0.5">{lang === 'ar' ? 'اللون' : 'Color'}</span>
                      <span className="text-ink font-semibold">{f.color || "-"}</span>
                    </div>
                    <div>
                      <span className="text-ink-light text-[9px] uppercase font-bold tracking-widest block mb-0.5">{lang === 'ar' ? 'النوع والشكل' : 'Type & Shape'}</span>
                      <span className="text-ink font-semibold">{getLabel('frame_type', f.type)} • {getLabel('frame_shape', f.shape)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Price & Responsive Actions Row */}
                <div className="flex items-center justify-between pt-3 border-t border-cream-border/60 gap-4 mt-auto">
                  <div className="text-start">
                    <span className="text-ink-light text-[9px] uppercase font-bold tracking-widest block">{lang === 'ar' ? 'سعر البيع' : 'Sell Price'}</span>
                    <span className="text-base font-bold font-mono text-ink tabular-nums">{formatIQD(f.sell_price)}</span>
                    <span className="text-[10px] text-ink-light font-mono line-through block tabular-nums">{formatIQD(f.cost_price)}</span>
                  </div>

                  {/* Action triggers with large touch targets (44px) */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setRestockAmount(5); setRestockFrame(f); }} 
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 active:bg-blue-200 border border-blue-100 rounded-xl transition-all shadow-sm"
                      title="Restock"
                    >
                      <Plus size={18} />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(f)} 
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-cream hover:bg-cream-dark/40 active:bg-cream-dark/60 border border-cream-border text-ink rounded-xl transition-all shadow-sm"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(f.id)} 
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-100 text-rose-600 rounded-xl transition-all shadow-sm"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredFrames.length === 0 && (
            <div className="col-span-1 md:col-span-2 p-12 bg-white border border-cream-border rounded-xl text-center text-ink-light italic text-sm">
              {lang === 'ar' ? 'لم يتم العثور على إطارات تطابق بحثك.' : 'No frames found matching your criteria.'}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isAddEditOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setIsAddEditOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-5 border-b border-cream-border bg-cream/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-burgundy/10 text-burgundy flex items-center justify-center rounded-xl">
                    <Glasses size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif font-bold text-ink">
                      {editingFrame ? (lang === 'ar' ? 'تعديل الإطار' : 'Edit Frame') : (lang === 'ar' ? 'إضافة إطار جديد' : 'Add New Frame')}
                    </h2>
                    <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mt-0.5">Inventory Management</p>
                  </div>
                </div>
                <button onClick={() => setIsAddEditOpen(false)} className="text-ink-light hover:bg-cream p-2 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto w-full">
                <div className="space-y-6">
                  {/* Category & Model Details */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Brand</label>
                      <select 
                        value={addFrameData.brand} 
                        onChange={e => setAddFrameData(prev => ({...prev, brand: e.target.value}))} 
                        className="input-field w-full text-sm"
                      >
                        {lensCatalog.frame_brand?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Model Indicator / Name</label>
                      <input 
                        type="text" 
                        value={addFrameData.model} 
                        onChange={e => setAddFrameData(prev => ({...prev, model: e.target.value}))} 
                        className="input-field w-full text-sm"
                        placeholder="e.g. Wayfarer, GG0012S"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Color Variant</label>
                      <input 
                        type="text" 
                        value={addFrameData.color} 
                        onChange={e => setAddFrameData(prev => ({...prev, color: e.target.value}))} 
                        className="input-field w-full text-sm"
                        placeholder="e.g. Matte Black, Havana"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Frame Type</label>
                      <select 
                        value={addFrameData.type} 
                        onChange={e => setAddFrameData(prev => ({...prev, type: e.target.value}))} 
                        className="input-field w-full text-sm"
                      >
                        {lensCatalog.frame_type?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Material</label>
                      <select 
                        value={addFrameData.material} 
                        onChange={e => setAddFrameData(prev => ({...prev, material: e.target.value}))} 
                        className="input-field w-full text-sm"
                      >
                        {lensCatalog.frame_material?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Shape</label>
                      <select 
                        value={addFrameData.shape} 
                        onChange={e => setAddFrameData(prev => ({...prev, shape: e.target.value}))} 
                        className="input-field w-full text-sm"
                      >
                        {lensCatalog.frame_shape?.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="border-t border-cream-border pt-6 mt-6 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Initial Quantity / Stock</label>
                      <input 
                        type="number" min="0" value={addFrameData.quantity} 
                        onChange={e => setAddFrameData(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))} 
                        className="input-field w-full font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Alert Min Stock</label>
                      <input 
                        type="number" min="0" value={addFrameData.min_stock} 
                        onChange={e => setAddFrameData(prev => ({...prev, min_stock: parseInt(e.target.value) || 0}))} 
                        className="input-field w-full font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Cost Price (IQD)</label>
                      <input 
                        type="number" min="0" step="1000" value={addFrameData.cost_price} 
                        onChange={e => setAddFrameData(prev => ({...prev, cost_price: parseInt(e.target.value) || 0}))} 
                        className="input-field w-full font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold mb-1.5 ml-1 text-ink-light">Selling Price (IQD)</label>
                      <input 
                        type="number" min="0" step="1000" value={addFrameData.sell_price} 
                        onChange={e => setAddFrameData(prev => ({...prev, sell_price: parseInt(e.target.value) || 0}))} 
                        className="input-field w-full font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-cream-border bg-cream/30 gap-3 flex justify-end shrink-0">
                <button onClick={() => setIsAddEditOpen(false)} className="px-5 py-2.5 text-sm font-bold text-ink-light hover:text-ink transition-colors">
                  {t("cancel")}
                </button>
                <button onClick={handleSaveAddEdit} className="btn-burgundy px-6 py-2.5 flex items-center gap-2 shadow-md">
                  <Plus size={18} />
                  <span>{editingFrame ? (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes') : (lang === 'ar' ? 'إضافة الإطار' : 'Add Frame')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Restock Modal */}
      <AnimatePresence>
        {restockFrame && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setRestockFrame(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Package size={24} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-1">Restock Frame</h3>
              <p className="text-xs text-ink-light mb-6">
                Add inventory for <strong>{getLabel('frame_brand', restockFrame.brand)} {restockFrame.model}</strong>. Current stock: {restockFrame.quantity}
              </p>
              
              <div className="mb-6">
                <label className="block text-[10px] uppercase font-bold text-ink-light mb-2">Pieces to Add</label>
                <div className="flex items-center gap-4">
                  <button onClick={() => setRestockAmount(Math.max(1, restockAmount - 1))} className="w-10 h-10 rounded-lg border border-cream-border bg-cream flex items-center justify-center text-ink hover:bg-cream-dark transition-colors">-</button>
                  <input type="number" min="1" value={restockAmount} onChange={e => setRestockAmount(parseInt(e.target.value) || 0)} className="input-field flex-1 text-center font-mono text-lg py-2" />
                  <button onClick={() => setRestockAmount(restockAmount + 1)} className="w-10 h-10 rounded-lg border border-cream-border bg-cream flex items-center justify-center text-ink hover:bg-cream-dark transition-colors">+</button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setRestockFrame(null)} className="flex-1 py-2.5 text-sm font-bold text-ink-mid hover:bg-cream rounded-xl transition-colors">Cancel</button>
                <button 
                  onClick={() => {
                    if (restockAmount > 0) {
                      setFrames(prev => prev.map(f => f.id === restockFrame.id ? { ...f, quantity: f.quantity + restockAmount } : f));
                      
                      // Ledger this inside reports as an opex expense
                      const totalCost = Number(restockAmount) * Number(restockFrame.cost_price || 15000);
                      let currentExps = [];
                      const savedExps = localStorage.getItem("noor_expenses");
                      if (savedExps) {
                        try {
                          currentExps = JSON.parse(savedExps);
                        } catch (err) {
                          currentExps = [];
                        }
                      }
                      
                      const newExpense = {
                        id: "e_frame_restock_" + Math.random().toString(36).substring(7),
                        description: lang === "ar"
                          ? `توريد وإعادة تزويد مخزون إطارات [${restockFrame.brand} - ${restockFrame.model}] عدد ${restockAmount}`
                          : `Restocked Frames: ${restockFrame.brand} - ${restockFrame.model} (Qty x${restockAmount})`,
                        category: "other" as const,
                        amount: totalCost,
                        date: new Date().toISOString().split("T")[0]
                      };
                      
                      currentExps.unshift(newExpense);
                      localStorage.setItem("noor_expenses", JSON.stringify(currentExps));
                    }
                    setRestockFrame(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-md shadow-blue-600/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Content Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 p-6">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">Delete Frame?</h3>
              <p className="text-sm text-ink-light mb-6 leading-relaxed">
                Are you sure you want to delete this frame from your catalog? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-2.5 text-sm font-bold text-ink-mid hover:bg-cream rounded-xl transition-colors">Cancel</button>
                <button 
                  onClick={() => {
                    setFrames(prev => prev.filter(f => f.id !== deleteConfirmId));
                    setDeleteConfirmId(null);
                  }}
                  className="flex-1 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-md shadow-rose-600/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
