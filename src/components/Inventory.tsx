import React, { useState, useMemo, useEffect } from "react";
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
  Disc,
  Glasses,
  User,
  Phone,
  Mail,
  MapPin,
  Check,
  ShoppingCart,
  ShoppingBag,
  Trash2,
  Edit2,
  X,
  Minus,
  Info,
  CreditCard
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { useScrollLock } from "../hooks/useScrollLock";
import { formatIQD, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { InventoryItem, Supplier } from "../types";

export function Inventory() {
  const { 
    t, 
    lang, 
    isLoading, 
    setPatients, 
    logAction, 
    inventoryFilter, 
    setInventoryFilter, 
    inventoryTrigger,
    lenses,
    setLenses,
    frames,
    setFrames
  } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"items" | "suppliers">("items");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState<"all" | "low_stock">("all");

  // Load items from localStorage or use defaults
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem("noor_inventory_items");
    let activeItems: InventoryItem[] = [];
    if (saved) {
      try {
        activeItems = JSON.parse(saved);
      } catch (err) {
        console.error("Error loading inventory items", err);
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
      localStorage.setItem("noor_inventory_items", JSON.stringify(activeItems));
    } else {
      let needsSave = false;
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
      if (needsSave) {
        localStorage.setItem("noor_inventory_items", JSON.stringify(activeItems));
      }
    }
    return activeItems;
  });

  useEffect(() => {
    if (inventoryFilter === "low_stock") {
      setStockFilter("low_stock");
      setActiveTab("items");
    } else {
      setStockFilter("all");
    }
  }, [inventoryFilter]);

  const [supplierSearch, setSupplierSearch] = useState("");

  // 1. Load suppliers with localStorage fallback
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem("noor_suppliers");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading suppliers", e);
      }
    }
    return [
      { id: "s1", name: "Optical Global Distribution", contact_person: "Mazen Ahmed", phone: "+964 770 123 4567", email: "sales@opticalglobal.com", address: "Baghdad, Al-Mansour", payment_terms: "Net 30" },
      { id: "s2", name: "Vision Care Lenses Co.", contact_person: "Sarah Khalid", phone: "+964 780 987 6543", email: "orders@visioncare.iq", address: "Erbil, 60m Street", payment_terms: "Direct Payment" },
    ];
  });

  // Save suppliers whenever state changes
  useEffect(() => {
    localStorage.setItem("noor_suppliers", JSON.stringify(suppliers));
  }, [suppliers]);

  // 2. Load and save supplier orders
  const [supplierOrders, setSupplierOrders] = useState<any[]>(() => {
    const saved = localStorage.getItem("noor_supplier_orders");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Error reading supplier orders", err);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem("noor_supplier_orders", JSON.stringify(supplierOrders));
  }, [supplierOrders]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || 
      (s.contact_person && s.contact_person.toLowerCase().includes(supplierSearch.toLowerCase()))
    );
  }, [suppliers, supplierSearch]);

  // Modal States for Suppliers & Place Orders
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    payment_terms: "Direct Payment"
  });

  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderSupplier, setOrderSupplier] = useState<Supplier | null>(null);
  const [orderFormData, setOrderFormData] = useState({
    itemId: "custom", // combined items or "custom" for newly bought
    customItemName: "",
    quantity: 10,
    unitCost: 15000,
    category: "accessory"
  });

  // Save items back to localStorage upon updates
  useEffect(() => {
    localStorage.setItem("noor_inventory_items", JSON.stringify(items));
  }, [items]);

  // Sync state if quick sale popup does a write
  useEffect(() => {
    const saved = localStorage.getItem("noor_inventory_items");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (err) {
        console.error("Error refreshing inventory items", err);
      }
    }
  }, [inventoryTrigger]);

  // Quick Sale (POS Cart) States
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [quantitiesToSell, setQuantitiesToSell] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [paidOverride, setPaidOverride] = useState("");
  const [saleResult, setSaleResult] = useState<{
    success: boolean;
    customer: string;
    total: number;
    paid: number;
    change: number;
    itemsCount: number;
  } | null>(null);

  // Add & Edit Product Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  
  // Prevent scroll when edit/add modal is active
  useScrollLock(isAddEditOpen);

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "accessory" as InventoryItem["category"],
    sku: "",
    stock_level: 10,
    reorder_point: 2,
    unit_price: 5000,
  });

  const combinedItems = useMemo(() => {
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

    return [...items, ...mappedLenses, ...mappedFrames];
  }, [items, lenses, frames]);

  const filteredItems = useMemo(() => {
    return combinedItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
      const matchesStock = stockFilter === "all" || item.stock_level <= item.reorder_point;
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [combinedItems, searchTerm, categoryFilter, stockFilter]);

  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleSelectLowStockItem = (item: any) => {
    setIsSearchExpanded(true);
    setSearchTerm(item.sku || item.name);
    setCategoryFilter("all");
    setStockFilter("all");
    setTimeout(() => {
      const el = document.getElementById("inventory-search");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.focus();
      }
    }, 150);
  };

  const stats = useMemo(() => {
    const lowStockItemsCount = combinedItems.filter(i => i.stock_level <= i.reorder_point).length;
    const totalItems = combinedItems.reduce((acc, i) => acc + i.stock_level, 0);
    const totalValue = combinedItems.reduce((acc, i) => acc + (i.stock_level * i.unit_price), 0);
    return { lowStock: lowStockItemsCount, totalItems, totalValue };
  }, [combinedItems]);

  const lowStockItems = useMemo(() => {
    return combinedItems.filter(i => i.stock_level <= i.reorder_point);
  }, [combinedItems]);

  // Cart operations helpers
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        return prev.filter(itemId => itemId !== id);
      } else {
        setQuantitiesToSell(q => ({ ...q, [id]: 1 }));
        return [...prev, id];
      }
    });
  };

  const isAllFilteredSelected = filteredItems.length > 0 && filteredItems.every(i => selectedItemIds.includes(i.id));
  
  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      setSelectedItemIds(prev => prev.filter(id => !filteredItems.some(f => f.id === id)));
    } else {
      const newIds = [...selectedItemIds];
      filteredItems.forEach(f => {
        if (!newIds.includes(f.id)) {
          newIds.push(f.id);
          setQuantitiesToSell(q => ({ ...q, [f.id]: q[f.id] || 1 }));
        }
      });
      setSelectedItemIds(newIds);
    }
  };

  const updateQuantityToSell = (id: string, delta: number) => {
    const item = combinedItems.find(i => i.id === id);
    if (!item) return;
    setQuantitiesToSell(q => {
      const current = q[id] || 1;
      const next = Math.max(1, current + delta);
      return { ...q, [id]: next };
    });
  };

  // Compute Checkout totals
  const selectedCartItems = useMemo(() => {
    return selectedItemIds
      .map(id => {
        const item = combinedItems.find(i => i.id === id);
        const qty = quantitiesToSell[id] || 1;
        return item ? { ...item, qty, subtotal: item.unit_price * qty } : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [selectedItemIds, combinedItems, quantitiesToSell]);

  const cartTotalAmount = useMemo(() => {
    return selectedCartItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [selectedCartItems]);

  const defaultPaidAmount = cartTotalAmount;

  // Render product categories nicely
  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "lens": return lang === "ar" ? "عدسة" : "Lens";
      case "frame": return lang === "ar" ? "إطار" : "Frame";
      case "accessory": return lang === "ar" ? "إكسسوار" : "Accessory";
      case "contact_lens": return lang === "ar" ? "عدسات لاصقة" : "Contact Lens";
      case "reading_frame": return lang === "ar" ? "إطار قراءة" : "Reading Frame";
      default: return lang === "ar" ? "أخرى" : "Other";
    }
  };

  // Handle Quick Retail Sale confirmation
  const handleRegisterQuickSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCartItems.length === 0) return;

    const payerName = customerName.trim() || (lang === "ar" ? "زبون سفري مباشر" : "Walk-in Retail Customer");
    const actualPaid = paidOverride !== "" ? parseFloat(paidOverride) : cartTotalAmount;
    
    if (isNaN(actualPaid) || actualPaid < 0) {
      alert(lang === "ar" ? "الرجاء كيتان قيمة الدفع بالشكل الصحيح" : "Please enter a valid paid amount");
      return;
    }

    const remainingAmount = Math.max(0, cartTotalAmount - actualPaid);

    // 1. Decrement inventory stock levels
    setItems(prevItems => prevItems.map(item => {
      const soldItem = selectedCartItems.find(s => s.id === item.id);
      if (soldItem) {
        return {
          ...item,
          stock_level: Math.max(0, item.stock_level - soldItem.qty),
          updated_at: new Date().toISOString().split("T")[0]
        };
      }
      return item;
    }));

    // 1b. Update actual professional lenses database in ClinicContext
    setLenses((prevLenses: import("../types").LensItem[]) => prevLenses.map(l => {
      const sold = selectedCartItems.find(c => c.id === `lens_${l.id}`);
      if (sold) {
        return {
          ...l,
          quantity: Math.max(0, l.quantity - sold.qty)
        };
      }
      return l;
    }));

    // 1c. Update actual professional frames database in ClinicContext
    setFrames((prevFrames: import("../types").FrameItem[]) => prevFrames.map(f => {
      const sold = selectedCartItems.find(c => c.id === `frame_${f.id}`);
      if (sold) {
        return {
          ...f,
          quantity: Math.max(0, f.quantity - sold.qty)
        };
      }
      return f;
    }));

    // 2. Map sold items descriptive string
    const itemsDesc = selectedCartItems.map(s => `${s.qty}x ${s.name}`).join(", ");
    const diagnosisStr = lang === "ar"
      ? `بيع مباشر بالتجزئة: ${selectedCartItems.map(s => `${s.name} (عدد ${s.qty})`).join("، ")}`
      : `Retail Sale: ${itemsDesc}`;

    // 3. Create a unified visit model integration
    const newVisitId = "v_retail_" + Math.random().toString(36).substring(7);
    const walkinVisit = {
      id: newVisitId,
      patient_id: "walkin_retail",
      customer_name: payerName,
      visit_date: new Date().toISOString().split("T")[0],
      diagnosis: diagnosisStr,
      total_amount: cartTotalAmount,
      amount_paid: actualPaid,
      remaining: remainingAmount,
    };

    // 4. Update core patient record state so it rolls into Reports/Finances instantly
    setPatients((prevPatients: any[]) => {
      // Find if we already have the global Walk-In Retail container
      const retailIndex = prevPatients.findIndex(p => p.id === "walkin_retail");
      if (retailIndex !== -1) {
        const existing = prevPatients[retailIndex];
        const updatedVisits = [walkinVisit, ...(existing.visits || [])];
        return prevPatients.map((p, idx) => idx === retailIndex ? {
          ...p,
          last_visit: walkinVisit.visit_date,
          outstanding: (p.outstanding || 0) + remainingAmount,
          visits: updatedVisits
        } : p);
      } else {
        // Bootstrap Walk-in sales aggregator patient
        const newRetailCustomer = {
          id: "walkin_retail",
          full_name: lang === "ar" ? "زبائن البيع المباشر (سفري)" : "Walk-in Retail Customers",
          phone: "07XXXXXXXXX",
          age: 30,
          gender: "male",
          last_visit: walkinVisit.visit_date,
          outstanding: remainingAmount,
          updated_at: walkinVisit.visit_date,
          outstanding_remaining: remainingAmount,
          visits: [walkinVisit]
        };
        return [newRetailCustomer, ...prevPatients];
      }
    });

    // 5. Audit log tracking
    logAction({
      action: "create",
      entity_type: "inventory",
      entity_id: newVisitId,
      entity_name: "Quick Direct Sale",
      details: `Direct Sell of ${itemsDesc} to ${payerName}. Total: ${formatIQD(cartTotalAmount)}. Paid: ${formatIQD(actualPaid)}`
    });

    // State presentation setup
    setSaleResult({
      success: true,
      customer: payerName,
      total: cartTotalAmount,
      paid: actualPaid,
      change: Math.max(0, actualPaid - cartTotalAmount),
      itemsCount: selectedCartItems.reduce((acc, i) => acc + i.qty, 0)
    });

    // Reset checkout forms
    setSelectedItemIds([]);
    setCustomerName("");
    setNotes("");
    setPaidOverride("");
  };

  // Add & Edit operational mechanics
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      category: "accessory",
      sku: "AC-" + Math.floor(100 + Math.random() * 900),
      stock_level: 10,
      reorder_point: 2,
      unit_price: 5000
    });
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku || "AC-" + Math.floor(100 + Math.random() * 900),
      stock_level: item.stock_level,
      reorder_point: item.reorder_point,
      unit_price: item.unit_price
    });
    setIsAddEditOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا المنتج نهائياً من المخزن؟" : "Are you sure you want to delete this product from inventory?")) {
      setItems(prev => prev.filter(i => i.id !== id));
      setSelectedItemIds(prev => prev.filter(i => i !== id));
      logAction({
        action: "delete",
        entity_type: "inventory",
        entity_id: id,
        entity_name: "Inventory Product Removal",
        details: `Deleted item ID ${id} from OTC list`
      });
    }
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert(lang === "ar" ? "اسم المنتج مطلوب" : "Product name is required");
      return;
    }

    if (editingItem) {
      // Modify existing
      setItems(prev => prev.map(i => i.id === editingItem.id ? {
        ...i,
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        stock_level: Number(formData.stock_level),
        reorder_point: Number(formData.reorder_point),
        unit_price: Number(formData.unit_price),
        updated_at: new Date().toISOString().split("T")[0]
      } : i));

      logAction({
        action: "update",
        entity_type: "inventory",
        entity_id: editingItem.id,
        entity_name: formData.name,
        details: `Modified product configuration or stock totals.`
      });
    } else {
      // Append new product
      const newItem: InventoryItem = {
        id: "prod_" + Math.random().toString(36).substring(7),
        name: formData.name,
        category: formData.category,
        sku: formData.sku,
        stock_level: Number(formData.stock_level),
        reorder_point: Number(formData.reorder_point),
        unit_price: Number(formData.unit_price),
        updated_at: new Date().toISOString().split("T")[0]
      };

      setItems(prev => [newItem, ...prev]);

      logAction({
        action: "create",
        entity_type: "inventory",
        entity_id: newItem.id,
        entity_name: newItem.name,
        details: `Created new miscellaneous/OTC retail product.`
      });
    }

    setIsAddEditOpen(false);
  };

  // Suppliers & Orders Handlers
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierFormData({
      name: "",
      contact_person: "",
      phone: "",
      email: "",
      address: "",
      payment_terms: "Direct Payment"
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      payment_terms: supplier.payment_terms || "Direct Payment"
    });
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(lang === "ar" ? `هل أنت متأكد من حذف المجهز ماليًا (${name})؟` : `Are you sure you want to delete supplier [${name}]?`)) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      logAction({
        action: "delete",
        entity_type: "supplier",
        entity_id: id,
        entity_name: name,
        details: `Deleted supplier ${name}`
      });
    }
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierFormData.name.trim()) {
      alert(lang === "ar" ? "اسم المجهز مطلوب" : "Supplier name is required");
      return;
    }

    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? {
        ...s,
        name: supplierFormData.name,
        contact_person: supplierFormData.contact_person,
        phone: supplierFormData.phone,
        email: supplierFormData.email,
        address: supplierFormData.address,
        payment_terms: supplierFormData.payment_terms,
      } : s));
      logAction({
        action: "update",
        entity_type: "supplier",
        entity_id: editingSupplier.id,
        entity_name: supplierFormData.name,
        details: `Updated supplier details.`
      });
    } else {
      const newSupplier: Supplier = {
        id: "sup_" + Math.random().toString(36).substring(7),
        name: supplierFormData.name,
        contact_person: supplierFormData.contact_person,
        phone: supplierFormData.phone,
        email: supplierFormData.email,
        address: supplierFormData.address,
        payment_terms: supplierFormData.payment_terms
      };
      setSuppliers(prev => [newSupplier, ...prev]);
      logAction({
        action: "create",
        entity_type: "supplier",
        entity_id: newSupplier.id,
        entity_name: newSupplier.name,
        details: `Added new supplier: ${newSupplier.name}`
      });
    }
    setIsSupplierModalOpen(false);
  };

  const handleOpenPlaceOrder = (supplier: Supplier) => {
    setOrderSupplier(supplier);
    setOrderFormData({
      itemId: "custom",
      customItemName: "",
      quantity: 10,
      unitCost: 15000,
      category: "accessory"
    });
    setIsOrderModalOpen(true);
  };

  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderSupplier) return;
    if (!orderFormData.quantity || orderFormData.quantity <= 0) {
      alert(lang === "ar" ? "الكمية المطلوبة يجب أن تكون أكبر من 0" : "Quantity must be greater than zero");
      return;
    }
    if (!orderFormData.unitCost || orderFormData.unitCost <= 0) {
      alert(lang === "ar" ? "تكلفة القطعة يجب أن تكون أكبر من 0" : "Unit cost must be greater than zero");
      return;
    }

    let selectedItemName = "";
    if (orderFormData.itemId === "custom") {
      if (!orderFormData.customItemName.trim()) {
        alert(lang === "ar" ? "يرجى كتابة اسم المنتج المخصص الجديد للمخزن" : "Please output custom item name for procurement");
        return;
      }
      selectedItemName = orderFormData.customItemName;
    } else {
      const match = combinedItems.find(i => i.id === orderFormData.itemId);
      selectedItemName = match ? match.name : orderFormData.itemId;
    }

    const totalCost = Number(orderFormData.quantity) * Number(orderFormData.unitCost);

    // 1. Record Supplier Order
    const newOrder = {
      id: "ord_" + Math.random().toString(36).substring(7),
      supplier_id: orderSupplier.id,
      supplier_name: orderSupplier.name,
      item_name: selectedItemName,
      quantity: Number(orderFormData.quantity),
      unit_cost: Number(orderFormData.unitCost),
      total_cost: totalCost,
      date: new Date().toISOString().split("T")[0],
      status: "received"
    };

    setSupplierOrders(prev => [newOrder, ...prev]);

    // 2. Replenish stock levels
    if (orderFormData.itemId !== "custom") {
      const itemId = orderFormData.itemId;
      if (itemId.startsWith("lens_")) {
        const rawId = itemId.replace("lens_", "");
        setLenses((prev: any[]) => prev.map(l => l.id === rawId ? { ...l, quantity: l.quantity + Number(orderFormData.quantity) } : l));
      } else if (itemId.startsWith("frame_")) {
        const rawId = itemId.replace("frame_", "");
        setFrames((prev: any[]) => prev.map(f => f.id === rawId ? { ...f, quantity: f.quantity + Number(orderFormData.quantity) } : f));
      } else {
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, stock_level: i.stock_level + Number(orderFormData.quantity) } : i));
      }
    } else {
      // Create new OTC item automatically
      const newOtcProduct: InventoryItem = {
        id: "prod_otc_" + Math.random().toString(36).substring(7),
        name: selectedItemName,
        category: orderFormData.category as any,
        sku: "PO-" + orderSupplier.name.substring(0, 3).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900),
        stock_level: Number(orderFormData.quantity),
        reorder_point: 2,
        unit_price: Math.floor(Number(orderFormData.unitCost) * 1.35), // automatic 35% margin markup
        updated_at: new Date().toISOString().split("T")[0]
      };
      setItems(prev => [newOtcProduct, ...prev]);
    }

    // 3. Post operational expense in report section
    let currentExps: any[] = [];
    const savedExps = localStorage.getItem("noor_expenses");
    if (savedExps) {
      try {
        currentExps = JSON.parse(savedExps);
      } catch (err) {
        currentExps = [];
      }
    }
    const newExpenseEntry = {
      id: "e_ord_" + Math.random().toString(36).substring(7),
      description: lang === "ar"
        ? `فاتورة توريد مجهز [${orderSupplier.name}]: شحن (${selectedItemName}) عدد ${orderFormData.quantity}`
        : `Procurement Bill [${orderSupplier.name}]: Supplied ${selectedItemName} (x${orderFormData.quantity})`,
      category: orderFormData.itemId.startsWith("lens_") ? "lab" : (orderFormData.itemId.startsWith("frame_") ? "devices" : "other"),
      amount: totalCost,
      date: new Date().toISOString().split("T")[0]
    };
    currentExps.unshift(newExpenseEntry);
    localStorage.setItem("noor_expenses", JSON.stringify(currentExps));

    logAction({
      action: "create",
      entity_type: "inventory",
      entity_id: newOrder.id,
      entity_name: `Procurement PO-${newOrder.id}`,
      details: `Created Purchase Order from ${orderSupplier.name} of ${selectedItemName} (Qty: ${orderFormData.quantity}). Cost: ${totalCost} IQD. Posted to Financial Reports Expense Log.`
    });

    setIsOrderModalOpen(false);
    alert(lang === "ar"
      ? `تم تسجيل توريد طلبيات المجهز بنجاح! تم قيد مصروف بالدفاتر بقيمة (${totalCost.toLocaleString()}) د.ع وتحديث كميات مخزن العيادة.`
      : `Supplier Purchase Order saved! Opex cost of ${totalCost.toLocaleString()} IQD is registered in the reports system and stock replenished.`
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-zinc-200/50 rounded-lg w-48" />
            <div className="h-4 bg-zinc-200/50 rounded-lg w-32" />
          </div>
          <div className="h-10 bg-zinc-200/50 rounded-lg w-full sm:w-40" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-zinc-200/50 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Receipts Success Alerts Banner */}
      {saleResult && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 relative overflow-hidden shadow-md flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 -mr-12 -mt-12 rounded-full blur-xl" />
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/20">
              <Check size={24} strokeWidth={3} />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-900">
                {lang === "ar" ? "تم تسجيل عملية البيع السريع بنجاح!" : "Quick Sale Completed Successfully!"}
              </h3>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                {lang === "ar" 
                  ? `العضو: ${saleResult.customer} · تم بيع ${saleResult.itemsCount} منتج · القيمة الكلية: ${formatIQD(saleResult.total)} ` 
                  : `Customer: ${saleResult.customer} · Sold ${saleResult.itemsCount} items · Total Value: ${formatIQD(saleResult.total)}`}
              </p>
              {saleResult.paid < saleResult.total && (
                <span className="inline-block mt-2 bg-amber-100 text-amber-800 text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded font-bold border border-amber-200">
                  {lang === "ar" ? "قيد مالي (دين مفروض)" : "Outstanding Debt Created"}
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => setSaleResult(null)}
            className="px-5 py-2.5 hover:bg-emerald-100/50 text-emerald-800 font-bold text-xs uppercase tracking-widest rounded-xl transition-all border border-emerald-200 bg-white"
          >
            {lang === "ar" ? "تأكيد" : "Dismiss"}
          </button>
        </motion.div>
      )}

      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">
            {lang === "ar" ? "بيع سريع" : "Inventory"}
          </h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            {lang === "ar" ? "تسجيل المبيعات المباشرة للمواد والرفوف والنظارات الجاهزة" : "DIRECT RETAIL SALES & SHELF ACCESSORIES"} <span className="w-1 h-1 bg-cream-border rounded-full" /> {combinedItems.length} {lang === "ar" ? "منتج مسجل" : "REGISTERED ITEMS"}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={activeTab === "items" ? handleOpenAdd : handleOpenAddSupplier}
            className="btn-burgundy px-6 py-3 flex items-center gap-2 shadow-lg shadow-burgundy/20"
          >
            <Plus size={18} />
            <span>{activeTab === "items" ? (lang === "ar" ? "إضافة منتج للرفوف" : "Add OTC Product") : (lang === "ar" ? "إضافة مجهز جديد" : "Add Supplier")}</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alerts Banner */}
      {lowStockItems.length > 0 && !saleResult && (
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
          <div className="flex gap-1.5 items-center py-1">
            {lowStockItems.slice(0, 3).map((item, i) => {
              const isLens = item.id.startsWith("lens_") || item.category === "lens";
              const isFrame = item.id.startsWith("frame_") || item.category === "frame";
              return (
                <div 
                  key={item.id} 
                  className="h-8 w-8 rounded-full ring-2 ring-rose-300 bg-white flex items-center justify-center text-rose-600 shadow-sm relative group cursor-help shrink-0"
                  title={item.name}
                >
                  {isLens ? (
                    <Disc size={13} strokeWidth={2.5} />
                  ) : isFrame ? (
                    <Glasses size={13} strokeWidth={2.5} />
                  ) : (
                    <Package size={13} strokeWidth={2.5} />
                  )}
                </div>
              );
            })}
            {lowStockItems.length > 3 && (
              <div className="h-8 w-8 rounded-full ring-2 ring-rose-300 bg-rose-600 flex items-center justify-center text-[10px] font-extrabold text-white shadow-sm shrink-0">
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
          {lang === "ar" ? "المخزون والبيع المباشر" : "Inventory"}
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

      {/* Layout Grid that auto-shifts when elements are selected in checkout POS mode */}
      <div className={cn(
        "grid grid-cols-1 gap-6 items-start transition-all duration-300",
        selectedItemIds.length > 0 && activeTab === "items" ? "xl:grid-cols-12" : "grid-cols-1"
      )}>
        
        {/* Main Content Column */}
        <div className={cn(
          "space-y-4 transition-all duration-300",
          selectedItemIds.length > 0 && activeTab === "items" ? "xl:col-span-8" : "w-full"
        )}>
          <AnimatePresence mode="wait">
            {activeTab === "items" ? (
              <motion.div 
                key="items-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-3 items-center justify-between mb-2">
                  <div className="flex items-center gap-3 w-full md:w-auto flex-1">
                    <div 
                      className={cn(
                        "relative group transition-all duration-300 ease-in-out h-full flex items-center",
                        isSearchExpanded || searchTerm ? "w-full md:w-80" : "w-[46px]"
                      )}
                      onMouseEnter={() => setIsSearchExpanded(true)}
                      onMouseLeave={() => {
                        if (!searchTerm && document.activeElement?.id !== 'inventory-search') {
                          setIsSearchExpanded(false);
                        }
                      }}
                    >
                      <div className={cn(
                        "absolute inset-0 bg-white border-2 rounded-xl transition-all duration-300",
                        isSearchExpanded || searchTerm ? "border-burgundy shadow-lg shadow-burgundy/5" : "border-cream-border hover:border-burgundy/50 cursor-pointer"
                      )} onClick={() => { setIsSearchExpanded(true); setTimeout(() => document.getElementById('inventory-search')?.focus(), 50); }} />
                      <Search 
                        className={cn(
                          "absolute start-3.5 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none",
                          isSearchExpanded || searchTerm ? "text-burgundy" : "text-ink-light group-hover:text-burgundy"
                        )} 
                        size={18} 
                      />
                      <input 
                        id="inventory-search"
                        type="text" 
                        placeholder={isSearchExpanded || searchTerm ? (lang === "ar" ? "البحث عن طريق الاسم أو الرمز..." : "Search by name or SKU...") : ""}
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
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    {selectedItemIds.length > 0 && (
                      <button 
                        onClick={() => setSelectedItemIds([])}
                        className="p-3 text-rose-600 bg-white border-2 border-cream-border hover:border-rose-200 hover:bg-rose-50 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-1 min-w-[120px]"
                      >
                        <X size={14} />
                        <span>{lang === "ar" ? "إلغاء التحديد" : "Clear Checked"}</span>
                      </button>
                    )}

                    <select 
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="border-2 border-cream-border bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink-mid focus:border-burgundy outline-none transition-all cursor-pointer min-w-[140px]"
                    >
                      <option value="all">{lang === 'ar' ? 'جميع الفئات' : 'All Categories'}</option>
                      <option value="lens">{t("lenses")}</option>
                      <option value="frame">{t("frames")}</option>
                      <option value="accessory">{lang === 'ar' ? 'إكسسوارات' : 'Accessories'}</option>
                      <option value="contact_lens">{lang === 'ar' ? 'عدسات لاصقة' : 'Contact Lenses'}</option>
                      <option value="reading_frame">{lang === 'ar' ? 'إطارات قراءة جاهزة' : 'Reading Frames'}</option>
                    </select>

                    <select 
                      value={stockFilter}
                      onChange={(e) => {
                        const val = e.target.value as "all" | "low_stock";
                        setStockFilter(val);
                        if (val === "all" && inventoryFilter === "low_stock") {
                          setInventoryFilter("all");
                        }
                      }}
                      className="border-2 border-cream-border bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink-mid focus:border-burgundy outline-none transition-all cursor-pointer min-w-[140px]"
                    >
                      <option value="all">{lang === 'ar' ? 'جميع مستويات المخزون' : 'All Stock'}</option>
                      <option value="low_stock">{lang === 'ar' ? 'المنتجات الناقصة فقط' : 'Low Stock'}</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle instructions for direct sell selection */}
                <div className="bg-cream/40 border border-cream-border rounded-xl p-3 flex items-center justify-between text-xs text-ink-light font-medium">
                  <div className="flex items-center gap-2">
                    <Info size={14} className="text-burgundy" />
                    <span>
                      {lang === "ar" 
                        ? "سجل مبيعات سريعة للمواد بالنقر مباشرة على المنتج لإضافته أو زيادة كميته بالسلّة مباشرة." 
                        : "Sell products instantly by clicking any item card to add it to the cart or increment its quantity."}
                    </span>
                  </div>
                </div>

                {/* Overhauled Items Catalog CardsGrid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredItems.map((item, idx) => {
                    const isLowStock = item.stock_level <= item.reorder_point;
                    const isChecked = selectedItemIds.includes(item.id);
                    const qtyInCart = isChecked ? (quantitiesToSell[item.id] || 1) : 0;
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        key={item.id} 
                        className={cn(
                          "bg-white border-2 rounded-2xl p-5 flex flex-col justify-between hover:border-burgundy/40 hover:shadow-md transition-all group relative cursor-pointer select-none",
                          isLowStock ? "border-rose-100 bg-rose-50/[0.02]" : "border-cream-border",
                          isChecked && "border-burgundy/60 bg-burgundy/[0.01] shadow-sm shadow-burgundy/5"
                        )}
                        onClick={() => toggleSelectItem(item.id)}
                      >
                        {/* Selected Indicator Badge in card corner */}
                        {isChecked && (
                          <div className="absolute top-3 right-3 bg-burgundy text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow">
                            <ShoppingCart size={10} />
                            <span>{qtyInCart} {lang === "ar" ? "بالسلة" : "In Cart"}</span>
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Top row: Category Pill & Stock Status */}
                          <div className="flex justify-between items-center gap-2">
                            <span className="px-2 py-0.5 bg-cream text-burgundy text-[9px] font-bold uppercase tracking-widest rounded">
                              {getCategoryLabel(item.category)}
                            </span>
                            
                            {/* Stock Indicator */}
                            <div className="flex items-center">
                              {isLowStock ? (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                                  <AlertTriangle size={10} /> {lang === "ar" ? "ناقص: " : "Low: "}{item.stock_level}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[9px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full">
                                  <Boxes size={10} /> {lang === "ar" ? "متوفر: " : "Stock: "}{item.stock_level}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Product Details: Title & SKU */}
                          <div className="pt-2 text-start">
                            <h4 className="font-bold text-ink text-sm leading-tight line-clamp-2 min-h-[40px]">{item.name}</h4>
                            <p className="text-[10px] font-mono text-ink-light font-bold uppercase tracking-wider mt-1.5">{item.sku}</p>
                          </div>
                        </div>

                        {/* Bottom row: Price & Action trigger */}
                        <div className="border-t border-cream-border/60 pt-4 mt-4 flex items-center justify-between gap-2">
                          <div className="text-start">
                            <span className="text-[9px] text-ink-light block font-bold uppercase tracking-widest">{lang === "ar" ? "سعر الحبة" : "Unit Price"}</span>
                            <span className="font-mono text-base font-extrabold text-ink">{formatIQD(item.unit_price)}</span>
                          </div>

                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            {/* Edit / Delete Operations for custom items */}
                            {!(item.id.startsWith("lens_") || item.id.startsWith("frame_")) ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleOpenEdit(item)}
                                  className="p-1.5 hover:bg-burgundy bg-cream hover:text-white rounded-lg text-ink-mid transition-all border border-cream-border"
                                  title={lang === "ar" ? "تعديل" : "Edit"}
                                >
                                  <Edit2 size={12} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1.5 hover:bg-rose-600 bg-rose-50 hover:text-white rounded-lg text-rose-600 transition-all border border-rose-100"
                                  title={lang === "ar" ? "حذف" : "Delete"}
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-[8px] text-[#b5a38a] font-bold bg-cream border border-cream-border px-1.5 py-0.5 rounded uppercase tracking-wider">
                                {item.id.startsWith("lens_") ? (lang === "ar" ? "كتالوج عدسات" : "Lenses") : (lang === "ar" ? "كتالوج إطارات" : "Frames")}
                              </span>
                            )}

                            {/* Direct Add Button */}
                            <button 
                              onClick={() => toggleSelectItem(item.id)}
                              className={cn(
                                "p-1.5 px-3 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1 h-8",
                                isChecked 
                                  ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                                  : "bg-burgundy text-white hover:bg-burgundy-light shadow-burgundy/10"
                              )}
                            >
                              <Plus size={13} strokeWidth={2.5} />
                              <span>{lang === "ar" ? "إضافة" : "Add"}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <div className="col-span-full py-16 text-center text-ink-light italic text-sm">
                      {t("no_data")}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              // Suppliers tab content intact
              <motion.div 
                key="suppliers-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Search suppliers toolbar */}
                <div className="bg-white border border-cream-border p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute start-3top-1/2 -translate-y-1/2 text-ink-light w-4 h-4" style={{ insetInlineStart: "0.75rem", top: "50%" }} />
                    <input 
                      type="text" 
                      placeholder={lang === "ar" ? "ابحث عن مجهز بالاسم أو المسؤول للتواصل..." : "Search suppliers by company or contact name..."}
                      className="w-full ps-9 pe-4 py-2 text-xs border border-cream-border rounded-xl bg-cream/30 focus:bg-white focus:border-burgundy outline-none transition-all"
                      value={supplierSearch}
                      onChange={e => setSupplierSearch(e.target.value)}
                    />
                  </div>
                  <div className="text-[10px] font-bold text-ink-light uppercase tracking-wider">
                    {lang === "ar" ? `إجمالي المجهزين: ${suppliers.length}` : `TOTAL VENDORS: ${suppliers.length}`}
                  </div>
                </div>

                {/* Suppliers List Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredSuppliers.map((supplier, idx) => {
                    const ordersForSupplier = supplierOrders.filter(o => o.supplier_id === supplier.id);
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        key={supplier.id} 
                        className="card p-6 bg-white hover:border-burgundy/25 transition-all group relative overflow-hidden text-start flex flex-col justify-between border border-cream-border rounded-2xl shadow-sm"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-cream/30 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-burgundy/5 transition-all" />
                        
                        <div>
                          {/* Heading controls */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-burgundy/5 text-burgundy flex items-center justify-center shrink-0 shadow-inner">
                              <Building2 size={24} />
                            </div>
                            <div className="flex gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleOpenEditSupplier(supplier)}
                                className="p-2 hover:bg-cream border border-cream-border text-ink-light hover:text-burgundy rounded-lg transition-colors"
                                title={lang === "ar" ? "تعديل بيانات مجهز" : "Edit supplier"}
                              >
                                <Plus size={14} className="rotate-45" style={{ transform: "none" }} /> {/* Edit Icon or standard Edit indicator */}
                                <User size={12} className="hidden" /> {/* Temp */}
                                <span className="text-[10px] font-bold">{lang === "ar" ? "تعديل" : "Edit"}</span>
                              </button>
                              <button 
                                onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                                className="p-2 hover:bg-rose-50 border border-rose-100 text-ink-light hover:text-rose-600 rounded-lg transition-colors"
                                title={lang === "ar" ? "حذف المجهز ماليًا" : "Delete supplier"}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Details */}
                          <div className="space-y-1">
                            <h3 className="text-xl font-serif font-bold text-ink group-hover:text-burgundy transition-colors">{supplier.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-burgundy-soft uppercase tracking-wider">
                              <User size={13} className="text-burgundy" /> 
                              <span>{supplier.contact_person || (lang === "ar" ? "طلب غير مسمى" : "Unnamed contact")}</span>
                            </div>
                          </div>

                          {/* Profile list */}
                          <div className="space-y-2.5 pt-4 pb-4 border-t border-cream-border mt-4">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                                <Phone size={13} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">{lang === 'ar' ? 'رقم الهاتف المباشر' : 'Direct Phone'}</p>
                                <p className="text-xs font-medium text-ink-mid font-mono truncate">{supplier.phone || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                                <Mail size={13} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">{lang === 'ar' ? 'البريد الإلكتروني' : 'Mail Endpoint'}</p>
                                <p className="text-xs font-medium text-ink-mid truncate max-w-[200px]">{supplier.email || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                                <MapPin size={13} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">{lang === 'ar' ? 'المقر الرئيسي بالتفصيل' : 'Office Location'}</p>
                                <p className="text-xs font-medium text-ink-mid truncate">{supplier.address || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                                <Check size={13} className="text-emerald-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[8px] text-ink-light uppercase font-bold tracking-widest">{lang === 'ar' ? 'شروط التسوية المالية' : 'Payment Terms / Cycle'}</p>
                                <p className="text-xs font-bold text-ink-mid">{supplier.payment_terms || "Direct Cash"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Expandable Order Logs Section inside the card */}
                          <div className="border-t border-cream-border pt-4 mt-2">
                            <h4 className="text-[10px] font-bold text-ink uppercase tracking-wider flex items-center gap-1.5 mb-2">
                              <Info size={12} className="text-burgundy" />
                              <span>{lang === "ar" ? `سجل التوريد للطلبيات المكتملة (${ordersForSupplier.length})` : `Procured Orders Logs (${ordersForSupplier.length})`}</span>
                            </h4>
                            {ordersForSupplier.length === 0 ? (
                              <p className="text-[10px] italic text-zinc-400">
                                {lang === "ar" ? "لا يوجد أي طلبيات مسجلة حاليًا لهذا المجهز." : "No registered purchase orders found for this vendor."}
                              </p>
                            ) : (
                              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                                {ordersForSupplier.map(order => (
                                  <div key={order.id} className="bg-cream/50 border border-cream-border/60 rounded-xl p-2.5 text-[11px] font-medium space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-ink truncate max-w-[150px]">{order.item_name}</span>
                                      <span className="font-mono text-emerald-700 font-bold">{formatIQD(order.total_cost)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] text-ink-light font-mono">
                                      <span>{lang === "ar" ? `العدد: ${order.quantity} حبة` : `Qty: ${order.quantity} units`}</span>
                                      <span>{order.date}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Placement Call to Action */}
                        <div className="pt-4 mt-4 border-t border-cream-border">
                          <button 
                            onClick={() => handleOpenPlaceOrder(supplier)}
                            className="w-full py-2.5 bg-burgundy hover:bg-gold hover:text-burgundy text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                          >
                            <ShoppingCart size={13} />
                            <span>{lang === "ar" ? "شحن ومشتريات مخزن (سجل طلبية)" : "Place New Order"}</span>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {filteredSuppliers.length === 0 && (
                    <div className="col-span-2 p-12 text-center text-ink-light italic">
                      {lang === "ar" ? "لم يتم العثور على مجهزين يطابقون كلمة البحث." : "No suppliers match search keywords."}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Checkout POS Cart Column (Sliding in beautifully) */}
        {selectedItemIds.length > 0 && activeTab === "items" && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="xl:col-span-4 card p-5 bg-white border-2 border-burgundy/20 shadow-xl overflow-hidden relative sticky top-6 text-start space-y-5"
          >
            <div className="flex items-center justify-between border-b border-cream-border pb-3">
              <div className="flex items-center gap-2 text-burgundy">
                <ShoppingCart size={18} />
                <h3 className="font-serif font-bold text-lg">
                  {lang === "ar" ? "فاتورة بيع سريع" : "Quick Retail Sale"}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedItemIds([])}
                className="p-1 border border-cream-border hover:bg-rose-50 hover:text-rose-600 rounded-lg text-ink-light transition-colors"
                title={lang === "ar" ? "أغلق" : "Close"}
              >
                <X size={15} />
              </button>
            </div>

            {/* Selected Items details in cart */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {selectedCartItems.map(item => (
                <div key={item.id} className="bg-cream/40 rounded-xl p-3 border border-cream-border/50 text-xs text-ink-mid flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold flex items-center gap-1">
                      <Package size={13} className="text-burgundy/80" />
                      {item.name}
                    </span>
                    <span className="font-mono text-ink font-bold">{formatIQD(item.subtotal)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-ink-light">
                    <span>{formatIQD(item.unit_price)} / {lang === "ar" ? "الحبة" : "unit"}</span>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        type="button" 
                        onClick={() => updateQuantityToSell(item.id, -1)}
                        className="w-5 h-5 rounded bg-cream hover:bg-cream-dark transition-all flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="font-bold text-ink text-xs font-mono w-4 text-center">{item.qty}</span>
                      <button 
                        type="button" 
                        onClick={() => updateQuantityToSell(item.id, 1)}
                        className="w-5 h-5 rounded bg-cream hover:bg-cream-dark transition-all flex items-center justify-center font-bold"
                        disabled={item.qty >= item.stock_level}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Client input & payment configurations */}
            <form onSubmit={handleRegisterQuickSale} className="space-y-4 pt-2 border-t border-cream-border/60">
              
              {/* Optional custom customer name */}
              <div>
                <label className="text-[10px] sm:text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1 flex items-center gap-1">
                  <User size={10} />
                  <span>{lang === "ar" ? "اسم الزبون (اختياري)" : "Customer Name (Optional)"}</span>
                </label>
                <input 
                  type="text" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder={lang === "ar" ? "زبون سفري مباشر" : "Walk-in Retail Customer"}
                  className="w-full bg-cream/40 border-2 border-cream-border/95 px-3 py-2 rounded-xl text-xs outline-none focus:border-burgundy tracking-wide"
                />
              </div>

              {/* Total Summary */}
              <div className="bg-burgundy/[0.03] rounded-xl p-4 border border-burgundy/10 space-y-1.5 font-sans">
                <div className="flex justify-between text-xs text-ink-light">
                  <span>{lang === "ar" ? "الإجمالي الأصلي" : "Gross Total"}</span>
                  <span className="font-mono">{formatIQD(cartTotalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm text-ink font-bold border-t border-cream-border pt-1.5 mt-1.5">
                  <span className="text-burgundy font-serif font-black">{lang === "ar" ? "المبلغ المطلوب" : "Grand Total"}</span>
                  <span className="font-mono text-burgundy">{formatIQD(cartTotalAmount)}</span>
                </div>
              </div>

              {/* Paid override for partial payments/debts */}
              <div>
                <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CreditCard size={10} />
                    <span>{lang === "ar" ? "المبلغ المدفوع فعلياً" : "Actual Amount Paid"}</span>
                  </div>
                  <span className="text-[9px] text-burgundy font-extrabold font-mono hover:underline cursor-pointer" onClick={() => setPaidOverride("")}>
                    {lang === "ar" ? "كامل المبلغ" : "Reset full"}
                  </span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={paidOverride}
                    onChange={(e) => setPaidOverride(e.target.value)}
                    placeholder={cartTotalAmount.toString()}
                    className="w-full bg-cream/40 border-2 border-cream-border/95 px-3 py-2 rounded-xl text-xs outline-none focus:border-burgundy font-mono tracking-wide"
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 font-bold text-[9px] text-ink-light uppercase">IQD</span>
                </div>
              </div>

              {/* Outstanding feedback indicator */}
              {paidOverride !== "" && parseFloat(paidOverride) < cartTotalAmount && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-800 flex items-start gap-2 leading-relaxed">
                  <Info size={12} className="shrink-0 mt-0.5" />
                  <span>
                    {lang === "ar" 
                      ? `سيتم معاملة الباقي بقيمة ${formatIQD(Math.max(0, cartTotalAmount - parseFloat(paidOverride)))} كديون جارية على زبون سفري.`
                      : `The outstanding amount of ${formatIQD(Math.max(0, cartTotalAmount - parseFloat(paidOverride)))} will be tracked as walk-in accounts receivable.`}
                  </span>
                </div>
              )}

              {/* Register Action button */}
              <button 
                type="submit"
                className="w-full py-3 bg-burgundy hover:bg-gold text-white hover:text-burgundy font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md shadow-burgundy/10 flex items-center justify-center gap-2 group"
              >
                <ShoppingBag size={14} className="group-hover:scale-110 transition-transform" />
                <span>{lang === "ar" ? "إتمام وتأكيد البيع" : "Register OTC Sale"}</span>
              </button>
            </form>
          </motion.div>
        )}
      </div>

      {/* Add / Edit OTC Product Modal Dialog */}
      <AnimatePresence>
        {isAddEditOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
              onClick={() => setIsAddEditOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-start p-6 space-y-4"
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-cream-border pb-3">
                <h3 className="font-serif font-bold text-lg text-ink">
                  {editingItem 
                    ? (lang === "ar" ? "تعديل المنتج" : "Edit OTC Product")
                    : (lang === "ar" ? "إضافة منتج جديد للمخزن" : "Add OTC Product")}
                </h3>
                <button 
                  onClick={() => setIsAddEditOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-cream transition-all border border-cream-border"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                {/* Product Name */}
                <div>
                  <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                    {lang === "ar" ? "اسم المنتج" : "Product Name"}
                  </label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={lang === "ar" ? "مثال: منظف نظارات بخاخ 50 مل" : "e.g., Lens Cleaning spray 50ml"}
                    className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy"
                  />
                </div>

                {/* SKU Code */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "الرمز المميز (SKU)" : "SKU / Model Code"}
                    </label>
                    <input 
                      type="text" 
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="AC-142"
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "فئة المنتج" : "Product Category"}
                    </label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full bg-white border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy cursor-pointer"
                    >
                      <option value="accessory">{lang === "ar" ? "إكسسوار / ملحق" : "Accessory"}</option>
                      <option value="frame">{lang === "ar" ? "إطار نظارة" : "Frame"}</option>
                      <option value="lens">{lang === "ar" ? "عدسة جاهزة" : "Lens"}</option>
                      <option value="contact_lens">{lang === "ar" ? "عدسات لاصقة" : "Contact Lens"}</option>
                      <option value="reading_frame">{lang === "ar" ? "إطار قراءة جاهز" : "Reading Frame"}</option>
                      <option value="other">{lang === "ar" ? "أخرى / عامة" : "Other"}</option>
                    </select>
                  </div>
                </div>

                {/* Pricing / Selling Rate */}
                <div>
                  <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                    {lang === "ar" ? "سعر البيع الافتراضي للمستهلك" : "Default OTC Selling Price (IQD)"}
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={formData.unit_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_price: Number(e.target.value) }))}
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 font-bold text-[9px] text-ink-light">IQD</span>
                  </div>
                </div>

                {/* Units & stock alerts config */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "مستوى المخزون الحالي" : "Initial Stock Level"}
                    </label>
                    <input 
                      type="number" 
                      value={formData.stock_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock_level: Number(e.target.value) }))}
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "حد التنبيه المنخفض" : "Low Stock Point"}
                    </label>
                    <input 
                      type="number" 
                      value={formData.reorder_point}
                      onChange={(e) => setFormData(prev => ({ ...prev, reorder_point: Number(e.target.value) }))}
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                    />
                  </div>
                </div>

                {/* Submit controls */}
                <div className="flex gap-2.5 pt-4 border-t border-cream-border/60">
                  <button 
                    type="button"
                    onClick={() => setIsAddEditOpen(false)}
                    className="flex-1 py-3 bg-cream hover:bg-cream-dark/40 text-ink-mid text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-cream-border"
                  >
                    {lang === "ar" ? "إلغاء الأمر" : "Cancel"}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-burgundy hover:bg-gold hover:text-burgundy text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md"
                  >
                    {editingItem ? (lang === "ar" ? "تأكيد التعديل" : "Save Changes") : (lang === "ar" ? "إضافة المنتج" : "Add Product")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Supplier Modal Dialog */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
              onClick={() => setIsSupplierModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-start p-6 space-y-4 font-sans"
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-cream-border pb-3">
                <h3 className="font-serif font-bold text-lg text-ink">
                  {editingSupplier 
                    ? (lang === "ar" ? "تعديل المجهز" : "Edit Supplier Details")
                    : (lang === "ar" ? "تسجيل مجهز جديد" : "Register Supplier")}
                </h3>
                <button 
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-cream transition-all border border-cream-border"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveSupplier} className="space-y-4 text-xs font-medium text-ink-mid">
                {/* Supplier Name */}
                <div>
                  <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                    {lang === "ar" ? "اسم المجهز التجاري / الشركة" : "Supplier / Company Name"}
                  </label>
                  <input 
                    required
                    type="text" 
                    value={supplierFormData.name}
                    onChange={(e) => setSupplierFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={lang === "ar" ? "مثال: شركة الأستاذ للبصريات" : "e.g., Al-Ostadh Optics Trading"}
                    className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy"
                  />
                </div>

                {/* Contact Person */}
                <div>
                  <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                    {lang === "ar" ? "الشخص المسؤول للتواصل" : "Contact Person"}
                  </label>
                  <input 
                    type="text" 
                    value={supplierFormData.contact_person}
                    onChange={(e) => setSupplierFormData(prev => ({ ...prev, contact_person: e.target.value }))}
                    placeholder={lang === "ar" ? "مثال: م. أحمد حميد" : "e.g., Mazen Ahmed"}
                    className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </label>
                    <input 
                      type="text" 
                      value={supplierFormData.phone}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+964..."
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                    />
                  </div>
                  {/* Email */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "البريد الإلكتروني" : "Email Address"}
                    </label>
                    <input 
                      type="email" 
                      value={supplierFormData.email}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@..."
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Address */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "العنوان بالتفصيل" : "Office Address"}
                    </label>
                    <input 
                      type="text" 
                      value={supplierFormData.address}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={lang === "ar" ? "بغداد، شارع السعدون" : "Baghdad, Al-Saadoun St."}
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy"
                    />
                  </div>
                  {/* Payment terms */}
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "طريقة التسوية / شروط الدفع" : "Payment Terms"}
                    </label>
                    <select 
                      value={supplierFormData.payment_terms}
                      onChange={(e) => setSupplierFormData(prev => ({ ...prev, payment_terms: e.target.value }))}
                      className="w-full bg-white border-2 border-cream-border px-3 py-2 rounded-xl text-xs outline-none focus:border-burgundy cursor-pointer"
                    >
                      <option value="Direct Payment">{lang === "ar" ? "دفع نقدي مباشر" : "Direct Cash"}</option>
                      <option value="Net 30">Net 30 days ({lang === "ar" ? "آجل 30 يوم" : "30 days Credit"})</option>
                      <option value="Net 60">Net 60 days ({lang === "ar" ? "آجل 60 يوم" : "60 days Credit"})</option>
                      <option value="Weekly Billing">{lang === "ar" ? "تصفية أسبوعية" : "Weekly Billing"}</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-cream-border">
                  <button 
                    type="button"
                    onClick={() => setIsSupplierModalOpen(false)}
                    className="flex-1 py-3 bg-cream hover:bg-cream-dark/40 text-ink-mid text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-cream-border"
                  >
                    {lang === "ar" ? "إلغاء الموقف" : "Cancel"}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-burgundy hover:bg-gold hover:text-burgundy text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md"
                  >
                    {lang === "ar" ? "حفظ المجهز" : "Save Supplier"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Place Supplier Order Modal Dialog */}
      <AnimatePresence>
        {isOrderModalOpen && orderSupplier && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
              onClick={() => setIsOrderModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-start p-6 space-y-4 font-sans"
              dir={lang === "ar" ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-cream-border pb-3">
                <div className="flex items-center gap-2">
                  <Building2 size={18} className="text-burgundy" />
                  <div>
                    <h3 className="font-serif font-bold text-base text-ink">
                      {lang === "ar" ? "تسجيل طلبية توريد جديدة" : "Place Procurement Purchase Order"}
                    </h3>
                    <p className="text-[10px] text-zinc-500">
                      {lang === "ar" ? `المجهز: ${orderSupplier.name}` : `Vendor: ${orderSupplier.name}`}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOrderModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-cream transition-all border border-cream-border"
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handlePlaceOrderSubmit} className="space-y-4 text-xs font-medium text-ink-mid">
                
                {/* Select stock Item to replenish */}
                <div>
                  <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                    {lang === "ar" ? "اختر مادة من مخزن العيادة للشحن أو اختر مادة مخصصة" : "Replenish Existing Product / Category"}
                  </label>
                  <select 
                    value={orderFormData.itemId}
                    onChange={(e) => setOrderFormData(prev => ({ ...prev, itemId: e.target.value }))}
                    className="w-full bg-white border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy cursor-pointer font-sans"
                  >
                    <option value="custom">{lang === "ar" ? "+ مادة جديدة مخصصة غير مسجلة بالرفوف" : "+ Brand New Custom / OTC Product"}</option>
                    <optgroup label={lang === "ar" ? "أصناف وإكسسوارات OTC الرفوف العامة" : "OTC Shelf Accessories & OTC Products"}>
                      {items.map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} ({lang === "ar" ? "المخزون المتوفر" : "Available"}: {item.stock_level})
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={lang === "ar" ? "سجل عدسات العيادة الطبية" : "Clinical RX Lens Catalog List"}>
                      {(lenses || []).map(l => (
                        <option key={`lens_${l.id}`} value={`lens_${l.id}`}>
                          {l.lens_type} ({l.material}, {l.coating}) SPH:{l.sphere >= 0 ? '+' : ''}{l.sphere.toFixed(2)} - Qty: {l.quantity}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={lang === "ar" ? "إطارات النظارات المصممة" : "Designer Frames Catalog List"}>
                      {(frames || []).map(f => (
                        <option key={`frame_${f.id}`} value={`frame_${f.id}`}>
                          {f.brand} - {f.model} ({f.color}) - Qty: {f.quantity}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Custom Name (Only visible if Item is custom) */}
                {orderFormData.itemId === "custom" && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                        {lang === "ar" ? "اسم المادة المخصصة الجديدة" : "New Custom Item Commercial Name"}
                      </label>
                      <input 
                        type="text" 
                        value={orderFormData.customItemName}
                        onChange={(e) => setOrderFormData(prev => ({ ...prev, customItemName: e.target.value }))}
                        placeholder={lang === "ar" ? "مثال: مادة ملحقة قطرة مرطبة للعين 15مل" : "e.g., Eye soothing lubricant drop 15ml"}
                        className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs outline-none focus:border-burgundy"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <div>
                        <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                          {lang === "ar" ? "فئة المادة" : "Product Category"}
                        </label>
                        <select 
                          value={orderFormData.category}
                          onChange={(e) => setOrderFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full bg-white border-2 border-cream-border px-3 py-2 rounded-xl text-xs outline-none focus:border-burgundy cursor-pointer font-sans"
                        >
                          <option value="accessory">{lang === "ar" ? "إكسسوار / ملحق" : "Accessory"}</option>
                          <option value="frame">{lang === "ar" ? "إطار نظارة" : "Frame"}</option>
                          <option value="lens">{lang === "ar" ? "عدسة جاهزة" : "Lens"}</option>
                          <option value="contact_lens">{lang === "ar" ? "عدسات لاصقة" : "Contact Lens"}</option>
                          <option value="other">{lang === "ar" ? "أخرى / عامة" : "Other"}</option>
                        </select>
                      </div>
                      <div className="flex items-center text-[10px] text-zinc-500 leading-tight">
                        {lang === "ar" 
                          ? "سيتم تسجيل هذه المادة الجديدة تلقائيًا في مخازن العيادة للرفوف وتطبيق سعر حماية ربحي مناسب تلقائيًا."
                          : "This product will be automatically registered inside clinical shelves with custom pricing markup."}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Quantity & Cost price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "الكمية المشتراة (أعداد)" : "Purchased Quantity"}
                    </label>
                    <input 
                      type="number" 
                      min="1"
                      value={orderFormData.quantity}
                      onChange={(e) => setOrderFormData(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-ink-light block uppercase tracking-wider mb-1">
                      {lang === "ar" ? "تكلفة شراء الحبة الواحدة" : "Unit Purchase Cost (IQD)"}
                    </label>
                    <div className="relative">
                      <input 
                        type="number" 
                        min="1"
                        value={orderFormData.unitCost}
                        onChange={(e) => setOrderFormData(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                        className="w-full bg-cream/40 border-2 border-cream-border px-3 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-burgundy"
                      />
                      <span className="absolute end-3 top-1/2 -translate-y-1/2 font-bold text-[9px] text-zinc-400">IQD</span>
                    </div>
                  </div>
                </div>

                {/* Summary calculation */}
                <div className="bg-cream p-4 rounded-xl border border-cream-border flex justify-between items-center text-[11px] font-bold font-mono text-zinc-700">
                  <span>{lang === "ar" ? "إجمالي كلفة الفاتورة المترتبة:" : "Total Purchase Cost Outflow:"}</span>
                  <span className="text-burgundy text-xs font-black">
                    {formatIQD(Number(orderFormData.quantity) * Number(orderFormData.unitCost))}
                  </span>
                </div>

                <div className="flex gap-2.5 pt-4 border-t border-cream-border">
                  <button 
                    type="button"
                    onClick={() => setIsOrderModalOpen(false)}
                    className="flex-1 py-3 bg-cream hover:bg-cream-dark/40 text-ink-mid text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-cream-border"
                  >
                    {lang === "ar" ? "أغلق النافذة" : "Cancel PO"}
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2 font-sans"
                  >
                    <Check size={13} />
                    <span>{lang === "ar" ? "ترحيل الفاتورة وتحديث المخزون" : "Receive Order & Post Cost"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
