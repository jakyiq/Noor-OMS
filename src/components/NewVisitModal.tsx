import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Plus, Minus, Search, Check } from "lucide-react";
import { cn } from "../lib/utils";
import { useClinic } from "../context/ClinicContext";

interface NewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visitData: any) => void;
  lang: string;
  visitToEdit?: any | null;
  isCloning?: boolean;
}

const LENS_TYPES = [
  "Single Vision",
  "Bifocal",
  "Trifocal",
  "Progressive",
  "Reading",
  "Plano",
  "Prism",
  "Contact Lenses",
];

const FRAME_TYPES = ["Full Rim", "Half Rim", "Rimless", "Semi-Rimless"];

const FRAME_MATERIALS = ["Acetate", "Metal", "Plastic", "TR90", "Titanium", "Wood"];

const COATINGS = [
  "Clear",
  "Blue Light Cut",
  "Green Light Cut",
  "Photochromic",
  "Photochromic Blue",
  "Photochromic Green",
  "Polarized Filter",
  "Tinted",
  "UV 400",
  "Mirror",
  "Anti-Scratch",
  "Anti-Fog",
  "Oleophobic",
  "AR+",
  "Blue Cut Combo",
];

const MATERIALS = [
  "Plastic (CR-39)",
  "Glass",
  "High-Index",
  "Trivex",
];

