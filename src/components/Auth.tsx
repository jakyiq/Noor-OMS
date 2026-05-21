import React, { useState } from "react";
import { Mail, Lock, User, Phone, ArrowRight, ArrowLeft, Globe } from "lucide-react";
import { useClinic } from "../context/ClinicContext";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { EyeLensLogo } from "./EyeLensLogo";

export function Auth() {
  const { lang, setLang, setUser, t } = useClinic();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const emailLower = email.toLowerCase().trim();
    const isAdminUser = emailLower.includes("admin");

    setTimeout(() => {
      let loggedInUser = null;
      const storedReceptionists = localStorage.getItem("noor_receptionists");
      if (storedReceptionists) {
        try {
          const recList = JSON.parse(storedReceptionists);
          // Check username/email match (case-insensitive) and plain password match
          const found = recList.find(
            (r: any) =>
              r.username.toLowerCase().trim() === emailLower &&
              r.password === password
          );
          if (found) {
            loggedInUser = {
              id: found.id || Math.random().toString(),
              full_name: found.full_name,
              username: found.username,
              role: "receptionist" as const,
              clinic_id: "clinic_1",
              permissions: found.permissions || {
                viewFinancials: false,
                auditOrders: false,
                editPatients: false,
                editSettings: false
              }
            };
          }
        } catch (err) {
          console.error("Error matching receptionist login:", err);
        }
      }

      if (loggedInUser) {
        setUser(loggedInUser);
      } else {
        setUser({
          id: "1",
          full_name: isAdminUser ? "Super Admin" : "Dr. Ahmed Al-Rashid",
          username: email.split("@")[0] || "admin",
          role: isAdminUser ? "super_admin" : "doctor",
          clinic_id: "clinic_1",
        });
      }
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
             <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center border border-white/15 shadow-sm backdrop-blur-md">
               <EyeLensLogo size={28} className="text-white" />
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
              <span className="text-gold">Eye Care</span> management
            </motion.h2>
          </div>
        </div>

        <div className="relative z-10 flex flex-wrap items-center border-t border-white/10 pt-8 gap-x-12 gap-y-4">
          <div className="flex items-center bg-white/10 border border-white/15 p-[3px] rounded-full shadow-inner backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-1 ps-2.5 pe-2 text-gold font-semibold text-[10px] select-none border-e border-white/15">
              <Globe size={11} className="animate-pulse text-gold" />
              <span className="font-bold font-mono text-[9px] tracking-wider text-white/80">{lang.toUpperCase()}</span>
            </div>

            <div className="flex items-center relative gap-0.5 px-0.5">
              <button 
                type="button"
                onClick={() => setLang("ar")}
                className={cn(
                  "relative z-10 w-11 py-1 rounded-full text-[10px] font-bold text-center transition-all duration-300 outline-none cursor-pointer select-none",
                  lang === "ar" ? "text-burgundy animate-fade-in" : "text-white/70 hover:text-white"
                )}
              >
                عربي
                {lang === "ar" && (
                  <motion.div 
                    layoutId="authActiveLangPc"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
              </button>
              <button 
                type="button"
                onClick={() => setLang("en")}
                className={cn(
                  "relative z-10 w-11 py-1 rounded-full text-[10px] font-bold text-center transition-all duration-300 outline-none cursor-pointer select-none",
                  lang === "en" ? "text-burgundy animate-fade-in" : "text-white/70 hover:text-white"
                )}
              >
                EN
                {lang === "en" && (
                  <motion.div 
                    layoutId="authActiveLangPc"
                    className="absolute inset-0 bg-white rounded-full -z-10 shadow-sm"
                    transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-[10px] text-white/45 font-bold uppercase tracking-widest mb-1">
              {lang === "ar" ? "الوحدة الطبية" : "Clinical Suite"}
            </p>
            <p className="text-xs font-bold text-amber-100/90 tracking-wide">
              {lang === "ar" ? "الفحص والوصفات الطبية" : "Precision Diagnostics & Rx"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-white/45 font-bold uppercase tracking-widest mb-1">
              {lang === "ar" ? "العمليات والمالية" : "Ledger & Inventory"}
            </p>
            <p className="text-xs font-bold text-amber-100/90 tracking-wide">
              {lang === "ar" ? "إدارة المخزون والمبيعات" : "Lenses, Frames & Sales"}
            </p>
          </div>
          <div className="ms-auto flex items-end">
            <p className="text-[10px] text-white/30">© {new Date().getFullYear()} NOOR OPTICAL SAAS</p>
          </div>
        </div>
      </div>

      {/* Form Panel */}
      <div className="w-full lg:w-[480px] bg-white flex flex-col justify-center items-center py-20 px-6 sm:p-12 relative shadow-2xl min-h-screen lg:min-h-0">
        <div className="lg:hidden absolute top-4 end-4 sm:top-6 sm:end-6 flex items-center bg-cream/95 border border-cream-border p-[3px] rounded-full shadow-md z-50 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-1 ps-2.5 pe-2 text-burgundy font-semibold text-[10px] select-none border-e border-cream-border/60">
            <Globe size={11} className="animate-pulse" />
            <span className="font-bold font-mono text-[9px] tracking-wider">{lang.toUpperCase()}</span>
          </div>

          <div className="flex items-center relative gap-0.5 px-0.5">
            <button 
              onClick={() => setLang("ar")}
              className={cn(
                "relative z-10 w-11 py-1 rounded-full text-[10px] font-bold text-center transition-all duration-300 outline-none cursor-pointer select-none",
                lang === "ar" ? "text-white animate-fade-in" : "text-ink-mid hover:text-burgundy"
              )}
            >
              عربي
              {lang === "ar" && (
                <motion.div 
                  layoutId="authActiveLang"
                  className="absolute inset-0 bg-burgundy rounded-full -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                />
              )}
            </button>
            <button 
              onClick={() => setLang("en")}
              className={cn(
                "relative z-10 w-11 py-1 rounded-full text-[10px] font-bold text-center transition-all duration-300 outline-none cursor-pointer select-none",
                lang === "en" ? "text-white animate-fade-in" : "text-ink-mid hover:text-burgundy"
              )}
            >
              EN
              {lang === "en" && (
                <motion.div 
                  layoutId="authActiveLang"
                  className="absolute inset-0 bg-burgundy rounded-full -z-10 shadow-sm"
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
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
            <div className="lg:hidden w-16 h-16 bg-cream border-2 border-burgundy/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md shadow-burgundy/5">
               <EyeLensLogo size={36} className="text-burgundy" />
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

          {isLogin && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-cream-border flex-1" />
                <span className="text-[10px] font-bold text-ink-light uppercase tracking-wider">
                  {lang === "ar" ? "أو" : "Or"}
                </span>
                <div className="h-px bg-cream-border flex-1" />
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setUser({
                      id: "u_google",
                      full_name: "Dr. Ahmed Al-Rashid",
                      username: "admin_google",
                      role: "doctor",
                      clinic_id: "clinic_1",
                    });
                    setIsLoading(false);
                  }, 1200);
                }}
                className="w-full py-3.5 px-4 border-2 border-cream-border hover:border-burgundy/30 bg-white hover:bg-cream-light text-ink font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-3 shadow-sm active:scale-95"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>{lang === "ar" ? "تسجيل الدخول بواسطة Google" : "Sign in with Google"}</span>
              </button>
            </>
          )}

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
