import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ShoppingCart, Plus, Minus, Search, Trash2, Check, ArrowUpRight, ArrowLeft } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn, removeEmojis, cleanNameInput, cleanNumberOnlyInput } from "../lib/utils";
import { InventoryItem, Visit, Patient } from "../types";

interface CartItem {
  id: string; // can be inventory item id or random for custom
  name: string;
  category: "reading_frame" | "accessory" | "other" | "contact_lens";
  price: number;
  quantity: number;
  stock_level?: number;
  isCustom?: boolean;
  cost_price?: number;
}

interface QuickSellModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSellModal({ isOpen, onClose }: QuickSellModalProps) {
  const { lang, patients, setPatients, logAction, setInventoryTrigger } = useClinic();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Custom item creation form states
  const [customName, setCustomName] = useState("");
  const [customPrice, setCustomPrice] = useState<number>(3000);
  const [customQty, setCustomQty] = useState<number>(1);
  const [customCategory, setCustomCategory] = useState<"accessory" | "other" | "reading_frame">("accessory");
  
  const [isSuccess, setIsSuccess] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Initialize and Seed default presets in localstorage if they don't already exist
  useEffect(() => {
    if (!isOpen) return;
    
    const saved = localStorage.getItem("noor_inventory_items");
    let list: InventoryItem[] = [];
    if (saved) {
      try {
        list = JSON.parse(saved);
      } catch (e) {
        console.error("Error reading inventory items directly from storage", e);
      }
    }

    let changed = false;

    // 1. Preset Generic Reading Frame
    const hasRF = list.some(i => i.name === "Generic Reading Frame" || i.name === "إطار نظارة قراءة جاهز" || i.sku === "PRE-RF-01");
    if (!hasRF) {
      list.push({
        id: "rf_preset",
        name: lang === "ar" ? "إطار نظارة قراءة جاهز" : "Generic Reading Frame",
        category: "reading_frame",
        sku: "PRE-RF-01",
        stock_level: 25,
        reorder_point: 5,
        unit_price: 15000,
        cost_price: 8000,
        updated_at: new Date().toISOString()
      });
      changed = true;
    }

    // 2. Preset Lens Wiping Cloth
    const hasCloth = list.some(i => i.name === "Lens Wiping Cloth" || i.name === "قطعة قماش لتنظيف العدسات" || i.sku === "PRE-LWC-02");
    if (!hasCloth) {
      list.push({
        id: "cloth_preset",
        name: lang === "ar" ? "قطعة قماش لتنظيف العدسات" : "Lens Wiping Cloth",
        category: "accessory",
        sku: "PRE-LWC-02",
        stock_level: 100,
        reorder_point: 10,
        unit_price: 2500,
        cost_price: 800,
        updated_at: new Date().toISOString()
      });
      changed = true;
    }

    // 3. Preset Lens Spray
    const hasSpray = list.some(i => i.name === "Lens Spray" || i.name === "بخاخ تنظيف العدسات" || i.sku === "PRE-LS-03");
    if (!hasSpray) {
      list.push({
        id: "spray_preset",
        name: lang === "ar" ? "بخاخ تنظيف العدسات" : "Lens Spray",
        category: "accessory",
        sku: "PRE-LS-03",
        stock_level: 50,
        reorder_point: 8,
        unit_price: 3500,
        cost_price: 1200,
        updated_at: new Date().toISOString()
      });
      changed = true;
    }

    if (changed) {
      localStorage.setItem("noor_inventory_items", JSON.stringify(list));
      if (setInventoryTrigger) {
        setInventoryTrigger(prev => prev + 1);
      }
    }

    setInventoryList(list);
    setCart([]);
    setCustomerName("");
    setCustomName("");
    setSearchQuery("");
    setIsSuccess(false);
    setStockWarning(null);
    setMobileTab("catalog");
  }, [isOpen, lang]);

  // Read latest inventory list
  const refreshInventoryList = () => {
    const saved = localStorage.getItem("noor_inventory_items");
    if (saved) {
      try {
        setInventoryList(JSON.parse(saved));
      } catch (e) {}
    }
  };

