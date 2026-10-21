"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { unlockBranchKitchen } from "@/lib/admin-actions";

interface KitchenBranchLockScreenProps {
  targetShop: {
    id: number;
    name: string;
    slug: string;
  };
  currentSession?: {
    shopId: number | null;
    shopName: string;
    role: string;
  } | null;
  isCrossBranchMismatch?: boolean;
}

export default function KitchenBranchLockScreen({
  targetShop,
  currentSession,
  isCrossBranchMismatch,
}: KitchenBranchLockScreenProps) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleKeyPress = (num: string) => {
    setPasscode((prev) => prev + num);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPasscode("");
    setErrorMessage(null);
  };

  const handleBackspace = () => {
    setPasscode((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleUnlock = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode.trim()) {
      setErrorMessage("Please enter the branch password or kitchen PIN.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await unlockBranchKitchen(targetShop.id, passcode);
      if (res.success) {
        router.refresh();
      } else {
        setErrorMessage(res.error || "Incorrect password or PIN for this branch.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to unlock kitchen display.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[5px] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-600" />

        {/* Branch Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-[5px] bg-amber-500/10 border border-amber-500/20 text-2xl mb-3">
            👨‍🍳
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight uppercase">
            {targetShop.name}
          </h1>
          <div className="inline-block mt-1 px-2.5 py-0.5 rounded-[5px] bg-slate-800 text-amber-400 text-xs font-mono tracking-wider uppercase border border-slate-700">
            KITCHEN DISPLAY SCREEN (KDS)
          </div>
        </div>

        {/* Cross Branch Mismatch Warning */}
        {isCrossBranchMismatch && currentSession && (
          <div className="mb-5 p-3.5 rounded-[5px] bg-red-950/60 border border-red-800/80 text-red-200 text-xs space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-red-400 uppercase tracking-wide">
              <span>⛔</span> Cross-Branch Kitchen Access Blocked
            </div>
            <p>
              You are currently signed into <strong className="text-white">{currentSession.shopName}</strong>.
              For safety and privacy, you cannot view <strong className="text-white">{targetShop.name}&apos;s</strong> kitchen queue without its branch passcode.
            </p>
          </div>
        )}

        {/* Lock Notice */}
        <div className="text-center mb-6">
          <p className="text-xs text-slate-400">
            Enter branch password or staff PIN to unlock this kitchen tablet.
          </p>
        </div>

        {/* Password / PIN Form */}
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setErrorMessage(null);
              }}
              placeholder="Enter Branch Password / PIN"
              className="w-full bg-slate-950 border border-slate-700 rounded-[5px] px-4 py-3 text-center text-lg tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono transition-colors"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Quick Tablet Touch Keypad */}
          <div className="grid grid-cols-3 gap-2 my-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(String(num))}
                className="py-3 bg-slate-800/70 hover:bg-slate-700 active:bg-slate-600 rounded-[5px] text-lg font-bold text-white transition-colors border border-slate-700/50"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="py-3 bg-red-950/40 hover:bg-red-900/50 text-red-400 rounded-[5px] text-xs font-bold uppercase tracking-wider transition-colors border border-red-900/40"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeyPress("0")}
              className="py-3 bg-slate-800/70 hover:bg-slate-700 active:bg-slate-600 rounded-[5px] text-lg font-bold text-white transition-colors border border-slate-700/50"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="py-3 bg-slate-800/70 hover:bg-slate-700 active:bg-slate-600 text-slate-300 rounded-[5px] text-sm font-bold transition-colors border border-slate-700/50"
            >
              ⌫
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[5px] text-red-400 text-xs text-center font-medium">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 text-slate-950 font-bold uppercase tracking-wider text-sm rounded-[5px] transition-colors shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Verifying...</span>
            ) : (
              <>
                <span>🔓</span>
                <span>Unlock Kitchen Display</span>
              </>
            )}
          </button>
        </form>

        {/* Security badge at bottom */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
            <span>🛡️</span>
            <span>Branch-Isolated KDS Screen • Protected by Anti-Snoop Security</span>
          </p>
        </div>
      </div>
    </div>
  );
}
