import React, { useState } from "react";
import { Disc, Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export function Auth() {
  const { lang, setLang, setUser, t } = useClinic();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setUser({
        id: "1",
        full_name: "Dr. Ahmed Al-Rashid",
        username: "admin",
        role: "doctor",
        clinic_id: "clinic_1",
      });
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex items-stretch bg-cream overflow-hidden">
      {/* Brand Panel (Desktop) */}
      <div className="hidden lg:flex flex-1 bg-burgundy relative flex-col justify-between p-12 overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 end-0 w-[500px] h-[500px] bg-white/5 rounded-full -me-64 -mt-64 blur-3xl opacity-50" />
        <div className="absolute bottom-0 start-0 w-[300px] h-[300px] bg-gold/10 rounded-full -ms-32 -mb-32 blur-2xl" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
               <Disc className="text-white w-7 h-7" />
             </div>
             <div>
               <h1 className="text-2xl font-serif font-bold text-white leading-tight">Noor OMS</h1>
               <p className="text-[10px] items-center text-white/50 tracking-widest font-bold uppercase">Optical Management System</p>
             </div>
          </div>
          <div className="pt-24 space-y-6">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-serif font-bold text-white leading-tight"
            >
              Building the future of <br />
              <span className="text-gold">Eye Care</span> management.
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white/60 text-lg max-w-md leading-relaxed"
            >
              Streamline your patient records, inventory, and clinic operations with our sophisticated SaaS solution.
            </motion.p>
          </div>
        </div>

        <div className="relative z-10 flex border-t border-white/10 pt-8 gap-12">
          <div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Patients Served</p>
            <p className="text-2xl font-bold text-white">42k+</p>
          </div>
          <div>
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-2">Clinics Managed</p>
            <p className="text-2xl font-bold text-white">120+</p>
          </div>
          <div className="ms-auto flex items-end">
            <p className="text-[10px] text-white/30">© 2024 NOOR OPTICAL SAAS</p>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-[480px] bg-white flex items-center justify-center p-6 sm:p-12 relative shadow-2xl">
        <div className="absolute top-6 end-6 flex items-center bg-cream-dark/40 border border-cream-border p-[3px] rounded-full shadow-sm z-50 backdrop-blur-sm">
          <div className="flex items-center gap-1 px-2.5 text-ink-light font-medium text-[10px] select-none border-e border-cream-border/60">
            <Globe size={12} className="text-burgundy animate-pulse" />
            <span className="font-bold font-mono">{lang.toUpperCase()}</span>
          </div>

          <div className="flex gap-0.5 relative px-1">
            <button 
              onClick={() => setLang("ar")}
              className={cn(
                "relative z-10 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 outline-none",
                lang === "ar" ? "text-white" : "text-ink-mid hover:text-burgundy"
              )}
            >
              Ar
              {lang === "ar" && (
                <motion.div 
                  layoutId="authActiveLang"
                  className="absolute inset-0 bg-burgundy rounded-full -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>
            <button 
              onClick={() => setLang("en")}
              className={cn(
                "relative z-10 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all duration-300 outline-none",
                lang === "en" ? "text-white" : "text-ink-mid hover:text-burgundy"
              )}
            >
              En
              {lang === "en" && (
                <motion.div 
                  layoutId="authActiveLang"
                  className="absolute inset-0 bg-burgundy rounded-full -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="text-center space-y-2">
            <div className="lg:hidden w-16 h-16 bg-burgundy rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-burgundy/20">
               <Disc className="text-white w-10 h-10" />
            </div>
            <h3 className="text-3xl font-serif font-bold text-ink">
              {isLogin ? t("welcome_back") : t("welcome_title")}
            </h3>
            <p className="text-sm text-ink-light font-medium">
              {isLogin ? t("signin_sub") : t("signup_sub")}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ms-1">{t("full_name_label")}</label>
                <div className="relative group">
                  <User size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" />
                  <input 
                    type="text" 
                    className="w-full ps-10 pe-4 py-3 bg-cream border-2 border-cream-border rounded-xl focus:bg-white focus:border-burgundy outline-none transition-all"
                    placeholder={lang === 'ar' ? 'د. أحمد علي' : 'Dr. Ahmed Ali'}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ms-1">{t("email_user_label")}</label>
              <div className="relative group">
                <Mail size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" />
                <input 
                  type="text" 
                  className="w-full ps-10 pe-4 py-3 bg-cream border-2 border-cream-border rounded-xl focus:bg-white focus:border-burgundy outline-none transition-all text-sm"
                  placeholder="clinic@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-light uppercase tracking-widest ms-1">{t("password_label")}</label>
              <div className="relative group">
                <Lock size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-light group-focus-within:text-burgundy transition-colors" />
                <input 
                  type="password" 
                  className="w-full ps-10 pe-4 py-3 bg-cream border-2 border-cream-border rounded-xl focus:bg-white focus:border-burgundy outline-none transition-all text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="text-end">
                <button type="button" className="text-xs font-bold text-burgundy/60 hover:text-burgundy transition-colors">
                  {lang === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                </button>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-burgundy text-white font-bold rounded-xl shadow-lg shadow-burgundy/20 hover:bg-burgundy-soft hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all text-sm flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isLogin ? t("login_btn") : t("signup_btn")}</span>
                  {lang === 'ar' ? <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> : <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                </>
              )}
            </button>
          </form>

          <div className="pt-8 text-center text-sm font-medium">
            <span className="text-ink-light">
              {isLogin ? t("no_account") : t("has_account")}{" "}
            </span>
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-burgundy font-bold hover:underline"
            >
              {isLogin ? t("register_now") : t("signin_here")}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
