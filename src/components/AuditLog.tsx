import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Clock,
  User,
  Database,
  Tag,
  AlertCircle,
  FileText,
  Trash2,
  Edit,
  Plus
} from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";

export function AuditLog() {
  const { t, lang, auditLogs } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = 
        log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entity_id.includes(searchTerm);
      
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesEntity = entityFilter === "all" || log.entity_type === entityFilter;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [auditLogs, searchTerm, actionFilter, entityFilter]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create": return <Plus size={14} className="text-green-600" />;
      case "update": return <Edit size={14} className="text-amber-600" />;
      case "delete": return <Trash2 size={14} className="text-rose-600" />;
      default: return <Database size={14} />;
    }
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case "patient": return lang === 'ar' ? 'مراجع' : 'Patient';
      case "visit": return lang === 'ar' ? 'مراجعة' : 'Visit';
      case "prescription": return lang === 'ar' ? 'وصفة' : 'Prescription';
      case "inventory": return lang === 'ar' ? 'مخزن' : 'Inventory';
      case "supplier": return lang === 'ar' ? 'مورد' : 'Supplier';
      case "settings": return lang === 'ar' ? 'الإعدادات' : 'Settings';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1">{lang === 'ar' ? 'سجل التدقيق' : 'Audit Log'}</h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest flex items-center gap-2">
            SYSTEM ACTIVITY FEED <span className="w-1 h-1 bg-cream-border rounded-full" /> {auditLogs.length} EVENTS RECORDED
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-cream/50 rounded-xl border border-cream-border">
          <ShieldCheck size={16} className="text-burgundy" />
          <span className="text-[10px] font-bold text-ink-mid uppercase tracking-widest">Compliance Active</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative group">
          <Search className="absolute start-4 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" size={18} />
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'ابحث في السجلات...' : 'Search activity logs...'}
            className="w-full ps-12 pe-4 py-3 bg-white border-2 border-cream-border rounded-xl focus:border-burgundy focus:shadow-lg focus:shadow-burgundy/5 transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="border-2 border-cream-border bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink-mid focus:border-burgundy outline-none transition-all cursor-pointer"
          >
            <option value="all">{lang === 'ar' ? 'جميع العمليات' : 'All Actions'}</option>
            <option value="create">{lang === 'ar' ? 'إضافة' : 'Create'}</option>
            <option value="update">{lang === 'ar' ? 'تعديل' : 'Update'}</option>
            <option value="delete">{lang === 'ar' ? 'حذف' : 'Delete'}</option>
          </select>
          <select 
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="border-2 border-cream-border bg-white rounded-xl px-4 py-3 text-sm font-medium text-ink-mid focus:border-burgundy outline-none transition-all cursor-pointer"
          >
            <option value="all">{lang === 'ar' ? 'جميع الكيانات' : 'All Entities'}</option>
            <option value="patient">{lang === 'ar' ? 'المراجعين' : 'Patients'}</option>
            <option value="visit">{lang === 'ar' ? 'المراجعات' : 'Visits'}</option>
            <option value="prescription">{lang === 'ar' ? 'الوصفات' : 'Prescriptions'}</option>
            <option value="inventory">{lang === 'ar' ? 'المخزن' : 'Inventory'}</option>
            <option value="settings">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-cream-border overflow-hidden shadow-sm">
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-6 py-4 bg-cream/50 border-b border-cream-border text-[10px] font-bold text-ink-light uppercase tracking-widest">
          <div className="col-span-3">Timestamp / User</div>
          <div className="col-span-2 text-center">Action</div>
          <div className="col-span-2 text-center">Entity Type</div>
          <div className="col-span-3">Name / Details</div>
          <div className="col-span-2 text-end">Action ID</div>
        </div>

        <div className="divide-y divide-cream-border">
          {filteredLogs.map((log, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={log.id} 
              className="lg:grid lg:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-cream/20 transition-all group"
            >
              <div className="col-span-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center text-ink-light shrink-0">
                  <Clock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink">{format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}</h4>
                  <p className="text-[10px] font-medium text-ink-light flex items-center gap-1"><User size={10} /> {log.user_name}</p>
                </div>
              </div>

              <div className="col-span-2 flex justify-center">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border",
                  log.action === 'create' ? "bg-green-50 text-green-600 border-green-100" :
                  log.action === 'update' ? "bg-amber-50 text-amber-600 border-amber-100" :
                  "bg-rose-50 text-rose-600 border-rose-100"
                )}>
                  {getActionIcon(log.action)}
                  {log.action}
                </span>
              </div>

              <div className="col-span-2 text-center">
                <span className="px-2 py-1 bg-cream-dark/30 text-ink-light text-[10px] font-bold uppercase tracking-widest rounded border border-cream-border/50">
                  {getEntityLabel(log.entity_type)}
                </span>
              </div>

              <div className="col-span-3">
                <h4 className="text-xs font-bold text-ink truncate">{log.entity_name}</h4>
                <p className="text-[10px] text-ink-light truncate mt-0.5">{log.details}</p>
              </div>

              <div className="col-span-2 text-end">
                <span className="text-[10px] font-mono font-bold text-ink-light/50 bg-cream px-2 py-1 rounded">#{log.id}</span>
              </div>
            </motion.div>
          ))}
          {filteredLogs.length === 0 && (
            <div className="p-16 text-center text-ink-light flex flex-col items-center gap-4">
              <Database size={48} className="opacity-10" />
              <p className="text-sm font-bold uppercase tracking-widest">No activity records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