export const NewVisitModal: React.FC<NewVisitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lang,
  visitToEdit,
  isCloning = false,
}) => {
  const { lensCatalog, frames, lenses } = useClinic();
  
  const currentLensTypes = React.useMemo(() => lensCatalog?.type || LENS_TYPES.map(t => ({label: t, value: t})), [lensCatalog?.type]);
  const currentMaterials = React.useMemo(() => lensCatalog?.material || MATERIALS.map(t => ({label: t, value: t})), [lensCatalog?.material]);
  const currentCoatings = React.useMemo(() => lensCatalog?.coating || COATINGS.map(t => ({label: t, value: t})), [lensCatalog?.coating]);

  const [activeTab, setActiveTab] = useState<"rx" | "frame" | "financial">("rx");

  const isContact = (t: string) => (t || "").toLowerCase().includes("contact");
  const isPlano = (t: string) => (t || "").toLowerCase().includes("plano");

  const defaultData = {
    eyesCount: "both" as "both" | "od" | "os",
    od: { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" },
    os: { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" },
    lensType: currentLensTypes[0]?.value || "Single Vision",
    ipd: "",
    material: currentMaterials[0]?.value || "Plastic (CR-39)",
    coating: "",
    stockMatch: "",
    matchedOdLensId: null as string | null,
    matchedOsLensId: null as string | null,

    includeFrame: false,
    frameBrand: "",
    frameType: FRAME_TYPES[0],
    frameMaterial: FRAME_MATERIALS[0],
    frameStockItem: "",

    framePrice: "",
    lensPrice: "15000",
    checkupFee: "5000",
    paidAmount: "",
    notes: "",
    checkupDone: true,
  };

  const [data, setData] = useState(defaultData);

  useEffect(() => {
    if (isOpen) {
      if (visitToEdit) {
        if (visitToEdit.rawFormData) {
          const loadedData = { ...visitToEdit.rawFormData };
          if (isCloning) {
            loadedData.paidAmount = "";
            loadedData.notes = "";
            loadedData.matchedOdLensId = null;
            loadedData.matchedOsLensId = null;
            loadedData.frameStockItem = "";
            loadedData.matchedFrameId = null;
          }
          setData(loadedData);
        } else if (visitToEdit.rxData) {
          // Reconstruct rawFormData from rxData
          const rx = visitToEdit.rxData;
          const leftEyePresent = !!rx.os;
          const rightEyePresent = !!rx.od;
          const eyesCount = (leftEyePresent && rightEyePresent) ? "both" : (rightEyePresent ? "od" : "os");

          const parseEye = (eye: any) => {
            if (!eye) return { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" };
            return {
              sph: eye.sph !== undefined && eye.sph !== null ? String(eye.sph) : "",
              sphSign: eye.sphSign || "+",
              cyl: eye.cyl !== undefined && eye.cyl !== null ? String(eye.cyl) : "",
              cylSign: eye.cylSign || "+",
              axis: eye.axis !== undefined && eye.axis !== null ? String(eye.axis) : "",
              add: eye.add !== undefined && eye.add !== null ? String(eye.add) : "",
              va: eye.va || "6/6",
              bcva: eye.bcva || "6/6"
            };
          };

          setData({
            ...defaultData,
            eyesCount: eyesCount as "both" | "od" | "os",
            od: parseEye(rx.od),
            os: parseEye(rx.os),
            lensType: rx.lens || currentLensTypes[0]?.value || "Single Vision",
            ipd: rx.ipd || "",
            includeFrame: !!rx.frame,
            frameBrand: rx.frame || "",
            notes: "", // Always empty notes for cloned
            paidAmount: "", // Always empty paid for cloned
            lensPrice: String(visitToEdit.total_amount || "15000"),
          });
        }
      } else {
        setData({
          ...defaultData,
          lensType: currentLensTypes[0]?.value || "Single Vision",
          material: currentMaterials[0]?.value || "Plastic (CR-39)",
          coating: currentCoatings[0]?.value || ""
        });
      }
      setActiveTab("rx");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitToEdit, isCloning, currentLensTypes, currentMaterials, currentCoatings]);

  const renderLensStockMatch = () => {
    let checkOd = data.eyesCount === 'both' || data.eyesCount === 'od';
    let checkOs = data.eyesCount === 'both' || data.eyesCount === 'os';
    
    if (data.eyesCount === 'both') {
      const odEmpty = data.od.sph === "" && data.od.cyl === "";
      const osEmpty = data.os.sph === "" && data.os.cyl === "";
      if (odEmpty && !osEmpty) checkOd = false;
      if (osEmpty && !odEmpty) checkOs = false;
    }

    const claimedQuantities = new Map<string, number>();
    if (data.matchedOdLensId) {
      claimedQuantities.set(data.matchedOdLensId, (claimedQuantities.get(data.matchedOdLensId) || 0) + 1);
    }
    if (data.matchedOsLensId) {
      claimedQuantities.set(data.matchedOsLensId, (claimedQuantities.get(data.matchedOsLensId) || 0) + 1);
    }

    const checkPower = (sphStr: string, sphSign: string, cylStr: string, cylSign: string, eyeKey: "od" | "os") => {
      const eyeLabel = eyeKey.toUpperCase();
      const sphValStr = (sphStr || "0").trim();
      const cylValStr = (cylStr || "0").trim();
      
      const exactSph = parseFloat(sphSign === "-" ? "-" + sphValStr : sphValStr);
      const exactCyl = parseFloat(cylSign === "-" ? "-" + cylValStr : cylValStr);

      if (isNaN(exactSph) || isNaN(exactCyl)) return null;

      const findLensForPower = (sph: number, cyl: number) => {
        return lenses.find(l => 
          l.lens_type === data.lensType &&
          l.material === data.material &&
          l.coating === data.coating &&
          Math.abs(Number(l.sphere || 0) - sph) < 0.001 &&
          Math.abs(Number(l.cylinder || 0) - cyl) < 0.001
        );
      };

      const findAnyLensForPower = (sph: number, cyl: number) => {
        return lenses.filter(l => 
          Math.abs(Number(l.sphere || 0) - sph) < 0.001 &&
          Math.abs(Number(l.cylinder || 0) - cyl) < 0.001
        );
      };

      const formatPower = (sph: number, cyl: number) => `SPH ${sph > 0 ? '+' : ''}${sph.toFixed(2)}${cyl ? ` CYL ${cyl > 0 ? '+' : ''}${cyl.toFixed(2)}` : ''}`;

      const handleApply = (sph: number, cyl: number, lensId: string) => {
        setData(prev => ({
          ...prev,
          ...(eyeKey === "od" ? { matchedOdLensId: lensId } : { matchedOsLensId: lensId }),
          [eyeKey]: {
            ...prev[eyeKey],
            sph: Math.abs(sph).toString(),
            sphSign: sph < 0 ? "-" : "+",
            cyl: Math.abs(cyl).toString(),
            cylSign: cyl < 0 ? "-" : "+"
          }
        }));
      };

      const handleApplyVariant = (l: any) => {
        setData(prev => ({
          ...prev,
          lensType: l.lens_type,
          material: l.material,
          coating: l.coating,
          ...(eyeKey === "od" ? { matchedOdLensId: l.id } : { matchedOsLensId: l.id }),
          lensPrice: l.sell_price ? l.sell_price.toString() : prev.lensPrice,
          [eyeKey]: {
            ...prev[eyeKey],
            sph: Math.abs(l.sphere || 0).toString(),
            sphSign: (l.sphere || 0) < 0 ? "-" : "+",
            cyl: Math.abs(l.cylinder || 0).toString(),
            cylSign: (l.cylinder || 0) < 0 ? "-" : "+"
          }
        }));
      };

      const exactLens = findLensForPower(exactSph, exactCyl);
      const anyExactLenses = exactLens ? [] : findAnyLensForPower(exactSph, exactCyl);

      const getEffectiveQty = (l: any) => {
        if (!l) return 0;
        let claimedByOther = 0;
        if (eyeKey === "od" && data.matchedOsLensId === l.id) claimedByOther++;
        if (eyeKey === "os" && data.matchedOdLensId === l.id) claimedByOther++;
        return Math.max(0, l.quantity - claimedByOther);
      };

      let effectiveQuantity = getEffectiveQty(exactLens);
      const isSelected = exactLens && ((eyeKey === "od" && data.matchedOdLensId === exactLens.id) || (eyeKey === "os" && data.matchedOsLensId === exactLens.id));

      const exactStatus = exactLens 
        ? (effectiveQuantity > 0 ? `${effectiveQuantity} ${lang === "ar" ? "متوفر" : "in stock"}` : (lang === "ar" ? "نفد المخزون" : "Out of stock")) 
        : (lang === "ar" ? "غير موجود بالمخزون" : "Not in inventory");
      
      const plus25Lens = findLensForPower(exactSph + 0.25, exactCyl);
      let plus25Qty = getEffectiveQty(plus25Lens);
      const isPlus25Selected = plus25Lens && ((eyeKey === "od" && data.matchedOdLensId === plus25Lens.id) || (eyeKey === "os" && data.matchedOsLensId === plus25Lens.id));
      
      const minus25Lens = findLensForPower(exactSph - 0.25, exactCyl);
      let minus25Qty = getEffectiveQty(minus25Lens);
      const isMinus25Selected = minus25Lens && ((eyeKey === "od" && data.matchedOdLensId === minus25Lens.id) || (eyeKey === "os" && data.matchedOsLensId === minus25Lens.id));

      return (
        <div key={eyeKey} className="mb-4 last:mb-0 pb-1 border-b border-cream-border last:border-0 last:pb-0">
          <div className="font-bold text-ink-mid text-xs mb-1">--- {eyeLabel} ---</div>
          
          <div className="flex flex-col py-1.5 px-2 rounded -mx-2 transition-colors">
            <div 
              onClick={() => exactLens && effectiveQuantity > 0 && handleApply(exactSph, exactCyl, exactLens.id)}
              className={cn("flex justify-between items-center w-full p-2 rounded-md transition-all", exactLens && effectiveQuantity > 0 && !isSelected ? "cursor-pointer hover:bg-black/5" : "", isSelected ? "bg-blue-50 ring-1 ring-blue-500 shadow-sm" : "", (!exactLens || effectiveQuantity <= 0) ? "opacity-70 cursor-not-allowed" : "")}
            >
               <span className="font-mono text-sm flex items-center gap-2">
                 <span>Exact: {formatPower(exactSph, exactCyl)}</span>
                 {isSelected && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm uppercase font-bold tracking-wider flex items-center gap-1"><Check size={12} strokeWidth={3} /> Selected</span>}
               </span>
               <div className="flex items-center gap-3">
                 <span className={cn(
                   "text-xs font-bold",
                   exactLens && effectiveQuantity > 0 ? (isSelected ? "text-blue-700" : "text-emerald-600") : "text-rose-500"
                 )}>{exactStatus}</span>
               </div>
            </div>
            {!exactLens && anyExactLenses.length > 0 && (
              <div className="text-[10px] text-amber-600 mt-2 leading-tight">
                <div className="font-bold mb-1">{lang === "ar" ? "متوفر بمواد/طلاء مختلف:" : "Available in other variants:"}</div>
                <div className="space-y-1">
                  {anyExactLenses.slice(0, 3).map((l, i) => {
                    const lQty = getEffectiveQty(l);
                    const lSelected = l && ((eyeKey === "od" && data.matchedOdLensId === l.id) || (eyeKey === "os" && data.matchedOsLensId === l.id));
                    return (
                      <div 
                        key={i} 
                        onClick={() => {
                          if (lQty > 0) {
                            handleApplyVariant(l);
                          }
                        }}
                        className={cn(
                          "flex justify-between items-center px-2 py-1.5 rounded-md transition-all",
                          lQty > 0 && !lSelected ? "cursor-pointer hover:bg-black/5" : "",
                          lSelected ? "bg-amber-50 ring-1 ring-amber-500 shadow-sm" : "",
                          lQty <= 0 ? "opacity-50 cursor-not-allowed" : ""
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <span>• {l.lens_type} / {l.material} / {l.coating}</span>
                          {lSelected && <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded shadow-sm uppercase font-bold tracking-wider flex items-center gap-1"><Check size={12} strokeWidth={3} /> Selected</span>}
                        </span>
                        <span className={cn(lQty > 0 ? "font-bold" : "", lSelected ? "text-amber-700" : "")}>
                          ({lQty > 0 ? lQty + ' in stock' : 'out of stock'})
                        </span>
                      </div>
                    );
                  })}
                  {anyExactLenses.length > 3 && (
                    <div className="px-1 text-ink-light opacity-70">
                      ... and {anyExactLenses.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {plus25Lens && plus25Qty > 0 && (
            <div
              onClick={() => handleApply(exactSph + 0.25, exactCyl, plus25Lens.id)}
              className={cn("flex justify-between items-center py-2 px-3 rounded-md -mx-2 transition-all mt-1", isPlus25Selected ? "bg-blue-50 ring-1 ring-blue-500 shadow-sm" : "cursor-pointer hover:bg-black/5 opacity-90")}
            >
              <span className="font-mono text-sm flex items-center gap-2">
                <span>Alt (+0.25): {formatPower(exactSph + 0.25, exactCyl)}</span>
                {isPlus25Selected && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm uppercase font-bold tracking-wider flex items-center gap-1"><Check size={12} strokeWidth={3} /> Selected</span>}
              </span>
              <span className={cn("text-xs font-bold", isPlus25Selected ? "text-blue-700" : "text-emerald-600")}>
                {plus25Qty} {lang === "ar" ? "متوفر" : "in stock"}
              </span>
            </div>
          )}

          {minus25Lens && minus25Qty > 0 && (
            <div
              onClick={() => handleApply(exactSph - 0.25, exactCyl, minus25Lens.id)}
              className={cn("flex justify-between items-center py-2 px-3 rounded-md -mx-2 transition-all mt-1", isMinus25Selected ? "bg-blue-50 ring-1 ring-blue-500 shadow-sm" : "cursor-pointer hover:bg-black/5 opacity-90")}
            >
              <span className="font-mono text-sm flex items-center gap-2">
                <span>Alt (-0.25): {formatPower(exactSph - 0.25, exactCyl)}</span>
                {isMinus25Selected && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded shadow-sm uppercase font-bold tracking-wider flex items-center gap-1"><Check size={12} strokeWidth={3} /> Selected</span>}
              </span>
              <span className={cn("text-xs font-bold", isMinus25Selected ? "text-blue-700" : "text-emerald-600")}>
                {minus25Qty} {lang === "ar" ? "متوفر" : "in stock"}
              </span>
            </div>
          )}
        </div>
      );
    };

    const hasSetValues = data.od.sph || data.od.cyl || data.os.sph || data.os.cyl;

    if (!hasSetValues) {
      return (
        <div className="text-ink-mid text-sm sm:p-4 text-center opacity-70">
          {lang === "ar" ? "أدخل قيم الوصفة أولاً لتشغيل مطابقة المخزون..." : "Enter prescription values to trigger stock matching..."}
        </div>
      );
    }

    return (
      <div className="flex flex-col w-full h-full p-2 whitespace-pre-wrap font-mono text-sm bg-transparent border-0 overflow-y-auto">
        {checkOd && checkPower(data.od.sph, data.od.sphSign, data.od.cyl, data.od.cylSign, "od")}
        {checkOs && checkPower(data.os.sph, data.os.sphSign, data.os.cyl, data.os.cylSign, "os")}
      </div>
    );
  };

  if (!isOpen) return null;

  const getMatchedStock = (eyeKey: "od" | "os") => {
    const matchedId = eyeKey === "od" ? data.matchedOdLensId : data.matchedOsLensId;
    if (!matchedId) return null;
    const lens = lenses.find(l => l.id === matchedId);
    if (!lens) return null;
    const inputs = data[eyeKey];
    const formSph = parseFloat(inputs.sphSign === "-" ? "-" + (inputs.sph || "0") : (inputs.sph || "0"));
    const formCyl = parseFloat(inputs.cylSign === "-" ? "-" + (inputs.cyl || "0") : (inputs.cyl || "0"));
    if (Math.abs(Number(lens.sphere || 0) - formSph) < 0.001 && Math.abs(Number(lens.cylinder || 0) - formCyl) < 0.001) {
      return lens;
    }
    return null;
  };
  const odMatchedLens = getMatchedStock("od");
  const osMatchedLens = getMatchedStock("os");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let odLensReq = null;
    let osLensReq = null;
    
    // Only check stock if not editing an existing visit
    // For simplicity, we check whenever they are adding a new visit.
    if (!visitToEdit) {
      let checkOd = data.eyesCount === 'both' || data.eyesCount === 'od';
      let checkOs = data.eyesCount === 'both' || data.eyesCount === 'os';
      
      if (data.eyesCount === 'both') {
        const odEmpty = data.od.sph === "" && data.od.cyl === "";
        const osEmpty = data.os.sph === "" && data.os.cyl === "";
        if (odEmpty && !osEmpty) checkOd = false;
        if (osEmpty && !odEmpty) checkOs = false;
      }

      if (checkOd) {
        odLensReq = {
          sph: parseFloat((data.od.sphSign === '-' ? '-' : '') + (data.od.sph || '0')),
          cyl: parseFloat((data.od.cylSign === '-' ? '-' : '') + (data.od.cyl || '0'))
        };
      }
      if (checkOs) {
        osLensReq = {
          sph: parseFloat((data.os.sphSign === '-' ? '-' : '') + (data.os.sph || '0')),
          cyl: parseFloat((data.os.cylSign === '-' ? '-' : '') + (data.os.cyl || '0'))
        };
      }

      const inventoryCheck = new Map<string, number>();

      const checkLensAvailability = (req: {sph: number, cyl: number}, eyeLabel: string) => {
        const match = lenses.find(l => 
          l.lens_type === data.lensType &&
          l.material === data.material &&
          l.coating === data.coating &&
          Math.abs(Number(l.sphere || 0) - req.sph) < 0.001 &&
          Math.abs(Number(l.cylinder || 0) - req.cyl) < 0.001
        );
        
        if (!match) {
          alert(`${eyeLabel} Lens (SPH: ${req.sph}, CYL: ${req.cyl}) not found in inventory.`);
          return false;
        }
        
        const needed = (inventoryCheck.get(match.id) || 0) + 1;
        inventoryCheck.set(match.id, needed);
        
        if (match.quantity < needed) {
          alert(`Not enough stock for ${eyeLabel} Lens (SPH: ${req.sph}, CYL: ${req.cyl}). Only ${match.quantity} available.`);
          return false;
        }
        return match.id;
      }

      let odMatchId = null;
      let osMatchId = null;

      if (odLensReq) {
        odMatchId = checkLensAvailability(odLensReq, "OD");
        if (!odMatchId) return;
      }
      if (osLensReq) {
        osMatchId = checkLensAvailability(osLensReq, "OS");
        if (!osMatchId) return;
      }

      data.matchedOdLensId = odMatchId;
      data.matchedOsLensId = osMatchId;
    }

    if (!visitToEdit && data.includeFrame && data.frameStockItem) {
      const frame = frames.find(f => f.id === data.frameStockItem);
      if (!frame || frame.quantity < 1) {
        alert("Selected frame is out of stock!");
        return;
      }
      data.matchedFrameId = data.frameStockItem;
    }

    onSave(data);
  };

  const toggleCoating = (coating: string) => {
    setData((prev) => ({
      ...prev,
      coating: coating,
    }));
  };

  const calculateTotal = () => {
    const fPrice = parseFloat(data.framePrice) || 0;
    const lPrice = parseFloat(data.lensPrice) || 0;
    const cFee = data.checkupDone ? parseFloat(data.checkupFee) || 5000 : 0;
    return fPrice + lPrice + cFee;
  };

  const total = calculateTotal();
  const paid = parseFloat(data.paidAmount) || 0;
  const remaining = total - paid;

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[50.4rem] overflow-hidden flex flex-col max-h-[90vh]"
        dir={lang === "ar" ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-cream-border bg-white z-10 shrink-0">
          <h2 className="text-xl font-bold">
            {lang === "ar" ? "زيارة جديدة" : "New Visit"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border border-cream-border rounded-xl text-ink-light hover:text-ink transition-colors bg-white hover:bg-cream/50"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSave}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Tabs */}
          <div className="flex border-b border-cream-border pt-4 px-6 shrink-0 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("rx")}
              className={cn(
                "pb-3 text-sm font-bold border-b-2 transition-colors",
                activeTab === "rx"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-ink-light hover:text-ink",
              )}
            >
              {lang === "ar" ? "الوصفة" : "Prescription"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("frame")}
              className={cn(
                "pb-3 text-sm font-bold border-b-2 transition-colors",
                activeTab === "frame"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-ink-light hover:text-ink",
              )}
            >
              {lang === "ar" ? "الإطار" : "Frame"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("financial")}
              className={cn(
                "pb-3 text-sm font-bold border-b-2 transition-colors",
                activeTab === "financial"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-ink-light hover:text-ink",
              )}
            >
              {lang === "ar" ? "المالية" : "Financial"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {activeTab === "rx" && (
              <div className="space-y-6">
                {/* Mobile View */}
                <div className="flex flex-col gap-4 sm:hidden mb-6">
                  {(data.eyesCount === "both" || data.eyesCount === "od") && (
                    <div className="border border-cream-border rounded-xl p-3 bg-white">
                      <div className="font-bold text-blue-800 text-sm mb-3 border-b border-cream-border pb-2 flex justify-between items-center">
                        <span>OD (R)</span>
                        {odMatchedLens && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                            <Check size={10} /> {lang === "ar" ? "محدد من المخزون" : "Stock selected"}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">SPH</label>
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="0.00" disabled={isPlano(data.lensType)} min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.od.sph} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setData(prev => ({...prev, od: {...prev.od, sph: v}})); }} />
                            <button type="button" disabled={isPlano(data.lensType)} onClick={() => setData(prev => ({...prev, od: {...prev.od, sphSign: prev.od.sphSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0 disabled:opacity-50", data.od.sphSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{data.od.sphSign}</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">CYL</label>
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="0.00" disabled={isPlano(data.lensType)} min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.od.cyl} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setData(prev => ({...prev, od: {...prev.od, cyl: v}})); }} />
                            <button type="button" disabled={isPlano(data.lensType)} onClick={() => setData(prev => ({...prev, od: {...prev.od, cylSign: prev.od.cylSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0 disabled:opacity-50", data.od.cylSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{data.od.cylSign}</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">AXIS</label>
                          <input type="number" placeholder="0" disabled={isPlano(data.lensType)} min="1" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.od.axis} onChange={e => { let v = e.target.value; if (parseInt(v, 10) > 180) v = "180"; setData(prev => ({...prev, od: {...prev.od, axis: v}})); }} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">ADD</label>
                          <input type="number" placeholder="0.00" disabled={isPlano(data.lensType)} min="0" step="0.25" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.od.add} onChange={e => setData(prev => ({...prev, od: {...prev.od, add: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">VA</label>
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" placeholder="6/6" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={data.od.va} onChange={e => setData(prev => ({...prev, od: {...prev.od, va: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">BCVA</label>
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" placeholder="6/6" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={data.od.bcva} onChange={e => setData(prev => ({...prev, od: {...prev.od, bcva: e.target.value}}))} />
                        </div>
                      </div>
                    </div>
                  )}

                  {(data.eyesCount === "both" || data.eyesCount === "os") && (
                    <div className="border border-cream-border rounded-xl p-3 bg-white">
                      <div className="font-bold text-blue-800 text-sm mb-3 border-b border-cream-border pb-2 flex justify-between items-center">
                        <span>OS (L)</span>
                        {osMatchedLens && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                            <Check size={10} /> {lang === "ar" ? "محدد من المخزون" : "Stock selected"}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">SPH</label>
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="0.00" disabled={isPlano(data.lensType)} min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.os.sph} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setData(prev => ({...prev, os: {...prev.os, sph: v}})); }} />
                            <button type="button" disabled={isPlano(data.lensType)} onClick={() => setData(prev => ({...prev, os: {...prev.os, sphSign: prev.os.sphSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0 disabled:opacity-50", data.os.sphSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{data.os.sphSign}</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">CYL</label>
                          <div className="flex items-center gap-1">
                            <input type="number" placeholder="0.00" disabled={isPlano(data.lensType)} min="0" max="20" step="0.25" className="w-full text-center border px-2 py-1.5 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.os.cyl} onChange={e => { let v = e.target.value; if (parseFloat(v) > 20) v = "20"; setData(prev => ({...prev, os: {...prev.os, cyl: v}})); }} />
                            <button type="button" disabled={isPlano(data.lensType)} onClick={() => setData(prev => ({...prev, os: {...prev.os, cylSign: prev.os.cylSign === "+" ? "-" : "+"}}))} className={cn("p-1.5 border rounded w-8 font-bold transition-colors shrink-0 disabled:opacity-50", data.os.cylSign === "+" ? "bg-blue-50 text-blue-600 border-blue-200" : "bg-rose-50 text-rose-600 border-rose-200")}>{data.os.cylSign}</button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">AXIS</label>
                          <input type="number" placeholder="0" disabled={isPlano(data.lensType)} min="1" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.os.axis} onChange={e => { let v = e.target.value; if (parseInt(v, 10) > 180) v = "180"; setData(prev => ({...prev, os: {...prev.os, axis: v}})); }} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">ADD</label>
                          <input type="number" placeholder="0.00" disabled={isPlano(data.lensType)} min="0" step="0.25" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm disabled:bg-gray-100 disabled:opacity-50" value={data.os.add} onChange={e => setData(prev => ({...prev, os: {...prev.os, add: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">VA</label>
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" placeholder="6/6" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={data.os.va} onChange={e => setData(prev => ({...prev, os: {...prev.os, va: e.target.value}}))} />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-ink-light block uppercase tracking-widest mb-1">BCVA</label>
                          <input type="text" pattern="[0-9]+/[0-9]+" title="Must be a fraction (e.g. 6/6)" placeholder="6/6" className="w-full text-center bg-transparent outline-none border focus:border-blue-600 rounded-md py-1.5 px-2 text-sm" value={data.os.bcva} onChange={e => setData(prev => ({...prev, os: {...prev.os, bcva: e.target.value}}))} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block border border-cream-border rounded-xl overflow-x-auto mb-6 w-full">
                  <table className="w-full text-center text-xs sm:text-sm whitespace-nowrap min-w-max bg-white">
                    <thead className="text-ink-light text-[10px] sm:text-xs font-bold uppercase tracking-widest border-b border-cream-border">
                      <tr>
                        <th className="p-3 border-x border-cream-border text-center">
                          EYE
                        </th>
                        <th className="p-3 border-x border-cream-border text-center">
                          SPH
                        </th>
                        <th className="p-3 border-x border-cream-border text-center">
                          CYL
                        </th>
                        <th className="p-3 border-x border-cream-border text-center">
                          AXIS
                        </th>
                        <th className="p-3 border-x border-cream-border text-center">
                          ADD
                        </th>
                        <th className="p-3 border-x border-cream-border text-center">
                          VA
                        </th>
                        <th className="p-3 border-x border-cream-border text-center">
                          BCVA
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cream-border">
                      {(data.eyesCount === "both" ||
                        data.eyesCount === "od") && (
                        <tr>
                          <td className="p-2 font-bold text-blue-800 border-x border-cream-border relative">
                            <div className="flex flex-col gap-1 items-start">
                              <span>OD (R)</span>
                              {odMatchedLens && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                                  <Check size={10} /> {lang === "ar" ? "من المخزون" : "Stock"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="0.00"
                                disabled={isPlano(data.lensType)}
                                min="0"
                                max="20"
                                step="0.25"
                                className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md disabled:bg-gray-100 disabled:opacity-50"
                                value={data.od.sph}
                                onChange={(e) => {
                                  let v = e.target.value;
                                  if (parseFloat(v) > 20) v = "20";
                                  setData((prev) => ({
                                    ...prev,
                                    od: { ...prev.od, sph: v },
                                  }));
                                }}
                              />
                              <button
                                type="button"
                                disabled={isPlano(data.lensType)}
                                onClick={() =>
                                  setData((prev) => ({
                                    ...prev,
                                    od: {
                                      ...prev.od,
                                      sphSign:
                                        prev.od.sphSign === "+" ? "-" : "+",
                                    },
                                  }))
                                }
                                className={cn(
                                  "p-1 border rounded w-7 font-bold transition-colors disabled:opacity-50",
                                  data.od.sphSign === "+"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : "bg-rose-50 text-rose-600 border-rose-200",
                                )}
                              >
                                {data.od.sphSign}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="0.00"
                                disabled={isPlano(data.lensType)}
                                min="0"
                                max="20"
                                step="0.25"
                                className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md disabled:bg-gray-100 disabled:opacity-50"
                                value={data.od.cyl}
                                onChange={(e) => {
                                  let v = e.target.value;
                                  if (parseFloat(v) > 20) v = "20";
                                  setData((prev) => ({
                                    ...prev,
                                    od: { ...prev.od, cyl: v },
                                  }));
                                }}
                              />
                              <button
                                type="button"
                                disabled={isPlano(data.lensType)}
                                onClick={() =>
                                  setData((prev) => ({
                                    ...prev,
                                    od: {
                                      ...prev.od,
                                      cylSign:
                                        prev.od.cylSign === "+" ? "-" : "+",
                                    },
                                  }))
                                }
                                className={cn(
                                  "p-1 border rounded w-7 font-bold transition-colors disabled:opacity-50",
                                  data.od.cylSign === "+"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : "bg-rose-50 text-rose-600 border-rose-200",
                                )}
                              >
                                {data.od.cylSign}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="number"
                              placeholder="0"
                              disabled={isPlano(data.lensType)}
                              min="1"
                              max="180"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1 disabled:bg-gray-100 disabled:opacity-50"
                              value={data.od.axis}
                              onChange={(e) => {
                                let v = e.target.value;
                                if (parseInt(v, 10) > 180) v = "180";
                                setData((prev) => ({
                                  ...prev,
                                  od: { ...prev.od, axis: v },
                                }));
                              }}
                            />
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="number"
                              placeholder="0.00"
                              disabled={isPlano(data.lensType)}
                              min="0"
                              step="0.25"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1 disabled:bg-gray-100 disabled:opacity-50"
                              value={data.od.add}
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  od: { ...prev.od, add: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="text"
                              pattern="[0-9]+/[0-9]+"
                              placeholder="6/6"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1"
                              value={data.od.va}
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  od: { ...prev.od, va: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="text"
                              pattern="[0-9]+/[0-9]+"
                              placeholder="6/6"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1"
                              value={data.od.bcva}
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  od: { ...prev.od, bcva: e.target.value },
                                }))
                              }
                            />
                          </td>
                        </tr>
                      )}
                      {(data.eyesCount === "both" ||
                        data.eyesCount === "os") && (
                        <tr>
                          <td className="p-2 font-bold text-blue-800 border-x border-cream-border relative">
                            <div className="flex flex-col gap-1 items-start">
                              <span>OS (L)</span>
                              {osMatchedLens && (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium flex items-center gap-1 shadow-sm">
                                  <Check size={10} /> {lang === "ar" ? "من المخزون" : "Stock"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="0.00"
                                disabled={isPlano(data.lensType)}
                                min="0"
                                max="20"
                                step="0.25"
                                className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md disabled:bg-gray-100 disabled:opacity-50"
                                value={data.os.sph}
                                onChange={(e) => {
                                  let v = e.target.value;
                                  if (parseFloat(v) > 20) v = "20";
                                  setData((prev) => ({
                                    ...prev,
                                    os: { ...prev.os, sph: v },
                                  }));
                                }}
                              />
                              <button
                                type="button"
                                disabled={isPlano(data.lensType)}
                                onClick={() =>
                                  setData((prev) => ({
                                    ...prev,
                                    os: {
                                      ...prev.os,
                                      sphSign:
                                        prev.os.sphSign === "+" ? "-" : "+",
                                    },
                                  }))
                                }
                                className={cn(
                                  "p-1 border rounded w-7 font-bold transition-colors disabled:opacity-50",
                                  data.os.sphSign === "+"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : "bg-rose-50 text-rose-600 border-rose-200",
                                )}
                              >
                                {data.os.sphSign}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="0.00"
                                disabled={isPlano(data.lensType)}
                                min="0"
                                max="20"
                                step="0.25"
                                className="w-16 text-center border px-2 py-1 border-cream-border outline-none focus:ring-1 focus:ring-[#1a4a8d] rounded-md disabled:bg-gray-100 disabled:opacity-50"
                                value={data.os.cyl}
                                onChange={(e) => {
                                  let v = e.target.value;
                                  if (parseFloat(v) > 20) v = "20";
                                  setData((prev) => ({
                                    ...prev,
                                    os: { ...prev.os, cyl: v },
                                  }));
                                }}
                              />
                              <button
                                type="button"
                                disabled={isPlano(data.lensType)}
                                onClick={() =>
                                  setData((prev) => ({
                                    ...prev,
                                    os: {
                                      ...prev.os,
                                      cylSign:
                                        prev.os.cylSign === "+" ? "-" : "+",
                                    },
                                  }))
                                }
                                className={cn(
                                  "p-1 border rounded w-7 font-bold transition-colors disabled:opacity-50",
                                  data.os.cylSign === "+"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : "bg-rose-50 text-rose-600 border-rose-200",
                                )}
                              >
                                {data.os.cylSign}
                              </button>
                            </div>
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="number"
                              placeholder="0"
                              disabled={isPlano(data.lensType)}
                              min="1"
                              max="180"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1 disabled:bg-gray-100 disabled:opacity-50"
                              value={data.os.axis}
                              onChange={(e) => {
                                let v = e.target.value;
                                if (parseInt(v, 10) > 180) v = "180";
                                setData((prev) => ({
                                  ...prev,
                                  os: { ...prev.os, axis: v },
                                }));
                              }}
                            />
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="number"
                              placeholder="0.00"
                              disabled={isPlano(data.lensType)}
                              min="0"
                              step="0.25"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1 disabled:bg-gray-100 disabled:opacity-50"
                              value={data.os.add}
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  os: { ...prev.os, add: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="text"
                              pattern="[0-9]+/[0-9]+"
                              placeholder="6/6"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1"
                              value={data.os.va}
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  os: { ...prev.os, va: e.target.value },
                                }))
                              }
                            />
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <input
                              type="text"
                              pattern="[0-9]+/[0-9]+"
                              placeholder="6/6"
                              className="w-16 text-center bg-transparent outline-none border focus:border-blue-600 rounded py-1 px-1"
                              value={data.os.bcva}
                              onChange={(e) =>
                                setData((prev) => ({
                                  ...prev,
                                  os: { ...prev.os, bcva: e.target.value },
                                }))
                              }
                            />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-ink-light block mb-2">
                      {lang === "ar" ? "عدد العيون" : "Eyes Count"}
                    </label>
                    <select
                      className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white"
                      value={data.eyesCount}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          eyesCount: e.target.value as "both" | "od" | "os",
                        }))
                      }
                    >
                      <option value="both">
                        {lang === "ar" ? "كلا العينين" : "Both Eyes"}
                      </option>
                      <option value="od">
                        {lang === "ar" ? "العين اليمنى OD" : "Right Eye OD"}
                      </option>
                      <option value="os">
                        {lang === "ar" ? "العين اليسرى OS" : "Left Eye OS"}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-light block mb-2">
                      {lang === "ar" ? "IPD" : "IPD"}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="62.0"
                      className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600"
                      value={data.ipd}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, ipd: e.target.value }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-light block mb-2">
                      {lang === "ar" ? "نوع العدسة" : "Lens Type"}
                    </label>
                    <select
                      className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white"
                      value={data.lensType}
                      onChange={(e) => {
                        const lt = e.target.value;
                        const matchAny = lenses.find(l => l.lens_type === lt);
                        const lp = matchAny ? matchAny.sell_price.toString() : data.lensPrice;
                        setData((prev) => ({
                          ...prev,
                          lensType: lt,
                          lensPrice: lp,
                          material: matchAny ? matchAny.material : currentMaterials[0]?.value,
                          coating: matchAny ? matchAny.coating : (isContact(lt) ? "Clear" : currentCoatings[0]?.value)
                        }));
                      }}
                    >
                      {currentLensTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={cn("text-xs font-bold block mb-2", isContact(data.lensType) ? "text-ink-light/50" : "text-ink-light")}>
                      {lang === "ar" ? "المادة" : "Material"}
                    </label>
                    <select
                      className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white disabled:bg-gray-100 disabled:opacity-50"
                      value={data.material}
                      disabled={isContact(data.lensType)}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          material: e.target.value,
                        }))
                      }
                    >
                      {currentMaterials.map((mat) => (
                        <option key={mat.value} value={mat.value}>
                          {mat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={cn("text-xs font-bold block mb-3 text-center", isContact(data.lensType) ? "text-ink-light/50" : "text-ink-light")}>
                    {lang === "ar" ? "الطلاء" : "Coating"}
                  </label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {currentCoatings.map((coating) => (
                      <button
                        key={coating.value}
                        type="button"
                        disabled={isContact(data.lensType)}
                        onClick={() => toggleCoating(coating.value)}
                        className={cn(
                          "px-4 py-1.5 rounded-full border text-xs transition-colors shadow-sm",
                          isContact(data.lensType) ? "opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400" :
                          data.coating === coating.value
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-ink border-cream-border hover:border-blue-400",
                        )}
                      >
                        {coating.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-light block mb-2">
                    {lang === "ar" ? "مطابقة المخزون" : "Stock Match"}
                  </label>
                  <div className="w-full border border-cream-border rounded-lg p-2 outline-none focus-within:border-blue-600 h-40 bg-[#f8fbff] overflow-hidden flex flex-col">
                    {renderLensStockMatch()}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "frame" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between border border-[#e0eaef] bg-[#f8fbff] rounded-xl p-4">
                  <label className="font-bold text-ink">
                    {lang === "ar" ? "تضمين إطار" : "Include Frame"}
                  </label>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={data.includeFrame}
                    onClick={() =>
                      setData((prev) => ({
                        ...prev,
                        includeFrame: !prev.includeFrame,
                      }))
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                      data.includeFrame ? "bg-blue-600" : "bg-gray-200",
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        data.includeFrame
                          ? lang === "ar"
                            ? "-translate-x-5"
                            : "translate-x-5"
                          : "translate-x-0",
                      )}
                    />
                  </button>
                </div>

                {data.includeFrame && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                    <div>
                      <label className="text-xs font-bold text-ink-light block mb-2">
                        {lang === "ar" ? "علامة الإطار" : "Frame Brand"}
                      </label>
                      <input
                        type="text"
                        className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600"
                        value={data.frameBrand}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            frameBrand: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-light block mb-2">
                        {lang === "ar" ? "نوع الإطار" : "Frame Type"}
                      </label>
                      <select
                        className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white"
                        value={data.frameType}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            frameType: e.target.value,
                          }))
                        }
                      >
                        {FRAME_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-light block mb-2">
                        {lang === "ar" ? "مادة الإطار" : "Frame Material"}
                      </label>
                      <select
                        className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white"
                        value={data.frameMaterial}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            frameMaterial: e.target.value,
                          }))
                        }
                      >
                        {FRAME_MATERIALS.map((mat) => (
                          <option key={mat} value={mat}>
                            {mat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-ink-light block mb-2">
                        {lang === "ar" ? "من المخزون" : "From Stock"}
                      </label>
                      <select
                        className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white"
                        value={data.frameStockItem}
                        onChange={(e) => {
                          const fs = e.target.value;
                          const fObj = frames.find(f => f.id === fs);
                          const fp = fObj ? fObj.sell_price.toString() : data.framePrice;
                          setData((prev) => ({
                            ...prev,
                            frameStockItem: fs,
                            ...(fObj && {
                              frameBrand: fObj.brand + " " + fObj.model
                            }),
                            framePrice: fp
                          }));
                        }}
                      >
                        <option value="">
                          {lang === "ar" ? "...اختر إطاراً" : "Select Frame..."}
                        </option>
                        {frames.map(f => (
                          <option key={f.id} value={f.id}>{f.brand} - {f.model}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "financial" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {data.includeFrame && (
                    <div>
                      <label className="text-xs font-bold text-ink-light block mb-2">
                        {lang === "ar"
                          ? "سعر الإطار (د.ع)"
                          : "Frame Price (IQD)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600"
                        value={data.framePrice}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            framePrice: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-ink-light block mb-2">
                      {lang === "ar" ? "سعر العدسة (د.ع)" : "Lens Price (IQD)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600"
                      value={data.lensPrice}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          lensPrice: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between border border-[#e0eaef] bg-[#f8fbff] rounded-xl p-4 gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <label className="font-bold text-ink whitespace-nowrap">
                      {lang === "ar" ? "تم إجراء الفحص" : "Checkup Done"}
                    </label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={data.checkupDone}
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          checkupDone: !prev.checkupDone,
                        }))
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2",
                        data.checkupDone ? "bg-blue-600" : "bg-gray-200",
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          data.checkupDone
                            ? lang === "ar"
                              ? "-translate-x-5"
                              : "translate-x-5"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                  {data.checkupDone && (
                    <div className="w-full sm:w-1/2">
                      <label className="text-xs font-bold text-ink-light block mb-2 sm:sr-only">
                        {lang === "ar"
                          ? "رسوم الفحص (د.ع)"
                          : "Checkup Fee (IQD)"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="5000"
                        className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600"
                        value={data.checkupFee}
                        onChange={(e) =>
                          setData((prev) => ({
                            ...prev,
                            checkupFee: e.target.value,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-light block mb-2">
                    {lang === "ar"
                      ? "المبلغ المدفوع (د.ع)"
                      : "Paid Amount (IQD)"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600"
                    value={data.paidAmount}
                    onChange={(e) =>
                      setData((prev) => ({
                        ...prev,
                        paidAmount: e.target.value,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-light block mb-2">
                    {lang === "ar" ? "ملاحظات الزيارة" : "Visit Notes"}
                  </label>
                  <textarea
                    className="w-full border border-cream-border rounded-lg px-3 py-2 outline-none focus:border-blue-600 resize-none h-20"
                    value={data.notes}
                    onChange={(e) =>
                      setData((prev) => ({ ...prev, notes: e.target.value }))
                    }
                  />
                </div>

                <div className="bg-[#f0f7fa] border border-[#d0e3ec] rounded-xl overflow-hidden mt-6 text-sm divide-y divide-[#d0e3ec]">
                  <div className="flex justify-between p-3">
                    <span className="text-[#55697a]">
                      {lang === "ar" ? "الإجمالي" : "Total"}
                    </span>
                    <span className="font-bold">
                      {total.toLocaleString()} IQD
                    </span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-[#55697a]">
                      {lang === "ar" ? "المدفوع" : "Paid"}
                    </span>
                    <span className="font-medium text-blue-600">
                      {paid.toLocaleString()} IQD
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-white">
                    <span className="font-bold text-ink">
                      {lang === "ar" ? "المتبقي" : "Remaining"}
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        remaining > 0 ? "text-rose-600" : "text-green-600",
                      )}
                    >
                      {Math.max(0, remaining).toLocaleString()} IQD
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-cream-border bg-white flex justify-start gap-3 shrink-0">
            <button
              type="submit"
              className="px-8 py-2.5 bg-[#1a4a8d] text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 hover:shadow-xl hover:bg-blue-800 transition-all text-sm"
            >
              {lang === "ar" ? "حفظ" : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-2.5 bg-white text-ink border border-cream-border rounded-lg font-bold hover:bg-cream transition-all text-sm"
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
