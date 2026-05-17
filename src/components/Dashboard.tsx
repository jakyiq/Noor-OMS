import React from "react";
import { Users, DollarSign, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight, Bell, Package, Calendar } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { formatIQD, cn } from "../lib/utils";
import { motion } from "motion/react";
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

const data = [
  { name: "Sun", value: 400000 },
  { name: "Mon", value: 300000 },
  { name: "Tue", value: 500000 },
  { name: "Wed", value: 278000 },
  { name: "Thu", value: 189000 },
  { name: "Fri", value: 239000 },
  { name: "Sat", value: 349000 },
];

export function Dashboard() {
  const { t, lang, setCurrentSection } = useClinic();

  const [chartRange, setChartRange] = React.useState<"weekly" | "monthly" | "yearly">("weekly");

  const weeklyData = [
    { name: "Sun", value: 400000 },
    { name: "Mon", value: 300000 },
    { name: "Tue", value: 500000 },
    { name: "Wed", value: 278000 },
    { name: "Thu", value: 189000 },
    { name: "Fri", value: 239000 },
    { name: "Sat", value: 349000 },
  ];

  const monthlyData = [
    { name: "W1", value: 1200000 },
    { name: "W2", value: 1500000 },
    { name: "W3", value: 1100000 },
    { name: "W4", value: 1800000 },
  ];

  const yearlyData = [
    { name: "Jan", value: 4500000 },
    { name: "Feb", value: 5200000 },
    { name: "Mar", value: 4800000 },
    { name: "Apr", value: 6100000 },
    { name: "May", value: 5900000 },
    { name: "Jun", value: 6500000 },
    { name: "Jul", value: 7100000 },
    { name: "Aug", value: 6800000 },
    { name: "Sep", value: 7500000 },
    { name: "Oct", value: 8100000 },
    { name: "Nov", value: 7900000 },
    { name: "Dec", value: 8500000 },
  ];

  const activeData = chartRange === "weekly" ? weeklyData : chartRange === "monthly" ? monthlyData : yearlyData;

  const stats = [
    { id: "today_patients", label: t("today_patients"), value: "12", sub: "+20% from yesterday", icon: Users, color: "bg-blue-50 text-blue-600", trend: "up", section: "patients" },
    { id: "today_earnings", label: t("today_earnings"), value: formatIQD(850000), sub: "Target: 1M IQD", icon: DollarSign, color: "bg-emerald-50 text-emerald-600", trend: "up", section: "reports" },
    { id: "outstanding_debt", label: t("outstanding_debt"), value: formatIQD(1240000), sub: "14 clinical cases", icon: AlertCircle, color: "bg-rose-50 text-rose-600", trend: "down", section: "patients" },
    { id: "monthly_revenue", label: t("monthly_revenue"), value: formatIQD(15400000), sub: "+12% from last month", icon: TrendingUp, color: "bg-amber-50 text-amber-600", trend: "up", section: "reports" },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in transition-all duration-500">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-burgundy rounded-2xl p-6 lg:p-10 text-white shadow-xl group">

        <div className="absolute top-0 end-0 w-64 h-64 bg-white/5 rounded-full -me-32 -mt-32 blur-3xl group-hover:bg-white/10 transition-all duration-700" />
        <div className="absolute bottom-0 start-0 w-48 h-48 bg-gold/10 rounded-full -ms-24 -mb-24 blur-2xl" />
        
        <div className="relative z-10">
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
            {t("welcome_back")}، د. أحمد
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-md text-white/70 text-sm leading-relaxed"
          >
            {lang === 'ar' 
              ? 'لديك 12 موعداً مجدولاً لليوم و 4 تنبيهات لمخزون العدسات المنخفض.' 
              : 'You have 12 appointments scheduled for today and 4 low stock alerts for lenses.'}
          </motion.p>
        </div>
      </div>


      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 + 0.3 }}
            onClick={() => setCurrentSection(stat.section as any)}
            className="card p-6 flex flex-col justify-between hover:border-burgundy/20 transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={cn("p-3 rounded-xl", stat.color)}>
                <stat.icon size={20} />
              </div>
              {stat.trend === "up" ? (
                <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  <ArrowUpRight size={12} className="me-1" />
                  INCREASE
                </div>
              ) : (
                <div className="flex items-center text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                  <ArrowDownRight size={12} className="me-1" />
                  HIGH
                </div>
              )}
            </div>
            <div className="flex-1 mt-4 lg:mt-6">
              <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mb-1.5 lg:mb-2">{stat.label}</p>
              <h3 className="text-2xl font-bold text-ink mb-2 group-hover:text-burgundy transition-colors tabular-nums tracking-tight">{stat.value}</h3>
              <p className="text-[10px] lg:text-xs text-ink-light leading-tight">{stat.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 card p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-serif font-bold text-ink">
                {chartRange === "weekly" ? t("last_7_days") || "Last 7 Days" : 
                 chartRange === "monthly" ? t("last_30_days") || "Last 30 Days" : 
                 lang === 'ar' ? "آخر 12 شهراً" : "Yearly Overview"}
              </h3>
              <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mt-1">{lang === 'ar' ? 'تحليلات الإيرادات' : 'Revenue Analytics'}</p>
            </div>
            <div className="flex gap-1.5 p-1 bg-cream rounded-xl border border-cream-border overflow-x-auto self-start sm:self-auto">
              <button 
                onClick={() => setChartRange("weekly")} 
                className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", chartRange === "weekly" ? "bg-white text-burgundy shadow-sm" : "text-ink-light hover:text-ink")}
              >
                {lang === 'ar' ? 'أسبوعي' : 'Weekly'}
              </button>
              <button 
                onClick={() => setChartRange("monthly")} 
                className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", chartRange === "monthly" ? "bg-white text-burgundy shadow-sm" : "text-ink-light hover:text-ink")}
              >
                {lang === 'ar' ? 'شهري' : 'Monthly'}
              </button>
              <button 
                onClick={() => setChartRange("yearly")} 
                className={cn("px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all", chartRange === "yearly" ? "bg-white text-burgundy shadow-sm" : "text-ink-light hover:text-ink")}
              >
                {lang === 'ar' ? 'سنوي' : 'Yearly'}
              </button>
            </div>
          </div>
          
          <div className="h-[240px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">

              <AreaChart data={activeData}>
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
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e8dcc8', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
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
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card p-6"
        >
          <div className="mb-6">
            <h3 className="text-lg font-serif font-bold text-ink">{t("recent_patients")}</h3>
            <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mt-1">{lang === 'ar' ? 'أحدث الفحوصات' : 'Latest check-ups'}</p>
          </div>

          <div className="space-y-4">
            {[
              { name: "Ali Al-Fahad", time: "10 mins ago", type: "Progressive", price: 120000 },
              { name: "Sarah Jamil", time: "2 hours ago", type: "Single Vision", price: 45000 },
              { name: "Mohammed Hassan", time: "4 hours ago", type: "Frames only", price: 85000 },
              { name: "Noor Khalid", time: "Yesterday", type: "Reading", price: 35000 },
            ].map((patient, i) => (
              <div key={i} onClick={() => setCurrentSection("patients")} className="flex items-center gap-4 group cursor-pointer hover:bg-cream/50 p-2 -m-2 rounded-xl transition-all">
                <div className="w-10 h-10 rounded-xl bg-burgundy-pale text-burgundy flex items-center justify-center font-bold text-sm shrink-0 border border-burgundy/10">
                  {patient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-ink truncate group-hover:text-burgundy transition-colors">{patient.name}</h4>
                  <p className="text-[10px] text-ink-light truncate">{patient.type} · {patient.time}</p>
                </div>
                <div className="text-right shrink-0 ps-2">
                  <p className="text-xs font-bold text-burgundy tracking-tight tabular-nums">{formatIQD(patient.price)}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setCurrentSection("patients")} className="w-full mt-6 py-2 text-xs font-bold text-burgundy border-t border-cream-border pt-4 hover:text-burgundy-soft transition-colors tracking-widest uppercase cursor-pointer">
            {t("view_all")}
          </button>
        </motion.div>
      </div>

      {/* Mini Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={() => setCurrentSection("inventory")}
          className="card p-4 flex items-center justify-between cursor-pointer hover:border-burgundy/20 group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Package size={20} />
            </div>
            <div>
              <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mb-0.5">{lang === 'ar' ? 'تنبيهات المخزون' : 'Low Stock Items'}</p>
              <h4 className="text-sm font-bold text-ink group-hover:text-burgundy transition-colors">12 {lang === 'ar' ? 'عنصر' : 'Items'}</h4>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-cream border border-cream-border flex items-center justify-center text-burgundy opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight size={16} className={lang === 'ar' ? '-scale-x-100' : ''} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85 }}
          onClick={() => setCurrentSection("followups")}
          className="card p-4 flex items-center justify-between cursor-pointer hover:border-burgundy/20 group transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mb-0.5">{lang === 'ar' ? 'مراجعات اليوم' : 'Today\'s Follow-ups'}</p>
              <h4 className="text-sm font-bold text-ink group-hover:text-burgundy transition-colors">5 {lang === 'ar' ? 'مرضى' : 'Patients'}</h4>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-cream border border-cream-border flex items-center justify-center text-burgundy opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
            <ArrowUpRight size={16} className={lang === 'ar' ? '-scale-x-100' : ''} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card p-4 flex items-center justify-between cursor-pointer hover:border-burgundy/20 group transition-all border-dashed border-2 bg-transparent hover:bg-white"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cream border-2 border-cream-border text-ink flex items-center justify-center shrink-0 group-hover:border-burgundy/20 group-hover:text-burgundy transition-all">
              <Bell size={20} />
            </div>
            <div>
              <p className="text-[10px] text-ink-light uppercase tracking-widest font-bold mb-0.5">{lang === 'ar' ? 'مهام سريعة' : 'Quick Actions'}</p>
              <h4 className="text-sm font-bold text-ink group-hover:text-burgundy transition-colors">{lang === 'ar' ? 'إضافة موعد' : 'Add Appointment'}</h4>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
