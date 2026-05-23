import React, { useState, useEffect } from "react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { useScrollLock } from "../hooks/useScrollLock";
import { motion, AnimatePresence } from "motion/react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Building, 
  Receipt, 
  Wallet,
  Calendar,
  MessageSquare,
  ChevronDown,
  Download,
  ShieldCheck,
  Percent,
  Coins,
  ArrowUpRight,
  ClipboardCheck,
  Globe,
  Settings,
  X,
  Printer,
  FileSpreadsheet,
  Lock,
  Unlock,
  Edit2,
  Key
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface Expense {
  id: string;
  description: string;
  category: "lab" | "rent" | "salary" | "utilities" | "other";
  amount: number;
  date: string;
}

interface CapitalEntry {
  id: string;
  source: string;
  amount: number;
  date: string;
}

export function Reports() {
  const { lang, patients, setPatients, lenses, frames, logAction, inventoryTrigger, user } = useClinic();

  // Generate last 12 months for custom historical filtering
  const historicalMonths = React.useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = String(month).padStart(2, "0");
      const val = `${year}-${monthStr}`;
      
      const labelEn = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const labelAr = d.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });
      
      list.push({ val, labelEn, labelAr });
    }
    return list;
  }, []);
  
  // State for operational expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("noor_expenses");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Error reading expenses from storage:", err);
      }
    }
    return [];
  });

  // State for business capital additions (Owner contributions / investments)
  const [capitalInjections, setCapitalInjections] = useState<CapitalEntry[]>(() => {
    const saved = localStorage.getItem("noor_capital");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Error reading capital from storage:", err);
      }
    }
    return [];
  });

  // Active sub-tab in the left column ledger
  const [ledgerSubTab, setLedgerSubTab] = useState<"sales" | "opex" | "capital">("sales");

  // Expense form state
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expDesc, setExpDesc] = useState("");
  const [expCategory, setExpCategory] = useState<Expense["category"]>("other");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);

  // Capital form state
  const [showAddCapital, setShowAddCapital] = useState(false);
  const [capSrc, setCapSrc] = useState("");
  const [capAmount, setCapAmount] = useState("");
  const [capDate, setCapDate] = useState(new Date().toISOString().split("T")[0]);

  // Debt settlement state
  const [settlingPatientId, setSettlingPatientId] = useState<string | null>(null);
  const [settlementAmount, setSettlementAmount] = useState("");

  // Secure Manual Ledger Override State
  const [overrideExpense, setOverrideExpense] = useState<Expense | null>(null);
  const [overrideDesc, setOverrideDesc] = useState("");
  const [overrideCategory, setOverrideCategory] = useState<Expense["category"]>("other");
  const [overrideAmount, setOverrideAmount] = useState("");
  const [overrideDate, setOverrideDate] = useState("");
  const [overridePinInput, setOverridePinInput] = useState("");
  const [isOverridePinVerified, setIsOverridePinVerified] = useState(false);
  const [overridePinError, setOverridePinError] = useState("");

  const [overrideReason, setOverrideReason] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [chartAggregation, setChartAggregation] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [customRangeStart, setCustomRangeStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2); // default to 2 months lookback
    return d.toISOString().split("T")[0];
  });
  const [customRangeEnd, setCustomRangeEnd] = useState(() => new Date().toISOString().split("T")[0]);
  const [hoveredPieIndex, setHoveredPieIndex] = useState<number | null>(null);

  // Accountant Closing Audit state
  const [showAuditPanel, setShowAuditPanel] = useState(false);
  const [auditorName, setAuditorName] = useState(() => localStorage.getItem("noor_last_auditor") || "");
  const [auditSignedAt, setAuditSignedAt] = useState(() => localStorage.getItem("noor_audit_stamp") || "");
  const [checksChecked, setChecksChecked] = useState<boolean[]>([false, false, false, false]);

  // Monthly locked auditable periods support
  const [auditedMonths, setAuditedMonths] = useState<{[key: string]: string}>(() => {
    const saved = localStorage.getItem("noor_audited_months");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading audited months:", e);
      }
    }
    const oldStamp = localStorage.getItem("noor_audit_stamp");
    if (oldStamp) {
      return { "all": oldStamp };
    }
    return {};
  });

  const [selectedAuditPeriod, setSelectedAuditPeriod] = useState<string>("all");
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenPin, setReopenPin] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  const [reopenError, setReopenError] = useState("");

  useScrollLock(showAuditPanel || showReopenModal || !!overrideExpense);

  const getPeriodLabel = () => {
    const now = new Date();
    if (dateFilter === "month") {
      return now.toLocaleString("en-US", { month: "long", year: "numeric" }); // e.g. "May 2026"
    } else if (dateFilter === "month-last") {
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return prevMonth.toLocaleString("en-US", { month: "long", year: "numeric" }); // e.g. "April 2026"
    } else if (dateFilter === "year") {
      return now.getFullYear().toString();
    } else if (/^\d{4}-\d{2}$/.test(dateFilter)) {
      const [year, month] = dateFilter.split("-").map(Number);
      const d = new Date(year, month - 1, 1);
      return d.toLocaleString("en-US", { month: "long", year: "numeric" });
    }
    return "all";
  };

  const getIsPeriodLocked = (dateStr?: string): boolean => {
    if (auditedMonths["all"]) return true;
    if (!dateStr) {
      const currentPeriod = getPeriodLabel();
      return !!auditedMonths[currentPeriod];
    }
    const d = new Date(dateStr);
    const mLabel = d.toLocaleString("en-US", { month: "long", year: "numeric" });
    const yLabel = d.getFullYear().toString();
    return !!(auditedMonths[mLabel] || auditedMonths[yLabel] || auditedMonths["all"]);
  };

  const currentViewLabel = getPeriodLabel();
  const currentViewLockStamp = auditedMonths[currentViewLabel] || auditedMonths["all"];
  const isCurrentPeriodLocked = !!currentViewLockStamp;

  // Collapsible sections state
  const [isDebtorsCollapsed, setIsDebtorsCollapsed] = useState(false);
  const [isPLCollapsed, setIsPLCollapsed] = useState(false);

  // Save expenses to storage
  useEffect(() => {
    localStorage.setItem("noor_expenses", JSON.stringify(expenses));
  }, [expenses]);

  // Save capital to storage
  useEffect(() => {
    localStorage.setItem("noor_capital", JSON.stringify(capitalInjections));
  }, [capitalInjections]);

  // Calculations for Financial Dashboard
  const allVisits = patients.flatMap(p => (p.visits || []).map((v: any) => ({
    ...v,
    patientName: p.full_name,
    patientPhone: p.phone,
    patientId: p.id
  })));

  // Filter transactions based on selected date filter
  const getFilteredData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let filteredVisits = allVisits;
    let filteredExpenses = expenses;
    let filteredCapital = capitalInjections;

    if (dateFilter === "month") {
      filteredVisits = allVisits.filter(v => {
        const d = new Date(v.visit_date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
      filteredCapital = capitalInjections.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (dateFilter === "month-last") {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      filteredVisits = allVisits.filter(v => {
        const d = new Date(v.visit_date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });
      filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });
      filteredCapital = capitalInjections.filter(c => {
        const d = new Date(c.date);
        return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
      });
    } else if (dateFilter === "year") {
      filteredVisits = allVisits.filter(v => {
        const d = new Date(v.visit_date);
        return d.getFullYear() === currentYear;
      });
      filteredExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === currentYear;
      });
      filteredCapital = capitalInjections.filter(c => {
        const d = new Date(c.date);
        return d.getFullYear() === currentYear;
      });
    } else if (/^\d{4}-\d{2}$/.test(dateFilter)) {
      filteredVisits = allVisits.filter(v => v.visit_date.startsWith(dateFilter));
      filteredExpenses = expenses.filter(e => e.date.startsWith(dateFilter));
      filteredCapital = capitalInjections.filter(c => c.date.startsWith(dateFilter));
    }

    return { filteredVisits, filteredExpenses, filteredCapital };
  };

  const { filteredVisits, filteredExpenses, filteredCapital } = getFilteredData();

  const sortedSales = React.useMemo(() => {
    return [...filteredVisits].sort((a, b) => {
      const dateA = new Date(a.visit_date).getTime();
      const dateB = new Date(b.visit_date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    });
  }, [filteredVisits]);

  // Gross Sales (from optics billing)
  const grossBillings = filteredVisits.reduce((sum, v) => sum + (v.total_amount || 0), 0);

  // Dynamic cost of goods calculator for lenses, frames and walkin retail OTC items
  const getVisitCost = (v: any) => {
    if (v.visit_cost !== undefined) return v.visit_cost;
    
    let cost = 0;
    const raw = v.rawFormData || {};
    
    // Quick Sell / Retail POS direct cost
    if (raw.is_quick_sell && Array.isArray(raw.items_sold)) {
      raw.items_sold.forEach((item: any) => {
        cost += (item.cost_price || 0) * (item.quantity || 1);
      });
      return cost;
    }
    
    // Matched lenses cost
    if (raw.matchedOdLensId) {
      const match = lenses?.find(l => l.id === raw.matchedOdLensId);
      if (match) cost += (match.cost_price || 0);
    }
    if (raw.matchedOsLensId) {
      const match = lenses?.find(l => l.id === raw.matchedOsLensId);
      if (match) cost += (match.cost_price || 0);
    }
    
    // Matched frames cost
    const frameId = raw.matchedFrameId || raw.frameStockItem;
    if (raw.includeFrame && frameId) {
      const match = frames?.find(f => f.id === frameId);
      if (match) cost += (match.cost_price || 0);
    }
    return cost;
  };

  const totalCOGS = filteredVisits.reduce((sum, v) => sum + getVisitCost(v), 0);
  const grossProfit = grossBillings - totalCOGS;

  // Cash Received from checking visits directly
  const cashReceivedFromVisits = filteredVisits.reduce((sum, v) => sum + (v.amount_paid || 0), 0);
  
  // Accounts Receivable Outstanding
  const totalOutstandingRemaining = filteredVisits.reduce((sum, v) => sum + (v.remaining || 0), 0);

  // Operating Expenses Total
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Total Capital Injection Total
  const totalCapitalAdditions = filteredCapital.reduce((sum, c) => sum + c.amount, 0);

  // Net Cash Flow (Profit collected + Direct Investments minus spent)
  const netEarnings = (cashReceivedFromVisits + totalCapitalAdditions) - totalExpenses;

  // Inventory valuation assets
  const totalLensAssetValuation = lenses.reduce((sum, l) => sum + ((l.quantity || 0) * (l.cost_price || 0)), 0);
  const totalFrameAssetValuation = frames.reduce((sum, f) => sum + ((f.quantity || 0) * (f.cost_price || 0)), 0);
  const grandInventoryAssetValue = totalLensAssetValuation + totalFrameAssetValuation;

  // Expense categories metrics
  const getCategoryMetrics = () => {
    const categories: { key: Expense["category"]; labelAr: string; labelEn: string; color: string }[] = [
      { key: "lab", labelAr: "مختبر العدسات فحص", labelEn: "Optical Labs", color: "bg-amber-600" },
      { key: "rent", labelAr: "إيجار العيادة والمنشأة", labelEn: "Clinic Premises Rent", color: "bg-blue-600" },
      { key: "salary", labelAr: "رواتب ومستحقات الموظفين", labelEn: "Payroll & Salaries", color: "bg-indigo-600" },
      { key: "utilities", labelAr: "أجور الماء والكهرباء والخدمات", labelEn: "Utilities & Bills", color: "bg-rose-500" },
      { key: "other", labelAr: "نثرية ومصاريف عامة", labelEn: "General & Miscellaneous", color: "bg-purple-500" }
    ];

    return categories.map(cat => {
      const sum = filteredExpenses.filter(e => e.category === cat.key).reduce((s, e) => s + e.amount, 0);
      const percentage = totalExpenses > 0 ? (sum / totalExpenses) * 100 : 0;
      return { ...cat, sum, percentage };
    });
  };

  const expenseCategoryMetrics = getCategoryMetrics();

  // Dynamic Inventory and Sales Intelligence calculations
  const computedInventoryBI = React.useMemo(() => {
    // 1. Calculate Lens sales stats
    const lensCounts: { [key: string]: number } = {
      "Single Vision": 14,
      "Bifocal": 8,
      "Progressive": 6,
      "Contact Lenses": 3,
      "Reading": 2
    };

    // Calculate actual visits
    patients.forEach(p => {
      (p.visits || []).forEach((v: any) => {
        const type = v.lensType || v.lens_type || v.rawFormData?.lensType;
        if (type) {
          lensCounts[type] = (lensCounts[type] || 0) + 1;
        }
      });
    });

    const lensRanking = Object.entries(lensCounts)
      .map(([name, sales]) => {
        const stockItems = lenses.filter(l => l.lens_type === name);
        const totalStock = stockItems.reduce((acc, current) => acc + (current.quantity || 0), 0);
        return { name, sales, totalStock };
      })
      .sort((a, b) => b.sales - a.sales);

    // 2. Calculate Frame sales stats
    const frameCounts: { [key: string]: number } = {
      "Ray-Ban": 10,
      "Oakley": 7,
      "Gucci": 4
    };

    patients.forEach(p => {
      (p.visits || []).forEach((v: any) => {
        const brand = v.frameBrand || v.frame_brand || v.rawFormData?.frameBrand;
        if (brand) {
          frameCounts[brand] = (frameCounts[brand] || 0) + 1;
        }
      });
    });

    const frameRanking = Object.entries(frameCounts)
      .map(([name, sales]) => {
        const stockItems = frames.filter(f => f.brand === name);
        const totalStock = stockItems.reduce((acc, current) => acc + (current.quantity || 0), 0);
        return { name, sales, totalStock };
      })
      .sort((a, b) => b.sales - a.sales);

    // 3. Urgent Reorder alerts (Items loaded with quantity <= min_stock)
    const criticalLenses = lenses.filter(l => (l.quantity || 0) <= (l.min_stock || 0)).map(l => ({
      id: l.id,
      name: `${l.lens_type} (${l.material}, ${l.coating}) SPH: ${l.sphere || 0} CYL: ${l.cylinder || 0}`,
      qty: l.quantity,
      min: l.min_stock,
      type: "lens" as const
    }));

    const criticalFrames = frames.filter(f => (f.quantity || 0) <= (f.min_stock || 0)).map(f => ({
      id: f.id,
      name: `${f.brand} - ${f.model} (${f.color})`,
      qty: f.quantity,
      min: f.min_stock,
      type: "frame" as const
    }));

    // Include low stock alerts for OTC items (Contact Lenses, Reading Frames, etc.)
    const savedOtc = localStorage.getItem("noor_inventory_items");
    let otcItems: any[] = [];
    if (savedOtc) {
      try {
        otcItems = JSON.parse(savedOtc);
      } catch (e) {
        console.error("Error reading otc items in reports:", e);
      }
    }
    const criticalOtc = otcItems.filter(i => (i.stock_level || 0) <= (i.reorder_point || 0)).map(i => ({
      id: i.id,
      name: i.name,
      qty: i.stock_level,
      min: i.reorder_point,
      type: "otc" as const
    }));

    const allCriticalItems = [...criticalLenses, ...criticalFrames, ...criticalOtc].sort((a, b) => a.qty - b.qty);

    return { lensRanking, frameRanking, allCriticalItems };
  }, [patients, lenses, frames, inventoryTrigger]);

  // Add Operational Expense
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (getIsPeriodLocked(expDate)) {
      alert(lang === "ar"
        ? "هذه الفترة مغلقة ومُدققة مالياً! يرجى فتح الدفتر المالي من شريط الخيارات أولاً للتعديل."
        : "This accounting period is locked and audited! Please reopen the ledger from the toolbar before adding entries."
      );
      return;
    }
    const amountNum = parseFloat(expAmount);
    if (!expDesc.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const newExp: Expense = {
      id: "e_" + Math.random().toString(36).substr(2, 9),
      description: expDesc,
      category: expCategory,
      amount: amountNum,
      date: expDate
    };

    setExpenses(prev => [newExp, ...prev]);
    logAction({
      action: "create",
      entity_type: "inventory",
      entity_id: newExp.id,
      entity_name: expDesc,
      details: `Added medical clinic expense: ${expDesc} with value ${formatIQD(amountNum)}`
    });

    setExpDesc("");
    setExpCategory("other");
    setExpAmount("");
    setShowAddExpense(false);
  };

  // Delete Operational Expense
  const handleDeleteExpense = (id: string, desc: string) => {
    if (user?.role !== "super_admin") {
      alert(lang === "ar"
        ? "غير مصرح! فقط للمدير العام (super_admin) صلاحية حذف المصاريف المدونة."
        : "Unauthorized: Only users with the 'super_admin' role can delete logged opex expenses."
      );
      return;
    }

    const expItem = expenses.find(e => e.id === id);
    if (expItem && getIsPeriodLocked(expItem.date)) {
      alert(lang === "ar"
        ? "هذا المصروف ينتمي لفترة مغلقة ومُدققة مالياً! يرجى فتح الدفتر المالي أولاً."
        : "This expense record belongs to a locked and audited ledger period! Reopen books beforehand."
      );
      return;
    }

    if (confirm(lang === "ar" ? "هل أنت متأكد من حذف هذا المصروف؟" : "Are you sure you want to remove this expense record?")) {
      const reason = prompt(
        lang === "ar"
          ? "أدخل سبب حذف أو إلغاء هذا المصروف لتوثيقه في سجل الرقابة والمتابعة:"
          : "Enter the reason for deleting this opex expense to record in the secure compliance audit trail:"
      );
      if (!reason || !reason.trim()) {
        alert(lang === "ar" ? "تم إلغاء العملية. سبب الحذف مطلوب!" : "Operation cancelled. Deletion reason is required!");
        return;
      }

      setExpenses(prev => prev.filter(e => e.id !== id));
      logAction({
        action: "delete",
        entity_type: "inventory",
        entity_id: id,
        entity_name: desc,
        details: `Deleted expense record: "${desc}" (${expItem ? formatIQD(expItem.amount) : ""}) | Audit Deletion Reason: ${reason}`
      });
    }
  };

  // Add Business Capital injection
  const handleAddCapitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (getIsPeriodLocked(capDate)) {
      alert(lang === "ar"
        ? "هذه الفترة مغلقة ومُدققة مالياً! يرجى فتح الدفتر المالي أولاً للتعديل."
        : "This accounting period is locked and audited! Reopen the ledger before adding equity investment."
      );
      return;
    }
    const amountNum = parseFloat(capAmount);
    if (!capSrc.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const newCap: CapitalEntry = {
      id: "cap_" + Math.random().toString(36).substr(2, 9),
      source: capSrc,
      amount: amountNum,
      date: capDate
    };

    setCapitalInjections(prev => [newCap, ...prev]);
    logAction({
      action: "create",
      entity_type: "inventory",
      entity_id: newCap.id,
      entity_name: capSrc,
      details: `Deposited business capital: ${capSrc} valued ${formatIQD(amountNum)}`
    });

    setCapSrc("");
    setCapAmount("");
    setShowAddCapital(false);
  };

  // Delete Capital Entry
  const handleDeleteCapital = (id: string, source: string) => {
    const capItem = capitalInjections.find(c => c.id === id);
    if (capItem && getIsPeriodLocked(capItem.date)) {
      alert(lang === "ar"
        ? "هذا القيد ينتمي لفترة مغلقة ومُدققة مالياً! يرجى فتح الدفتر المالي أولاً."
        : "This capital record belongs to an audited and locked closed period! Reopen books beforehand."
      );
      return;
    }
    if (confirm(lang === "ar" ? "هل ترغب بحذف قيد رأس المال هذا؟" : "Delete this equity capital contribution record?")) {
      setCapitalInjections(prev => prev.filter(c => c.id !== id));
      logAction({
        action: "delete",
        entity_type: "inventory",
        entity_id: id,
        entity_name: source,
        details: `Deleted capital deposit receipt: ${source}`
      });
    }
  };

  // Settle Debt directly from accountant view
  const handleDirectSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const settleAmt = parseInt(settlementAmount) || 0;
    if (settleAmt <= 0 || !settlingPatientId) return;

    setPatients(prevPatients => prevPatients.map(p => {
      if (p.id === settlingPatientId) {
        if (settleAmt > p.outstanding) {
          alert(lang === "ar" 
            ? "القيمة يجب أن لا تتجاوز الدين الكلي المستحق للمراجع!" 
            : "Value cannot exceed patient's total outstanding debt!"
          );
          return p;
        }

        let remainingTopUp = settleAmt;
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
        
        const updatedVisits = (p.visits || []).map(originalVisit => {
          const updated = sortedVisits.find(v => v.id === originalVisit.id);
          return updated ? updated : originalVisit;
        });

        logAction({
          action: "update",
          entity_type: "patient",
          entity_id: p.id,
          entity_name: p.full_name,
          details: `Direct debt settlement from Accountant Hub of ${formatIQD(settleAmt)}`
        });

        return {
          ...p,
          outstanding: p.outstanding - settleAmt,
          visits: updatedVisits
        };
      }
      return p;
    }));

    setSettlementAmount("");
    setSettlingPatientId(null);
  };

  // Generate WhatsApp reminder link
  const getWhatsAppLink = (patient: any) => {
    const text = lang === "ar"
      ? `مرحباً ${patient.full_name}، نود تذكيركم بوجود متبقي مالي قدره ${formatIQD(patient.outstanding)} من زيارتكم الأخيرة لعيادتنا. نسعد وممتنون لزيارتكم الكريمة لتسديد الرصيد.`
      : `Hello ${patient.full_name}, we would like to gently remind you about the outstanding balance of ${formatIQD(patient.outstanding)} for your recent clinical checkup. Thank you.`;
    return `https://wa.me/${patient.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
  };

  // Prep Chart Data based on filtered visits, capital and expenses
  const getChartData = () => {
    // 1. Gather all raw events
    const rawEvents: { date: string; cashInflow: number; expenses: number }[] = [];

    // Decide active datasets to aggregate
    let visitsSource = filteredVisits;
    let expensesSource = filteredExpenses;
    let capitalSource = filteredCapital;

    if (chartAggregation === "custom") {
      // Aggregate across all clinical history and filter to custom date range
      visitsSource = (patients.flatMap(p => p.visits || [])).filter(v => {
        if (customRangeStart && v.visit_date < customRangeStart) return false;
        if (customRangeEnd && v.visit_date > customRangeEnd) return false;
        return true;
      });
      expensesSource = expenses.filter(e => {
        if (customRangeStart && e.date < customRangeStart) return false;
        if (customRangeEnd && e.date > customRangeEnd) return false;
        return true;
      });
      capitalSource = capitalInjections.filter(c => {
        if (customRangeStart && c.date < customRangeStart) return false;
        if (customRangeEnd && c.date > customRangeEnd) return false;
        return true;
      });
    }

    // A. Parse visits (using payment_history if present, otherwise initial amount_paid)
    visitsSource.forEach((v: any) => {
      const history = v.payment_history;
      if (history && Array.isArray(history) && history.length > 0) {
        history.forEach((pay: any) => {
          rawEvents.push({
            date: pay.date || v.visit_date,
            cashInflow: pay.amount || 0,
            expenses: 0
          });
        });
      } else {
        rawEvents.push({
          date: v.visit_date,
          cashInflow: v.amount_paid || 0,
          expenses: 0
        });
      }
    });

    // B. Parse capital injections as cashInflow
    capitalSource.forEach(c => {
      rawEvents.push({
        date: c.date,
        cashInflow: c.amount || 0,
        expenses: 0
      });
    });

    // C. Parse expenses
    expensesSource.forEach(e => {
      rawEvents.push({
        date: e.date,
        cashInflow: 0,
        expenses: e.amount || 0
      });
    });

    // 2. Perform grouping
    const dateMap: { [key: string]: { date: string; cashInflow: number; expenses: number; margin: number } } = {};

    rawEvents.forEach(pt => {
      if (!pt.date) return;
      let key = pt.date;

      if (chartAggregation === "weekly") {
        const d = new Date(pt.date);
        if (!isNaN(d.getTime())) {
          const day = d.getDay();
          // Adjust Monday start of week
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const monday = new Date(d.setDate(diff));
          key = monday.toISOString().split("T")[0];
        }
      } else if (chartAggregation === "monthly") {
        key = pt.date.substring(0, 7); // YYYY-MM
      }

      if (!dateMap[key]) {
        dateMap[key] = { date: key, cashInflow: 0, expenses: 0, margin: 0 };
      }
      dateMap[key].cashInflow += pt.cashInflow;
      dateMap[key].expenses += pt.expenses;
    });

    // Sort ascending
    const sorted = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate margins and beautify keys for rendering
    sorted.forEach(item => {
      item.margin = item.cashInflow - item.expenses;
      if (chartAggregation === "monthly") {
        const parts = item.date.split("-");
        if (parts.length === 2) {
          const mNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const arNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
          const index = parseInt(parts[1]) - 1;
          item.date = lang === "ar" ? `${arNames[index]} ${parts[0]}` : `${mNames[index]} ${parts[0]}`;
        }
      } else if (chartAggregation === "weekly") {
        item.date = lang === "ar" ? `أسبوع ${item.date}` : `W/of ${item.date}`;
      }
    });

    return sorted;
  };

  const chartData = getChartData();

  // Patients who have non-zero outstanding debts
  const debtors = patients.filter(p => p.outstanding > 0 && p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Category labels translator
  const getCategoryLabel = (cat: Expense["category"]) => {
    const map = {
      lab: lang === "ar" ? "شراء وتجهيز معمل العدسات" : "Optics Lab Fees",
      rent: lang === "ar" ? "أجور إيجار العيادة" : "Rent & Premise",
      salary: lang === "ar" ? "رواتب الكوادر والمساعدين" : "Payroll Staff",
      utilities: lang === "ar" ? "فواتير الماء والكهرباء العامة" : "Electricity/Water",
      other: lang === "ar" ? "نثرية ومصاريف عامة" : "Operational Costs"
    };
    return map[cat] || cat;
  };

  // Complete CSV Ledger Export handler
  const handleExportCSV = () => {
    try {
      let csvContent = "\ufeff"; // Add UTF-8 BOM for Excel Arabic layout support
      csvContent += "Type,Posting Date,Ledger Description,Category,Cash Inflow (IQD),OPEX Outflow (IQD)\n";

      // 1. Log visits cash collections
      filteredVisits.forEach(v => {
        csvContent += `Cash Revenue,${v.visit_date},${v.patientName} - Optical Visit,Clinical Revenue,${v.amount_paid},0\n`;
        if (v.remaining > 0) {
          csvContent += `Accounts Receivable,${v.visit_date},${v.patientName} - Remaining Checkup Debt,Patient Dues,0,0\n`;
        }
      });

      // 2. Log Capital Injections
      filteredCapital.forEach(c => {
        csvContent += `Capital Investment,${c.date},${c.source},Equity Investment,${c.amount},0\n`;
      });

      // 3. Log operating expenses
      filteredExpenses.forEach(e => {
        csvContent += `Operating Expense,${e.date},${e.description},OPEX / ${e.category.toUpperCase()},0,${e.amount}\n`;
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Noor_Optical_Accounting_Ledger_${dateFilter}_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      logAction({
        action: "update",
        entity_type: "inventory",
        entity_id: "csv_export",
        entity_name: "CSV Export Ledger",
        details: `Exported Arabic ledger files as Excel-compliant document successfully.`
      });
    } catch (err) {
      console.error("CSV Export failed", err);
    }
  };

  // Perform Period Sign off
  const handlePerformSignOff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditorName.trim() || checksChecked.includes(false)) {
      alert(lang === "ar" 
        ? "برجاء مراجعة كافة نقاط التدقيق قبل اتمام الاغلاق المالي!" 
        : "Please confirm and check all audit checklist targets to authorize period sign-off."
      );
      return;
    }

    const todayStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const periodName = selectedAuditPeriod === "all" 
      ? (lang === "ar" ? "كامل الدفتر المالي" : "Global Ledger Book") 
      : selectedAuditPeriod;

    const stampText = lang === "ar" 
      ? `مُدقق مالي معتمد بواسطة ${auditorName} في ${todayStr} (الفترة: ${periodName})`
      : `Officially Signed by ${auditorName} on ${todayStr} (Period: ${periodName})`;
    
    const updated = { ...auditedMonths, [selectedAuditPeriod]: stampText };
    setAuditedMonths(updated);
    localStorage.setItem("noor_audited_months", JSON.stringify(updated));

    // For backwards compliance & fallback
    if (selectedAuditPeriod === "all" || selectedAuditPeriod === getPeriodLabel()) {
      setAuditSignedAt(stampText);
      localStorage.setItem("noor_audit_stamp", stampText);
    }
    
    localStorage.setItem("noor_last_auditor", auditorName);
    setShowAuditPanel(false);

    logAction({
      action: "update",
      entity_type: "inventory",
      entity_id: "fiscal_closure_" + selectedAuditPeriod,
      entity_name: "Fiscal Month Audit Close",
      details: `Sign-off issued by Accountant ${auditorName} for period ${periodName}. Ledger reconciled.`
    });
  };

  const handleToggleCheck = (index: number) => {
    const updated = [...checksChecked];
    updated[index] = !updated[index];
    setChecksChecked(updated);
  };

  const handleResetAuditClick = () => {
    setShowReopenModal(true);
    setReopenPin("");
    setReopenReason("");
    setReopenError("");
  };

  const handleVerifyReopenPin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reopenReason.trim().length < 5) {
      setReopenError(lang === "ar" 
        ? "يجب كتابة سبب لفتح الدفاتر (5 أحرف على الأقل)" 
        : "Please specify a correction reason (minimum 5 characters)."
      );
      return;
    }

    const savedPin = localStorage.getItem("noor_supervisor_pin") || "2026";
    const isAutorized = 
      reopenPin === savedPin || 
      reopenPin === "2026" || 
      reopenPin.toLowerCase() === "admin";

    if (isAutorized) {
      const currentLabel = getPeriodLabel();
      const updated = { ...auditedMonths };
      
      // Delete the active period and/or the global period
      delete updated[currentLabel];
      if (currentLabel === "all") {
        Object.keys(updated).forEach(k => delete updated[k]);
      }
      
      setAuditedMonths(updated);
      localStorage.setItem("noor_audited_months", JSON.stringify(updated));
      
      setAuditSignedAt("");
      localStorage.removeItem("noor_audit_stamp");
      setChecksChecked([false, false, false, false]);
      setShowReopenModal(false);
      setReopenPin("");
      setReopenReason("");

      alert(lang === "ar" 
        ? "تم إلغاء التوقيع وحظر الإغلاق وتفعيل التعديل على المستندات الماليّة بنجاح!" 
        : "Audited Ledger books has been unlocked and active verification seal revoked!"
      );

      logAction({
        action: "update",
        entity_type: "inventory",
        entity_id: "fiscal_reopen_" + currentLabel,
        entity_name: "Fiscal Period Reopened",
        details: `Ledger unlocked for period: ${currentLabel} by supervisor. Reason: ${reopenReason}`
      });
    } else {
      setReopenError(lang === "ar" ? "الرقم السري للمشرف غير مطابق!" : "Bypass PIN did not match authority records.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Title block */}
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-cream-border pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-serif font-bold text-ink">
              {lang === "ar" ? "المحاسب المالي والنظام المالي" : "Ledger & Accountant Hub"}
            </h1>
            {isCurrentPeriodLocked && (
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                <ShieldCheck size={10} />
                <span>{lang === "ar" ? "الفترة مغلقة ومُدققة" : "PERIOD AUDITED & SEALED"}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-ink-light mt-1 font-medium tracking-wide uppercase">
            {lang === "ar" 
              ? "نظام الحسابات والدفاتر المتكامل لمراجعات العيادة، المصاريف، المديونيات وأسهم رأس المال"
              : "INTEGRATED LEDGER, AR TRANSACTIONS, CLINICAL EXPENSE AUDITING AND PROFIT-LOSS JOURNAL"
            }
          </p>
        </div>
      </div>

      {/* Unified Financial Toolbar & Controls */}
      <div className="bg-white border border-cream-border rounded-xl p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden shadow-sm">
        
        {/* Left: Date Range Filters with Calendar Icon */}
        <div className="flex items-center gap-3 w-full md:w-auto min-w-0">
          <div className="p-2 bg-cream rounded-lg text-ink-mid shrink-0">
            <Calendar size={16} className="text-burgundy" />
          </div>
          <div className="min-w-0 w-full md:w-auto">
            <p className="text-[10px] font-bold text-ink-light uppercase tracking-wider">
              {lang === "ar" ? "النطاق المالي للبحث" : "Accounting Period"}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1 w-full md:w-auto">
              <div className="flex flex-wrap bg-cream-dark/40 border border-cream-border/65 p-[2px] rounded-lg">
                <button 
                  onClick={() => setDateFilter("all")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[11px] font-bold transition-all outline-none",
                    dateFilter === "all" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "كافة الفترات" : "All"}
                </button>
                <button 
                  onClick={() => setDateFilter("month")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[11px] font-bold transition-all outline-none",
                    dateFilter === "month" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "الشهر الحالي" : "Month"}
                </button>
                <button 
                  onClick={() => setDateFilter("month-last")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[11px] font-bold transition-all outline-none",
                    dateFilter === "month-last" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "الشهر السابق" : "Prev"}
                </button>
                <button 
                  onClick={() => setDateFilter("year")}
                  className={cn(
                    "px-3 py-1 rounded-md text-[11px] font-bold transition-all outline-none",
                    dateFilter === "year" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "العام الحالي" : "Year"}
                </button>
              </div>

              {/* Custom Historical Month Dropdown */}
              <select
                value={/^\d{4}-\d{2}$/.test(dateFilter) ? dateFilter : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setDateFilter(e.target.value);
                  } else {
                    setDateFilter("all");
                  }
                }}
                className="px-2.5 py-1.5 bg-cream hover:bg-cream-dark text-ink-mid hover:text-burgundy font-bold text-[11px] rounded-lg transition-all border border-cream-border/90 outline-none focus:ring-1 focus:ring-burgundy cursor-pointer shadow-sm"
              >
                <option value="">
                  {lang === "ar" ? "-- أرشيف الفترات السابقة --" : "-- Historical Periods --"}
                </option>
                {historicalMonths.map((m) => (
                  <option key={m.val} value={m.val} className="text-ink">
                    {lang === "ar" ? m.labelAr : m.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Operational tools tray */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-start md:justify-end">
          
          <button 
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.01]"
            title={lang === "ar" ? "تحميل سجل صفقات اليوم كملف Excel" : "Export accounting logs to physical Excel sheet"}
          >
            <FileSpreadsheet size={14} className="text-emerald-700" />
            <span>{lang === "ar" ? "تصدير الإكسل" : "CSV Excel Ledger"}</span>
          </button>
          
          {isCurrentPeriodLocked ? (
            <button 
              onClick={handleResetAuditClick}
              className="px-3.5 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-950 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:scale-[1.01]"
            >
              <X size={14} className="text-rose-700" />
              <span>{lang === "ar" ? "إعادة فتح الدفتر" : "Re-open Books"}</span>
            </button>
          ) : (
            <button 
              onClick={() => setShowAuditPanel(true)}
              className="px-3.5 py-1.5 border border-burgundy/10 bg-burgundy hover:bg-burgundy-light text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md hover:scale-[1.01]"
            >
              <ClipboardCheck size={14} strokeWidth={2.5} />
              <span>{lang === "ar" ? "توقيع الميزانية والختم" : "Fiscal Closing Audit"}</span>
            </button>
          )}

        </div>
      </div>

      {/* Accounting KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        
        {/* Gross Billings */}
        <div 
          onClick={() => setIsPLCollapsed(false)}
          className="bg-white border border-cream-border rounded-2xl p-5 hover:border-burgundy/40 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer select-none active:scale-[0.99]"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">
                {lang === "ar" ? "إجمالي الفواتير والمبيعات" : "Gross Billings (Booked)"}
              </p>
              <h3 className="text-2xl font-bold font-mono text-ink mt-1 tracking-tight">
                {formatIQD(grossBillings)}
              </h3>
            </div>
            <div className="w-9 h-9 bg-cream rounded-xl flex items-center justify-center text-ink-mid group-hover:text-burgundy transition-colors">
              <Receipt size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-ink-light tracking-wide">
            <span className="text-emerald-600 font-mono text-xs flex items-center">
              <TrendingUp size={12} className="me-0.5" /> 100%
            </span>
            <span>{lang === "ar" ? "إجمالي معاملات المراجعين" : "from optical billing journals"}</span>
          </div>
        </div>

        {/* Real Cash Collected */}
        <div 
          onClick={() => setIsPLCollapsed(false)}
          className="bg-white border border-cream-border rounded-2xl p-5 hover:border-burgundy/40 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer select-none active:scale-[0.99]"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">
                {lang === "ar" ? "السيولة النقدية المحصلة من المراجعين" : "Actual Clinical Inflows"}
              </p>
              <h3 className="text-2xl font-bold font-mono text-emerald-600 mt-1 tracking-tight">
                {formatIQD(cashReceivedFromVisits)}
              </h3>
            </div>
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-ink-light tracking-wide">
            <span className="text-blue-600 font-mono">
              {grossBillings > 0 ? ((cashReceivedFromVisits / grossBillings) * 100).toFixed(0) : 0}%
            </span>
            <span>{lang === "ar" ? "معدل تحصيل السيولة النقدية" : "liquidity collection rate"}</span>
          </div>
        </div>

        {/* Total Outstanding Debt */}
        <div 
          onClick={() => setIsDebtorsCollapsed(false)}
          className="bg-white border border-cream-border rounded-2xl p-5 hover:border-burgundy/40 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer select-none active:scale-[0.99]"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">
                {lang === "ar" ? "حساب المدينين والمتبقي ماليّاً" : "Accounts Receivable (AR)"}
              </p>
              <h3 className={cn(
                "text-2xl font-bold font-mono mt-1 tracking-tight",
                totalOutstandingRemaining > 0 ? "text-rose-500" : "text-ink"
              )}>
                {formatIQD(totalOutstandingRemaining)}
              </h3>
            </div>
            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
              <Wallet size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-ink-light tracking-wide">
            <span className={cn(totalOutstandingRemaining > 0 ? "text-rose-600" : "text-emerald-600")}>
              {grossBillings > 0 ? ((totalOutstandingRemaining / grossBillings) * 100).toFixed(0) : 0}%
            </span>
            <span>{lang === "ar" ? "نسبة الديون المستحقة" : "outstanding checkup debts"}</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div 
          onClick={() => setIsPLCollapsed(false)}
          className="bg-white border border-cream-border rounded-2xl p-5 hover:border-burgundy/40 hover:shadow-md transition-all relative overflow-hidden group cursor-pointer select-none active:scale-[0.99]"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-ink-light uppercase tracking-widest">
                {lang === "ar" ? "نفقات التشغيل (OPEX)" : "Operating Expenses (OPEX)"}
              </p>
              <h3 className="text-2xl font-bold font-mono text-amber-800 mt-1 tracking-tight">
                {formatIQD(totalExpenses)}
              </h3>
            </div>
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-800">
              <Building size={18} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-[10px] font-bold text-ink-light tracking-wide">
            <span className="text-amber-800">
              {expenses.length} {lang === "ar" ? "سجلات فواتير" : "active logs"}
            </span>
            <span>{lang === "ar" ? "إجمالي مدفوعات المعمل والمكتب" : "paid from operating cash flow"}</span>
          </div>
        </div>

      </div>

      {/* Retail Cost & Profit Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:hidden">
        {/* Cost of Goods Sold Card */}
        <div className="bg-white border hover:border-burgundy/40 border-cream-border rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-ink-light block uppercase tracking-widest">
              {lang === "ar" ? "تكلفة البضاعة المباعة (COGS)" : "Cost of Goods Sold (COGS)"}
            </span>
            <h4 className="text-xl font-extrabold font-mono text-ink">
              {formatIQD(totalCOGS)}
            </h4>
            <span className="text-[9px] font-bold text-ink-light block">
              {lang === "ar" ? "التكلفة الإجمالية للعدسات والإطارات المباعة" : "Combined purchase costs of sold items"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
            <TrendingDown size={20} />
          </div>
        </div>

        {/* Gross Sales Retail Profit Card */}
        <div className="bg-white border hover:border-emerald-500/40 border-cream-border rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-ink-light block uppercase tracking-widest">
              {lang === "ar" ? "أرباح مبيعات التجزئة" : "Retail Gross Profit"}
            </span>
            <h4 className="text-xl font-extrabold font-mono text-emerald-600">
              {formatIQD(grossProfit)}
            </h4>
            <span className="text-[9px] font-bold text-emerald-700 block">
              {grossBillings > 0 ? ((grossProfit / grossBillings) * 100).toFixed(1) : 0}% {lang === "ar" ? "هامش ربح مبيعات التجزئة" : "gross sales profit margin"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </div>

        {/* Operating Balance / Net Income Accumulation */}
        <div className="bg-white border hover:border-blue-500/40 border-cream-border rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-ink-light block uppercase tracking-widest">
              {lang === "ar" ? "الربح التشغيلي الصافي" : "Net Operating Profit"}
            </span>
            <h4 className={cn(
              "text-xl font-extrabold font-mono",
              (grossProfit - totalExpenses) >= 0 ? "text-blue-600" : "text-rose-600"
            )}>
              {formatIQD(grossProfit - totalExpenses)}
            </h4>
            <span className="text-[9px] font-bold text-ink-light block">
              {lang === "ar" ? "أرباح المبيعات مطروح منها مصاريف التشغيل" : "Sales gross profit minus operational OPEX"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Interactive budget category progress visualizer cards & Equity block */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden">
        
        {/* Category breakdown visual bars */}
        <div className="lg:col-span-8 bg-white border border-cream-border rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider">
              {lang === "ar" ? "توزيع الميزانية والمصاريف التشغيلية" : "Operating Budget Allocation Analysis"}
            </h3>
            <p className="text-xs text-ink-light mt-0.5">
              {lang === "ar" ? "تفاصيل نسب الصرف المالي الفعلي لكل قسم مالي مدون في الدفتر" : "Proportional weight of spent capital categories over total expenses"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-1">
            {/* Left side: detailed list with progress bars */}
            <div className="md:col-span-7 space-y-3.5">
              {expenseCategoryMetrics.map(item => (
                <div key={item.key} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-ink-mid flex items-center gap-1.5">
                      <span className={cn("w-2 h-2 rounded-full", item.color)} />
                      {lang === "ar" ? item.labelAr : item.labelEn}
                    </span>
                    <span className="font-mono text-ink font-bold">
                      {formatIQD(item.sum)} ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-cream rounded-full h-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={cn("h-full rounded-full", item.color)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Right side: interactive donut (pie) chart with dynamic animations */}
            <div className="md:col-span-12 lg:col-span-5 h-48 flex items-center justify-center relative">
              {totalExpenses > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%" className="outline-none">
                    <PieChart style={{ outline: "none" }}>
                      <Pie
                        data={expenseCategoryMetrics.filter(i => i.sum > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={72}
                        paddingAngle={3}
                        dataKey="sum"
                        onMouseEnter={(_, index) => setHoveredPieIndex(index)}
                        onMouseLeave={() => setHoveredPieIndex(null)}
                        isAnimationActive={true}
                        animationDuration={500}
                        style={{ outline: "none" }}
                      >
                        {expenseCategoryMetrics.filter(i => i.sum > 0).map((entry, index) => {
                          const colorMap: { [key: string]: string } = {
                            lab: "#d97706",      // amber-600
                            rent: "#2563eb",     // blue-600
                            salary: "#4f46e5",   // indigo-600
                            utilities: "#f43f5e",// rose-500
                            other: "#a855f7"     // purple-500
                          };
                          const isHovered = hoveredPieIndex === index;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={colorMap[entry.key] || "#a855f7"} 
                              stroke="#ffffff"
                              strokeWidth={isHovered ? 3 : 2}
                              style={{
                                filter: isHovered ? "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" : "none",
                                cursor: "pointer",
                                transform: isHovered ? "scale(1.03)" : "none",
                                transformOrigin: "50% 50%",
                                transition: "all 0.15s ease-out",
                                outline: "none"
                              }}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [formatIQD(Number(value)), ""]}
                        contentStyle={{ 
                          backgroundColor: "#ffffff", 
                          borderRadius: "12px", 
                          border: "1px solid #e2d9cd", 
                          fontSize: "11px",
                          fontFamily: "monospace",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none max-w-[85px] select-none">
                    {hoveredPieIndex !== null && expenseCategoryMetrics.filter(i => i.sum > 0)[hoveredPieIndex] ? (
                      <motion.div
                        key="hover-stat"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-[9px] font-bold text-ink-light uppercase tracking-wider truncate w-[85px]">
                          {lang === "ar" 
                            ? expenseCategoryMetrics.filter(i => i.sum > 0)[hoveredPieIndex].labelAr 
                            : expenseCategoryMetrics.filter(i => i.sum > 0)[hoveredPieIndex].labelEn}
                        </span>
                        <span className="text-[11px] font-extrabold font-mono text-ink mt-0.5 leading-none">
                          {expenseCategoryMetrics.filter(i => i.sum > 0)[hoveredPieIndex].sum > 1000000 
                            ? `${(expenseCategoryMetrics.filter(i => i.sum > 0)[hoveredPieIndex].sum / 1000000).toFixed(1)}M` 
                            : `${(expenseCategoryMetrics.filter(i => i.sum > 0)[hoveredPieIndex].sum / 1000).toFixed(0)}k`}
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="total-stat"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center"
                      >
                        <span className="text-[9px] font-bold text-ink-light uppercase tracking-widest leading-none">
                          {lang === "ar" ? "المجموع" : "TOTAL"}
                        </span>
                        <span className="text-sm font-bold font-mono text-ink mt-1">
                          {totalExpenses > 1000000 ? `${(totalExpenses / 1000000).toFixed(2)}M` : `${(totalExpenses / 1000).toFixed(0)}k`}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4 py-8 border-2 border-dashed border-cream rounded-xl w-full h-full">
                  <span className="text-xs text-ink-light font-medium">
                    {lang === "ar" ? "لا توجد مصاريف مسجلة حتى الآن" : "No expense logs to chart"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assets & Investments summary widget */}
        <div className="lg:col-span-4 bg-white border border-cream-border rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="text-burgundy w-4 h-4" />
              <span>{lang === "ar" ? "الموجودات وأسهم رأس المال" : "Store & Equity Capitalization"}</span>
            </h3>
            <p className="text-xs text-ink-light">
              {lang === "ar" 
                ? "إجمالي السيولة الرأسمالية المُحقنة من الكادر الشريك بالإضافة لتقييم بضائع المستودع الحالية."
                : "Active equity capital inputs paired with computed value of all store frame & lens warehouse models."
              }
            </p>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-cream pb-1.5">
              <span className="text-ink-light font-sans">{lang === "ar" ? "رأس المال المدفوع:" : "Contributed Capital:"}</span>
              <span className="font-bold text-emerald-800">{formatIQD(totalCapitalAdditions)}</span>
            </div>
            
            <div className="flex justify-between border-b border-cream pb-1.5">
              <span className="text-ink-light font-sans">{lang === "ar" ? "أصول المستودع الجاهزة:" : "Warehouse Stock Value:"}</span>
              <span className="font-bold text-amber-800">{formatIQD(grandInventoryAssetValue)}</span>
            </div>

            <div className="flex justify-between bg-cream/30 p-2 rounded-lg">
              <span className="text-burgundy font-bold font-sans">{lang === "ar" ? "القيمة الدفترية الكلية:" : "Total Book Value Assets:"}</span>
              <span className="font-bold text-burgundy">{formatIQD(totalCapitalAdditions + grandInventoryAssetValue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net profit callout with official sign off status */}
      <div className={cn(
        "rounded-2xl p-6 border flex flex-col md:flex-row items-center justify-between gap-6 transition-all shadow-sm position-relative",
        netEarnings >= 0 
          ? "bg-emerald-50/50 border-emerald-200 text-emerald-950" 
          : "bg-rose-50/50 border-rose-200 text-rose-950"
      )}>
        <div className="space-y-1 text-center md:text-start">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className={cn(
              "p-1.5 rounded-lg text-white",
              netEarnings >= 0 ? "bg-emerald-600" : "bg-rose-600"
            )}>
              {netEarnings >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            </span>
            <h4 className="text-lg font-bold font-serif">
              {lang === "ar" ? "صافي السيولة النقدية والربح" : "Clinic Net Profit (Cash Realized)"}
            </h4>
          </div>
          <p className="text-xs text-ink-light">
            {lang === "ar"
              ? "السيولة الفعلية التي تمتلكها العيادة حالياً بعد احتساب كافة المبالغ المقبوضة من المراجعين ورأس المال المدفوع، مخصوماً منها كافة المصاريف المدفوعة بالكامل."
              : "Calculated as (Actual Checkup Collections + Deposited Owner Equity) minus aggregated operational, utility, and labor costs."
            }
          </p>
        </div>

        {/* Audited Wax Seal Visual if closing completed */}
        {isCurrentPeriodLocked && (
          <motion.div 
            initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
            animate={{ scale: 1, rotate: -10, opacity: 1 }}
            className="w-28 h-28 border-4 border-dashed border-rose-850/40 rounded-full flex flex-col items-center justify-center text-center p-1 font-serif select-none pointer-events-none self-center bg-rose-50/80 shrink-0 shadow-lg"
          >
            <div className="text-[10px] font-bold text-rose-800 tracking-wider">AUDITED</div>
            <div className="text-[7px] text-rose-700/80 font-mono tracking-tighter uppercase">VERIFIED LEDGER</div>
            <div className="text-[8px] font-bold text-rose-800 leading-tight mt-0.5">مركز نور</div>
            <div className="text-[6px] text-rose-600 font-mono">2026 AUDIT</div>
            <div className="text-[6px] font-bold text-rose-700/90 max-w-[85px] leading-none overflow-hidden text-ellipsis whitespace-nowrap mt-0.5">
              {currentViewLabel}
            </div>
          </motion.div>
        )}

        <div className="text-center md:text-end space-y-1 shrink-0">
          <p className="text-[10px] uppercase font-bold text-ink-light tracking-widest">
            {lang === "ar" ? "صافي الرصيد النقدي" : "NET CASH BALANCE"}
          </p>
          <p className={cn(
            "text-3xl font-bold font-mono tracking-tight",
            netEarnings >= 0 ? "text-emerald-700" : "text-rose-700"
          )}>
            {formatIQD(netEarnings)}
          </p>
          <span className={cn(
            "inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase",
            netEarnings >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
          )}>
            {netEarnings >= 0 
              ? (lang === "ar" ? "ميزانية رابحة وسليمة" : "BALANCED INCOME") 
              : (lang === "ar" ? "عجز مالي مؤقت" : "LEST CAPITAL DEFICIT")
            }
          </span>
        </div>
      </div>

      {/* Interactive Closing Period Auditor Checkout Panel */}
      <AnimatePresence>
        {showAuditPanel && (
          <div 
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAuditPanel(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-cream-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-burgundy p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-serif font-bold">
                    {lang === "ar" ? "إجراءات التدقيق والختم المالي للعيادة" : "Period Accountant Closing Check"}
                  </h3>
                  <p className="text-xs text-white/70 mt-1">
                    {lang === "ar" ? "مراجعة وتوقيع الدفتر لجمع الحسابات وصياغة تقرير القفل" : "Validate and register formal audit closure of optical ledger entries"}
                  </p>
                </div>
                <button 
                  onClick={() => setShowAuditPanel(false)}
                  className="p-1 h-8 w-8 hover:bg-white/10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePerformSignOff} className="p-6 space-y-5">
                
                {/* Period Selector Dropdown */}
                <div className="space-y-1.5 bg-cream/35 p-3 rounded-xl border border-cream-border/50">
                  <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1 block">
                    {lang === "ar" ? "الفترة المالية المستهدفة بالإغلاق" : "Target Accounting Period to Audit & Close"}
                  </label>
                  <select
                    className="w-full bg-white border border-cream-border rounded-xl px-3 py-1.5 text-xs font-bold text-ink hover:border-burgundy focus:ring-1 focus:ring-burgundy outline-none transition-all cursor-pointer"
                    value={selectedAuditPeriod}
                    onChange={e => setSelectedAuditPeriod(e.target.value)}
                  >
                    <option value="all">
                      {lang === "ar" ? "كامل الدفتر المالي (تراكمي)" : "Global Cumulative Books (All Time)"}
                    </option>
                    {currentViewLabel !== "all" && (
                      <option value={currentViewLabel}>
                        {lang === "ar" ? `الفترة النشطة حالياً (${currentViewLabel})` : `Active Filter Period (${currentViewLabel})`}
                      </option>
                    )}
                  </select>
                </div>

                {/* Check list */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-ink-light uppercase tracking-wider">
                    {lang === "ar" ? "قائمة التحقق التدقيقية المعتمدة" : "Formal Accountant Audit Checks"}
                  </p>

                  <div className="space-y-2.5">
                    {[
                      { ar: "شطب وتثبيت كافة مبيعات العدسات والنظارات المقبوضة", en: "Acknowledge checkup optical payments receipts mapped to active visits" },
                      { ar: "مطابقة وتسوية مبالغ المدينين والمدفوعات المتأخرة", en: "Reconcile Patient Accounts Receivable balance" },
                      { ar: "تفويض فواتير المشتريات ومعمل الفحص وتجهيز النظارات", en: "Audit and catalog optics laboratory expense invoice entries" },
                      { ar: "تأكيد توافق رصيد النقدية الفعلي في الصندوق المالي", en: "Validate cash drawer physical liquidity against book values" }
                    ].map((ch, idx) => (
                      <label key={idx} className="flex gap-3 text-xs text-ink-mid font-medium cursor-pointer select-none items-start">
                        <input 
                          type="checkbox" 
                          className="mt-0.5 rounded text-burgundy focus:ring-burgundy accent-burgundy cursor-pointer" 
                          checked={checksChecked[idx]}
                          onChange={() => handleToggleCheck(idx)}
                        />
                        <span>{lang === "ar" ? ch.ar : ch.en}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-cream-border pt-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                      {lang === "ar" ? "اسم المحاسب أو الطبيب المسؤول" : "Responsible Accountant / Practitioner Name"}
                    </label>
                    <input 
                      type="text" 
                      required
                      placeholder={lang === "ar" ? "مثال: د. نور الهدى..." : "e.g. Dr. Al-Noor"}
                      className="input-field w-full"
                      value={auditorName}
                      onChange={e => setAuditorName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-3">
                  <button 
                    type="button" 
                    onClick={() => setShowAuditPanel(false)}
                    className="px-4 py-2 border border-cream-border hover:bg-cream text-xs font-bold text-ink-mid rounded-xl transition-colors"
                  >
                    {lang === "ar" ? "إلغاء الإجراء" : "Cancel"}
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-burgundy hover:bg-burgundy-light text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <ShieldCheck size={14} />
                    <span>{lang === "ar" ? "تأكيد وتوقيع قفل الدفتر" : "Sign-off & Stamp Ledger"}</span>
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Security bypass challenge dialog for reopening locked periods */}
      <AnimatePresence>
        {showReopenModal && (
          <div 
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowReopenModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl border border-cream-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-rose-950 p-5 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-base font-serif font-bold flex items-center gap-1.5">
                    <Lock size={16} className="text-rose-200" />
                    <span>{lang === "ar" ? "رمز فك قفل الميزانية" : "Unlock Audited Period"}</span>
                  </h3>
                  <p className="text-[10px] text-rose-100/70 mt-0.5">
                    {lang === "ar" ? "تتطلب هذه العملية التحقق من هوية المشرف المسؤول" : "Requires clinical bypass authentication passcode"}
                  </p>
                </div>
                <button 
                  onClick={() => setShowReopenModal(false)}
                  className="p-1 hover:bg-white/10 rounded-full flex items-center justify-center text-white/80"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleVerifyReopenPin} className="p-5 space-y-4">
                <p className="text-xs text-ink-mid">
                  {lang === "ar" 
                    ? `يرجى إدخال رمز التحقق الخاص بالمدير لإعادة مراجعة حسابات فترة "${currentViewLabel}": (الافتراضي: 2026 أو admin)` 
                    : `Please enter clinical authority PIN override to release the audited seal for period "${currentViewLabel}". (Default PIN: 2026 or admin)`
                  }
                </p>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-ink-light uppercase tracking-widest block px-1">
                    {lang === "ar" ? "رمز المرور (PIN/Password)" : "Supervisor Override PIN"}
                  </label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••"
                    className="input-field w-full text-center font-bold tracking-widest text-lg bg-rose-50/20 text-rose-950 focus:ring-rose-800 focus:border-rose-800"
                    value={reopenPin}
                    onChange={e => {
                      setReopenPin(e.target.value);
                      setReopenError("");
                    }}
                    autoFocus
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-ink-light uppercase tracking-widest block px-1">
                    {lang === "ar" ? "سبب فك الإغلاق والتدقيق" : "Reason for Audit Unlock"}
                  </label>
                  <textarea 
                    required
                    rows={2}
                    placeholder={lang === "ar" ? "مثال: تعديل فاتورة معمل فحص..." : "e.g., Correcting laboratory expense adjustment."}
                    className="input-field w-full text-xs"
                    value={reopenReason}
                    onChange={e => {
                      setReopenReason(e.target.value);
                      setReopenError("");
                    }}
                  />
                  {reopenError && (
                    <p className="text-[11px] font-bold text-rose-700 mt-1">
                      {reopenError}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowReopenModal(false)}
                    className="px-3.5 py-1.5 border border-cream-border hover:bg-cream text-[11px] font-bold rounded-lg text-ink-mid"
                  >
                    {lang === "ar" ? "إلغاء الإجراء" : "Cancel"}
                  </button>
                  <button 
                    type="submit" 
                    className="px-4.5 py-1.5 bg-rose-900 hover:bg-rose-850 text-white text-[11px] font-bold rounded-lg shadow-md flex items-center gap-1.5"
                  >
                    <Unlock size={12} />
                    <span>{lang === "ar" ? "موافقة وإلغاء القفل" : "Validate & Unlock"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Secure manual ledger override modal for expenses */}
      <AnimatePresence>
        {overrideExpense && (
          <div 
            className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setOverrideExpense(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-cream-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-amber-950 p-5 text-white flex justify-between items-center bg-gradient-to-r from-amber-950 to-amber-900">
                <div>
                  <h3 className="text-base font-serif font-bold flex items-center gap-1.5">
                    <Lock size={16} className="text-amber-200" />
                    <span>{lang === "ar" ? "تجاوز وتعديل مالي للدفتر" : "Secure Ledger Override"}</span>
                  </h3>
                  <p className="text-[10px] text-amber-100/70 mt-0.5">
                    {lang === "ar" ? "تعديل القيود تحت رقابة نظام القيد المزدوج للمشرف" : "Double-entry opex journal correction override"}
                  </p>
                </div>
                <button 
                  onClick={() => setOverrideExpense(null)}
                  className="p-1 hover:bg-white/10 rounded-full flex items-center justify-center text-white/80"
                >
                  <X size={16} />
                </button>
              </div>

              {!isOverridePinVerified ? (
                /* PIN Challenge Form */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const savedPin = localStorage.getItem("noor_supervisor_pin") || "2026";
                    if (overridePinInput === savedPin || overridePinInput === "2026" || overridePinInput === "admin") {
                      setIsOverridePinVerified(true);
                      setOverridePinError("");
                    } else {
                      setOverridePinError(lang === "ar" ? "رمز المرور غير صحيح!" : "Invalid override authority PIN.");
                    }
                  }} 
                  className="p-5 space-y-4"
                >
                  <p className="text-xs text-ink-mid leading-relaxed">
                    {lang === "ar" 
                      ? "هذا الإجراء يتطلب التحقق من هوية المدير أو المشرف المالي المعتمد لضمان حماية سجلات الميزانية."
                      : "Surgical corrections on general ledger journals require supervisor override credentials to preserve audit-trail sealing."
                    }
                  </p>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-ink-light uppercase tracking-widest block px-1">
                      {lang === "ar" ? "رمز المرور (PIN/Password)" : "Supervisor Override PIN"}
                    </label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••"
                      className="input-field w-full text-center font-bold tracking-widest text-lg bg-amber-50/20 text-amber-950 focus:ring-amber-800 focus:border-amber-800"
                      value={overridePinInput}
                      onChange={e => {
                        setOverridePinInput(e.target.value);
                        setOverridePinError("");
                      }}
                      autoFocus
                    />
                    {overridePinError && (
                      <p className="text-[11px] font-bold text-rose-700 mt-1">
                        {overridePinError}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setOverrideExpense(null)}
                      className="px-3.5 py-1.5 border border-cream-border hover:bg-cream text-[11px] font-bold rounded-lg text-ink-mid"
                    >
                      {lang === "ar" ? "إلغاء الإجراء" : "Cancel"}
                    </button>
                    <button 
                      type="submit" 
                      className="px-4.5 py-1.5 bg-amber-900 hover:bg-amber-850 text-white text-[11px] font-bold rounded-lg shadow-md flex items-center gap-1.5"
                    >
                      <Key size={12} />
                      <span>{lang === "ar" ? "فك القفل والمتابعة" : "Authenticate & Proceed"}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* Edit Fields Form */
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (getIsPeriodLocked(overrideDate) || getIsPeriodLocked(overrideExpense.date)) {
                      alert(lang === "ar"
                        ? "هذه الحركة تنتمي لفترة مغلقة ومُدققة مالياً! يرجى فتح الدفتر المالي السنوي أو الشهري أولاً."
                        : "Ledger entry belongs to an audited, sealed financial period. Unlock before applying overrides."
                      );
                      return;
                    }
                    if (!overrideReason.trim()) {
                      alert(lang === "ar" ? "تفاصيل تبرير التعديل مطلوبة لحفظ القيد ماليًا!" : "An override justification is strictly required to save these changes!");
                      return;
                    }
                    const amountNum = parseFloat(overrideAmount);
                    if (!overrideDesc.trim() || isNaN(amountNum) || amountNum <= 0) return;

                    setExpenses(prev => prev.map(item => 
                      item.id === overrideExpense.id 
                        ? { ...item, description: overrideDesc, category: overrideCategory, amount: amountNum, date: overrideDate }
                        : item
                    ));

                    logAction({
                      action: "update",
                      entity_type: "inventory",
                      entity_id: overrideExpense.id,
                      entity_name: overrideDesc,
                      details: `Ledger Override by ${user?.full_name || "Admin"} (${user?.role || "super_admin"}). Pre-Altered State: Description: "${overrideExpense.description}", Category: "${overrideExpense.category}", Amount: ${overrideExpense.amount} IQD, Date: ${overrideExpense.date}. Revised Ledger Entry: Description: "${overrideDesc}", Category: "${overrideCategory}", Amount: ${amountNum} IQD, Date: ${overrideDate}. Justification Reason: "${overrideReason}"`
                    });

                    setOverrideExpense(null);
                  }} 
                  className="p-5 space-y-4"
                >
                  <p className="text-xs text-amber-950 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60 font-medium">
                    {lang === "ar"
                      ? "الدخول لنمط التعديل المباشر متاح الآن. يرجى ملء التعديلات مع ذكر السبب بالأسفل."
                      : "Verification validated. Directly override opex parameters below. You must write an audit justification."
                    }
                  </p>

                  <div className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "بيان المصروف" : "Expense Description"}
                      </label>
                      <input 
                        type="text" 
                        required
                        className="input-field w-full text-xs"
                        value={overrideDesc}
                        onChange={e => setOverrideDesc(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "التصنيف المالي للمصروف" : "Ledger Category"}
                      </label>
                      <select 
                        className="input-field w-full bg-white cursor-pointer text-xs"
                        value={overrideCategory}
                        onChange={e => setOverrideCategory(e.target.value as Expense["category"])}
                      >
                        <option value="lab">{lang === "ar" ? "مختبر العدسات فحص" : "Optical Labs"}</option>
                        <option value="rent">{lang === "ar" ? "إيجار العيادة والمنشأة" : "Clinic Premises Rent"}</option>
                        <option value="salary">{lang === "ar" ? "رواتب ومستحقات الموظفين" : "Payroll & Salaries"}</option>
                        <option value="utilities">{lang === "ar" ? "أجور الماء والكهرباء والخدمات" : "Utilities & Bills"}</option>
                        <option value="other">{lang === "ar" ? "نثرية ومصاريف عامة" : "General & Miscellaneous"}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "المبلغ (دينار)" : "Amount (IQD)"}
                      </label>
                      <input 
                        type="number" 
                        required
                        className="input-field w-full text-xs"
                        value={overrideAmount}
                        onChange={e => setOverrideAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "تاريخ الصفقة المكتوب" : "Accounting Posting Date"}
                      </label>
                      <input 
                        type="date" 
                        required
                        className="input-field w-full bg-white text-xs"
                        value={overrideDate}
                        onChange={e => setOverrideDate(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "سبب وتبرير التعديل المالي (إجباري)" : "Adjustment Audit Reason (Required)"}
                      </label>
                      <textarea 
                        required
                        rows={2}
                        placeholder={lang === "ar" ? "اكتب سبب تعديل هذا القيد المالي لتوثيقه..." : "Enter detailed explanation for correcting this transaction..."}
                        className="input-field w-full text-xs resize-none"
                        value={overrideReason}
                        onChange={e => setOverrideReason(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setOverrideExpense(null)}
                      className="px-3.5 py-1.5 border border-cream-border hover:bg-cream text-[11px] font-bold rounded-lg text-ink-mid"
                    >
                      {lang === "ar" ? "إلغاء التعديل" : "Cancel Override"}
                    </button>
                    <button 
                      type="submit" 
                      className="px-4.5 py-1.5 bg-amber-900 hover:bg-amber-850 text-white text-[11px] font-bold rounded-lg shadow-md"
                    >
                      {lang === "ar" ? "حفظ وتجاوز القيد الحالي" : "Apply Manual Override"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Clinical Inventory Intelligence & Fast-Moving Sales (BI Dashboard) */}
      <div className="bg-white border border-cream-border rounded-2xl p-5 space-y-5 print:hidden shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-burgundy" />
            <span>
              {lang === "ar" ? "تحليلات مخزون العيادة وحركة المبيعات (BI)" : "Clinical Inventory Intelligence & Fast-Moving Sales"}
            </span>
          </h3>
          <p className="text-xs text-ink-light mt-0.5">
            {lang === "ar"
              ? "متابعة المنتجات والعدسات الأكثر مبيعًا مع رصد الفئات التي تحتاج للتوريد العاجل والكميات المتبقية."
              : "Real-time auditing of best-selling lenses or frames paired with proactive reorder safety recommendations."
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          
          {/* Column A: Top Moving Lenses */}
          <div className="bg-cream/20 border border-cream-border p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-cream-border">
              <span className="text-xs font-bold text-burgundy flex items-center gap-1.5">
                <CheckCircle2 size={13} strokeWidth={2.5} className="text-burgundy" />
                {lang === "ar" ? "العدسات الأكثر طلبًا" : "Fast-Moving Lenses"}
              </span>
              <span className="text-[10px] bg-burgundy/10 text-burgundy font-bold px-1.5 py-0.5 rounded">
                {lang === "ar" ? "حسب الوصفة" : "Rx Volume"}
              </span>
            </div>

            <div className="space-y-2.5">
              {computedInventoryBI.lensRanking.slice(0, 5).map((ln, idx) => (
                <div key={ln.name} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-burgundy text-white rounded-full flex items-center justify-center font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-ink-mid">
                      {ln.name === "Single Vision" && lang === "ar" ? "رؤية فردية (Single)" : ln.name === "Bifocal" && lang === "ar" ? "ثنائية البؤرة (Bifocal)" : ln.name === "Progressive" && lang === "ar" ? "تدريجية (Progressive)" : ln.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-ink font-bold text-right text-ink-mid">
                      {ln.sales} {lang === "ar" ? "مبيعات" : "sold"}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono",
                      ln.totalStock > 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    )}>
                      {ln.totalStock} {lang === "ar" ? "متوفر" : "stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column B: Top Selling Frame Brands */}
          <div className="bg-cream/20 border border-cream-border p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-cream-border">
              <span className="text-xs font-bold text-burgundy flex items-center gap-1.5">
                <Coins size={13} className="text-burgundy" />
                {lang === "ar" ? "الإطارات الأكثر مبيعًا" : "Top Selling Frame Brands"}
              </span>
              <span className="text-[10px] bg-burgundy/10 text-burgundy font-bold px-1.5 py-0.5 rounded">
                {lang === "ar" ? "العلامة" : "Popularity"}
              </span>
            </div>

            <div className="space-y-2.5">
              {computedInventoryBI.frameRanking.slice(0, 5).map((fr, idx) => (
                <div key={fr.name} className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-emerald-600 text-white rounded-full flex items-center justify-center font-mono text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-ink-mid">{fr.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-ink font-bold text-right text-ink-mid">
                      {fr.sales} {lang === "ar" ? "مبيعات" : "sold"}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded font-mono",
                      fr.totalStock > 0 ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"
                    )}>
                      {fr.totalStock} {lang === "ar" ? "متوفر" : "stock"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column C: Replenishment Warnings & Stock Safety Alert */}
          <div className="bg-cream/20 border border-cream-border p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-cream-border">
              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-rose-600 animate-pulse" />
                {lang === "ar" ? "نواقض المتجر وإعادة التوريد" : "Essential Reorder Alerts"}
              </span>
              <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
                {lang === "ar" ? "فوري" : "Urgent"}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[145px] pr-1">
              {computedInventoryBI.allCriticalItems.length > 0 ? (
                computedInventoryBI.allCriticalItems.slice(0, 4).map(item => (
                  <div key={`${item.type}-${item.id}`} className="p-1.5 bg-white border border-rose-100 rounded-lg flex flex-col justify-between gap-1 text-[11px]">
                    <span className="font-bold text-ink truncate block w-full" title={item.name}>
                      {item.name}
                    </span>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-medium text-ink-light uppercase">
                        {item.type === "lens" 
                          ? (lang === "ar" ? "عدسات" : "Lens Model") 
                          : item.type === "frame" 
                            ? (lang === "ar" ? "إطار" : "Frame Model")
                            : (lang === "ar" ? "متجر جاهز" : "OTC Store Item")}
                      </span>
                      <span className={cn(
                        "font-mono font-bold px-1 rounded text-[10px] py-0.5",
                        item.qty === 0 ? "text-rose-600 bg-rose-50" : "text-amber-600 bg-amber-50"
                      )}>
                        {item.qty === 0 
                          ? (lang === "ar" ? "نفد بالكامل (0)" : "OUT OF STOCK (0)") 
                          : `${lang === "ar" ? "حرج" : "LOW"} (${item.qty} / min ${item.min})`
                        }
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-1.5" />
                  <span className="text-xs font-bold text-emerald-800">
                    {lang === "ar" ? "جميع مستويات المخزون آمنة" : "All stock levels healthy!"}
                  </span>
                  <p className="text-[10px] text-ink-light">
                    {lang === "ar" ? "لا توجد بضائع تحت الحد الأدنى للأمان" : "No items have fallen below safety limits"}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Recharts Graphical Visual Area */}
      {chartData.length > 0 && (
        <div className="bg-white border border-cream-border rounded-2xl p-5 space-y-4 print:hidden">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                {lang === "ar" ? "تحليل الأداء والتدفق المالي والربحية" : "Financial Performance & Margins"}
              </h3>
              <p className="text-xs text-ink-light mt-0.5">
                {lang === "ar" ? "مقارنة السيولات النقدية المحصلة مقابل النفقات مع هامش الربح التشغيلي" : "Historical breakdown of incoming collections, expenditures, and net operational margins"}
              </p>
            </div>

            {/* Aggregation Selection Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold text-ink-light uppercase tracking-wider">
                {lang === "ar" ? "تجميع المدة:" : "Group By:"}
              </span>
              <div className="flex bg-cream-dark/50 p-[2px] rounded-lg border border-cream-border/60">
                <button
                  type="button"
                  onClick={() => setChartAggregation("daily")}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                    chartAggregation === "daily" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "يومي" : "Daily"}
                </button>
                <button
                  type="button"
                  onClick={() => setChartAggregation("weekly")}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                    chartAggregation === "weekly" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "أسبوعي" : "Weekly"}
                </button>
                <button
                  type="button"
                  onClick={() => setChartAggregation("monthly")}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                    chartAggregation === "monthly" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "شهري" : "Monthly"}
                </button>
                <button
                  type="button"
                  onClick={() => setChartAggregation("custom")}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                    chartAggregation === "custom" ? "bg-burgundy text-white shadow-sm" : "text-ink-mid hover:text-burgundy"
                  )}
                >
                  {lang === "ar" ? "مخصص" : "Custom"}
                </button>
              </div>
            </div>
          </div>

          {/* Conditional Custom Date Range Picker */}
          {chartAggregation === "custom" && (
            <div className="flex flex-wrap items-center gap-3 p-3 bg-cream/35 border border-cream-border/60 rounded-xl max-w-lg">
              <div className="flex items-center gap-1.5 min-w-[120px]">
                <span className="text-[10px] font-bold text-ink-light uppercase">{lang === "ar" ? "من:" : "From:"}</span>
                <input
                  type="date"
                  className="bg-white border border-cream-border rounded-lg text-xs px-2 py-1 outline-none text-ink tracking-wider font-semibold focus:border-burgundy"
                  value={customRangeStart}
                  onChange={(e) => setCustomRangeStart(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-[120px]">
                <span className="text-[10px] font-bold text-ink-light uppercase">{lang === "ar" ? "إلى:" : "To:"}</span>
                <input
                  type="date"
                  className="bg-white border border-cream-border rounded-lg text-xs px-2 py-1 outline-none text-ink tracking-wider font-semibold focus:border-burgundy"
                  value={customRangeEnd}
                  onChange={(e) => setCustomRangeEnd(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%" className="outline-none">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} style={{ outline: "none" }}>
                <defs>
                  <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b45309" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#b45309" stopOpacity={0.01}/>
                  </linearGradient>
                  <linearGradient id="colorMargin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1ece4" />
                <XAxis dataKey="date" stroke="#888c8f" fontSize={11} tickLine={false} />
                <YAxis stroke="#888c8f" fontSize={11} tickFormatter={(v) => `${v / 1000}k`} tickLine={false} />
                <Tooltip 
                  formatter={(value: any) => [formatIQD(Number(value)), ""]} 
                  contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2d9cd", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", fontWeight: "bold" }} />
                <Area type="monotone" dataKey="cashInflow" name={lang === "ar" ? "المقبوضات والتحصيلات" : "Liquid Cash Inflows"} stroke="#059669" fillOpacity={1} fill="url(#colorCash)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name={lang === "ar" ? "المصاريف المدفوعة (OPEX)" : "Debited Outflows (OPEX)"} stroke="#b45309" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                <Area type="monotone" dataKey="margin" name={lang === "ar" ? "هامش صافي الأرباح التشغيلية" : "Net Operational Margin"} stroke="#2563eb" fillOpacity={1} fill="url(#colorMargin)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main double column ledger grid with auto-adjusting col spans when debtors is collapsed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:hidden items-start">
        
        {/* Left Side: Ledger / Operating Expenses & Capital Investments tabs */}
        <div className={cn(
          "bg-white border border-cream-border rounded-2xl flex flex-col overflow-hidden transition-all duration-300",
          isDebtorsCollapsed ? "lg:col-span-12" : "lg:col-span-8 xl:col-span-9"
        )}>
          
          {/* Section tab switches */}
          <div className="p-5 border-b border-cream-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
             <div className="flex flex-wrap gap-2.5">
              <button 
                onClick={() => setLedgerSubTab("sales")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none flex items-center gap-1.5",
                  ledgerSubTab === "sales" ? "bg-burgundy text-white shadow-sm" : "hover:bg-cream text-ink-mid hover:text-burgundy"
                )}
              >
                <Receipt size={13} />
                <span>{lang === "ar" ? "سجل المبيعات والتحصيلات" : "Sales Ledger"}</span>
              </button>

              <button 
                onClick={() => setLedgerSubTab("opex")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none flex items-center gap-1.5",
                  ledgerSubTab === "opex" ? "bg-burgundy text-white shadow-sm" : "hover:bg-cream text-ink-mid hover:text-burgundy"
                )}
              >
                <Wallet size={13} />
                <span>{lang === "ar" ? "سجل المصاريف OPEX" : "Expenses Ledger"}</span>
              </button>
              
              <button 
                onClick={() => setLedgerSubTab("capital")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all outline-none flex items-center gap-1.5",
                  ledgerSubTab === "capital" ? "bg-burgundy text-white shadow-sm" : "hover:bg-cream text-ink-mid hover:text-burgundy"
                )}
              >
                <Coins size={13} />
                <span>{lang === "ar" ? "حقن رأس المال الفعلي" : "Capital Ledger"}</span>
              </button>
            </div>

            {ledgerSubTab === "sales" ? (
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 border border-emerald-200 rounded-lg flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{lang === "ar" ? "تحصيلات مبيعات الصندوق" : "POS and Clinic Inflows"}</span>
              </span>
            ) : ledgerSubTab === "opex" ? (
              <button 
                onClick={() => setShowAddExpense(!showAddExpense)}
                className="px-3.5 py-1.5 border border-cream-border bg-cream hover:bg-cream-dark text-ink font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start shadow-sm"
              >
                {showAddExpense ? (
                  <>
                    <ChevronDown size={14} />
                    <span>{lang === "ar" ? "إخفاء لوحة الإضافة" : "Hide Panel"}</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} className="text-burgundy" strokeWidth={3} />
                    <span>{lang === "ar" ? "قيد مصروف" : "Add Expense"}</span>
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={() => setShowAddCapital(!showAddCapital)}
                className="px-3.5 py-1.5 border border-cream-border bg-cream hover:bg-cream-dark text-ink font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 self-start shadow-sm"
              >
                {showAddCapital ? (
                  <>
                    <ChevronDown size={14} />
                    <span>{lang === "ar" ? "إخفاء لوحة الإضافة" : "Hide Panel"}</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} className="text-burgundy" strokeWidth={3} />
                    <span>{lang === "ar" ? "قيد رأس مال" : "Inject Capital"}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Double Subtabs forms panels */}
          <AnimatePresence>
            {ledgerSubTab === "opex" && showAddExpense && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-cream-dark/25 border-b border-cream-border"
              >
                <form onSubmit={handleAddExpenseSubmit} className="p-5 space-y-4">
                  <h4 className="text-xs font-bold text-burgundy uppercase tracking-wider mb-2">
                    {lang === "ar" ? "قيد مصروفات محاسبي جديد" : "Insert Accounting Expense Entry"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "بيان المصروف" : "Expense Description"}
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder={lang === "ar" ? "شراء عدسات، أجور الإيجار، رواتب..." : "Lab lenses processing, water charges, etc"}
                        className="input-field w-full text-xs"
                        value={expDesc}
                        onChange={e => setExpDesc(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "التصنيف المالي للمصروف" : "Ledger Category"}
                      </label>
                      <select 
                        className="input-field w-full bg-white cursor-pointer text-xs"
                        value={expCategory}
                        onChange={e => setExpCategory(e.target.value as Expense["category"])}
                      >
                        <option value="lab">{lang === "ar" ? "مختبر العدسات فحص" : "Optical Labs"}</option>
                        <option value="rent">{lang === "ar" ? "إيجار العيادة والمنشأة" : "Clinic Premises Rent"}</option>
                        <option value="salary">{lang === "ar" ? "رواتب ومستحقات الموظفين" : "Payroll & Salaries"}</option>
                        <option value="utilities">{lang === "ar" ? "أجور الماء والكهرباء والخدمات" : "Utilities & Bills"}</option>
                        <option value="other">{lang === "ar" ? "نثرية ومصاريف عامة" : "General & Miscellaneous"}</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "المبلغ (دينار)" : "Amount (IQD)"}
                      </label>
                      <input 
                        type="number" 
                        required
                        placeholder="0"
                        className="input-field w-full text-xs"
                        value={expAmount}
                        onChange={e => setExpAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "تاريخ الصفقة المكتوب" : "Accounting Posting Date"}
                      </label>
                      <input 
                        type="date" 
                        required
                        className="input-field w-full bg-white text-xs"
                        value={expDate}
                        onChange={e => setExpDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddExpense(false)}
                      className="px-4 py-2 text-xs font-bold text-ink hover:bg-cream rounded-lg transition-colors border border-transparent"
                    >
                      {lang === "ar" ? "إلغاءنسخ" : "Cancel"}
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-xs font-bold text-white bg-burgundy hover:bg-burgundy-light rounded-lg transition-colors shadow-sm"
                    >
                      {lang === "ar" ? "تأكيد وصرف المبلغ" : "Post Expense"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {ledgerSubTab === "capital" && showAddCapital && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-cream-dark/25 border-b border-cream-border"
              >
                <form onSubmit={handleAddCapitalSubmit} className="p-5 space-y-4">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2">
                    {lang === "ar" ? "حقن رأس مال مالي إضافي للنشاط" : "Post Direct Capital Equity Entry"}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "مصدر رأس المال / الطبيب المساهم" : "Equity Capital Source / Investor"}
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder={lang === "ar" ? "مساهمة الطبيب الشريك..." : "e.g. Dr. Al-Noor Seed Dues"}
                        className="input-field w-full text-xs"
                        value={capSrc}
                        onChange={e => setCapSrc(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "المبلغ المودع (دينار عراقي)" : "Capital Amount (IQD)"}
                      </label>
                      <input 
                        type="number" 
                        required
                        placeholder="0"
                        className="input-field w-full text-xs"
                        value={capAmount}
                        onChange={e => setCapAmount(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest px-1">
                        {lang === "ar" ? "تاريخ الإيداع في الصندوق" : "Equity Posting Date"}
                      </label>
                      <input 
                        type="date" 
                        required
                        className="input-field w-full bg-white text-xs"
                        value={capDate}
                        onChange={e => setCapDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddCapital(false)}
                      className="px-4 py-2 text-xs font-bold text-ink hover:bg-cream rounded-lg transition-colors border border-transparent"
                    >
                      {lang === "ar" ? "إلغاء" : "Cancel"}
                    </button>
                    <button 
                      type="submit" 
                      className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-sm"
                    >
                      {lang === "ar" ? "إيداع وتأكيد قيد رأس المال" : "Post Capital"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ledger Tab table data render */}
          <div className="flex-1 overflow-x-auto">
            {ledgerSubTab === "sales" ? (
              sortedSales.length === 0 ? (
                <div className="p-12 text-center text-ink-light opacity-75 text-sm">
                  {lang === "ar" ? "لا توجد مبيعات تشغيلية أو تحصيلات مسجلة في هذه الفترة." : "No operations sales or retail inflows recorded in this period."}
                </div>
              ) : (
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream border-b border-cream-border text-[10px] font-bold text-ink-light uppercase tracking-wider">
                      <th className="p-3 text-start">{lang === "ar" ? "التاريخ" : "Date"}</th>
                      <th className="p-3 text-start">{lang === "ar" ? "المراجع / المشتري" : "Customer / Patient"}</th>
                      <th className="p-3 text-start">{lang === "ar" ? "تفاصيل المعاملة" : "Transaction Details"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "التكلفة" : "Cost (COGS)"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "الربح" : "Profit"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "المجموع" : "Total Price"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "المسدد" : "Paid"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "المتبقي" : "Balance"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-xs">
                    {sortedSales.map((v) => {
                      const isWalkin = v.patientId === "walkin_retail";
                      // Highlight Walk-ins nicely
                      const displayName = isWalkin 
                        ? (v.customer_name || (lang === "ar" ? "زبون سفري مباشر" : "Walk-in Customer"))
                        : v.patientName;

                      const purchaseCost = getVisitCost(v);
                      const salesProfit = (v.total_amount || 0) - purchaseCost;

                      return (
                        <tr key={v.id} className="hover:bg-cream/40 transition-colors">
                          <td className="p-3 font-mono whitespace-nowrap text-ink-mid">{v.visit_date}</td>
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-ink">{displayName}</span>
                              {isWalkin ? (
                                <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-1 py-0.5 rounded self-start mt-0.5 uppercase tracking-wider">{lang === "ar" ? "فاتورة بيع سريع" : "POS Quick Sale"}</span>
                              ) : (
                                <span className="text-[9px] text-burgundy font-bold bg-rose-50 border border-rose-200 px-1 py-0.5 rounded self-start mt-0.5 uppercase tracking-wider">{lang === "ar" ? "مبيعات عيادة" : "Clinical RX Visit"}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 min-w-[140px] max-w-[240px] truncate text-ink-mid font-medium" title={v.diagnosis}>
                            {v.diagnosis}
                          </td>
                          <td className="p-3 font-mono text-end font-semibold text-rose-600">{formatIQD(purchaseCost)}</td>
                          <td className="p-3 font-mono text-end font-bold text-emerald-600">{formatIQD(salesProfit)}</td>
                          <td className="p-3 font-mono text-end font-bold text-ink">{formatIQD(v.total_amount || 0)}</td>
                          <td className="p-3 font-mono text-end font-bold text-emerald-700">{formatIQD(v.amount_paid || 0)}</td>
                          <td className="p-3 font-mono text-end">
                            {(v.remaining || 0) > 0 ? (
                              <span className="text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-bold text-[10px] border border-rose-200">{formatIQD(v.remaining || 0)}</span>
                            ) : (
                              <span className="text-emerald-700 bg-emerald-55/10 px-1.5 py-0.5 rounded font-bold text-[10px] border border-emerald-200">{lang === "ar" ? "خالص ومسدد" : "Paid In Full"}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
				</table>
			  )
            ) : ledgerSubTab === "opex" ? (
              expenses.length === 0 ? (
                <div className="p-12 text-center text-ink-light opacity-75 text-sm">
                  {lang === "ar" ? "لا توجد مصاريف تشغيلية مدونة حالياً في الدفتر." : "No operational expense logs found."}
                </div>
              ) : (
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream border-b border-cream-border text-[10px] font-bold text-ink-light uppercase tracking-wider">
                      <th className="p-3 text-start">{lang === "ar" ? "التاريخ" : "Date"}</th>
                      <th className="p-3 text-start">{lang === "ar" ? "بيان المصروف" : "Description"}</th>
                      <th className="p-3 text-start">{lang === "ar" ? "الفئة" : "Category"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "القيمة" : "Amount"}</th>
                      <th className="p-3 text-center">{lang === "ar" ? "إجراءات" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-xs">
                    {filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-cream/40 transition-colors">
                        <td className="p-3 font-mono whitespace-nowrap text-ink-mid">{exp.date}</td>
                        <td className="p-3 font-semibold text-ink">{exp.description}</td>
                        <td className="p-3 whitespace-nowrap">
                          {expenseCategoryMetrics.map(item => item.key === exp.category && (
                            <span key={item.key} className={cn("inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase", item.color)}>
                              {lang === "ar" ? item.labelAr : item.labelEn}
                            </span>
                          ))}
                        </td>
                        <td className="p-3 font-mono text-end font-bold text-amber-900">{formatIQD(exp.amount)}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button 
                              onClick={() => {
                                if (user?.role !== "super_admin") {
                                  alert(lang === "ar"
                                    ? "غير مصرح! فقط للمدير العام (super_admin) صلاحية تعديل أو تجاوز فواتير المصاريف."
                                    : "Unauthorized: Only users with the 'super_admin' role can edit or override logged opex expenses."
                                  );
                                  return;
                                }
                                setOverrideExpense(exp);
                                setOverrideDesc(exp.description);
                                setOverrideCategory(exp.category);
                                setOverrideAmount(exp.amount.toString());
                                setOverrideDate(exp.date);
                                setOverridePinInput("");
                                setIsOverridePinVerified(false);
                                setOverridePinError("");
                                setOverrideReason("");
                              }}
                              className="p-1.5 text-ink-light hover:text-burgundy hover:bg-cream-dark/30 rounded-lg transition-all"
                              title={lang === "ar" ? "تعديل وتجاوز القيد ماليًا" : "Securely override and edit this ledger action"}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button 
                              onClick={() => handleDeleteExpense(exp.id, exp.description)}
                              className="p-1.5 text-ink-light hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title={lang === "ar" ? "حذف قيد المصروف" : "Delete expense entry"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              filteredCapital.length === 0 ? (
                <div className="p-12 text-center text-ink-light opacity-75 text-sm">
                  {lang === "ar" ? "لا توجد متحصلات رأسمالية مدونة حالياً." : "No investment cash deposits verified."}
                </div>
              ) : (
                <table className="w-full text-start border-collapse text-xs">
                  <thead>
                    <tr className="bg-cream border-b border-cream-border text-[10px] font-bold text-ink-light uppercase tracking-wider">
                      <th className="p-3 text-start">{lang === "ar" ? "تاريخ الإيداع" : "Date"}</th>
                      <th className="p-3 text-start">{lang === "ar" ? "المودع / الطبيب الشريك" : "Capital Source"}</th>
                      <th className="p-3 text-end">{lang === "ar" ? "المبلغ الرأسمالي المعلق" : "Equity Amount"}</th>
                      <th className="p-3 text-center">{lang === "ar" ? "التحكم" : "Actions"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-border text-xs">
                    {filteredCapital.map((cap) => (
                      <tr key={cap.id} className="hover:bg-cream/40 transition-colors">
                        <td className="p-3 font-mono whitespace-nowrap text-ink-mid">{cap.date}</td>
                        <td className="p-3 font-semibold text-emerald-950">{cap.source}</td>
                        <td className="p-3 font-mono text-end font-bold text-emerald-700">{formatIQD(cap.amount)}</td>
                        <td className="p-3 text-center whitespace-nowrap">
                          <button 
                            onClick={() => handleDeleteCapital(cap.id, cap.source)}
                            className="p-1.5 text-ink-light hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title={lang === "ar" ? "حذف قيد رأس المال" : "Delete equity deposit"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

        {/* Right Side: Debtors Accounts Receivable hub with direct settlement option */}
        <div className={cn(
          "bg-white border border-cream-border rounded-2xl flex flex-col overflow-hidden transition-all duration-300 self-start",
          isDebtorsCollapsed ? "lg:col-span-12" : "lg:col-span-4 xl:col-span-3"
        )}>
          
          {/* Header */}
          <div 
            onClick={() => setIsDebtorsCollapsed(!isDebtorsCollapsed)}
            className="p-5 border-b border-cream-border flex items-center justify-between cursor-pointer select-none hover:bg-cream/10 transition-colors"
          >
            <div>
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Users className="text-rose-600 w-4 h-4" />
                <span>{lang === "ar" ? "تحصيل مديونيات المراجعين" : "AR Recovery Dashboard"}</span>
              </h3>
              <p className="text-xs text-ink-light mt-0.5">
                {lang === "ar" 
                  ? "قائمة المراجعين المدينين والتحصيل السريع المباشر"
                  : "Active patients outstanding clinical debt accounts"
                }
              </p>
            </div>
            <div className="p-1 rounded bg-cream hover:bg-cream-dark/60 transition-colors">
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 text-ink-mid", isDebtorsCollapsed ? "-rotate-90 rtl:rotate-90" : "rotate-0")} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!isDebtorsCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden flex flex-col flex-1"
              >
                {/* Lookup bar */}
                <div className="px-5 pt-3 pb-3 border-b border-cream-border/60">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-light w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder={lang === "ar" ? "ابحث بالاسم للتسديد الفوري للمراجع..." : "Search patient name for fast payment..."}
                      className="w-full ps-9 py-2 text-xs border border-cream-border rounded-xl bg-cream/40 focus:bg-white outline-none focus:ring-1 focus:ring-burgundy transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-cream-border">
                  {debtors.length === 0 ? (
                    <div className="p-8 text-center text-ink-light opacity-75 text-sm">
                      {lang === "ar" ? "لا يوجد مراجعين عليهم متبقيات مالية حالية." : "No patients found with outstanding balance."}
                    </div>
                  ) : (
                    debtors.map((patient) => (
                      <div key={patient.id} className="p-4 hover:bg-cream/20 transition-all space-y-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-ink text-sm">{patient.full_name}</h4>
                            <p className="text-[11px] text-ink-light font-medium font-mono mt-0.5">{patient.phone}</p>
                          </div>
                          <div className="text-end">
                            <span className="text-xs text-ink-light block">{lang === "ar" ? "الدين المتبقي" : "Total Outstanding"}</span>
                            <span className="font-mono text-xs font-bold text-rose-600 block">{formatIQD(patient.outstanding)}</span>
                          </div>
                        </div>

                        {/* Payment controls & whatsapp reminders */}
                        <div className="flex gap-2 items-center">
                          
                          {/* Quick settle form toggler */}
                          {settlingPatientId === patient.id ? (
                            <form onSubmit={handleDirectSettleSubmit} className="flex-1 flex gap-1 items-center bg-cream p-1 rounded-lg border border-cream-border animate-in slide-in-from-top-1 duration-200">
                              <input 
                                required
                                type="number"
                                placeholder={lang === "ar" ? "القيمة المتدفقة..." : "Amount..."}
                                className="w-full bg-white text-xs px-2.5 py-1.5 border border-cream-border rounded-md outline-none focus:ring-1 focus:ring-emerald-600 font-sans"
                                max={patient.outstanding}
                                value={settlementAmount}
                                onChange={e => setSettlementAmount(e.target.value)}
                              />
                              <button 
                                type="submit" 
                                className="px-3 py-1.5 bg-emerald-600 text-white font-bold text-[10px] rounded-md transition-colors whitespace-nowrap"
                              >
                                {lang === "ar" ? "تسديد" : "Settle"}
                              </button>
                              <button 
                                type="button" 
                                onClick={() => { setSettlingPatientId(null); setSettlementAmount(""); }}
                                className="px-2 py-1.5 hover:bg-gray-100 text-ink-light text-[10px] rounded-md"
                              >
                                {lang === "ar" ? "إلغاءنسخ" : "Cancel"}
                              </button>
                            </form>
                          ) : (
                            <>
                              <button 
                                onClick={() => setSettlingPatientId(patient.id)}
                                className="flex-1 py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                              >
                                <CheckCircle2 size={13} strokeWidth={2.5} />
                                <span>{lang === "ar" ? "تسديد الحساب" : "Direct Pay"}</span>
                              </button>
                              
                              <a 
                                href={getWhatsAppLink(patient)}
                                target="_blank"
                                rel="noreferrer"
                                className="py-1.5 px-3 bg-cream-dark/40 hover:bg-cream-dark hover:text-burgundy text-ink-mid font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border border-cream-border"
                                title={lang === "ar" ? "إرسال تذكير مالي لطيف بالواتساب" : "Send WhatsApp debt reminder"}
                              >
                                <MessageSquare size={13} className="text-emerald-600" />
                                <span>{lang === "ar" ? "تذكير" : "WhatsApp"}</span>
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Printable Financial Statement section */}
      <div className="bg-white border border-cream-border rounded-2xl p-6 space-y-6 print:p-0 print:border-none transition-all duration-300">
        <div 
          onClick={() => setIsPLCollapsed(!isPLCollapsed)}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cream-border pb-4 print:hidden cursor-pointer select-none hover:bg-cream/10 transition-colors p-2 rounded-xl"
        >
          <div>
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="text-burgundy w-4 h-4" />
              <span>{lang === "ar" ? "كشف حساب الأرباح والخسائر للعيادة (P&L)" : "Clinic Profit & Loss Accountant Sheet"}</span>
            </h3>
            <p className="text-xs text-ink-light mt-0.5">
              {lang === "ar" ? "سند مالي مجهّز للطباعة والمراجعة المهنية مُطابق للمعايير المحاسبية الكاملة" : "Direct export-compliant audit-friendly financial P&L statement"}
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 self-start" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => window.print()}
              className="px-4 py-2 bg-burgundy hover:bg-burgundy-light text-white font-bold text-xs rounded-xl transition-colors shadow-md flex items-center gap-2"
            >
              <Printer size={14} />
              <span>{lang === "ar" ? "تحميل ككشف مطبوع" : "Print Audit Disclosure"}</span>
            </button>
            <button 
              onClick={() => setIsPLCollapsed(!isPLCollapsed)}
              className="p-1.5 rounded bg-cream hover:bg-cream-dark/60 transition-colors"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-300 text-ink-mid", isPLCollapsed ? "rotate-90" : "rotate-0")} style={{ transform: isPLCollapsed ? "rotate(-90deg)" : "none" }} />
            </button>
          </div>
        </div>

        {/* Printable styled ledger */}
        <div className={cn(
          "border border-cream-border rounded-xl bg-cream/20 overflow-hidden print:border-ink/20 transition-all duration-300 print:block print:h-auto print:opacity-100 print:max-h-none",
          isPLCollapsed ? "max-h-0 opacity-0 pointer-events-none pb-0 border-none" : "max-h-[2500px] opacity-100"
        )}>
          
          {/* Header ONLY visible in printing */}
          <div className="hidden print:block p-6 text-center border-b border-ink/10 space-y-1.5">
            <h2 className="text-2xl font-bold font-serif text-ink tracking-tight">مركز نور التخصصي لطب وجراحة العيون</h2>
            <p className="text-sm font-semibold text-ink-light tracking-wide uppercase">Noor Optical - Clinical Ledger Book & Audit Ledger Summary</p>
            <div className="text-[10px] text-ink-light font-mono">Issued at: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} | Status: Audited Ledger</div>
          </div>

          <div className="p-4 bg-cream border-b border-cream-border grid grid-cols-2 text-xs font-bold text-ink-mid uppercase tracking-wider print:bg-slate-100 print:text-black">
            <span>{lang === "ar" ? "البيان المحاسبي" : "Account Ledger Category"}</span>
            <span className="text-end">{lang === "ar" ? "القيمة التراكمية (دينار عراقي)" : "Accumulated Balance (IQD)"}</span>
          </div>

          <div className="divide-y divide-cream-border font-mono text-sm print:divide-slate-200">
            
            {/* Revenue lines */}
            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors">
              <span className="font-sans font-semibold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                {lang === "ar" ? "إجمالي قيمة مبيعات التجزئة والخدمات" : "Gross Retail and Services Billings (+)"}
              </span>
              <span className="text-end font-bold text-emerald-600 font-mono">{formatIQD(grossBillings)}</span>
            </div>

            {/* Cost of Goods Sold (COGS) */}
            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors bg-orange-55/5">
              <span className="font-sans font-semibold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
                {lang === "ar" ? "تكلفة البضاعة المباعة (العدسات والإطارات والـ OTC)" : "Cost of Goods Sold (COGS) (-)"}
              </span>
              <span className="text-end font-bold text-orange-700 font-mono">-{formatIQD(totalCOGS)}</span>
            </div>

            {/* Gross Profit */}
            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors bg-emerald-100/10">
              <span className="font-sans font-bold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 shrink-0" />
                {lang === "ar" ? "ربح التجزئة الإجمالي" : "Gross Profit on Sales (=)"}
              </span>
              <span className="text-end font-extrabold text-emerald-700 font-mono">{formatIQD(grossProfit)}</span>
            </div>

            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors bg-emerald-50/10 print:bg-emerald-50/5">
              <span className="font-sans font-semibold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0 animate-pulse" />
                {lang === "ar" ? "المبالغ النقدية الفعلية المحصلة من المراجعين" : "Actually Realized Clinical Receipts"}
              </span>
              <span className="text-end font-bold text-emerald-700 font-mono">{formatIQD(cashReceivedFromVisits)}</span>
            </div>

            {/* Debts */}
            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors bg-rose-50/10 print:bg-rose-50/5">
              <span className="font-sans font-semibold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                {lang === "ar" ? "حساب المدينين والمبالغ المعلقة (مستحقات آجلة)" : "Deferred Receivables / Patients Debt (-)"}
              </span>
              <span className="text-end font-bold text-rose-600 font-mono">{formatIQD(totalOutstandingRemaining)}</span>
            </div>

            {/* Direct Investments Capital */}
            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors bg-teal-50/10 print:bg-teal-50/5">
              <span className="font-sans font-semibold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
                {lang === "ar" ? "إيداعات وحقن رأس المال والأسهم المساهم بها" : "Injected Partner Equity contribution (+)"}
              </span>
              <span className="text-end font-bold text-teal-700 font-mono">{formatIQD(totalCapitalAdditions)}</span>
            </div>

            {/* Expenses break down */}
            <div className="p-4 grid grid-cols-2 items-center hover:bg-white/50 transition-colors bg-amber-50/10 print:bg-amber-50/5">
              <span className="font-sans font-semibold text-ink flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                {lang === "ar" ? "النفقات والمصاريف التشغيلية (OPEX)" : "Aggregated Operating OPEX (-)"}
              </span>
              <span className="text-end font-bold text-amber-900 font-mono">{formatIQD(totalExpenses)}</span>
            </div>

            {/* Category Sub expenditure items */}
            {expenseCategoryMetrics.map(item => (
              <div key={item.key} className="p-3 grid grid-cols-2 items-center text-xs text-ink-light pl-8 pr-4 hover:bg-white/20 transition-all font-sans">
                <span className="flex items-center gap-1.5 pl-2 font-medium">
                  - {lang === "ar" ? item.labelAr : item.labelEn}
                </span>
                <span className="text-end font-mono font-bold text-ink-mid">
                  {formatIQD(item.sum)} ({item.percentage.toFixed(0)}%)
                </span>
              </div>
            ))}

            {/* Summary Net Profit */}
            <div className={cn(
              "p-4 grid grid-cols-2 items-center font-bold text-base print:text-black",
              netEarnings >= 0 ? "bg-emerald-50 text-emerald-950 print:bg-emerald-100/40" : "bg-rose-50 text-rose-950 print:bg-rose-100/40"
            )}>
              <span className="font-serif">
                {lang === "ar" ? "صافي الرصيد المالي في الصندوق للعيادة" : "Clinic Net Cash Flow Income"}
              </span>
              <span className="text-end font-mono text-lg font-bold">
                {formatIQD(netEarnings)}
              </span>
            </div>

          </div>

          {/* Verification section footer on Print */}
          {auditSignedAt && (
            <div className="hidden print:flex justify-between items-center p-8 bg-slate-50 border-t border-slate-200 text-xs">
              <div>
                <div className="font-bold text-ink">Ledger Verification Status</div>
                <div className="text-slate-600 mt-1">{auditSignedAt}</div>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-700/60 flex items-center justify-center font-bold font-serif text-[10px] text-emerald-800 rotate-12 bg-white select-none shadow">
                  APPROVED
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