  // Get current stock for specific items in list to display on cards
  const getItemStockPrice = (id_or_sku: string, defaultPrice: number): { stock: number; price: number; realId: string; name: string } => {
    const match = inventoryList.find(i => i.id === id_or_sku || i.sku === id_or_sku || i.name.toLowerCase() === id_or_sku.toLowerCase());
    return {
      stock: match ? match.stock_level : 0,
      price: match ? match.unit_price : defaultPrice,
      realId: match ? match.id : id_or_sku,
      name: match ? match.name : id_or_sku
    };
  };

  // Preset definitions
  const presets = React.useMemo(() => {
    const staticPresets = [
      {
        id: "rf_preset",
        nameAr: "إطار نظارة قراءة جاهز",
        nameEn: "Generic Reading Frame",
        category: "reading_frame" as const,
        defaultPrice: 15000,
        color: "from-amber-50 to-orange-50 border-orange-200 text-orange-950"
      },
      {
        id: "cloth_preset",
        nameAr: "قطعة قماش طبي لتنظيف العدسات",
        nameEn: "Lens Wiping Cloth",
        category: "accessory" as const,
        defaultPrice: 2500,
        color: "from-sky-50 to-blue-50 border-sky-200 text-sky-950"
      },
      {
        id: "spray_preset",
        nameAr: "بخاخ تنظيف العدسات المعقم",
        nameEn: "Lens Spray",
        category: "accessory" as const,
        defaultPrice: 3500,
        color: "from-teal-50 to-emerald-50 border-teal-200 text-teal-950"
      }
    ];

    // Read additional dynamic products that are flagged with is_quick_sell
    const dynamicPresets = inventoryList
      .filter(item => item.is_quick_sell && item.id !== "rf_preset" && item.id !== "cloth_preset" && item.id !== "spray_preset")
      .map((item, idx) => {
        const colors = [
          "from-purple-50 to-indigo-50 border-purple-200 text-purple-950",
          "from-rose-50 to-pink-50 border-rose-200 text-rose-950",
          "from-emerald-50 to-green-50 border-emerald-200 text-emerald-950",
          "from-fuchsia-50 to-violet-50 border-fuchsia-200 text-fuchsia-950",
          "from-indigo-50 to-cyan-50 border-indigo-200 text-indigo-950"
        ];
        return {
          id: item.id,
          nameAr: item.name,
          nameEn: item.name,
          category: (item.category === "reading_frame" ? "reading_frame" : "accessory") as "reading_frame" | "accessory",
          defaultPrice: item.unit_price,
          color: colors[idx % colors.length]
        };
      });

    return [...staticPresets, ...dynamicPresets];
  }, [inventoryList]);

  const handleAddPreset = (pId: string, defaultPrice: number, nameAr: string, nameEn: string, category: "reading_frame" | "accessory") => {
    const details = getItemStockPrice(pId, defaultPrice);
    const resolvedName = lang === "ar" ? nameAr : nameEn;
    
    // Find matched item inside inventoryList to get its exact cost_price
    const matchedItem = inventoryList.find(i => i.id === details.realId || i.sku === pId);
    let resolvedCostPrice = 0;
    if (matchedItem) {
      resolvedCostPrice = matchedItem.cost_price || 0;
    } else {
      // reasonable fallback for static default presets
      if (pId === "rf_preset") resolvedCostPrice = 6000;
      else if (pId === "cloth_preset") resolvedCostPrice = 500;
      else if (pId === "spray_preset") resolvedCostPrice = 1200;
    }

    // Check if ready in cart
    const existing = cart.find(c => c.id === details.realId);
    if (existing) {
      if (details.stock > 0 && existing.quantity >= details.stock) {
        setStockWarning(lang === "ar" ? `تحذير: لقد تجاوزت كمية المخزن المتوفرة لـ ${resolvedName}` : `Warning: You exceeded available stock level of ${resolvedName}`);
        return;
      }
      setCart(cart.map(c => c.id === details.realId ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        id: details.realId,
        name: resolvedName,
        category,
        price: details.price,
        quantity: 1,
        stock_level: details.stock,
        cost_price: resolvedCostPrice
      }]);
    }
    setStockWarning(null);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const matchedInInventory = inventoryList.find(i => i.name.toLowerCase() === customName.trim().toLowerCase());

