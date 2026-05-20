import React, { useState } from "react";
import { Settings as SettingsIcon, Save, Database, Printer, Building2, Bell, Shield, Palette, List } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { cn } from "../lib/utils";

export function Settings() {
  const { lang, clinic, setClinic, logAction, lensCatalog, setLensCatalog } = useClinic();
  const [activeTab, setActiveTab] = useState("general");
  
  const [formData, setFormData] = useState({
    name: clinic?.name || "",
    phone: clinic?.phone || "",
    address: clinic?.address || "",
    wa_template_1: clinic?.wa_template_1 || "Hello {patient_name}, this is a reminder for your follow-up on {next_visit} from {clinic_name}.",
    wa_template_2: clinic?.wa_template_2 || "",
    wa_template_3: clinic?.wa_template_3 || "",
    default_followup_months: clinic?.default_followup_months ?? 3
  });

  const serializeCatalog = (items: import("../types").CatalogItem[]) => items.map(i => `${i.label} | ${i.value}`).join('\n');
  const [catalogText, setCatalogText] = useState({
    type: serializeCatalog(lensCatalog?.type || []),
    material: serializeCatalog(lensCatalog?.material || []),
    coating: serializeCatalog(lensCatalog?.coating || []),
    frame_brand: serializeCatalog(lensCatalog?.frame_brand || []),
    frame_type: serializeCatalog(lensCatalog?.frame_type || []),
    frame_material: serializeCatalog(lensCatalog?.frame_material || []),
    frame_shape: serializeCatalog(lensCatalog?.frame_shape || [])
  });

  const parseCatalog = (text: string): import("../types").CatalogItem[] => {
    return text.split('\n').filter(line => line.trim() !== "").map(line => {
      const parts = line.split('|').map(s => s.trim());
      if (parts.length === 2) {
        return { label: parts[0], value: parts[1], is_active: true };
      }
      return { label: line.trim(), value: line.trim(), is_active: true };
    });
  };

  const [saveStatus, setSaveStatus] = useState("");

  const saveCatalog = () => {
    setLensCatalog(prev => ({
      ...prev,
      type: parseCatalog(catalogText.type),
      material: parseCatalog(catalogText.material),
      coating: parseCatalog(catalogText.coating),
      frame_brand: parseCatalog(catalogText.frame_brand),
      frame_type: parseCatalog(catalogText.frame_type),
      frame_material: parseCatalog(catalogText.frame_material),
      frame_shape: parseCatalog(catalogText.frame_shape)
    }));
    logAction({
      action: "update",
      entity_type: "settings",
      entity_id: "catalog",
      entity_name: "Product Catalog",
      details: "Updated product catalog items"
    });
    setSaveStatus(lang === 'ar' ? 'تم حفظ الكتالوج بنجاح!' : 'Catalog saved successfully!');
    setTimeout(() => setSaveStatus(""), 3000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinic) return;

    const changes: string[] = [];
    if (formData.name !== clinic.name) changes.push(`Name from "${clinic.name}" to "${formData.name}"`);
    if (formData.phone !== clinic.phone) changes.push(`Phone from "${clinic.phone}" to "${formData.phone}"`);
    if (formData.address !== clinic.address) changes.push(`Address from "${clinic.address}" to "${formData.address}"`);
    if (formData.default_followup_months !== clinic.default_followup_months) changes.push(`Default Follow-up changed to ${formData.default_followup_months} months`);
    if (formData.wa_template_1 !== clinic.wa_template_1) changes.push(`WhatsApp Template 1 changed`);

    if (changes.length > 0) {
      logAction({
        action: "update",
        entity_type: "settings",
        entity_id: clinic.id,
        entity_name: "Clinic Settings",
        details: `Updated settings: ${changes.join(", ")}`
      });

      setClinic({
        ...clinic,
        ...formData
      });
      
      setSaveStatus(lang === 'ar' ? 'تم الحفظ بنجاح' : 'Settings saved successfully');
      setTimeout(() => setSaveStatus(""), 3000);
    }
  };

  const tabs = [
    { id: 'general', label: lang === 'ar' ? 'إعدادات العيادة' : 'Clinic Settings', icon: Building2 },
    { id: 'catalog', label: lang === 'ar' ? 'كتالوج المنتجات' : 'Product Catalog', icon: List },
    { id: 'db', label: lang === 'ar' ? 'قاعدة البيانات' : 'Database Settings', icon: Database },
    { id: 'print', label: lang === 'ar' ? 'إعدادات الطباعة' : 'Print Settings', icon: Printer },
    { id: 'notifications', label: lang === 'ar' ? 'الإشعارات' : 'Notifications', icon: Bell },
    { id: 'security', label: lang === 'ar' ? 'الأمان' : 'Security', icon: Shield },
    { id: 'appearance', label: lang === 'ar' ? 'المظهر' : 'Appearance', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-ink mb-1 flex items-center gap-2">
            {lang === 'ar' ? 'الإعدادات' : 'Settings'}
          </h1>
          <p className="text-xs text-ink-light font-medium uppercase tracking-widest">
            {lang === 'ar' ? 'إعدادات النظام والعيادة' : 'System and Clinic Settings'}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        {/* Settings Navigation */}
        <div className="w-full">
          <div className="bg-white rounded-2xl border border-cream-border p-2 shadow-sm flex flex-nowrap overflow-x-auto hide-scrollbar gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap text-sm font-bold",
                    activeTab === tab.id
                      ? "bg-burgundy text-white shadow-md shadow-burgundy/20"
                      : "text-ink-mid hover:bg-cream hover:text-ink"
                  )}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-cream-border p-6 shadow-sm min-h-[400px]">
            {activeTab === 'general' && (
              <form onSubmit={handleSave} className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2 border-b border-cream-border pb-4">
                  <Building2 size={20} className="text-burgundy" /> 
                  {lang === 'ar' ? 'إعدادات العيادة' : 'Clinic Settings'}
                </h2>
                <div>
                  <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">
                    {lang === 'ar' ? 'اسم العيادة' : 'Clinic Name'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">
                    {lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">
                    {lang === 'ar' ? 'العنوان' : 'Address'}
                  </label>
                  <textarea
                    className="input-field min-h-[100px]"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">
                    {lang === 'ar' ? 'المدة الافتراضية للمراجعة (بالأشهر)' : 'Default Follow-up Interval (Months)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={formData.default_followup_months}
                    onChange={e => setFormData({ ...formData, default_followup_months: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div className="flex flex-col items-start gap-3 pt-6 border-t border-cream-border mt-6">
                  <button
                    type="submit"
                    className="btn-burgundy w-full flex items-center justify-center p-4 text-sm shadow-md"
                  >
                    <Save size={20} className="mr-2" />
                    {lang === 'ar' ? 'حفظ التغييرات' : 'Save General Changes'}
                  </button>
                  {saveStatus && <span className="text-sm font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2">{saveStatus}</span>}
                </div>
              </form>
            )}

            {activeTab === 'catalog' && (
              <div className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2 border-b border-cream-border pb-4">
                  <List size={20} className="text-burgundy" /> 
                  {lang === 'ar' ? 'كتالوج المنتجات' : 'Product Catalog Editor'}
                </h2>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 mb-6 space-y-1">
                  <p className="font-bold mb-2">Edit format: Label | Value (one per line)</p>
                  <p>Example: <i>Single Vision | single_vision</i> or just <i>Single Vision</i></p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Lens Types</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.type} 
                      onChange={e => setCatalogText(prev => ({ ...prev, type: e.target.value }))} 
                      placeholder="Single Vision | single_vision&#10;Bifocal | bifocal"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Lens Materials</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.material} 
                      onChange={e => setCatalogText(prev => ({ ...prev, material: e.target.value }))} 
                      placeholder="CR-39 | cr39&#10;Polycarbonate | polycarbonate"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Coatings</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.coating} 
                      onChange={e => setCatalogText(prev => ({ ...prev, coating: e.target.value }))} 
                      placeholder="Uncoated | uncoated&#10;Anti-Reflective | ar"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Frame Brands</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.frame_brand} 
                      onChange={e => setCatalogText(prev => ({ ...prev, frame_brand: e.target.value }))} 
                      placeholder="Ray-Ban | rayban&#10;Oakley | oakley"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Frame Types</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.frame_type} 
                      onChange={e => setCatalogText(prev => ({ ...prev, frame_type: e.target.value }))} 
                      placeholder="Full Rim | full_rim&#10;Rimless | rimless"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Frame Materials</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.frame_material} 
                      onChange={e => setCatalogText(prev => ({ ...prev, frame_material: e.target.value }))} 
                      placeholder="Metal | metal&#10;Plastic | plastic"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">Frame Shapes</label>
                    <textarea 
                      className="input-field min-h-[100px] font-mono text-xs" 
                      value={catalogText.frame_shape} 
                      onChange={e => setCatalogText(prev => ({ ...prev, frame_shape: e.target.value }))} 
                      placeholder="Square | square&#10;Round | round"
                    />
                  </div>
                  <div className="flex flex-col items-start gap-3 pt-6 border-t border-cream-border mt-6">
                    <button className="btn-burgundy w-full flex items-center justify-center p-4 text-sm shadow-md" onClick={saveCatalog}>
                      <Save size={20} className="mr-2" />
                      {lang === 'ar' ? 'حفظ التغييرات' : 'Save Catalog Changes'}
                    </button>
                    {saveStatus && <span className="text-sm font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2">{saveStatus}</span>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'db' && (
              <div className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2 border-b border-cream-border pb-4">
                  <Database size={20} className="text-burgundy" /> 
                  {lang === 'ar' ? 'قاعدة البيانات' : 'Database Settings'}
                </h2>
                <p className="text-sm text-ink-mid">
                  {lang === 'ar' 
                    ? 'خيارات النسخ الاحتياطي واستعادة قاعدة البيانات والاتصال بالخادم.' 
                    : 'Database backup, restore, and connection settings will be available here.'}
                </p>
                {/* Mock DB UI */}
                <div className="space-y-4 mt-4">
                  <div className="p-4 rounded-xl border border-cream-border bg-cream/30 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold">{lang === 'ar' ? 'النسخ الاحتياطي التلقائي' : 'Auto Backup'}</p>
                      <p className="text-xs text-ink-light">{lang === 'ar' ? 'نسخ احتياطي يومي للبيانات' : 'Daily data backup'}</p>
                    </div>
                    <div className="w-12 h-6 bg-burgundy rounded-full relative cursor-pointer">
                      <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                    </div>
                  </div>
                  <button className="btn-secondary w-full justify-center">
                    {lang === 'ar' ? 'إنشاء نسخة احتياطية الآن' : 'Create Backup Now'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'print' && (
              <div className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2 border-b border-cream-border pb-4">
                  <Printer size={20} className="text-burgundy" /> 
                  {lang === 'ar' ? 'إعدادات الطباعة' : 'Print Settings'}
                </h2>
                <p className="text-sm text-ink-mid">
                  {lang === 'ar' 
                    ? 'إعدادات تخطيط الطباعة، الهوامش، والمعلومات المطبوعة في ترويسة الورقة.' 
                    : 'Configure print layouts, margins, and header details for prescriptions and receipts.'}
                </p>
                {/* Mock Print UI */}
                <div className="space-y-4 mt-6">
                  <div>
                    <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">
                      {lang === 'ar' ? 'حجم الورق الافتراضي' : 'Default Paper Size'}
                    </label>
                    <select className="input-field">
                      <option>A4</option>
                      <option value="a5">A5</option>
                      <option>Letter</option>
                    </select>
                  </div>
                  <div className="p-4 rounded-xl border border-cream-border bg-cream/30 flex items-center gap-3">
                    <input type="checkbox" id="print-logo" defaultChecked className="w-4 h-4 text-burgundy rounded bg-white border-cream-border focus:ring-burgundy focus:ring-2" />
                    <label htmlFor="print-logo" className="text-sm font-bold text-ink cursor-pointer flex-1">
                      {lang === 'ar' ? 'طباعة شعار العيادة' : 'Print Clinic Logo'}
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <form onSubmit={handleSave} className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2 border-b border-cream-border pb-4">
                  <Bell size={20} className="text-burgundy" /> 
                  {lang === 'ar' ? 'رسائل الإشعارات (واتساب)' : 'WhatsApp Notification Templates'}
                </h2>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-xs text-blue-800 mb-6 space-y-1">
                  <p className="font-bold mb-2">Available Variables:</p>
                  <ul className="list-disc list-inside font-mono opacity-80">
                    <li>{'{patient_name}'}</li>
                    <li>{'{date}'}</li>
                    <li>{'{next_visit}'}</li>
                    <li>{'{clinic_name}'}</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-mid uppercase tracking-widest mb-1.5">
                    {lang === 'ar' ? 'نموذج واتساب 1' : 'WhatsApp Template 1'}
                  </label>
                  <textarea
                    className="input-field min-h-[100px]"
                    value={formData.wa_template_1}
                    onChange={e => setFormData({ ...formData, wa_template_1: e.target.value })}
                  />
                </div>
                <div className="flex flex-col items-start gap-3 pt-6 border-t border-cream-border mt-6">
                  <button type="submit" className="btn-burgundy w-full flex items-center justify-center p-4 text-sm shadow-md">
                    <Save size={20} className="mr-2" />
                    {lang === 'ar' ? 'حفظ التغييرات' : 'Save WhatsApp Settings'}
                  </button>
                  {saveStatus && <span className="text-sm font-bold text-emerald-600 animate-in fade-in slide-in-from-bottom-2">{saveStatus}</span>}
                </div>
              </form>
            )}

            {(activeTab === 'security' || activeTab === 'appearance') && (
              <div className="space-y-4 max-w-xl">
                <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2 border-b border-cream-border pb-4">
                  {activeTab === 'security' && <Shield size={20} className="text-burgundy" />}
                  {activeTab === 'appearance' && <Palette size={20} className="text-burgundy" />}
                  {tabs.find(t => t.id === activeTab)?.label}
                </h2>
                <p className="text-sm text-ink-mid flex items-center justify-center p-12 bg-cream/30 rounded-xl border border-dashed border-cream-border">
                  {lang === 'ar' ? 'هذا القسم قيد التطوير' : 'This section is under development'}
                </p>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
