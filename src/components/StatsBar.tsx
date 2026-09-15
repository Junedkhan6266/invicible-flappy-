import React from 'react';
import { Trophy, ShieldCheck, Flame, Sparkles, Award } from 'lucide-react';
import { GameStats } from '../types';

interface StatsBarProps {
  stats: GameStats;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats }) => {
  return (
    <div id="stats-dashboard-bar" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5 w-full">
      {/* Current Score */}
      <div id="stat-card-score" className="bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</div>
          <div className="text-xl font-black text-slate-800 tabular-nums">{stats.score}</div>
        </div>
      </div>

      {/* Win Rate (Always 100%) */}
      <div id="stat-card-winrate" className="bg-white/90 backdrop-blur-sm border border-amber-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Win Rate</div>
          <div className="text-xl font-black text-amber-600 tabular-nums">100%</div>
        </div>
      </div>

      {/* Defeats (Always 0) */}
      <div id="stat-card-losses" className="bg-white/90 backdrop-blur-sm border border-emerald-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Losses</div>
          <div className="text-xl font-black text-emerald-600 tabular-nums">0 <span className="text-xs font-medium text-emerald-500">(Never)</span></div>
        </div>
      </div>

      {/* Win Streak */}
      <div id="stat-card-streak" className="bg-white/90 backdrop-blur-sm border border-orange-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Win Streak</div>
          <div className="text-xl font-black text-slate-800 tabular-nums">{stats.consecutiveWins}</div>
        </div>
      </div>

      {/* Pipes Smashed */}
      <div id="stat-card-smashed" className="bg-white/90 backdrop-blur-sm border border-sky-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Demolished</div>
          <div className="text-xl font-black text-slate-800 tabular-nums">{stats.pipesSmashed}</div>
        </div>
      </div>

      {/* High Score */}
      <div id="stat-card-high" className="bg-white/90 backdrop-blur-sm border border-purple-100 rounded-xl p-3 shadow-xs flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
          <Trophy className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Record</div>
          <div className="text-xl font-black text-slate-800 tabular-nums">{stats.highScore}</div>
        </div>
      </div>
    </div>
  );
};
