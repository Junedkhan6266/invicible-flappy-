import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface MilestoneModalProps {
  score: number;
  title: string;
  onClose: () => void;
}

export const MilestoneModal: React.FC<MilestoneModalProps> = ({ score, title, onClose }) => {
  useEffect(() => {
    // Fire festive fireworks confetti
    const duration = 2.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.4), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.6, 0.9), y: Math.random() - 0.2 } });
    }, 250);

    return () => clearInterval(interval);
  }, [score]);

  return (
    <div id="milestone-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        id="milestone-modal-card"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border-4 border-amber-300 animate-in fade-in zoom-in duration-300"
      >
        {/* Glowing badge */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-900 flex items-center justify-center shadow-lg mb-4 ring-8 ring-amber-100">
          <Award className="w-10 h-10" />
        </div>

        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Unbroken 100% Win Streak
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1">
          {title}
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          You passed <span className="font-bold text-amber-600 text-base">{score}</span> obstacles without breaking a sweat!
        </p>

        {/* Highlight Perks */}
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Pipes continue to part before your presence</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Trampoline ground active & ready</span>
          </div>
        </div>

        <button
          id="milestone-modal-continue-btn"
          onClick={onClose}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>Keep Winning</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
