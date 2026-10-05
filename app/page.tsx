"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const phoneNumber = "0302-5260958";
  const intlPhone = "+92 302 5260958";
  const rawPhone = "03025260958";
  const whatsappUrl = `https://wa.me/923025260958?text=${encodeURIComponent(
    "Salam Syed Zeeshan Haider, I am interested in purchasing the Pizza POS & Online Ordering System."
  )}`;
  const callUrl = `tel:+923025260958`;

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Strictly disable window scrolling on main page
    const origHtml = document.documentElement.style.overflow;
    const origBody = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = origHtml;
      document.body.style.overflow = origBody;
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawPhone);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = rawPhone;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <main
      className="relative w-screen h-[100dvh] max-h-[100dvh] overflow-hidden select-none flex flex-col justify-center items-center"
      style={{
        background: "#080706",
        color: "#ffffff",
        fontFamily: "var(--font-outfit, var(--font-inter, system-ui, sans-serif))",
      }}
    >
      {/* ─── Ambient Glow Lights ─── */}
      <div
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[380px] blur-[140px] opacity-30"
        style={{
          background: "radial-gradient(circle, #ea580c 0%, #dc2626 55%, transparent 80%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-1/4 w-[480px] h-[300px] blur-[120px] opacity-20"
        style={{
          background: "radial-gradient(circle, #f97316 0%, transparent 75%)",
        }}
      />

      {/* Cyber Grid Texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP WORKSTATION VIEW (md:flex) — Square 5px UI
          ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden md:flex flex-col w-full max-w-5xl mx-auto px-6 lg:px-8 relative z-10">
        
        {/* Top Executive Header Bar (Square 5px) */}
        <header
          className="w-full flex items-center justify-between px-5 py-3.5 mb-6 backdrop-blur-xl"
          style={{
            background: "rgba(18, 14, 11, 0.85)",
            border: "1px solid rgba(234, 88, 12, 0.3)",
            borderRadius: "5px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center text-xl flex-shrink-0"
              style={{
                background: "#ea580c",
                borderRadius: "5px",
                boxShadow: "0 2px 10px rgba(234, 88, 12, 0.5)",
              }}
            >
              🍕
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-tight uppercase block leading-tight">
                PIZZA POS &amp; CLOUD SUITE
              </span>
              <span className="text-[11px] font-extrabold text-orange-400 uppercase tracking-wider block">
                Engineered by Syed Zeeshan Haider
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1"
              style={{
                background: "rgba(234, 88, 12, 0.12)",
                border: "1px solid rgba(234, 88, 12, 0.35)",
                borderRadius: "5px",
              }}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-extrabold text-orange-200 uppercase tracking-wider">
                System Active &bull; 24/7 Support
              </span>
            </div>
          </div>
        </header>

        {/* 2-Column Master Console (Square 5px) */}
        <div className="grid grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Direct Developer Contact Card */}
          <div
            className="col-span-7 p-7 flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden"
            style={{
              background: "rgba(18, 14, 11, 0.88)",
              border: "1px solid rgba(234, 88, 12, 0.32)",
              borderRadius: "5px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Top Tag & Title */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span
                  className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-400"
                  style={{
                    background: "rgba(234, 88, 12, 0.15)",
                    border: "1px solid rgba(234, 88, 12, 0.3)",
                    borderRadius: "5px",
                  }}
                >
                  ■ DIRECT INQUIRY &bull; SYSTEM PURCHASE
                </span>
                <span className="text-[11px] font-mono text-zinc-400 font-bold">
                  {intlPhone}
                </span>
              </div>

              <h2 className="text-xl font-black text-white tracking-tight mb-1">
                Official Developer Contact
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Get full platform setup for your brand: custom pizza ordering storefront, automated WhatsApp notifications, chef KDS, rider dispatch, and multi-branch management.
              </p>
            </div>

            {/* Prominent Contact Number Display Box (Square 5px) */}
            <div
              className="p-5 mb-5 flex flex-col justify-center"
              style={{
                background: "rgba(26, 19, 15, 0.95)",
                border: "1.5px solid rgba(234, 88, 12, 0.4)",
                borderRadius: "5px",
                boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.6)",
              }}
            >
              <span className="text-[10px] font-extrabold text-orange-400/90 uppercase tracking-widest block mb-1">
                CALL &bull; WHATSAPP &bull; SMS
              </span>

              <a
                href={callUrl}
                className="text-4xl lg:text-[44px] font-black tracking-tight text-white hover:text-orange-400 transition-colors no-underline block leading-none py-1"
                title="Click to Call"
              >
                {phoneNumber}
              </a>
            </div>

            {/* Action Buttons Row (Square 5px) */}
            <div className="grid grid-cols-3 gap-3">
              {/* Call Button */}
              <a
                href={callUrl}
                className="flex items-center justify-center gap-2 py-3 px-3 text-xs font-black text-white uppercase tracking-wider transition-all no-underline active:scale-[0.98]"
                style={{
                  background: "#18181b",
                  border: "1.5px solid #3f3f46",
                  borderRadius: "5px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#ea580c";
                  e.currentTarget.style.background = "#27272a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#3f3f46";
                  e.currentTarget.style.background = "#18181b";
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Direct Call</span>
              </a>

              {/* WhatsApp Button */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 px-3 text-xs font-black text-white uppercase tracking-wider transition-all no-underline active:scale-[0.98]"
                style={{
                  background: "#15803d",
                  border: "1.5px solid #16a34a",
                  borderRadius: "5px",
                  boxShadow: "0 2px 8px rgba(22, 163, 74, 0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#16a34a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#15803d";
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>WhatsApp</span>
              </a>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-2 py-3 px-3 text-xs font-black text-white uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98]"
                style={{
                  background: copied ? "rgba(234, 88, 12, 0.3)" : "#18181b",
                  border: copied ? "1.5px solid #ea580c" : "1.5px solid #3f3f46",
                  borderRadius: "5px",
                }}
              >
                {copied ? (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-orange-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Admin Management Gateway Card (Square 5px) */}
          <div
            className="col-span-5 p-7 flex flex-col justify-between backdrop-blur-2xl relative overflow-hidden"
            style={{
              background: "rgba(18, 14, 11, 0.88)",
              border: "1px solid rgba(234, 88, 12, 0.32)",
              borderRadius: "5px",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-orange-400 mb-4"
                style={{
                  background: "rgba(234, 88, 12, 0.15)",
                  border: "1px solid rgba(234, 88, 12, 0.3)",
                  borderRadius: "5px",
                }}
              >
                <span>🔒 AUTHORIZED ACCESS ONLY</span>
              </div>

              {/* Shield Icon Box */}
              <div
                className="w-12 h-12 flex items-center justify-center text-white mb-3"
                style={{
                  background: "#18181b",
                  border: "1.5px solid #ea580c",
                  borderRadius: "5px",
                  boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h2 className="text-xl font-black text-white tracking-tight mb-1">
                Admin Management Portal
              </h2>

              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Branch admin access for live orders board, kitchen display (KDS), menu pricing manager, and daily cash closing.
              </p>
            </div>

            {/* Admin Portal CTA Button (Square 5px) */}
            <div className="pt-2">
              <Link
                href="/admin/login"
                className="group w-full py-4 px-5 flex items-center justify-between no-underline transition-all duration-200 active:scale-[0.98]"
                style={{
                  background: "#ea580c",
                  border: "1.5px solid #f97316",
                  borderRadius: "5px",
                  boxShadow: "0 6px 20px rgba(234, 88, 12, 0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#c2410c";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ea580c";
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center text-white"
                    style={{
                      background: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "5px",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-black text-white tracking-wide uppercase">
                      Admin Portal Login
                    </span>
                    <span className="block text-[10px] text-orange-100 font-bold">
                      Store Manager &bull; Branch Terminal
                    </span>
                  </div>
                </div>

                <div
                  className="w-8 h-8 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform duration-200"
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    borderRadius: "5px",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Link>

              {/* Status Note */}
              <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-bold">
                <span>🔐 256-Bit Encrypted</span>
                <span>&bull;</span>
                <span>Multi-Branch Isolated Session</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom System Bar (Square 5px) */}
        <footer
          className="mt-6 flex items-center justify-between px-5 py-2.5 text-xs text-zinc-400"
          style={{
            background: "rgba(18, 14, 11, 0.6)",
            border: "1px solid rgba(234, 88, 12, 0.2)",
            borderRadius: "5px",
          }}
        >
          <span className="font-extrabold text-zinc-300">
            © {new Date().getFullYear()} Pizza POS Suite &bull; Commercial Handover Ready
          </span>
          <span className="font-mono text-[11px] text-orange-400 font-bold">
            Direct Line: {phoneNumber}
          </span>
        </footer>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE VIEW (md:hidden) — Square 5px UI, 100dvh Zero-Scroll
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex md:hidden w-full h-[100dvh] max-h-[100dvh] overflow-hidden flex-col justify-between p-4 relative z-10">
        
        {/* Mobile Header Bar (Square 5px) */}
        <div
          className="flex items-center justify-between p-3"
          style={{
            background: "rgba(18, 14, 11, 0.9)",
            border: "1px solid rgba(234, 88, 12, 0.3)",
            borderRadius: "5px",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 flex items-center justify-center text-lg flex-shrink-0"
              style={{
                background: "#ea580c",
                borderRadius: "5px",
                boxShadow: "0 2px 8px rgba(234, 88, 12, 0.4)",
              }}
            >
              🍕
            </div>
            <div>
              <span className="block text-xs font-black text-white tracking-tight uppercase leading-tight">
                PIZZA POS SUITE
              </span>
              <span className="block text-[10px] font-extrabold text-orange-400 uppercase tracking-wider">
                Syed Zeeshan Haider
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{
              background: "rgba(234, 88, 12, 0.15)",
              border: "1px solid rgba(234, 88, 12, 0.3)",
              borderRadius: "5px",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase text-orange-300">
              Online
            </span>
          </div>
        </div>

        {/* Mobile Center: Contact Showcase Box (Square 5px) */}
        <div
          className="w-full p-5 flex flex-col items-center text-center relative overflow-hidden backdrop-blur-xl"
          style={{
            background: "rgba(18, 14, 11, 0.95)",
            border: "1.5px solid rgba(234, 88, 12, 0.35)",
            borderRadius: "5px",
            boxShadow: "0 15px 40px rgba(0, 0, 0, 0.8)",
          }}
        >
          <span
            className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-400 mb-2"
            style={{
              background: "rgba(234, 88, 12, 0.15)",
              border: "1px solid rgba(234, 88, 12, 0.3)",
              borderRadius: "5px",
            }}
          >
            DIRECT PHONE &bull; WHATSAPP
          </span>

          <a
            href={callUrl}
            className="text-3xl font-black tracking-tight text-white active:text-orange-400 transition-colors my-1 no-underline block"
          >
            {phoneNumber}
          </a>

          <span className="text-xs font-mono text-zinc-400 tracking-wider mb-5">
            {intlPhone}
          </span>

          {/* 3 Mobile Fast Actions (Square 5px) */}
          <div className="grid grid-cols-3 gap-2 w-full">
            {/* Call */}
            <a
              href={callUrl}
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-black text-white uppercase tracking-wider active:scale-95 transition-all no-underline"
              style={{
                background: "#18181b",
                border: "1px solid #3f3f46",
                borderRadius: "5px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Call</span>
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-black text-white uppercase tracking-wider active:scale-95 transition-all no-underline"
              style={{
                background: "#15803d",
                border: "1px solid #16a34a",
                borderRadius: "5px",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Chat</span>
            </a>

            {/* Copy */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 py-3 text-xs font-black text-white uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
              style={{
                background: copied ? "rgba(234, 88, 12, 0.3)" : "#18181b",
                border: copied ? "1px solid #ea580c" : "1px solid #3f3f46",
                borderRadius: "5px",
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="text-orange-400">Copied</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Bottom: Admin Login CTA (Square 5px) */}
        <div className="pb-2 flex flex-col gap-2">
          <Link
            href="/admin/login"
            className="w-full py-3.5 px-4 flex items-center justify-between no-underline active:scale-[0.98] transition-all"
            style={{
              background: "#ea580c",
              border: "1px solid #f97316",
              borderRadius: "5px",
              boxShadow: "0 6px 18px rgba(234, 88, 12, 0.4)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 flex items-center justify-center text-white"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  borderRadius: "5px",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="text-left">
                <span className="block text-xs font-black text-white uppercase tracking-wider">
                  Admin Portal Login
                </span>
                <span className="block text-[10px] text-orange-100 font-bold">
                  Store Manager &bull; Branch Terminal
                </span>
              </div>
            </div>

            <div
              className="w-7 h-7 flex items-center justify-center text-white"
              style={{
                background: "rgba(0, 0, 0, 0.25)",
                borderRadius: "5px",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          </Link>

          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-bold">
            <span>🔒 Protected System</span>
            <span>&bull;</span>
            <span>Enterprise Edition</span>
          </div>
        </div>

      </div>
    </main>
  );
}