    const newItem: CartItem = {
      id: matchedInInventory ? matchedInInventory.id : "custom_" + Date.now(),
      name: customName.trim(),
      category: customCategory,
      price: customPrice,
      quantity: customQty,
      stock_level: matchedInInventory ? matchedInInventory.stock_level : undefined,
      isCustom: matchedInInventory ? false : true,
      cost_price: matchedInInventory ? matchedInInventory.cost_price || 0 : Math.round(customPrice * 0.6) // 60% fallback
    };

    setCart([...cart, newItem]);
    setCustomName("");
    setCustomQty(1);
    setStockWarning(null);
  };

  const handleAddFromInventorySearch = (item: InventoryItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      if (existing.quantity >= item.stock_level) {
        setStockWarning(lang === "ar" ? `تحذير: لا توجد كمية كافية لـ ${item.name}` : `Warning: Insufficient stock level for ${item.name}`);
        return;
      }
      setCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        id: item.id,
        name: item.name,
        category: item.category as any,
        price: item.unit_price,
        quantity: 1,
        stock_level: item.stock_level,
        cost_price: item.cost_price || 0
      }]);
    }
    setStockWarning(null);
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = c.quantity + delta;
        if (newQty <= 0) return c;
        if (c.stock_level !== undefined && newQty > c.stock_level) {
          setStockWarning(lang === "ar" ? `تحذير: تم الوصول للحد الأقصى المتوفر بالمستودع لـ ${c.name}` : `Warning: Maximum warehouse stock level reached for ${c.name}`);
          return c;
        }
        return { ...c, quantity: newQty };
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(c => c.id !== id));
    setStockWarning(null);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    const totalPrice = calculateTotal();
    const itemsSummary = cart.map(c => `${c.name} (${c.quantity}x @ ${formatIQD(c.price)})`).join(", ");

    // 1. Find or create the walkin_retail Patient
    let updatedPatients = [...patients];
    let walkinPatient = updatedPatients.find(p => p.id === "walkin_retail");

    if (!walkinPatient) {
      walkinPatient = {
        id: "walkin_retail",
        full_name: lang === "ar" ? "زبون سفري مباشر" : "Walk-in Retail Customer",
        phone: "+9647700000000",
        age: 30,
        gender: "male" as const,
        address: lang === "ar" ? "مبيعات مباشرة" : "POS Walk-in",
        notes: lang === "ar" ? "حساب افتراضي للمبيعات المباشرة السريعة للأجهزة والأكسسوارات" : "Virtual patient account dedicated for walk-in retail accessories & direct sales",
        updated_at: new Date().toISOString(),
        outstanding_remaining: 0,
        visits: [],
        prescriptions: []
      };
      updatedPatients.push(walkinPatient);
    }

    // 2. Create the POS Visit record
    const newVisitId = "pos_" + Date.now();
    const newVisit: Visit = {
      id: newVisitId,
      patient_id: "walkin_retail",
      visit_date: new Date().toISOString().split("T")[0],
      diagnosis: lang === "ar" ? "بيع مباشر بالتجزئة" : "Quick POS Sale",
      total_amount: totalPrice,
      amount_paid: totalPrice,
      remaining: 0,
      payment_history: [
        {
          id: "pay_" + Date.now(),
          date: new Date().toISOString().split("T")[0],
          amount: totalPrice
        }
      ],
      rawFormData: {
        customer_name: customerName.trim() || (lang === "ar" ? "زبون مبيعات مباشر" : "Walk-in Buyer"),
        is_quick_sell: true,
        items_sold: cart.map(c => ({
          name: c.name,
          category: c.category,
          price: c.price,
          quantity: c.quantity,
          cost_price: c.cost_price || 0
        }))
      }
    };

    walkinPatient.visits = [newVisit, ...(walkinPatient.visits || [])];

    // Write updated patients list to state and trigger react update
    setPatients(updatedPatients);

    // 3. Deduct actual stock from inventoryList & sync with noor_inventory_items
    const savedOtc = localStorage.getItem("noor_inventory_items");
    if (savedOtc) {
      try {
        let items: InventoryItem[] = JSON.parse(savedOtc);
        cart.forEach(c => {
          if (c.id && !c.isCustom) {
            items = items.map(orig => {
              if (orig.id === c.id) {
                return {
                  ...orig,
                  stock_level: Math.max(0, (orig.stock_level || 0) - c.quantity),
                  updated_at: new Date().toISOString()
                };
              }
              return orig;
            });
          }
        });
        localStorage.setItem("noor_inventory_items", JSON.stringify(items));
        if (setInventoryTrigger) {
          setInventoryTrigger(prev => prev + 1);
        }
      } catch (e) {
        console.error("Error updating inventory items stock in localstorage", e);
      }
    }

    // 4. Log audit log trail
    logAction({
      action: "create",
      entity_type: "inventory",
      entity_id: newVisitId,
      entity_name: "Walk-in Retail Sale",
      details: lang === "ar" 
        ? `فاتورة بيع سريع للزبون (${customerName.trim() || "زبون عادي"}): ${itemsSummary}. القيمة: ${formatIQD(totalPrice)}.`
        : `Completed direct sell ticket for (${customerName.trim() || "Walk-in client"}): ${itemsSummary}. Cash: ${formatIQD(totalPrice)}.`
    });

    setIsSuccess(true);
  };

  // Filter items in catalog for dropdown search
  const filteredCatalogOptions = inventoryList.filter(item => {
    if (!searchQuery.trim()) return false;
    const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const skuMatch = item.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || skuMatch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[9500] flex items-center justify-center sm:p-4 bg-ink/50 backdrop-blur-sm animate-in fade-in"
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white w-full h-full sm:h-auto max-h-[100dvh] sm:max-h-[92dvh] sm:rounded-3xl rounded-none shadow-2xl flex flex-col overflow-hidden relative max-w-[62rem]"
            dir={lang === "ar" ? "rtl" : "ltr"}
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-cream-border bg-gradient-to-r from-cream-light to-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-burgundy text-white flex items-center justify-center shadow-md">
                  <ShoppingCart size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-serif font-bold text-ink leading-tight">
                    {lang === "ar" ? "بوابة البيع المباشر والسريع" : "Quick Sell & Retail Station"}
                  </h2>
                  <p className="text-[10px] sm:text-[11px] text-ink-light">
                    {lang === "ar" ? "قطع الاكسسوارات والإطارات الجاهزة والبخاخات وصيانة النظارات" : "Accessories, wiping rags, sanitizing spray, ready-readers & fast service"}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 border border-cream-border rounded-xl text-ink-light hover:text-ink transition-colors hover:bg-cream bg-white cursor-pointer active:scale-95"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile Tab Bar Header (Only visible on screens < lg) */}
            <div className="lg:hidden flex bg-cream/15 border-b border-cream-border h-12 shrink-0">
              <button
                type="button"
                onClick={() => setMobileTab("catalog")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all relative",
                  mobileTab === "catalog" ? "text-burgundy" : "text-ink-light hover:text-ink-mid"
                )}
              >
                <Search size={14} />
                <span>{lang === "ar" ? "كتالوج المواد والبخاخات" : "Catalog & Presets"}</span>
                {mobileTab === "catalog" && (
                  <motion.div layoutId="pos-mobile-tab-line" className="absolute bottom-0 inset-x-0 h-0.5 bg-burgundy" />
                )}
              </button>
              <div className="w-[1px] bg-cream-border my-2" />
              <button
                type="button"
                onClick={() => setMobileTab("cart")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 text-xs font-bold transition-all relative",
                  mobileTab === "cart" ? "text-burgundy" : "text-ink-light hover:text-ink-mid"
                )}
              >
                <div className="relative">
                  <ShoppingCart size={14} />
                  {cart.length > 0 && (
                    <motion.span 
                      key={cart.reduce((s, c) => s + c.quantity, 0)}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: [1.3, 1] }}
                      transition={{ type: "spring", stiffness: 300, damping: 15 }}
                      className="absolute -top-1.5 -right-1.5 bg-burgundy text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      {cart.reduce((s, c) => s + c.quantity, 0)}
                    </motion.span>
                  )}
                </div>
                <span>{lang === "ar" ? "سلة الشراء والدفع" : "Cart & Checkout"}</span>
                {mobileTab === "cart" && (
                  <motion.div layoutId="pos-mobile-tab-line" className="absolute bottom-0 inset-x-0 h-0.5 bg-burgundy" />
                )}
              </button>
            </div>

            {/* Split Screen Layout */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-cream-light/30">
              
              {/* LEFT COLUMN: Input form & Presets (7 cols) */}
              <div className={cn(
                "p-4 sm:p-6 overflow-y-auto border-cream-border space-y-6 flex flex-col justify-between lg:col-span-7",
                mobileTab === "catalog" ? "flex flex-1" : "hidden lg:flex",
                "lg:border-e"
              )}>
                <div>
                  {/* Presets Grid */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-ink-mid tracking-wider uppercase font-[Verdana] flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-burgundy rounded-full" />
                      {lang === "ar" ? "السلع وقطع الغيار الأكثر طلباً" : "Most Requested Retail Presets"}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                      {presets.map((preset) => {
                        const info = getItemStockPrice(preset.id, preset.defaultPrice);
                        return (
                          <div 
                            key={preset.id}
                            className={cn(
                              "relative p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 flex flex-col justify-between h-[9.5rem] sm:h-[10.5rem] bg-gradient-to-br shadow-sm transition-all duration-300 transform select-none",
                              preset.color
                            )}
                          >
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase bg-white/60 backdrop-blur-md px-1.5 sm:px-2 py-0.5 rounded-md border border-black/5 dark:border-white/5 font-[Verdana] scale-90 sm:scale-95 origin-left">
                                  {preset.category === "reading_frame" ? (lang === "ar" ? "قراءة" : "Reader") : (lang === "ar" ? "إكسسوار" : "Accessory")}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-bold font-serif leading-snug mt-1.5 sm:mt-2 text-ink line-clamp-2">
                                {lang === "ar" ? preset.nameAr : preset.nameEn}
                              </h4>
                            </div>
                            
                            <div className="mt-2 sm:mt-4 flex items-end justify-between">
                              <div>
                                <p className="text-[9px] sm:text-[10px] opacity-80 leading-none mb-1">
                                  {lang === "ar" ? `المخزون: ${info.stock} قطعة` : `Stock: ${info.stock} pcs`}
                                </p>
                                <p className="text-sm sm:text-base font-bold font-mono tracking-tight text-burgundy">{formatIQD(info.price)}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddPreset(preset.id, preset.defaultPrice, preset.nameAr, preset.nameEn, preset.category)}
                                className="w-8 h-8 rounded-xl bg-white border border-cream-border flex items-center justify-center text-ink hover:text-burgundy hover:border-burgundy hover:bg-burgundy/5 cursor-pointer shadow-sm active:scale-95 transition-all"
                              >
                                <Plus size={16} className="stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stock Alert / Warnings */}
                  {stockWarning && (
                    <div className="mt-4 bg-amber-50 text-amber-900 px-4 py-2.5 rounded-xl text-xs border border-amber-200 font-medium flex items-center gap-2 animate-pulse">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0" />
                      {stockWarning}
                    </div>
                  )}

                  {/* Search Inventory lookup */}
                  <div className="mt-6 space-y-3">
                    <h3 className="text-xs font-bold text-ink-mid tracking-wider uppercase font-[Verdana] flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-burgundy rounded-full" />
                      {lang === "ar" ? "البحث والاختيار المباشر من مخزن العيادة" : "Live Optical Stock Search & Add"}
                    </h3>
                    <div className="relative">
                      <Search className="absolute top-3.5 left-3 text-ink-light" size={16} />
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(removeEmojis(e.target.value))}
                        placeholder={lang === "ar" ? "ابحث بالاسم أو رمز الباركود SKU (مثال: بخاخ، إطار، CL...)" : "Filter clinic catalog by name, model, barcode or SKU..."}
                        className="w-full text-xs sm:text-sm pl-10 pr-4 py-3 border border-cream-border rounded-xl focus:border-burgundy focus:ring-1 focus:ring-burgundy outline-none bg-white font-medium"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-2.5 text-[10px] px-1.5 py-1 rounded border border-cream bg-cream/50 text-ink-mid hover:text-ink hover:bg-cream"
                        >
                          {lang === "ar" ? "تصفية" : "Clear"}
                        </button>
                      )}
                    </div>

                    {searchQuery.trim() !== "" && (
                      <div className="bg-white border border-cream-border rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-cream/60 z-20 relative font-sans">
                        {filteredCatalogOptions.length === 0 ? (
                          <p className="p-4 text-xs italic text-ink-light text-center">
                            {lang === "ar" ? "تعذر العثور على أي سلع مطابقة للاستعلام المحدد." : "No matching catalog inventory items found."}
                          </p>
                        ) : (
                          filteredCatalogOptions.map((item) => (
                            <div 
                              key={item.id}
                              onClick={() => {
                                handleAddFromInventorySearch(item);
                                setSearchQuery("");
                              }}
                              className="p-3 hover:bg-cream/30 flex justify-between items-center cursor-pointer transition-colors"
                            >
                              <div>
                                <p className="text-xs font-bold text-ink">{item.name}</p>
                                <p className="text-[10px] text-ink-light flex items-center gap-2 mt-0.5">
                                  <span>SKU: {item.sku || "N/A"}</span>
                                  <span className="w-1 h-1 bg-cream-border rounded-full" />
                                  <span>{lang === "ar" ? `المخزون المتوفر: ${item.stock_level} قطعة` : `In Stock: ${item.stock_level}`}</span>
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-burgundy font-mono">{formatIQD(item.unit_price)}</span>
                                <span className="px-2 py-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-50 rounded border border-emerald-100 flex items-center gap-0.5">
                                  <Plus size={10} /> {lang === "ar" ? "أضف" : "Add"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sell Custom / Other Miscellaneous Items */}
                <div className="mt-8 pt-5 border-t border-cream-border pb-2">
                  <h3 className="text-xs font-bold text-ink-mid tracking-wider uppercase font-[Verdana] flex items-center gap-2 mb-3">
                    <span className="w-1.5 h-3 bg-burgundy rounded-full" />
                    {lang === "ar" ? "بيع سلعة فرعية مخصصة أو صيانة وتصليح" : "Custom Miscellaneous / One-Time Service Sales"}
                  </h3>
                  <form onSubmit={handleAddCustom} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    <div className="sm:col-span-5">
                      <label className="block text-[9px] sm:text-[10px] font-bold text-ink-mid mb-1">
                        {lang === "ar" ? "صنف أو وصف السلعة (مثال: برغي إطار، صيانة)" : "Name / Description (e.g., Replacement Nosepads)"}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={customName}
                        onChange={(e) => setCustomName(cleanNameInput(e.target.value))}
                        placeholder={lang === "ar" ? "أدخل تفاصيل ووصف السلعة الحرة هنا..." : "Type custom item details or service name..."}
                        className="w-full text-xs p-2.5 border border-cream-border bg-white rounded-xl outline-none focus:border-burgundy"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[9px] sm:text-[10px] font-bold text-ink-mid mb-1">
                        {lang === "ar" ? "السعر الإجمالي (د.ع)" : "Unit Price (IQD)"}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={customPrice || ""}
                        onChange={(e) => setCustomPrice(parseInt(cleanNumberOnlyInput(e.target.value)) || 0)}
                        className="w-full text-xs p-2.5 border border-cream-border bg-white rounded-xl outline-none font-mono focus:border-burgundy"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[9px] sm:text-[10px] font-bold text-ink-mid mb-1">
                        {lang === "ar" ? "الكمية" : "Qty"}
                      </label>
                      <input 
                        type="text" 
                        required
                        value={customQty || ""}
                        onChange={(e) => setCustomQty(parseInt(cleanNumberOnlyInput(e.target.value)) || 1)}
                        className="w-full text-xs p-2.5 border border-cream-border bg-white rounded-xl outline-none font-mono focus:border-burgundy"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <button
                        type="submit"
                        className="w-full text-xs py-2.5 bg-ink text-white font-bold rounded-xl hover:bg-burgundy hover:text-white transition-all cursor-pointer active:scale-[0.98] h-[37px] flex items-center justify-center shadow-sm"
                      >
                        {lang === "ar" ? "إضافة" : "Inject"}
                      </button>
                    </div>
                  </form>
                </div>

              </div>

              {/* RIGHT COLUMN: Interactive Cart & Checkout (5 cols) */}
              <div className={cn(
                "p-4 sm:p-6 overflow-y-auto bg-cream/15 lg:col-span-5 flex-col justify-between",
                mobileTab === "cart" ? "flex flex-1" : "hidden lg:flex"
              )}>
                
                {/* Cart Items List */}
                <div className="flex-1 flex flex-col justify-between min-h-0">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-ink tracking-wider uppercase font-[Verdana] flex items-center gap-2">
                        <ShoppingCart size={14} className="text-burgundy" />
                        {lang === "ar" ? "عناصر سلة البيع الحالي" : "Checkout Invoice List"}
                      </h3>
                      {cart && cart.length > 0 && (
                        <button 
                          onClick={() => setCart([])}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:underline bg-red-50 hover:bg-red-100 rounded-lg px-2.5 py-1.5 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 size={11} /> {lang === "ar" ? "تفريغ السلة" : "Empty Cart"}
                        </button>
                      )}
                    </div>

                    <div className="max-h-[14rem] sm:max-h-[19rem] overflow-y-auto space-y-2 border border-cream-border/60 rounded-2xl p-2.5 bg-white shadow-inner font-sans">
                      {!cart || cart.length === 0 ? (
                        <div className="py-12 px-4 text-center">
                          <ShoppingCart className="mx-auto text-cream-border mb-3" size={36} />
                          <p className="text-xs italic text-ink-light">
                            {lang === "ar" ? "السلة فارغة. يرجى اختيار presets أو البحث وإدراج السلك." : "The direct-sale cart is currently empty."}
                          </p>
                        </div>
                      ) : (
                        cart.map((item) => (
                          <div 
                            key={item.id}
                            className="p-3 bg-cream-light/35 rounded-xl border border-cream/50 flex justify-between items-center group shadow-sm hover:border-cream transition-colors"
                          >
                            <div className="flex-1 min-w-0 pr-3 text-start">
                              <p className="text-xs font-bold text-ink truncate">{item.name}</p>
                              <p className="text-[10px] text-ink-mid mt-0.5 font-mono">
                                {formatIQD(item.price)} &times; {item.quantity}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="flex items-center border border-cream-border bg-white rounded-lg p-0.5">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-6 h-6 rounded-md hover:bg-cream/40 text-ink-light hover:text-ink flex items-center justify-center"
                                >
                                  <Minus size={11} className="stroke-[2.5]" />
                                </button>
                                <span className="px-2 text-xs font-bold font-mono text-ink text-center min-w-[1.25rem]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-6 h-6 rounded-md hover:bg-cream/40 text-ink-light hover:text-ink flex items-center justify-center"
                                >
                                  <Plus size={11} className="stroke-[2.5]" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition-colors shadow-sm ml-1"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Customer field and checkout details */}
                  <div className="mt-6 border-t border-cream-border/60 pt-4 space-y-4 shrink-0">
                    <div className="text-start">
                      <label className="block text-[10px] font-bold text-ink mb-1.5 uppercase tracking-wider">
                        {lang === "ar" ? "اسم الزبون المشتري (اختياري)" : "Buyer / Customer Reference Name (Optional)"}
                      </label>
                      <input 
                        type="text" 
                        value={customerName}
                        onChange={(e) => setCustomerName(cleanNameInput(e.target.value))}
                        placeholder={lang === "ar" ? "مثال: مبيعات سريعة للمريض أحمد..." : "e.g., Quick walkin customer referal..."}
                        className="w-full text-xs p-3 border border-cream-border rounded-xl outline-none focus:border-burgundy bg-white font-medium"
                      />
                    </div>

                    <div className="bg-white rounded-2xl border border-cream-border p-4 space-y-2 shadow-sm text-start">
                      <div className="flex justify-between items-center text-xs text-ink-light">
                        <span>{lang === "ar" ? "عناصر السلة الكلية:" : "Invoice list items:"}</span>
                        <span className="font-bold text-ink">{cart ? cart.reduce((s, c) => s + c.quantity, 0) : 0} {lang === "ar" ? "سلعة" : "items"}</span>
                      </div>
                      <div className="flex justify-between items-center border-t border-cream/50 pt-2 text-sm text-ink font-bold font-serif">
                        <span>{lang === "ar" ? "إجمالي المبلغ الصافي:" : "GRAND TOTAL COST:"}</span>
                        <span className="text-burgundy font-mono tracking-tight text-lg">{formatIQD(calculateTotal())}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trigger Complete Sale */}
                <div className="mt-6 shrink-0 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    disabled={!cart || cart.length === 0}
                    onClick={handleCompleteSale}
                    className={cn(
                      "w-full text-center py-4 rounded-2xl font-serif font-bold text-sm tracking-wide shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer select-none",
                      cart && cart.length > 0
                        ? "bg-gradient-to-r from-burgundy via-[#701a24] to-rose-950 text-white hover:opacity-95 shadow-burgundy/15 hover:shadow-lg active:scale-[0.99]"
                        : "bg-cream-border/65 text-ink-light cursor-not-allowed"
                    )}
                  >
                    <Check size={16} className="stroke-[2.5]" />
                    {lang === "ar" ? "استلام النقد وإقفال فاتورة البيع" : "Confirm Payment & Post Cash Ticket"}
                  </button>
                  <p className="text-[10px] text-ink-light text-center mt-2.5">
                    {lang === "ar" 
                      ? "إجراء البيع سيقوم بقيد الإيرادات بصندوق العيادة وتخفيض المخزون من الأكسسوارات فوراً." 
                      : "Submission commits immediate income ledger postings and decrements the selected warehouse stock quantities."}
                  </p>
                </div>

              </div>

            </div>

            {/* Complete Sale SUCCESS overlay */}
            <AnimatePresence>
              {isSuccess && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/95 z-[9900] flex flex-col items-center justify-center p-6 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full border-2 border-emerald-100 flex items-center justify-center mb-6 animate-bounce">
                    <Check size={38} className="stroke-[3]" />
                  </div>
                  
                  <h2 className="text-2xl font-serif font-bold text-ink mb-2">
                    {lang === "ar" ? "تم تسجيل البيع بنجاح!" : "Sale Executed Successfully!"}
                  </h2>
                  <p className="text-sm text-ink-light max-w-sm leading-relaxed mb-6">
                    {lang === "ar" 
                      ? `تم تحصيل الإيرار الكلي للسلعة بقيمة ${formatIQD(calculateTotal())} وتخفيض الكميات في المخازن، ودوّنت العملية في سجل التدقيق السنوي للعيادة.`
                      : `Successfully collected ${formatIQD(calculateTotal())} net earnings, itemized the inventory warehouse shelves, and recorded secure audit logs.`}
                  </p>

                  <button
                    onClick={onClose}
                    className="px-8 py-3 bg-ink hover:bg-ink-mid text-white rounded-xl text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <ArrowLeft size={14} />
                    {lang === "ar" ? "العودة للرئيسة" : "Return to Dashboard"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
