import React, { useState, useMemo } from "react";
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  AlertTriangle, 
  ArrowUpRight, 
  MoreHorizontal, 
  Building2, 
  Boxes,
  TrendingDown,
  TrendingUp,
  Tag,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem, Supplier } from "../types";

export function Inventory() {
  const { t, lang } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "suppliers">("items");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [items, setItems] = useState<InventoryItem[]>([
    { id: "1", name: "Classic Aviator Frame", category: "frame", sku: "FR-001", stock_level: 45, reorder_point: 10, unit_price: 25000, updated_at: "2024-05-12" },
    { id: "2", name: "Anti-Reflective Lens (Pair)", category: "lens", sku: "LN-002", stock_level: 8, reorder_point: 15, unit_price: 15000, updated_at: "2024-05-10" },
    { id: "3", name: "Premium Microfiber Cloth", category: "accessory", sku: "AC-003", stock_level: 120, reorder_point: 50, unit_price: 2000, updated_at: "2024-05-15" },
    { id: "4", name: "Lens Cleaning Spray 30ml", category: "accessory", sku: "AC-004", stock_level: 5, reorder_point: 20, unit_price: 5000, updated_at: "2024-05-01" },
    { id: "5", name: "Titanium Rimless Frame", category: "frame", sku: "FR-005", stock_level: 22, reorder_point: 5, unit_price: 85000, updated_at: "2024-05-05" },
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([
    { id: "s1", name: "Optical Global Distribution", contact_person: "Mazen Ahmed", phone: "+964 770 123 4567", email: "sales@opticalglobal.com", address: "Baghdad, Al-Mansour", payment_terms: "Net 30" },
    { id: "s2", name: "Vision Care Lenses Co.", contact_person: "Sarah Khalid", phone: "+964 780 987 6543", email: "orders@visioncare.iq", address: "Erbil, 60m Street", payment_terms: "Direct Payment" },
  ]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const stats = useMemo(() => {
    const lowStockItemsCount = items.filter(i => i.stock_level <= i.reorder_point).length;
    const totalItems = items.reduce((acc, i) => acc + i.stock_level, 0);
    const totalValue = items.reduce((acc, i) => acc + (i.stock_level * i.unit_price), 0);
    return { lowStock: lowStockItemsCount, totalItems, totalValue };
  }, [items]);

  const lowStockItems = useMemo(() => {
    return items.filter(i => i.stock_level <= i.reorder_point);
  }, [items]);

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{t("inventory")}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            STOCK CONTROL SYSTEM <span className="w-1 h-1 bg-cream-border rounded-full" /> {items.length} TOTAL PRODUCTS
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-burgundy px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20">
            <Plus size={18} />
            <span>{activeTab === "items" ? t("add_item") : t("add_supplier")}</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockItems.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 shadow-sm"
        >
          <div className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shrink-0 animate-pulse">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 text-center md:text-start">
            <h3 className="text-sm font-bold text-rose-900 uppercase tracking-tight">{lang === 'ar' ? 'تنبيه: مخزون منخفض' : 'Critical Stock Alert'}</h3>
            <p className="text-xs text-rose-700 font-medium leading-relaxed">
              {lang === 'ar' 
                ? `هناك ${lowStockItems.length} أصناف وصلت إلى مستوى إعادة الطلب أو أقل. يرجى مراجعة الطلبات.` 
                : `There are ${lowStockItems.length} items that have reached or dropped below their reorder point.`}
            </p>
          </div>
          <div className="flex -space-x-2 overflow-hidden py-1">
            {lowStockItems.slice(0, 3).map((item, i) => (
              <div key={item.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-rose-50 bg-rose-200 flex items-center justify-center text-[10px] font-bold text-rose-700 uppercase" style={{ zIndex: 3 - i }}>
                {item.name.charAt(0)}
              </div>
            ))}
            {lowStockItems.length > 3 && (
              <div className="inline-block h-8 w-8 rounded-full ring-2 ring-rose-50 bg-rose-300 flex items-center justify-center text-[10px] font-bold text-rose-800 uppercase" style={{ zIndex: 0 }}>
                +{lowStockItems.length - 3}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <Boxes size={64} className="text-burgundy" />
          </div>
          <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-1">Total Stock Units</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-ink">{stats.totalItems.toLocaleString("en-US")}</span>
            <span className="text-[10px] text-green-600 font-bold mb-1 flex items-center"><TrendingUp size={10} /> +4%</span>
          </div>
        </div>

        <div className="card p-6 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <AlertTriangle size={64} className="text-rose-600" />
          </div>
          <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-1">{t("low_stock")}</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-rose-600">{stats.lowStock}</span>
            <span className="text-[10px] text-ink-light font-bold mb-1">Items at risk</span>
          </div>
        </div>

        <div className="card p-6 bg-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
            <DollarSign size={64} className="text-amber-600" />
          </div>
          <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest mb-1">Stock Value (Estimated)</p>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-ink">{formatIQD(stats.totalValue)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-cream-border">
        <button 
          onClick={() => setActiveTab("items")}
          className={cn(
            "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all relative",
            activeTab === "items" ? "text-burgundy" : "text-ink-light hover:text-ink-mid"
          )}
        >
          {t("inventory")}
          {activeTab === "items" && <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-burgundy" />}
        </button>
        <button 
          onClick={() => setActiveTab("suppliers")}
          className={cn(
            "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all relative",
            activeTab === "suppliers" ? "text-burgundy" : "text-ink-light hover:text-ink-mid"
          )}
        >
          {t("suppliers")}
          {activeTab === "suppliers" && <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-burgundy" />}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="space-y-4">
        <AnimatePresence mode="wait">
          {activeTab === "items" ? (
            <motion.div 
              key="items-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by product name or SKU..."
                    className="w-full ps-12 pe-4 py-3 bg-white border-2 border-cream-border rounded-xl focus:border-burgundy focus:shadow-lg focus:shadow-burgundy/5 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="border-2 border-cream-border bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink-mid focus:border-burgundy outline-none transition-all cursor-pointer min-w-[140px]"
                  >
                    <option value="all">{lang === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                    <option value="lens">{t("lenses")}</option>
                    <option value="frame">{t("frames")}</option>
                    <option value="accessory">{lang === 'ar' ? 'إكسسوارات' : 'Accessories'}</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-cream/50 border-b border-cream-border">
                  <div className="col-span-4 text-[10px] font-bold text-ink-light uppercase tracking-widest">{t("name")} / {t("sku")}</div>
                  <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest text-center">{t("category")}</div>
                  <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest text-center">{t("stock_level")}</div>
                  <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest text-end">{t("unit_price")}</div>
                  <div className="col-span-2 text-[10px] font-bold text-ink-light uppercase tracking-widest text-center">Status</div>
                </div>

                <div className="divide-y divide-cream-border">
                  {filteredItems.map((item, idx) => {
                    const isLowStock = item.stock_level <= item.reorder_point;
                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={item.id} 
                        className={cn(
                          "lg:grid lg:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-cream/20 transition-all group",
                          isLowStock && "bg-rose-50/30 border-s-4 border-s-rose-600"
                        )}
                      >
                        <div className="col-span-4 flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            isLowStock ? "bg-rose-50 text-rose-600" : "bg-cream text-burgundy"
                          )}>
                            <Package size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-ink">{item.name}</h4>
                            <p className="text-[10px] font-mono text-ink-light font-bold uppercase tracking-wider">{item.sku}</p>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <span className="px-2 py-1 bg-cream-dark/30 text-ink-light text-[10px] font-bold uppercase tracking-widest rounded">
                            {item.category}
                          </span>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "text-sm font-bold",
                              isLowStock ? "text-rose-600" : "text-ink"
                            )}>
                              {item.stock_level}
                            </span>
                            <span className="text-[8px] text-ink-light uppercase font-bold tracking-tighter">
                              Reorder at: {item.reorder_point}
                            </span>
                          </div>
                        </div>
                        <div className="col-span-2 text-end">
                          <span className="text-sm font-bold text-ink font-mono">{formatIQD(item.unit_price)}</span>
                        </div>
                        <div className="col-span-2 flex justify-center">
                          {isLowStock ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full border border-rose-100">
                              <AlertTriangle size={12} /> {t("low_stock")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                              <Boxes size={12} /> {t("in_stock")}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="p-12 text-center text-ink-light italic">
                      {t("no_data")}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="suppliers-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {suppliers.map((supplier, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={supplier.id} 
                  className="card p-6 bg-white hover:border-burgundy/20 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cream/30 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-burgundy/5 transition-all" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-burgundy/5 text-burgundy flex items-center justify-center shrink-0">
                      <Building2 size={24} />
                    </div>
                    <button className="p-2 text-ink-light hover:text-burgundy">
                      <MoreHorizontal size={20} />
                    </button>
                  </div>

                  <h3 className="text-xl font-serif font-bold text-ink mb-1 group-hover:text-burgundy transition-colors">{supplier.name}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-burgundy-soft uppercase tracking-widest mb-6">
                    <User size={12} /> {supplier.contact_person}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-cream-border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                        <Phone size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">Phone Number</p>
                        <p className="text-sm font-medium text-ink-mid font-mono">{supplier.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                        <Mail size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">Email Address</p>
                        <p className="text-sm font-medium text-ink-mid truncate max-w-[200px]">{supplier.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                        <MapPin size={14} />
                      </div>
                      <div>
                        <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">Company Office</p>
                        <p className="text-sm font-medium text-ink-mid">{supplier.address}</p>
                      </div>
                    </div>
                    {supplier.payment_terms && (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                          <Tag size={14} />
                        </div>
                        <div>
                          <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">{t("payment_terms")}</p>
                          <p className="text-sm font-medium text-burgundy font-bold">{supplier.payment_terms}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-cream-dark/20 hover:bg-burgundy hover:text-white text-burgundy text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
                    View Associated Products <ArrowUpRight size={14} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
