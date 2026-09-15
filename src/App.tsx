/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BirdSkin, TrailType, InvincibleMode, GameStats } from './types';
import { FlappyCanvas } from './components/FlappyCanvas';
import { StatsBar } from './components/StatsBar';
import { ControlsBar } from './components/ControlsBar';
import { MilestoneModal } from './components/MilestoneModal';
import { soundEngine } from './utils/audio';
import { Crown, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState<GameStats>(() => {
    const savedHigh = localStorage.getItem('flappy_high_score');
    return {
      score: 0,
      highScore: savedHigh ? parseInt(savedHigh, 10) : 0,
      pipesSmashed: 0,
      trampolineBounces: 0,
      pipesCleared: 0,
      flaps: 0,
      losses: 0,
      winRate: 100,
      consecutiveWins: 0,
    };
  });

  const [skin, setSkin] = useState<BirdSkin>('golden');
  const [trail, setTrail] = useState<TrailType>('stars');
  const [mode, setMode] = useState<InvincibleMode>('godmode');
  const [autoPilot, setAutoPilot] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameKey, setGameKey] = useState<number>(1);
  const [milestone, setMilestone] = useState<{ score: number; title: string } | null>(null);

  const flapsTriggerRef = useRef<(() => void) | null>(null);

  // Sync high score to local storage
  useEffect(() => {
    if (stats.highScore > 0) {
      localStorage.setItem('flappy_high_score', stats.highScore.toString());
    }
  }, [stats.highScore]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const handleResetGame = useCallback(() => {
    setStats((prev) => ({
      ...prev,
      score: 0,
    }));
    setGameStarted(false);
    setIsPaused(false);
    setGameKey((k) => k + 1);
  }, []);

  const handleFlap = useCallback(() => {
    if (flapsTriggerRef.current) {
      flapsTriggerRef.current();
    }
  }, []);

  const handleMilestone = useCallback((score: number, title: string) => {
    setMilestone({ score, title });
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col items-center justify-between p-3 sm:p-5 antialiased font-sans">
      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2 px-1 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center shadow-xs border border-amber-300">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
              Invincible Flappy Bird
              <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Impossible to Lose • Guaranteed 100% Victory
            </p>
          </div>
        </div>

        {/* Certified Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Defeat Disabled</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-4xl flex-1 flex flex-col gap-3.5">
        {/* Live Stats Row */}
        <StatsBar stats={stats} />

        {/* Interactive Canvas Area */}
        <div className="relative w-full h-[460px] sm:h-[500px] flex items-center justify-center">
          <FlappyCanvas
            key={gameKey}
            skin={skin}
            trail={trail}
            mode={mode}
            autoPilotEnabled={autoPilot}
            isPaused={isPaused}
            gameStarted={gameStarted}
            onStartGame={() => setGameStarted(true)}
            onUpdateStats={setStats}
            onMilestone={handleMilestone}
            flapsTriggerRef={flapsTriggerRef}
          />

          {/* Pause Overlay indicator */}
          {isPaused && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-xs rounded-2xl">
              <div className="px-6 py-3 rounded-2xl bg-white text-slate-900 font-black text-xl shadow-xl flex items-center gap-2">
                <span>GAME PAUSED</span>
              </div>
              <button
                onClick={handleTogglePause}
                className="mt-3 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md"
              >
                Click to Resume
              </button>
            </div>
          )}
        </div>

        {/* Controls, Modes & Customizer */}
        <ControlsBar
          skin={skin}
          onSelectSkin={setSkin}
          trail={trail}
          onSelectTrail={setTrail}
          mode={mode}
          onSelectMode={setMode}
          autoPilot={autoPilot}
          onToggleAutoPilot={() => setAutoPilot((v) => !v)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isPaused={isPaused}
          onTogglePause={handleTogglePause}
          onResetGame={handleResetGame}
          onFlap={handleFlap}
        />
      </main>

      {/* Footer Instructions */}
      <footer className="w-full max-w-4xl text-center py-2 text-xs text-slate-400">
        Tap screen or press <span className="font-semibold text-slate-600">Spacebar</span> to flap. Enjoy infinite victory without stress!
      </footer>

      {/* Milestone Celebration Modal */}
      {milestone && (
        <MilestoneModal
          score={milestone.score}
          title={milestone.title}
          onClose={() => setMilestone(null)}
        />
      )}
    </div>
  );
}
