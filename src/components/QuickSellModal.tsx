import React, { useState, useEffect, useMemo } from "react";
import { 
  X, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  Check, 
  User, 
  Sparkles, 
  Package, 
  Eye, 
  Layers, 
  ShoppingBag,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  Hash,
  BookOpen
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { useScrollLock } from "../hooks/useScrollLock";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem } from "../types";

export function QuickSellModal() {
  const { 
    lang, 
    isQuickSellOpen, 
    setIsQuickSellOpen, 
    setPatients, 
    logAction, 
    setInventoryTrigger,
    lenses,
    setLenses,
    frames,
    setFrames
  } = useClinic();

  // Prevent scroll interaction with anything beneath it
  useScrollLock(isQuickSellOpen);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [items, setItems] = useState<InventoryItem[]>([]);
  
  // Cart states
  const [cart, setCart] = useState<Array<{ item: InventoryItem; qty: number }>>([]);
  const [customerName, setCustomerName] = useState("");
  const [paidOverride, setPaidOverride] = useState("");
  
  // Success receipt screen
  const [saleResult, setSaleResult] = useState<{
    success: boolean;
    customer: string;
    total: number;
    paid: number;
    change: number;
  } | null>(null);

  // Load items from local storage whenever modal opens, appending professional lenses and frames
  useEffect(() => {
    if (isQuickSellOpen) {
      const saved = localStorage.getItem("noor_inventory_items");
      let activeItems: InventoryItem[] = [];
      if (saved) {
        try {
          activeItems = JSON.parse(saved);
        } catch (err) {
          console.error("Error loading inventory items in modal", err);
        }
      }

      const defaultContactLens: InventoryItem = { 
        id: "quick_contact_lens", 
        name: "Bio-Soft Monthly Contact Lenses", 
        category: "contact_lens", 
        sku: "CL-020", 
        stock_level: 30, 
        reorder_point: 5, 
        unit_price: 35000, 
        updated_at: "2026-05-20" 
      };
      
      const defaultReadingFrame: InventoryItem = { 
        id: "quick_reading_frame", 
        name: "Generic Reading Frame (+1.50)", 
        category: "reading_frame", 
        sku: "RF-050", 
        stock_level: 50, 
        reorder_point: 10, 
        unit_price: 15000, 
        updated_at: "2026-05-20" 
      };

      let needsSave = false;
      if (activeItems.length === 0) {
        activeItems = [
          { id: "1", name: "Classic Aviator Frame", category: "frame", sku: "FR-001", stock_level: 45, reorder_point: 10, unit_price: 25000, updated_at: "2024-05-12" },
          { id: "2", name: "Anti-Reflective Lens (Pair)", category: "lens", sku: "LN-002", stock_level: 8, reorder_point: 15, unit_price: 15000, updated_at: "2024-05-10" },
          { id: "3", name: "Premium Microfiber Cloth", category: "accessory", sku: "AC-003", stock_level: 120, reorder_point: 50, unit_price: 2000, updated_at: "2024-05-15" },
          { id: "4", name: "Lens Cleaning Spray 30ml", category: "accessory", sku: "AC-004", stock_level: 5, reorder_point: 20, unit_price: 5000, updated_at: "2024-05-01" },
          { id: "5", name: "Titanium Rimless Frame", category: "frame", sku: "FR-005", stock_level: 22, reorder_point: 5, unit_price: 85000, updated_at: "2024-05-05" },
          defaultContactLens,
          defaultReadingFrame
        ];
        needsSave = true;
      } else {
        const hasContactLens = activeItems.some(item => item.category === "contact_lens");
        if (!hasContactLens) {
          activeItems.push(defaultContactLens);
          needsSave = true;
        }
        const hasReadingFrame = activeItems.some(item => item.category === "reading_frame");
        if (!hasReadingFrame) {
          activeItems.push(defaultReadingFrame);
          needsSave = true;
        }
      }

      if (needsSave) {
        localStorage.setItem("noor_inventory_items", JSON.stringify(activeItems));
      }

      // Map ophthalmic lenses (from lenses context) & designer frames (from frames context)
      const mappedLenses: InventoryItem[] = (lenses || []).map(l => ({
        id: `lens_${l.id}`,
        name: `${l.lens_type} (${l.material}, ${l.coating}) SPH:${l.sphere >= 0 ? '+' : ''}${l.sphere.toFixed(2)} CYL:${l.cylinder >= 0 ? '+' : ''}${l.cylinder.toFixed(2)}`,
        category: "lens",
        sku: `LN-RX-${l.id.substring(0, 4).toUpperCase()}`,
        stock_level: l.quantity,
        reorder_point: l.min_stock,
        unit_price: l.sell_price,
        updated_at: new Date().toISOString().split("T")[0]
      }));

      const mappedFrames: InventoryItem[] = (frames || []).map(f => ({
        id: `frame_${f.id}`,
        name: `${f.brand} - ${f.model} (${f.color}, ${f.type})`,
        category: "frame",
        sku: `FR-${f.brand.substring(0, 3).toUpperCase()}-${f.model.substring(0, 3).toUpperCase()}`,
        stock_level: f.quantity,
        reorder_point: f.min_stock,
        unit_price: f.sell_price,
        updated_at: new Date().toISOString().split("T")[0]
      }));

      setItems([...activeItems, ...mappedLenses, ...mappedFrames]);

      if (needsSave) {
        setInventoryTrigger(prev => prev + 1);
      }

      // Reset cart and fields
      setCart([]);
      setCustomerName("");
      setPaidOverride("");
      setSaleResult(null);
      setSearchTerm("");
      setSelectedCategory("all");
    }
  }, [isQuickSellOpen, lenses, frames]);

  // Filtered store items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  // Cart helper functions
  const addToCart = (item: InventoryItem) => {
    if (item.stock_level <= 0) {
      alert(lang === "ar" ? "هذا المنتج غير متوفر في المخون حالياً!" : "Out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        if (existing.qty >= item.stock_level) {
          alert(lang === "ar" ? `لا يمكن تجاوز الكمية المتوفرة: ${item.stock_level}` : `Cannot exceed available stock of ${item.stock_level}`);
          return prev;
        }
        return prev.map(c => c.item.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const updateQty = (itemId: string, diff: number) => {
    setCart(prev => {
      return prev.map(c => {
        if (c.item.id === itemId) {
          const newQty = c.qty + diff;
          if (newQty <= 0) return null;
          if (newQty > c.item.stock_level) {
            alert(lang === "ar" ? `لا يمكن تجاوز الكمية المتوفرة: ${c.item.stock_level}` : `Cannot exceed available stock of ${c.item.stock_level}`);
            return c;
          }
          return { ...c, qty: newQty };
        }
        return c;
      }).filter((x): x is NonNullable<typeof x> => x !== null);
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  // Cart computations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, c) => sum + (c.item.unit_price * c.qty), 0);
  }, [cart]);

  const changeDue = useMemo(() => {
    const paid = paidOverride !== "" ? parseFloat(paidOverride) : cartSubtotal;
    if (isNaN(paid)) return 0;
    return Math.max(0, paid - cartSubtotal);
  }, [cartSubtotal, paidOverride]);

  // Confirm and save sale
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Check stock levels once more
    const overstocked = cart.find(c => c.qty > c.item.stock_level);
    if (overstocked) {
      alert(lang === "ar" 
        ? `عذراً، الكمية المطلوبة من (${overstocked.item.name}) أكبر من المخزون المتوفر (${overstocked.item.stock_level}).`
        : `Requested quantity for ${overstocked.item.name} exceeds available stock (${overstocked.item.stock_level}).`
      );
      return;
    }

    const payer = customerName.trim() || (lang === "ar" ? "زبون سفري مباشر" : "Walk-in Retail Customer");
    const actualPaid = paidOverride !== "" ? parseFloat(paidOverride) : cartSubtotal;
    
    if (isNaN(actualPaid) || actualPaid < 0) {
      alert(lang === "ar" ? "عذراً، يرجى كتابة قيمة دفع صحيحة" : "Please enter a valid paid amount");
      return;
    }

    const remainingAmount = Math.max(0, cartSubtotal - actualPaid);

    // 1. Prepare updated inventory items
    const updatedGlobalItems = items.map(gItem => {
      const sold = cart.find(c => c.item.id === gItem.id);
      if (sold) {
        return {
          ...gItem,
          stock_level: Math.max(0, gItem.stock_level - sold.qty),
          updated_at: new Date().toISOString().split("T")[0]
        };
      }
      return gItem;
    });

    // 2. Save pure general inventory back to localStorage, excluding prefixed lens_ and frame_ items
    const rawInventoryList = updatedGlobalItems.filter(gItem => !gItem.id.startsWith("lens_") && !gItem.id.startsWith("frame_"));
    localStorage.setItem("noor_inventory_items", JSON.stringify(rawInventoryList));

    // Update state immediately for instant rendering responsive feel
    setItems(updatedGlobalItems);

    // 2b. Update actual professional lenses database in ClinicContext
    setLenses((prevLenses: import("../types").LensItem[]) => prevLenses.map(l => {
      const sold = cart.find(c => c.item.id === `lens_${l.id}`);
      if (sold) {
        return {
          ...l,
          quantity: Math.max(0, l.quantity - sold.qty)
        };
      }
      return l;
    }));

    // 2c. Update actual professional frames database in ClinicContext
    setFrames((prevFrames: import("../types").FrameItem[]) => prevFrames.map(f => {
      const sold = cart.find(c => c.item.id === `frame_${f.id}`);
      if (sold) {
        return {
          ...f,
          quantity: Math.max(0, f.quantity - sold.qty)
        };
      }
      return f;
    }));

    // 3. Construct description strings
    const descArray = cart.map(c => `${c.qty}x ${c.item.name}`);
    const itemsDesc = descArray.join(", ");
    const diagnosisStr = lang === "ar"
      ? `بيع مباشر بالتجزئة من الواجهة السريعة للزبائن: ${cart.map(c => `${c.item.name} (عدد ${c.qty})`).join("، ")}`
      : `Walk-in POS Sale: ${itemsDesc}`;

    // 4. Create unified visit aggregator under a virtual walk-in retail patient
    const newVisitId = "v_retail_" + Math.random().toString(36).substring(7);
    const walkinVisit = {
      id: newVisitId,
      patient_id: "walkin_retail",
      customer_name: payer,
      visit_date: new Date().toISOString().split("T")[0],
      diagnosis: diagnosisStr,
      total_amount: cartSubtotal,
      amount_paid: actualPaid,
      remaining: remainingAmount,
    };

    setPatients((prevPatients: any[]) => {
      const retailIndex = prevPatients.findIndex(p => p.id === "walkin_retail");
      if (retailIndex !== -1) {
        const existing = prevPatients[retailIndex];
        const updatedVisits = [walkinVisit, ...(existing.visits || [])];
        return prevPatients.map((p, idx) => idx === retailIndex ? {
          ...p,
          last_visit: walkinVisit.visit_date,
          outstanding: (p.outstanding || 0) + remainingAmount,
          outstanding_remaining: (p.outstanding_remaining || 0) + remainingAmount,
          visits: updatedVisits
        } : p);
      } else {
        const newRetailCustomer = {
          id: "walkin_retail",
          full_name: lang === "ar" ? "زبائن البيع المباشر (سفري)" : "Walk-in Retail Customers",
          phone: "07XXXXXXXXX",
          age: 30,
          gender: "male",
          last_visit: walkinVisit.visit_date,
          outstanding: remainingAmount,
          outstanding_remaining: remainingAmount,
          updated_at: walkinVisit.visit_date,
          visits: [walkinVisit]
        };
        return [newRetailCustomer, ...prevPatients];
      }
    });

    // 5. Audit Log Entry
    logAction({
      action: "create",
      entity_type: "inventory",
      entity_id: newVisitId,
      entity_name: "Quick Direct Sale (POS)",
      details: `Direct Sell of ${itemsDesc} to ${payer}. Total: ${formatIQD(cartSubtotal)}. Paid: ${formatIQD(actualPaid)}`
    });

    // 6. Alert Inventory page to sync up
    setInventoryTrigger(prev => prev + 1);

    // Show beautiful receipt screen inside modal
    setSaleResult({
      success: true,
      customer: payer,
      total: cartSubtotal,
      paid: actualPaid,
      change: Math.max(0, actualPaid - cartSubtotal)
    });
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "lens": return lang === "ar" ? "عدسات النخبة" : "Precision Lenses";
      case "frame": return lang === "ar" ? "إطارات فاخرة" : "Designer Frames";
      case "accessory": return lang === "ar" ? "ملحقات مكملة" : "Elite Accessories";
      case "contact_lens": return lang === "ar" ? "عدسات لاصقة" : "Contact Lenses";
      case "reading_frame": return lang === "ar" ? "نظارات قراءة جاهزة" : "Reading Frames";
      default: return lang === "ar" ? "أخرى" : "Other";
    }
  };

  if (!isQuickSellOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      {/* Backdrop with premium deep glass-morphism & amber hue glow */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-[#12070a]/90 via-[#260e15]/85 to-[#0e0406]/90 backdrop-blur-md transition-opacity" 
        onClick={() => setIsQuickSellOpen(false)}
      />

      {/* Modal Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 30 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        className="relative bg-cream border-2 border-gold/40 rounded-[32px] shadow-3xl w-full max-w-5xl h-[92vh] md:h-[88vh] flex flex-col overflow-hidden ring-1 ring-gold/25"
        style={{ direction: lang === "ar" ? "rtl" : "ltr" }}
      >
        {/* Luxury Background Ambient Beams */}
        <div className="absolute top-0 right-1/4 w-[500px] h-32 bg-gold/10 blur-[100px] pointer-events-none rounded-full" />
        <div className="absolute bottom-0 left-10 w-96 h-48 bg-burgundy/5 blur-[80px] pointer-events-none rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-amber-500/5 blur-[50px] pointer-events-none rounded-full" />

        {/* Header (Boutique Style) */}
        <div className="bg-white px-6 py-5 border-b-2 border-cream-border/60 flex justify-between items-center shrink-0 relative z-10 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-burgundy to-[#4a0812] text-white flex items-center justify-center shadow-lg shadow-burgundy/15 shrink-0 border border-gold/25">
              <ShoppingCart size={22} className="stroke-[2] text-gold" style={{ filter: "drop-shadow(0px 1px 2px rgba(0,0,0,0.25))" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-sans font-black text-gold tracking-widest uppercase bg-burgundy px-2 py-0.5 rounded border border-gold/20 leading-none">
                  {lang === "ar" ? "مبيعات فورية • كاشير" : "BOUTIQUE EXPRESS POS"}
                </span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <h3 className="font-serif font-black text-xl text-ink tracking-tight mt-1">
                {lang === "ar" ? "بوابة الفوترة السريعة المباشرة" : "Direct POS Retail Workspace"}
              </h3>
              <p className="text-[10px] text-ink-light tracking-wide uppercase font-sans mt-0.5">
                {lang === "ar" 
                  ? "إصدار فوري للفواتير وتحديث تلقائي للرفوف دون إنشاء سجل ملف مريض مسبقاً" 
                  : "Skip clinical pathways. Tap shelved goods to decrement absolute stock levels & sync register"}
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => setIsQuickSellOpen(false)}
            className="p-2.5 bg-cream/50 hover:bg-cream hover:border-gold/30 rounded-xl transition-all text-ink-light hover:text-burgundy cursor-pointer border border-cream-border"
          >
            <X size={18} className="stroke-[2.5]" />
          </button>
        </div>

        {saleResult ? (
          /* Receipt Success Screen (High Contrast Boutique Bill) */
          <div className="flex-1 overflow-y-auto p-6 sm:p-10 flex flex-col items-center justify-center text-center bg-[#faf8f4]">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring" }}
              className="w-16 h-16 rounded-full bg-emerald-50 border-4 border-emerald-500/15 text-emerald-600 flex items-center justify-center mb-4 shadow-sm"
            >
              <Check size={32} className="stroke-[3]" />
            </motion.div>
            
            <h4 className="text-3xl font-serif font-black text-ink mb-1 tracking-tight">
              {lang === "ar" ? "تم تأكيد المبيعات والقبض!" : "Transaction Confirmed!"}
            </h4>
            <p className="text-xs text-emerald-700 font-mono bg-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-1.5 mb-8 font-bold">
              {lang === "ar" ? "تم تعديل الأرقام الفورية للرفوف وحفظ المستند" : "INVENTORY CORRECTED & REVENUE PERSISTED IN SYSTEM"}
            </p>

            {/* Vintage ticket paper mockup */}
            <motion.div 
              initial={{ y: 25, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, type: "spring", damping: 20 }}
              className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-cream-border text-left text-sm space-y-4 mb-8 shadow-xl w-full max-w-md relative overflow-hidden"
            >
              {/* Decorative top security security lines */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-gold via-burgundy to-gold" />

              {/* Ticket jagged edge circles */}
              <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#faf8f4] border-r-2 border-cream-border" />
              <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#faf8f4] border-l-2 border-cream-border" />

              <div className="text-center pb-5 border-b-2 border-dashed border-cream-border">
                <span className="font-serif font-black text-ink tracking-wider text-[20px]">NOOR OPTICAL OMS</span>
                <p className="text-[10px] text-burgundy font-mono mt-1 font-bold tracking-widest uppercase">BOUTIQUE REGISTER RECEIPT</p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" />
                  <p className="text-[9px] text-ink-light font-mono tracking-widest uppercase inline-block">{new Date().toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 px-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-ink-light uppercase tracking-wider font-mono text-[9px] font-black">{lang === "ar" ? "العميل المستلم:" : "VISITOR / BUYER:"}</span>
                  <span className="font-bold text-ink bg-cream/80 px-2.5 py-1 rounded border border-cream-border text-xs tracking-tight">{saleResult.customer}</span>
                </div>
                
                <div className="flex justify-between items-center border-t border-cream-border/60 pt-3">
                  <span className="text-ink-light font-bold text-xs">{lang === "ar" ? "مبلغ البيع الإجمالي:" : "Invoice Net Sale:"}</span>
                  <span className="font-mono font-black text-ink text-base">{formatIQD(saleResult.total)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-ink-light text-xs">{lang === "ar" ? "المقبوض كاش:" : "Amount Received (Cash):"}</span>
                  <span className="font-bold text-burgundy font-mono text-sm">{formatIQD(saleResult.paid)}</span>
                </div>

                <div className="flex justify-between items-center border-t-2 border-dashed border-cream-border/80 pt-3.5">
                  <span className="text-ink font-serif font-black text-sm">{lang === "ar" ? "الفراطة المسترجعة للزبون:" : "Change Returned:"}</span>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-600 text-lg block">{formatIQD(saleResult.change)}</span>
                    <span className="text-[8px] font-mono text-emerald-500 uppercase tracking-widest block font-bold mt-0.5">{lang === "ar" ? "تم التسليم" : "DISPENSED LIVE"}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setCart([]);
                  setCustomerName("");
                  setPaidOverride("");
                  setSaleResult(null);
                }}
                className="px-6 py-3.5 bg-white border-2 border-cream-border text-ink rounded-2xl text-xs font-mono font-bold uppercase tracking-wider hover:border-burgundy/35 hover:bg-cream transition-all shadow-sm active:scale-95 cursor-pointer"
                id="sell-another-btn"
              >
                {lang === "ar" ? "تسجيل مبيعات جديدة" : "Register Another Sale"}
              </button>
              <button
                type="button"
                onClick={() => setIsQuickSellOpen(false)}
                className="px-6 py-3.5 bg-gradient-to-r from-burgundy to-[#4a0812] text-gold border border-gold/30 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider hover:brightness-110 shadow-lg shadow-burgundy/15 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                id="done-btn"
              >
                {lang === "ar" ? "إغلاق نافذة المبيعات" : "Close Register"}
              </button>
            </div>
          </div>
        ) : (
          /* POS Sales Screen Grid */
          <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Left Column: Products Listing (Clean Canvas Grid) */}
            <div className="md:w-3/5 p-5 sm:p-6 flex flex-col h-full overflow-hidden bg-white">
              
              {/* Product Shelf Search & Filter tray */}
              <div className="space-y-4 shrink-0 mb-5 pb-4 border-b border-cream-border/50">
                <div className="relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 left-3.5 text-gold stroke-[2.5]" size={15} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={lang === "ar" ? "ابحث بالاسم أو باركود SKU للمنتج..." : "Scan or write product name, model SKU..."}
                    className="w-full bg-[#FAF8F5] border-2 border-cream-border hover:border-gold/30 focus:border-burgundy rounded-2xl py-3 pl-10 pr-4 text-xs sm:text-sm outline-none transition-all font-sans text-ink placeholder:text-ink-light"
                    id="modal-search"
                  />
                  {searchTerm && (
                    <button 
                      type="button"
                      onClick={() => setSearchTerm("")} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] uppercase font-black text-burgundy bg-burgundy/10 hover:bg-burgundy/20 px-2 py-1 rounded"
                    >
                      {lang === "ar" ? "تصفية" : "Reset"}
                    </button>
                  )}
                </div>

                {/* Categories with custom aesthetic pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  <span className="text-[8px] font-sans font-bold text-[#b5a38a] uppercase tracking-widest shrink-0 hidden sm:inline">
                    {lang === "ar" ? "تصفية الدرج:" : "SHELF DRAWER:"}
                  </span>
                  
                  {["all", "lens", "frame", "contact_lens", "reading_frame", "accessory"].map((cat) => {
                    const iconMap: Record<string, React.ReactNode> = {
                      all: <Package size={12} className="stroke-[2.5]" />,
                      lens: <Sparkles size={12} className="stroke-[2.5]" />,
                      frame: <Layers size={12} className="stroke-[2.5]" />,
                      contact_lens: <Eye size={12} className="stroke-[2.5]" />,
                      reading_frame: <BookOpen size={12} className="stroke-[2.5]" />,
                      accessory: <ShoppingBag size={12} className="stroke-[2.5]" />
                    };

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest whitespace-nowrap border-2 transition-all cursor-pointer select-none flex items-center gap-1.5 shadow-xs",
                          selectedCategory === cat 
                            ? "bg-burgundy text-gold border-burgundy shadow-md shadow-burgundy/10"
                            : "bg-white text-ink-mid border-cream-border hover:border-gold/40 hover:text-burgundy"
                        )}
                      >
                        {iconMap[cat]}
                        <span className={cat === "all" ? "font-sans font-bold" : "font-[Verdana]"}>{cat === "all" ? (lang === "ar" ? "الرف بالكامل" : "All Shelves") : getCategoryLabel(cat)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid of items with improved font-weights & contrast */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2">
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-ink-light bg-[#FAF8F5] rounded-3xl border-2 border-dashed border-cream-border">
                    <div className="w-12 h-12 bg-cream rounded-full flex items-center justify-center mb-3">
                      <Package size={22} className="text-[#c0ad97] stroke-[1.5]" />
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-ink-mid mb-1">{lang === "ar" ? "لا توجد مواد مخزنة مطابقة لبحثك" : "No registered goods found"}</p>
                    <p className="text-[10px] sm:text-xs text-ink-light max-w-[280px] mx-auto leading-relaxed">{lang === "ar" ? "تأكد من اختيار التصنيف الصحيح أو رمز مادة مسجلة في قائمة المستودع" : "Double-check your spelling, search barcode, or shift the shelf category filter."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredItems.map(item => {
                      const isOutOfStock = item.stock_level <= 0;
                      const cartQty = cart.find(c => c.item.id === item.id)?.qty || 0;
                      const isLowStock = item.stock_level <= item.reorder_point;

                      return (
                        <motion.div
                          key={item.id}
                          whileHover={!isOutOfStock ? { y: -3, scale: 1.01 } : {}}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                          onClick={() => !isOutOfStock && addToCart(item)}
                          className={cn(
                            "bg-[#fdfcfb] border-2 rounded-2xl p-4 flex flex-col justify-between cursor-pointer transition-all select-none relative group shadow-xs hover:shadow-lg hover:border-gold/60",
                            isOutOfStock ? "opacity-35 cursor-not-allowed bg-[#FAF8F5]/50 border-cream-border" : "border-cream-border/70",
                            cartQty > 0 ? "border-gold/80 bg-[#fffdfa] ring-2 ring-gold/25" : ""
                          )}
                        >
                          {cartQty > 0 && (
                            <span className="absolute top-3.5 right-3.5 bg-burgundy text-gold text-[9px] px-2.5 py-1 rounded-lg font-black font-mono tracking-widest uppercase shadow-sm">
                              {cartQty} {lang === "ar" ? "سلة" : "in slot"}
                            </span>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-[8px] font-[Verdana] font-black text-gold bg-burgundy px-2 py-0.5 rounded uppercase tracking-widest inline-block shrink-0">
                                {item.category === "lens" 
                                  ? "RX Lens" 
                                  : item.category === "frame" 
                                    ? "Designer" 
                                    : item.category === "contact_lens"
                                      ? "Contact"
                                      : item.category === "reading_frame"
                                        ? "Reader"
                                        : "OTC ACC"}
                              </span>
                              <div className="text-[9px] text-[#b5a38a] font-mono leading-none tracking-widest uppercase bg-cream px-1.5 py-0.5 rounded">
                                {item.sku || "NO-SKU"}
                              </div>
                            </div>
                            
                            <h4 className="font-sans font-black text-[13px] text-ink group-hover:text-burgundy transition-colors leading-relaxed line-clamp-2 h-10 overflow-hidden pr-8" title={item.name}>
                              {item.name}
                            </h4>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-cream-border/70">
                            <div>
                              <p className="text-[12px] font-[Verdana] font-bold text-ink-light uppercase leading-none tracking-wider mb-1">{lang === "ar" ? "سعر التجزئة" : "RETAIL PRICE"}</p>
                              <span className="text-xs sm:text-sm font-mono font-black text-burgundy">
                                {formatIQD(item.unit_price)}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={cn(
                                "text-[9px] uppercase font-mono font-black tracking-widest px-2 py-1 rounded-lg inline-block",
                                isOutOfStock 
                                  ? "bg-rose-50 text-rose-600 border border-rose-100" 
                                  : isLowStock 
                                    ? "bg-amber-50 text-amber-600 border border-amber-100 animate-pulse" 
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              )}>
                                {isOutOfStock 
                                  ? (lang === "ar" ? "إنتهى الكلي" : "DELETED") 
                                  : `${lang === "ar" ? "على الرف:" : "QTY:"} ${item.stock_level}`}
                              </span>
                            </div>
                          </div>
                          
                          {/* Elegantly overlayed interactive feedback */}
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-cream hover:bg-gold hover:text-ink flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md scale-90 group-hover:scale-100 border border-cream-border">
                            <Plus size={14} className="stroke-[2.5]" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Invoice / Checkout Cart (Polished Sidebar Pane) */}
            <div className="md:w-2/5 p-5 sm:p-6 bg-[#FAF7F2] flex flex-col h-full overflow-hidden justify-between border-t md:border-t-0 md:border-l-2 border-cream-border/80 shadow-inner">
              <div className="flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center mb-4 shrink-0 px-1 border-b border-cream-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Hash size={13} className="text-gold stroke-[2.5]" />
                    <span className="font-[Verdana] font-black text-[10px] uppercase text-ink tracking-widest">
                      {lang === "ar" ? "سلة المبيعات المباشرة" : "ACTIVE EXPORT LIST"}
                    </span>
                  </div>
                  <span className="text-[10px] bg-burgundy text-gold font-mono font-bold px-3 py-1 rounded-full tracking-wider uppercase shadow-xs">
                    {cart.reduce((acc, c) => acc + c.qty, 0)} {lang === "ar" ? "عناصر" : "ITEMS"}
                  </span>
                </div>

                {/* Cart list container */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink-light border-2 border-dashed border-cream-border/60 rounded-3xl bg-white/45">
                      <div className="w-14 h-14 rounded-full bg-[#fcfbfa] flex items-center justify-center mb-3 text-ink-light shadow-xs border border-cream-border">
                        <ShoppingCart size={24} className="stroke-[1.5] scale-110 opacity-40" />
                      </div>
                      <p className="text-xs font-serif font-black text-ink-mid">{lang === "ar" ? "سلة الفواتير المباشرة فارغة" : "Sales Registry is Empty"}</p>
                      <p className="text-[10px] text-ink-light mt-1.5 max-w-[200px] mx-auto leading-relaxed">
                        {lang === "ar" ? "قم باختيار المنتجات المتوفرة على اليسار للبدء بالفوترة" : "Begin direct checkout by selecting designer structures inside shelves."}
                      </p>
                    </div>
                  ) : (
                    cart.map(({ item, qty }) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={item.id} 
                        className="bg-white border-2 border-cream-border/60 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm relative overflow-hidden"
                      >
                        {/* Decorative left accent */}
                        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gold" />
                        
                        <div className="flex justify-between items-start gap-2 pl-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-[8px] font-mono font-bold text-[#b5a38a] uppercase tracking-wider">{item.sku || "SKU-N/A"}</span>
                            <h5 className="text-xs font-serif font-black text-ink leading-snug line-clamp-1 pr-4" title={item.name}>
                              {item.name}
                            </h5>
                          </div>
                          <button 
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="p-1 text-ink hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                            title="Discard"
                          >
                            <Trash2 size={13} className="stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Dot leader invoice preview element */}
                        <div className="flex justify-between items-baseline gap-1.5 text-[11px] px-2 text-ink-mid">
                          <span className="shrink-0">{qty}x {formatIQD(item.unit_price)}</span>
                          <div className="flex-1 border-b border-dotted border-cream-border/80 h-1" />
                          <span className="font-mono font-bold tracking-tight shrink-0 text-burgundy">{formatIQD(item.unit_price * qty)}</span>
                        </div>

                        <div className="flex justify-between items-center bg-[#FAF8F5] px-2.5 py-1.5 rounded-xl border border-cream-border/60 mt-0.5">
                          {/* Quantity selector */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, -1)}
                              className="w-6 h-6 rounded-lg bg-white border border-cream-border flex items-center justify-center text-ink hover:text-burgundy hover:border-burgundy/40 transition-all shadow-xs cursor-pointer"
                            >
                              <Minus size={10} className="stroke-[3]" />
                            </button>
                            <span className="text-xs font-mono font-bold text-ink w-6 text-center select-none">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, 1)}
                              className="w-6 h-6 rounded-lg bg-white border border-cream-border flex items-center justify-center text-ink hover:text-burgundy hover:border-burgundy/40 transition-all shadow-xs cursor-pointer"
                            >
                              <Plus size={10} className="stroke-[3]" />
                            </button>
                          </div>

                          <div className="text-[10px] font-mono text-ink-light">
                            {lang === "ar" ? "قيمة مجمّعة" : "COMPOUND"}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="border-t-2 border-cream-border/80 pt-4 mt-auto space-y-4 shrink-0 px-1 relative z-10">
                
                {/* Optional Customer Name */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-[Verdana] font-black text-ink-light uppercase tracking-widest block">
                      {lang === "ar" ? "الاسم الكامل للمشتري (اختياري):" : "WALK-IN PASSPORT / VISITOR ID (OPTIONAL):"}
                    </label>
                    <span className="text-[8px] font-mono text-gold uppercase bg-burgundy-pale px-1 rounded">WALK-IN</span>
                  </div>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" size={13} />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder={lang === "ar" ? "مثال: زبون سفري، علي..." : "E.g. Anonymous cash buyer..."}
                      className="w-full bg-white border-2 border-cream-border hover:border-gold/30 rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-burgundy transition-all text-ink font-sans placeholder:text-ink-light"
                      id="pos-customer-name"
                    />
                  </div>
                </div>

                {/* Subtotal View (Enriched style) */}
                <div className="bg-white border-2 border-cream-border rounded-2xl p-3 flex justify-between items-center shadow-xs">
                  <div>
                    <span className="text-[9px] font-sans font-black text-ink-light block uppercase tracking-widest leading-none mb-1">
                      {lang === "ar" ? "الحساب الكلي:" : "GROSS VALUE CERTIFICATE:"}
                    </span>
                    <span className="text-xs font-serif font-black text-ink-mid">
                      {lang === "ar" ? "صافي المقابل للمشتريات" : "Unified Net Balance"}
                    </span>
                  </div>
                  <span className="text-base sm:text-lg text-burgundy font-mono font-black px-4 py-1.5 rounded-xl bg-[#fffcf8] border border-cream-border shadow-xs">
                    {formatIQD(cartSubtotal)}
                  </span>
                </div>

                {/* Invoice Payment override */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[9px] font-mono font-black text-ink-light uppercase tracking-widest block">
                      {lang === "ar" ? "المبلغ المستلم كاش بالفعل (لحساب المتبقي):" : "TOTAL RECEIVED CASH AT DRAWER:"}
                    </label>
                    <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1 rounded">IQD CASH</span>
                  </div>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gold" size={13} />
                    <input
                      type="number"
                      value={paidOverride}
                      onChange={(e) => setPaidOverride(e.target.value)}
                      placeholder={cartSubtotal > 0 ? cartSubtotal.toString() : (lang === "ar" ? "المبلغ المستلم..." : "Enter exact received bill amount...")}
                      className="w-full bg-white border-2 border-cream-border rounded-xl py-2.5 pl-9 pr-4 text-xs outline-none focus:border-burgundy transition-all font-[Verdana] text-ink text-left"
                      id="paid-override-field"
                    />
                  </div>
                </div>

                {/* Change calculation */}
                {cartSubtotal > 0 && parseFloat(paidOverride) > cartSubtotal && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center text-xs text-emerald-850 bg-emerald-500/10 border-2 border-emerald-500/25 p-3 rounded-2xl shadow-sm"
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-emerald-600 stroke-[2.5]" />
                      <span className="font-bold text-emerald-800">{lang === "ar" ? "الفراطة المرتجعة للعميل:" : "Dispense Balance Change:"}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-700 text-sm">{formatIQD(changeDue)}</span>
                  </motion.div>
                )}

                {/* Checkout Submit button */}
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className={cn(
                    "w-full py-3.5 sm:py-4 rounded-xl font-sans text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transform active:scale-95 transition-all cursor-pointer border-2 shadow-lg",
                    cart.length === 0 
                      ? "bg-cream-border text-ink-light border-cream-border shadow-none cursor-not-allowed" 
                      : "bg-gradient-to-r from-burgundy via-[#520d18] to-burgundy text-gold border-burgundy hover:brightness-110 shadow-burgundy/15 hover:shadow-2xl"
                  )}
                  id="checkout-confirm"
                >
                  <Sparkles size={14} className="stroke-[2.5] text-gold animate-bounce" />
                  <span>{lang === "ar" ? "إثبات عملية البيع المباشر وطباعة" : "PROCESS & INVOICE DIRECT RET"}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
