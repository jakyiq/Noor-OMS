import React from "react";
import { Users, DollarSign, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight, Bell, Package, Calendar, ShoppingCart, Boxes } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion } from "motion/react";
import { QuickSellModal } from "./QuickSellModal";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

export function Dashboard() {
  const { t, lang, setCurrentSection, setInventoryFilter, isLoading, patients, user, lenses, frames } = useClinic();

  const [chartRange, setChartRange] = React.useState<"weekly" | "monthly" | "yearly">("weekly");
  const [time, setTime] = React.useState(new Date());
  const [isQuickSellOpen, setIsQuickSellOpen] = React.useState(false);

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hasFinancePermission = React.useMemo(() => {
    if (!user) return true; // Default to full permission if no auth context
    if (user.role === "doctor" || user.role === "super_admin") return true;
    return !!user.permissions?.viewFinancials;
  }, [user]);

  const userDisplayName = user?.full_name || (lang === 'ar' ? 'د. أحمد علي' : 'Dr. Ahmed Ali');

  const recentSales = React.useMemo(() => {
    const list: any[] = [];
    if (!patients || !Array.isArray(patients)) return [];

    patients.forEach(p => {
      if (p.visits && Array.isArray(p.visits)) {
        p.visits.forEach(v => {
          list.push({
            id: v.id,
            patientId: p.id,
            name: p.id === "walkin_retail" ? (v.customer_name || (lang === "ar" ? "زبون سفري مباشر" : "Walk-in Customer")) : p.full_name,
            visit_date: v.visit_date,
            type: v.diagnosis || (p.id === "walkin_retail" ? (lang === "ar" ? "بيع مباشر بالتجزئة" : "Quick POS Sale") : (lang === "ar" ? "فحص سريري" : "Clinic RX Visit")),
            price: v.total_amount || 0,
            amount_paid: v.amount_paid || 0,
            remaining: v.remaining || 0
          });
        });
      }
    });

    return list.sort((a, b) => {
      const dateA = new Date(a.visit_date).getTime();
      const dateB = new Date(b.visit_date).getTime();
      if (dateA !== dateB) return dateB - dateA;
      return b.id.localeCompare(a.id);
    }).slice(0, 5); // Take top 5 recent sales/transactions
  }, [patients, lang]);

  const getFriendlyDate = (dateStr: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const yesterdayDate = new Date();
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      const yesterday = yesterdayDate.toISOString().split("T")[0];

      if (dateStr === today) {
        return lang === "ar" ? "اليوم" : "Today";
      } else if (dateStr === yesterday) {
        return lang === "ar" ? "أمس" : "Yesterday";
      } else {
        return dateStr;
      }
    } catch (e) {
      return dateStr;
    }
  };

  const getGreeting = () => {
    const hour = time.getHours();
    if (lang === 'ar') {
      if (hour < 12) return 'صباح الخير';
      if (hour < 18) return 'مساء الخير';
      return 'مساء الخير';
    }
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = () => {
    return time.toLocaleDateString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = () => {
    return time.toLocaleTimeString(lang === 'ar' ? 'ar-IQ' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const weeklyData = React.useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const map = days.reduce((acc, d) => ({ ...acc, [d]: 0 }), {} as Record<string, number>);

    // Get dates of the current week (Sunday to Saturday)
    const now = new Date();
    const currentDay = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - currentDay);

    const weekDates: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push(d.toISOString().split("T")[0]);
    }

    if (patients && Array.isArray(patients)) {
      patients.forEach(p => {
        if (p.visits && Array.isArray(p.visits)) {
          p.visits.forEach(v => {
            const idx = weekDates.indexOf(v.visit_date);
            if (idx !== -1) {
              const dayName = days[idx];
              map[dayName] += v.total_amount || 0;
            }
          });
        }
      });
    }

    return days.map(day => ({ name: day, value: map[day] }));
  }, [patients]);

  const monthlyData = React.useMemo(() => {
    const weeks = ["W1", "W2", "W3", "W4"];
    const map = { W1: 0, W2: 0, W3: 0, W4: 0 } as Record<string, number>;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (patients && Array.isArray(patients)) {
      patients.forEach(p => {
        if (p.visits && Array.isArray(p.visits)) {
          p.visits.forEach(v => {
            const d = new Date(v.visit_date);
            if (d.getFullYear() === year && d.getMonth() === month) {
              const dom = d.getDate();
              if (dom <= 7) map.W1 += v.total_amount || 0;
              else if (dom <= 14) map.W2 += v.total_amount || 0;
              else if (dom <= 21) map.W3 += v.total_amount || 0;
              else map.W4 += v.total_amount || 0;
            }
          });
        }
      });
    }

    return weeks.map(w => ({ name: w, value: map[w] }));
  }, [patients]);

  const yearlyData = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const map = months.reduce((acc, m) => ({ ...acc, [m]: 0 }), {} as Record<string, number>);

    const now = new Date();
    const year = now.getFullYear();

    if (patients && Array.isArray(patients)) {
      patients.forEach(p => {
        if (p.visits && Array.isArray(p.visits)) {
          p.visits.forEach(v => {
            const d = new Date(v.visit_date);
            if (d.getFullYear() === year) {
              const mName = months[d.getMonth()];
              map[mName] += v.total_amount || 0;
            }
          });
        }
      });
    }

    return months.map(m => ({ name: m, value: map[m] }));
  }, [patients]);

  const activeData = chartRange === "weekly" ? weeklyData : chartRange === "monthly" ? monthlyData : yearlyData;

  const dynamicStats = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const currentYearMonth = todayStr.substring(0, 7);

    let todayPatientsCount = 0;
    let todayEarningsSum = 0;
    let totalOutstandingDebt = 0;
    let debtorsCount = 0;
    let monthlyRevenueSum = 0;

    if (patients && Array.isArray(patients)) {
      patients.forEach(p => {
        const debt = p.outstanding || 0;
        totalOutstandingDebt += debt;
        if (debt > 0) {
          debtorsCount += 1;
        }
        
        if (p.visits && Array.isArray(p.visits)) {
          p.visits.forEach(v => {
            if (v.visit_date === todayStr) {
              todayPatientsCount += 1;
              todayEarningsSum += v.amount_paid || 0;
            }
            if (v.visit_date && v.visit_date.startsWith(currentYearMonth)) {
              monthlyRevenueSum += v.total_amount || 0;
            }
          });
        }
      });
    }

    return {
      todayPatients: todayPatientsCount,
      todayEarnings: todayEarningsSum,
      outstandingDebt: totalOutstandingDebt,
      debtorsCount,
      monthlyRevenue: monthlyRevenueSum
    };
  }, [patients]);

  const dynamicAlerts = React.useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    let todayFollowups = 0;
    if (patients && Array.isArray(patients)) {
      patients.forEach(p => {
        if (p.visits && Array.isArray(p.visits)) {
          p.visits.forEach(v => {
            if (v.next_visit_date === todayStr) {
              todayFollowups += 1;
            }
          });
        }
      });
    }

    const lowStockLenses = lenses ? lenses.filter((l: any) => l.quantity <= (l.min_stock || 0)).length : 0;
    const lowStockFrames = frames ? frames.filter((f: any) => f.quantity <= (f.min_stock || 0)).length : 0;
    const lowStockCount = lowStockLenses + lowStockFrames;

    return {
      todayFollowups,
      lowStockAlerts: lowStockCount
    };
  }, [patients, lenses, frames]);

  const stats = [
    { 
      id: "today_patients", 
      label: t("today_patients"), 
      value: String(dynamicStats.todayPatients), 
      sub: lang === "ar" ? "جلسات فحص نشطة اليوم" : "Active checkup sessions today", 
      icon: Users, 
      color: "bg-blue-50 text-blue-600", 
      trend: "up", 
      section: "patients" 
    },
    ...(hasFinancePermission ? [
      { 
        id: "today_earnings", 
        label: t("today_earnings"), 
        value: formatIQD(dynamicStats.todayEarnings), 
        sub: lang === "ar" ? "مدفوعات صندوق اليوم" : "Vault cash collected today", 
        icon: DollarSign, 
        color: "bg-emerald-50 text-emerald-600", 
        trend: "up", 
        section: "reports" 
      },
    ] : []),
    { 
      id: "outstanding_debt", 
      label: t("outstanding_debt"), 
      value: formatIQD(dynamicStats.outstandingDebt), 
      sub: lang === "ar" ? `${dynamicStats.debtorsCount} حسابات معلقة` : `${dynamicStats.debtorsCount} medical accounts pending`, 
      icon: AlertCircle, 
      color: "bg-rose-50 text-rose-600", 
      trend: "down", 
      section: "patients" 
    },
    ...(hasFinancePermission ? [
      { 
        id: "monthly_revenue", 
        label: t("monthly_revenue"), 
        value: formatIQD(dynamicStats.monthlyRevenue), 
        sub: lang === "ar" ? "قيمة مبيعات الشهر الحالي" : "Gross sales this bill-cycle", 
        icon: TrendingUp, 
        color: "bg-amber-50 text-amber-600", 
        trend: "up", 
        section: "reports" 
      }
    ] : [])
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 lg:space-y-8 animate-pulse">
        {/* Hero Skeleton */}
        <div className="h-40 sm:h-48 bg-zinc-200/50 rounded-2xl w-full" />
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 sm:h-36 bg-zinc-200/50 rounded-2xl w-full" />
          ))}
        </div>

        {/* Chart Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
          <div className="lg:col-span-3 h-[300px] sm:h-[400px] bg-zinc-200/50 rounded-2xl w-full" />
          <div className="lg:col-span-2 h-[300px] sm:h-[400px] bg-zinc-200/50 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in transition-all duration-500">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-burgundy rounded-2xl p-6 lg:p-10 text-white shadow-xl group flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">

        <div className="absolute top-0 end-0 w-64 h-64 bg-white/5 rounded-full -me-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700 pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-gold/10 rounded-full -ms-24 -mb-24 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex-1 text-start">
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-gold font-bold tracking-widest text-[10px] uppercase mb-2"
          >
            {lang === 'ar' ? 'نظرة عامة' : 'SYSTEM OVERVIEW'}
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl lg:text-4xl font-serif font-bold mb-4"
          >
            {t("welcome_back")}، {userDisplayName}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md text-white/70 text-sm leading-relaxed"
          >
            {lang === 'ar' 
              ? `لديك ${dynamicAlerts.todayFollowups} موعد متابعة مجدول لليوم و ${dynamicAlerts.lowStockAlerts} تنبيهات لمخزون العيادة المنخفض.` 
              : `You have ${dynamicAlerts.todayFollowups} scheduled follow-up visits for today and ${dynamicAlerts.lowStockAlerts} clinic low stock alerts.`}
          </motion.p>
        </div>

        <div className="relative z-10 flex flex-col items-start lg:items-end text-start lg:text-end border-t lg:border-t-0 lg:border-s border-white/20 pt-6 lg:pt-0 lg:ps-10 min-w-max">
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gold font-medium text-sm mb-1"
          >
            {getGreeting()}
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl lg:text-2xl font-serif font-bold mb-2"
          >
            {formatDate()}
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[20px] font-mono text-white/90 font-medium"
          >
            {formatTime()}
            <div className="h-1 w-12 bg-gold mt-3 rounded-full hidden lg:block ms-auto" />
            <div className="h-1 w-12 bg-gold mt-3 rounded-full lg:hidden" />
          </motion.div>
        </div>
      </div>


      {/* Premium Storage & Stock Control Action Row */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => {
          setIsQuickSellOpen(true);
        }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-r from-burgundy via-[#2c0b11] to-ink border-2 border-gold/40 hover:border-gold cursor-pointer group shadow-xl transition-all duration-300 transform md:hover:-translate-y-0.5 select-none"
      >
        {/* Decorative ambient glowing backdrops */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl md:group-hover:bg-gold/25 transition-all duration-500 pointer-events-none" />
        <div className="absolute -bottom-4 left-10 w-24 h-24 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gold text-ink flex items-center justify-center shrink-0 shadow-lg shadow-gold/20 md:group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-gold tracking-widest uppercase font-[Verdana] bg-white/5 px-2.5 py-0.5 rounded border border-gold/15">
                  {lang === 'ar' ? 'بوابة البيع المباشر والسريع' : 'QUICK SELL DIRECT STATION'}
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded font-[Verdana] animate-pulse tracking-wide">
                  {lang === 'ar' ? 'نشط ومحدث' : 'ACTIVE CONSOLE'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white mt-1 group-hover:text-gold transition-colors tracking-tight">
                {lang === 'ar' ? 'بوابة المبيعات المباشرة السريعة لمختلف السلع' : 'Open Quick Sell & Direct Checkout Hub'}
              </h3>
              <p className="text-xs text-white/70 max-w-xl font-sans leading-relaxed mt-0.5">
                {lang === 'ar' 
                  ? 'قم ببيع إطارات القراءة الجاهزة، مناديل تنظيف العدسات، بخاخ المعقم، ومختلف مستلزمات البصريات بشكل مباشر وسريع.' 
                  : 'Instantly sell generic reading frames, lens wipes, sanitizing sprays, or other miscellaneous optical accessories with automatic stock checking.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end shrink-0 select-none">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickSellOpen(true);
              }}
              className="text-xs font-[Verdana] font-bold text-gold bg-gold/10 border border-gold/40 hover:bg-gold hover:text-ink hover:border-gold rounded-xl px-4 py-2 transition-all cursor-pointer inline-block shadow-sm"
            >
              {lang === 'ar' ? 'البوابة السريعة للمبيعات المباشرة (Quick Sell)' : 'Quick Sell / Retail Checkout'}
            </button>
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickSellOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 hover:bg-gold hover:text-ink md:group-hover:scale-105 flex items-center justify-center text-gold cursor-pointer transition-all shrink-0 shadow-sm"
              title={lang === 'ar' ? 'بيع سريع مباشر' : 'Fast-track Direct Sale'}
            >
              <ShoppingCart size={17} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
      </motion.div>


      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 + 0.3 }}
            onClick={() => setCurrentSection(stat.section as any)}
            className="card p-3 sm:p-5 flex flex-col justify-between hover:border-burgundy/20 transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className={cn("p-1.5 sm:p-2.5 rounded-xl", stat.color)}>
                <stat.icon size={16} className="sm:hidden" />
                <stat.icon size={18} className="hidden sm:block" />
              </div>
              {stat.trend === "up" ? (
                <div className="flex items-center text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                  <ArrowUpRight size={10} className="me-0.5 sm:me-1" />
                  <span className="hidden sm:inline text-[13.5px] font-bold">INCREASE</span>
                  <span className="sm:hidden text-[13.5px] font-bold">INC</span>
                </div>
              ) : (
                <div className="flex items-center text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                  <ArrowDownRight size={10} className="me-0.5 sm:me-1" />
                  <span className="hidden sm:inline text-[13.5px] font-bold">HIGH</span>
                  <span className="sm:hidden text-[13.5px] font-bold">HI</span>
                </div>
              )}
            </div>
            <div className="flex-1 mt-1 sm:mt-2">
              <p className="text-[11px] text-ink-light uppercase tracking-widest font-bold mb-1 sm:mb-1.5 leading-tight">{stat.label}</p>
              <h3 className="text-lg sm:text-2xl font-bold text-ink mb-1 group-hover:text-burgundy transition-colors tabular-nums tracking-tight">{stat.value}</h3>
              <p className="text-[9px] sm:text-[10px] text-ink-light leading-tight">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6">
        {/* Main Chart */}
        {hasFinancePermission && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-3 card p-4 sm:p-6 flex flex-col"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4 shrink-0">
              <div>
                <h3 className="text-lg font-serif font-bold text-ink">
                  {chartRange === "weekly" ? t("last_7_days") || "Last 7 Days" : 
                   chartRange === "monthly" ? t("last_30_days") || "Last 30 Days" : 
                   lang === 'ar' ? "آخر 12 شهراً" : "Yearly Overview"}
                </h3>
                <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mt-1">{lang === 'ar' ? 'تحليلات الإيرادات' : 'Revenue Analytics'}</p>
              </div>
              <div className="flex gap-1 sm:gap-1.5 p-1 bg-cream rounded-xl border border-cream-border overflow-x-auto w-full sm:w-auto scrollbar-hide shrink-0">
                <button 
                  onClick={() => setChartRange("weekly")} 
                  className={cn("flex-1 sm:flex-none px-2 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", chartRange === "weekly" ? "bg-white text-burgundy shadow-sm" : "text-ink-light hover:text-ink")}
                >
                  {lang === 'ar' ? 'أسبوعي' : 'Weekly'}
                </button>
                <button 
                  onClick={() => setChartRange("monthly")} 
                  className={cn("flex-1 sm:flex-none px-2 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", chartRange === "monthly" ? "bg-white text-burgundy shadow-sm" : "text-ink-light hover:text-ink")}
                >
                  {lang === 'ar' ? 'شهري' : 'Monthly'}
                </button>
                <button 
                  onClick={() => setChartRange("yearly")} 
                  className={cn("flex-1 sm:flex-none px-2 sm:px-4 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", chartRange === "yearly" ? "bg-white text-burgundy shadow-sm" : "text-ink-light hover:text-ink")}
                >
                  {lang === 'ar' ? 'سنوي' : 'Yearly'}
                </button>
              </div>
            </div>
            
            <div className="min-h-[250px] sm:min-h-[300px] mt-4 -mx-4 sm:-mx-6 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] relative z-10 outline-none [&_*]:outline-none" style={{ WebkitTapHighlightColor: 'transparent' }}>
              <ResponsiveContainer width="100%" height="100%" className="outline-none">
                <AreaChart data={activeData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} style={{ outline: 'none' }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6b1a2a" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6b1a2a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0ead8" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#8a7d70', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#8a7d70', fontWeight: 600 }}
                    tickFormatter={(val) => `${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#e8dcc8', strokeWidth: 1, strokeDasharray: '3 3', fill: 'transparent' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e8dcc8', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      outline: 'none'
                    }}
                    itemStyle={{ color: '#6b1a2a', fontWeight: 'bold' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#6b1a2a" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6b1a2a', style: { outline: 'none' } }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className={cn("card p-4 sm:p-6 flex flex-col", hasFinancePermission ? "lg:col-span-2" : "lg:col-span-5 col-span-full")}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif font-bold text-ink">{lang === 'ar' ? 'سجل المبيعات الأخيرة' : 'Recent Activity / Sales'}</h3>
              <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mt-1">
                {lang === 'ar' ? 'تحصيلات الصندوق والعيادة الفورية' : 'Latest POS and clinical inflows'}
              </p>
            </div>
            <span className="text-[9px] font-bold text-burgundy bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
              {lang === "ar" ? "نشط" : "LIVE FEED"}
            </span>
          </div>

          <div className="flex flex-col">
            {recentSales.length === 0 ? (
              <div className="p-8 text-center text-ink-light italic text-xs">
                {lang === "ar" ? "لا توجد أي تحصيلات مبيعات مسجلة حتى الآن." : "No documented transactions found yet."}
              </div>
            ) : (
              recentSales.map((sale, i) => (
                <div 
                  key={sale.id || i} 
                  onClick={() => {
                    if (sale.patientId === "walkin_retail") {
                      if (hasFinancePermission) setCurrentSection("reports");
                    } else {
                      setCurrentSection("patients");
                    }
                  }} 
                  className="flex items-center gap-3 sm:gap-4 group cursor-pointer hover:bg-cream/30 py-3 px-1 sm:px-2 rounded-lg transition-all border-b border-cream-border border-dashed last:border-b-0"
                >
                  {sale.patientId === "walkin_retail" ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
                      <ShoppingCart size={14} className="stroke-[2.5]" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-burgundy-pale text-burgundy flex items-center justify-center font-bold text-sm shrink-0 border border-burgundy/10">
                      {sale.name ? sale.name[0] : "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0 pe-2 text-start">
                    <h4 className="text-[13px] sm:text-sm font-bold text-ink truncate group-hover:text-burgundy transition-colors">
                      {sale.name}
                    </h4>
                    <p className="text-[10px] text-ink-light truncate font-medium" title={sale.type}>{sale.type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {hasFinancePermission && (
                      <p className="text-xs font-bold text-burgundy tracking-tight tabular-nums">{formatIQD(sale.price)}</p>
                    )}
                    <p className="text-[9px] sm:text-[10px] text-ink-light mt-0.5">{getFriendlyDate(sale.visit_date)}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <button onClick={() => setCurrentSection("patients")} className="w-full mt-6 py-2 text-xs font-bold text-burgundy border-t border-cream-border pt-4 hover:text-burgundy-soft transition-colors tracking-widest uppercase cursor-pointer">
            {t("view_all")}
          </button>
        </motion.div>
      </div>

      <QuickSellModal 
        isOpen={isQuickSellOpen} 
        onClose={() => setIsQuickSellOpen(false)} 
      />
    </div>
  );
}
