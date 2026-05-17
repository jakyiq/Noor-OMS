import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { X, Plus, Minus, Search } from "lucide-react";
import { cn } from "../lib/utils";

interface NewVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (visitData: any) => void;
  lang: string;
  visitToEdit?: any | null;
}

const LENS_TYPES = [
  "Single Vision",
  "Bifocal",
  "Trifocal",
  "Progressive",
  "Reading",
  "Plano",
  "Prism",
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

const MOCK_INVENTORY = {
  frames: [
    { id: "fr1", name: "Ray-Ban RX5154", price: 65000 },
    { id: "fr2", name: "Oakley Crosslink", price: 85000 },
    { id: "fr3", name: "Titanium Rimless Frame", price: 45000 },
    { id: "fr4", name: "Classic Aviator Frame", price: 25000 },
  ],
  lenses: {
    "Single Vision": 15000,
    "Bifocal": 25000,
    "Trifocal": 35000,
    "Progressive": 60000,
    "Reading": 10000,
    "Plano": 10000,
    "Prism": 45000,
  } as Record<string, number>
};

const MATERIALS = [
  "Plastic (CR-39)",
  "Glass",
  "High-Index",
  "Trivex",
  "Contact Lenses",
];

export const NewVisitModal: React.FC<NewVisitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  lang,
  visitToEdit,
}) => {
  const [activeTab, setActiveTab] = useState<"rx" | "frame" | "financial">("rx");

  const defaultData = {
    eyesCount: "both" as "both" | "od" | "os",
    od: { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" },
    os: { sph: "", sphSign: "+", cyl: "", cylSign: "+", axis: "", add: "", va: "6/6", bcva: "6/6" },
    lensType: LENS_TYPES[0],
    ipd: "",
    material: MATERIALS[0],
    coatings: [] as string[],
    stockMatch: "",

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
      if (visitToEdit && visitToEdit.rawFormData) {
        setData(visitToEdit.rawFormData);
      } else {
        setData(defaultData);
      }
      setActiveTab("rx");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, visitToEdit]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(data);
  };

  const toggleCoating = (coating: string) => {
    setData((prev) => ({
      ...prev,
      coatings: prev.coatings.includes(coating)
        ? prev.coatings.filter((c) => c !== coating)
        : [...prev.coatings, coating],
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
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
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
                <div className="border border-cream-border rounded-xl overflow-hidden mb-6">
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
                          <td className="p-2 font-bold text-blue-800 border-x border-cream-border">
                            OD (R)
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="0.00"
                                disabled={data.lensType === "Plano"}
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
                                disabled={data.lensType === "Plano"}
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
                                disabled={data.lensType === "Plano"}
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
                                disabled={data.lensType === "Plano"}
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
                              disabled={data.lensType === "Plano"}
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
                              disabled={data.lensType === "Plano"}
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
                          <td className="p-2 font-bold text-blue-800 border-x border-cream-border">
                            OS (L)
                          </td>
                          <td className="p-2 border-x border-cream-border">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                placeholder="0.00"
                                disabled={data.lensType === "Plano"}
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
                                disabled={data.lensType === "Plano"}
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
                                disabled={data.lensType === "Plano"}
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
                                disabled={data.lensType === "Plano"}
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
                              disabled={data.lensType === "Plano"}
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
                              disabled={data.lensType === "Plano"}
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
                        const lp = MOCK_INVENTORY.lenses[lt] ? MOCK_INVENTORY.lenses[lt].toString() : data.lensPrice;
                        setData((prev) => ({
                          ...prev,
                          lensType: lt,
                          lensPrice: lp
                        }));
                      }}
                    >
                      {LENS_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-ink-light block mb-2">
                      {lang === "ar" ? "المادة" : "Material"}
                    </label>
                    <select
                      className="w-full border border-cream-border rounded-lg px-3 py-2.5 outline-none focus:border-blue-600 bg-white"
                      value={data.material}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          material: e.target.value,
                        }))
                      }
                    >
                      {MATERIALS.map((mat) => (
                        <option key={mat} value={mat}>
                          {mat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-light block mb-3 text-center">
                    {lang === "ar" ? "الطلاء" : "Coating"}
                  </label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {COATINGS.map((coating) => (
                      <button
                        key={coating}
                        type="button"
                        onClick={() => toggleCoating(coating)}
                        className={cn(
                          "px-4 py-1.5 rounded-full border text-xs transition-colors shadow-sm",
                          data.coatings.includes(coating)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-ink border-cream-border hover:border-blue-400",
                        )}
                      >
                        {coating}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-ink-light block mb-2">
                    {lang === "ar" ? "مطابقة المخزون" : "Stock Match"}
                  </label>
                  <textarea
                    placeholder={
                      lang === "ar"
                        ? "أدخل قيم الوصفة أولاً لتشغيل مطابقة المخزون..."
                        : "Enter prescription values to trigger stock matching..."
                    }
                    className="w-full border border-cream-border rounded-lg p-3 outline-none focus:border-blue-600 resize-none h-24 bg-[#f8fbff]"
                    readOnly
                    value={data.stockMatch}
                  ></textarea>
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
                          const fObj = MOCK_INVENTORY.frames.find(f => f.id === fs);
                          const fp = fObj ? fObj.price.toString() : data.framePrice;
                          setData((prev) => ({
                            ...prev,
                            frameStockItem: fs,
                            ...(fObj && {
                              frameBrand: fObj.name
                            }),
                            framePrice: fp
                          }));
                        }}
                      >
                        <option value="">
                          {lang === "ar" ? "...اختر إطاراً" : "Select Frame..."}
                        </option>
                        {MOCK_INVENTORY.frames.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
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
