import React from 'react';
import { Play, Pause, Volume2, VolumeX, Shield, Wand2, RefreshCw, Feather } from 'lucide-react';
import { BirdSkin, TrailType, InvincibleMode } from '../types';

interface ControlsBarProps {
  skin: BirdSkin;
  onSelectSkin: (skin: BirdSkin) => void;
  trail: TrailType;
  onSelectTrail: (trail: TrailType) => void;
  mode: InvincibleMode;
  onSelectMode: (mode: InvincibleMode) => void;
  autoPilot: boolean;
  onToggleAutoPilot: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  onResetGame: () => void;
  onFlap: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  skin,
  onSelectSkin,
  trail,
  onSelectTrail,
  mode,
  onSelectMode,
  autoPilot,
  onToggleAutoPilot,
  isMuted,
  onToggleMute,
  isPaused,
  onTogglePause,
  onResetGame,
  onFlap,
}) => {
  return (
    <div id="controls-container" className="w-full space-y-4">
      {/* Primary Action Row: Large Touch/Click Flap Button + Quick Pause & Mute */}
      <div className="flex items-center gap-3">
        <button
          id="btn-flap-primary"
          onClick={(e) => {
            e.currentTarget.blur();
            onFlap();
          }}
          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-lg sm:text-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 select-none"
        >
          <Feather className="w-6 h-6 animate-bounce" />
          <span>FLAP WINGS</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white/20 text-white/90 hidden sm:inline-block">SPACEBAR</span>
        </button>

        {/* Pause / Resume */}
        <button
          id="btn-toggle-pause"
          onClick={onTogglePause}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
        >
          {isPaused ? <Play className="w-6 h-6 fill-slate-700" /> : <Pause className="w-6 h-6" />}
        </button>

        {/* Sound Toggle */}
        <button
          id="btn-toggle-mute"
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          className={`p-4 rounded-2xl border transition-all shadow-xs ${
            isMuted
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
        </button>

        {/* Reset / New Flight */}
        <button
          id="btn-reset-flight"
          onClick={onResetGame}
          title="Restart Flight"
          className="p-4 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
        >
          <RefreshCw className="w-6 h-6" />
        </button>
      </div>

      {/* Invincible Style & Customizer Options */}
      <div className="bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-4">
        {/* Invincibility Mechanics */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Invincibility Style
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              Zero Chance of Defeat
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'godmode', label: 'God Mode', desc: 'All Powers Active' },
              { id: 'shatter', label: 'Shatter & Smash', desc: 'Pipes Demolish' },
              { id: 'parting', label: 'Moses Parting', desc: 'Pipes Open Away' },
              { id: 'trampoline', label: 'Rubber Bounce', desc: 'Springs Safely' },
            ].map((opt) => (
              <button
                key={opt.id}
                id={`btn-mode-${opt.id}`}
                onClick={() => onSelectMode(opt.id as InvincibleMode)}
                className={`py-2 px-3 rounded-xl border text-left transition-all ${
                  mode === opt.id
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                }`}
              >
                <div className="text-xs font-bold">{opt.label}</div>
                <div className="text-[11px] text-slate-500 line-clamp-1">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Autopilot Switch & Vanity Customizer */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Autopilot toggle */}
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-xs font-bold text-slate-800">Zen Wingman (Autopilot)</span>
                <p className="text-[11px] text-slate-500">Auto-flaps when you are AFK</p>
              </div>
            </div>
            <button
              id="btn-toggle-autopilot"
              onClick={onToggleAutoPilot}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                autoPilot ? 'bg-purple-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                  autoPilot ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Bird Skin Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Bird Skin:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'golden', label: '👑 Gold' },
                { id: 'classic', label: '🐥 Yellow' },
                { id: 'phoenix', label: '⚡ Cyan' },
                { id: 'party', label: '🕶️ Party' },
              ].map((s) => (
                <button
                  key={s.id}
                  id={`btn-skin-${s.id}`}
                  onClick={() => onSelectSkin(s.id as BirdSkin)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    skin === s.id
                      ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trail Particles */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">Trail:</span>
            <div className="flex gap-1.5">
              {[
                { id: 'stars', label: '⭐ Stars' },
                { id: 'rainbow', label: '🌈 Rainbow' },
                { id: 'bubbles', label: '🫧 Bubbles' },
                { id: 'hearts', label: '❤️ Hearts' },
              ].map((t) => (
                <button
                  key={t.id}
                  id={`btn-trail-${t.id}`}
                  onClick={() => onSelectTrail(t.id as TrailType)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    trail === t.id
                      ? 'bg-sky-100 border-sky-300 text-sky-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
