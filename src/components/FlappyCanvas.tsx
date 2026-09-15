import React, { useEffect, useRef } from 'react';
import { BirdSkin, TrailType, InvincibleMode, Particle, FloatingText, PipePair, GameStats } from '../types';
import { soundEngine } from '../utils/audio';

interface FlappyCanvasProps {
  skin: BirdSkin;
  trail: TrailType;
  mode: InvincibleMode;
  autoPilotEnabled: boolean;
  isPaused: boolean;
  gameStarted: boolean;
  onStartGame: () => void;
  onUpdateStats: (updater: (prev: GameStats) => GameStats) => void;
  onMilestone: (score: number, title: string) => void;
  flapsTriggerRef: React.MutableRefObject<(() => void) | null>;
}

export const FlappyCanvas: React.FC<FlappyCanvasProps> = ({
  skin,
  trail,
  mode,
  autoPilotEnabled,
  isPaused,
  gameStarted,
  onStartGame,
  onUpdateStats,
  onMilestone,
  flapsTriggerRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State refs for animation loop
  const birdRef = useRef({
    x: 100,
    y: 250,
    vy: 0,
    radius: 18,
    angle: 0,
    wingAngle: 0,
    wingSpeed: 0.2,
  });

  const pipesRef = useRef<PipePair[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatTextsRef = useRef<FloatingText[]>([]);
  const groundOffsetRef = useRef(0);
  const cloudOffsetRef = useRef(0);
  const skyStarsRef = useRef<{ x: number; y: number; s: number; alpha: number }[]>([]);
  const lastPipeSpawnRef = useRef(0);
  const pipeIdCounterRef = useRef(1);
  const floatingIdCounterRef = useRef(1);
  const frameCountRef = useRef(0);
  const currentScoreRef = useRef(0);
  const nextMilestoneRef = useRef(10);
  const trampolineAnimRef = useRef(0); // For ground spring visual bounce

  // Keep track of latest props inside render loop
  const propsRef = useRef({
    skin,
    trail,
    mode,
    autoPilotEnabled,
    isPaused,
    gameStarted,
    onStartGame,
    onUpdateStats,
    onMilestone,
  });

  useEffect(() => {
    propsRef.current = {
      skin,
      trail,
      mode,
      autoPilotEnabled,
      isPaused,
      gameStarted,
      onStartGame,
      onUpdateStats,
      onMilestone,
    };
  }, [skin, trail, mode, autoPilotEnabled, isPaused, gameStarted, onStartGame, onUpdateStats, onMilestone]);

  // Jump/Flap Action
  const flap = () => {
    if (!propsRef.current.gameStarted) {
      propsRef.current.onStartGame();
    }
    const bird = birdRef.current;
    bird.vy = -7.8;
    soundEngine.playFlap();

    propsRef.current.onUpdateStats((prev) => ({
      ...prev,
      flaps: prev.flaps + 1,
    }));

    // Spawn flap burst particles
    for (let i = 0; i < 6; i++) {
      particlesRef.current.push({
        x: bird.x - bird.radius + Math.random() * 4,
        y: bird.y + 6 + Math.random() * 6,
        vx: -1.5 - Math.random() * 2,
        vy: 1 - Math.random() * 2,
        color: '#ffffff',
        size: 3 + Math.random() * 3,
        life: 1,
        maxLife: 15 + Math.random() * 10,
        shape: 'circle',
      });
    }
  };

  useEffect(() => {
    flapsTriggerRef.current = flap;
    return () => {
      flapsTriggerRef.current = null;
    };
  }, []);

  // Keyboard and Touch listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        flap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    // Pre-populate background clouds & stars
    if (skyStarsRef.current.length === 0) {
      for (let i = 0; i < 40; i++) {
        skyStarsRef.current.push({
          x: Math.random() * 800,
          y: Math.random() * 120,
          s: 1.5 + Math.random() * 2.5,
          alpha: 0.3 + Math.random() * 0.7,
        });
      }
    }

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(() => resizeCanvas());
    resizeObserver.observe(container);

    // Initial Bird Positioning
    const groundHeight = 70;

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const groundY = height - groundHeight;
      const bird = birdRef.current;
      const { skin: currentSkin, trail: currentTrail, mode: currentMode, autoPilotEnabled: autoPilot, isPaused: paused, gameStarted: started } = propsRef.current;

      frameCountRef.current++;

      if (!paused) {
        // --- PHYSICS & LOGIC ---
        if (started) {
          // Gravity
          bird.vy += 0.38;
          bird.y += bird.vy;

          // Wing flapping oscillation
          bird.wingAngle += bird.wingSpeed;

          // Bird rotation based on velocity
          const targetAngle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.vy * 0.08)));
          bird.angle += (targetAngle - bird.angle) * 0.2;

          // Autopilot cushion (Never crash even when going AFK!)
          if (autoPilot) {
            let nextPipe: PipePair | undefined;
            for (const p of pipesRef.current) {
              if (p.x + p.width > bird.x - bird.radius) {
                nextPipe = p;
                break;
              }
            }

            const targetY = nextPipe ? nextPipe.topHeight + nextPipe.gap / 2 : height * 0.45;

            // If falling below target safe altitude or approaching ground, auto-hover
            if (bird.y > targetY + 30 && bird.vy > 1.2) {
              bird.vy = -5.5;
              soundEngine.playFlap();
              // Spawn gentle angel particles
              particlesRef.current.push({
                x: bird.x,
                y: bird.y + 10,
                vx: -1,
                vy: 2,
                color: '#60a5fa',
                size: 4,
                life: 1,
                maxLife: 20,
                shape: 'feather',
              });
            }
          }

          // 1. TRAMPOLINE FLOOR PROTECTION (Never hit ground and die!)
          if (bird.y + bird.radius >= groundY - 4) {
            bird.y = groundY - bird.radius - 4;
            bird.vy = -12.5; // Big bouncy spring!
            trampolineAnimRef.current = 15; // spring visual bounce
            soundEngine.playBoing();

            propsRef.current.onUpdateStats((prev) => ({
              ...prev,
              trampolineBounces: prev.trampolineBounces + 1,
              score: prev.score + 1,
              consecutiveWins: prev.consecutiveWins + 1,
            }));

            currentScoreRef.current += 1;

            floatTextsRef.current.push({
              id: floatingIdCounterRef.current++,
              x: bird.x,
              y: groundY - 30,
              text: 'BOING! +1 🌸',
              color: '#10b981',
              life: 1,
              maxLife: 45,
              size: 20,
            });

            // Burst flower/spring petals
            for (let i = 0; i < 15; i++) {
              particlesRef.current.push({
                x: bird.x + (Math.random() * 40 - 20),
                y: groundY,
                vx: (Math.random() - 0.5) * 6,
                vy: -3 - Math.random() * 5,
                color: ['#34d399', '#f472b6', '#fbbf24', '#38bdf8'][Math.floor(Math.random() * 4)],
                size: 4 + Math.random() * 4,
                life: 1,
                maxLife: 25 + Math.random() * 15,
                shape: 'star',
              });
            }
          }

          // 2. CEILING STRATOSPHERE (Fly as high as you want!)
          if (bird.y - bird.radius < 5) {
            bird.y = bird.radius + 5;
            bird.vy = 1; // Soft bounce down

            if (frameCountRef.current % 30 === 0) {
              floatTextsRef.current.push({
                id: floatingIdCounterRef.current++,
                x: bird.x + 20,
                y: 35,
                text: 'STRATOSPHERE! ✨',
                color: '#ec4899',
                life: 1,
                maxLife: 35,
                size: 16,
              });
            }
          }

          // Spawn Trail Particles
          if (frameCountRef.current % 2 === 0) {
            let trailColor = '#f59e0b';
            let trailShape: Particle['shape'] = 'star';

            if (currentTrail === 'rainbow') {
              const rainbowCols = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
              trailColor = rainbowCols[frameCountRef.current % rainbowCols.length];
              trailShape = 'circle';
            } else if (currentTrail === 'bubbles') {
              trailColor = '#38bdf8';
              trailShape = 'circle';
            } else if (currentTrail === 'hearts') {
              trailColor = '#f43f5e';
              trailShape = 'square';
            }

            particlesRef.current.push({
              x: bird.x - bird.radius,
              y: bird.y + (Math.random() * 8 - 4),
              vx: -2 - Math.random() * 1.5,
              vy: (Math.random() - 0.5) * 1.5,
              color: trailColor,
              size: 3 + Math.random() * 3,
              life: 1,
              maxLife: 20 + Math.random() * 10,
              shape: trailShape,
              rotation: Math.random() * Math.PI,
              vRot: (Math.random() - 0.5) * 0.1,
            });
          }

          // 3. PIPES SPAWNING & UPDATING
          const pipeInterval = 135; // Frames between pipe spawns
          if (frameCountRef.current - lastPipeSpawnRef.current >= pipeInterval) {
            lastPipeSpawnRef.current = frameCountRef.current;
            const minTop = 60;
            const maxTop = groundY - 220;
            const topH = Math.floor(Math.random() * (maxTop - minTop) + minTop);
            const gap = 150; // Generous comfortable gap

            pipesRef.current.push({
              id: pipeIdCounterRef.current++,
              x: width + 30,
              topHeight: topH,
              gap,
              width: 64,
              passed: false,
              shattered: false,
              partOffset: 0,
            });
          }

          const pipeSpeed = 2.4;
          const pipes = pipesRef.current;

          for (let i = pipes.length - 1; i >= 0; i--) {
            const p = pipes[i];
            p.x -= pipeSpeed;

            // Proximity protection:
            const pipeLeft = p.x;
            const pipeRight = p.x + p.width;
            const birdRight = bird.x + bird.radius;
            const birdLeft = bird.x - bird.radius;
            const birdTop = bird.y - bird.radius;
            const birdBottom = bird.y + bird.radius;

            // Distance to bird
            const distToBird = p.x - bird.x;

            // A) "PARTING THE RED SEA" / MOSES MODE / GOD MODE
            if ((currentMode === 'parting' || currentMode === 'godmode') && !p.shattered) {
              if (distToBird > -p.width && distToBird < 110) {
                // If bird is about to touch top or bottom pipe, dynamically expand gap!
                const currentGapTop = p.topHeight - (p.partOffset || 0);
                const currentGapBottom = p.topHeight + p.gap + (p.partOffset || 0);

                if (birdTop < currentGapTop + 14 || birdBottom > currentGapBottom - 14) {
                  p.partOffset = (p.partOffset || 0) + 4.5; // Smoothly slide open!

                  if (frameCountRef.current % 12 === 0) {
                    soundEngine.playParting();
                    particlesRef.current.push({
                      x: p.x + p.width / 2,
                      y: p.topHeight + p.gap / 2,
                      vx: (Math.random() - 0.5) * 3,
                      vy: (Math.random() - 0.5) * 3,
                      color: '#fbbf24',
                      size: 4,
                      life: 1,
                      maxLife: 20,
                      shape: 'star',
                    });
                  }
                }
              }
            }

            // B) COLLISION CHECK
            if (!p.shattered) {
              const effectiveTopHeight = p.topHeight - (p.partOffset || 0);
              const effectiveBottomStart = p.topHeight + p.gap + (p.partOffset || 0);

              const inHorizontalRange = birdRight > pipeLeft + 6 && birdLeft < pipeRight - 6;
              const hitTopPipe = birdTop < effectiveTopHeight;
              const hitBottomPipe = birdBottom > effectiveBottomStart;

              if (inHorizontalRange && (hitTopPipe || hitBottomPipe)) {
                // INSTEAD OF DYING: TRIGGER INVINCIBLE HERO MECHANIC!
                if (currentMode === 'trampoline') {
                  // Bouncy Rubber Pipes: bounce back safely!
                  bird.vy = hitTopPipe ? 6.5 : -7.5;
                  bird.x = Math.max(70, bird.x - 4);
                  soundEngine.playBoing();

                  floatTextsRef.current.push({
                    id: floatingIdCounterRef.current++,
                    x: p.x + 20,
                    y: bird.y,
                    text: 'RUBBER BOUNCE! 🛡️',
                    color: '#3b82f6',
                    life: 1,
                    maxLife: 40,
                    size: 18,
                  });
                } else {
                  // SMASH / GOD MODE: SHATTER THE PIPE INTO PIECES!
                  p.shattered = true;
                  p.shatterAlpha = 1;
                  soundEngine.playSmash();

                  propsRef.current.onUpdateStats((prev) => ({
                    ...prev,
                    pipesSmashed: prev.pipesSmashed + 1,
                    score: prev.score + 2, // Bonus score for smashing!
                    consecutiveWins: prev.consecutiveWins + 1,
                  }));

                  currentScoreRef.current += 2;

                  floatTextsRef.current.push({
                    id: floatingIdCounterRef.current++,
                    x: p.x + 30,
                    y: bird.y,
                    text: 'SMASHED! +2 💥',
                    color: '#f59e0b',
                    life: 1,
                    maxLife: 50,
                    size: 22,
                  });

                  // Spawn pipe brick explosion fragments
                  for (let k = 0; k < 28; k++) {
                    particlesRef.current.push({
                      x: p.x + Math.random() * p.width,
                      y: Math.random() > 0.5 ? Math.random() * effectiveTopHeight : effectiveBottomStart + Math.random() * (groundY - effectiveBottomStart),
                      vx: (Math.random() - 0.3) * 10,
                      vy: (Math.random() - 0.5) * 10,
                      color: ['#22c55e', '#16a34a', '#15803d', '#86efac', '#eab308'][Math.floor(Math.random() * 5)],
                      size: 6 + Math.random() * 8,
                      life: 1,
                      maxLife: 35 + Math.random() * 20,
                      shape: 'square',
                      rotation: Math.random() * Math.PI * 2,
                      vRot: (Math.random() - 0.5) * 0.2,
                    });
                  }
                }
              }
            }

            // C) SCORE PASSING CHECK
            if (!p.passed && p.x + p.width < bird.x) {
              p.passed = true;
              soundEngine.playScore();

              propsRef.current.onUpdateStats((prev) => {
                const newScore = prev.score + 1;
                const newHigh = Math.max(prev.highScore, newScore);
                return {
                  ...prev,
                  score: newScore,
                  highScore: newHigh,
                  pipesCleared: prev.pipesCleared + 1,
                  consecutiveWins: prev.consecutiveWins + 1,
                };
              });

              currentScoreRef.current += 1;

              floatTextsRef.current.push({
                id: floatingIdCounterRef.current++,
                x: p.x + 35,
                y: p.topHeight + p.gap / 2,
                text: '+1 VICTORY! 👑',
                color: '#22c55e',
                life: 1,
                maxLife: 35,
                size: 19,
              });

              // Check milestone
              if (currentScoreRef.current >= nextMilestoneRef.current) {
                const reached = nextMilestoneRef.current;
                if (reached === 10) nextMilestoneRef.current = 25;
                else if (reached === 25) nextMilestoneRef.current = 50;
                else if (reached === 50) nextMilestoneRef.current = 100;
                else nextMilestoneRef.current += 100;

                const titles: Record<number, string> = {
                  10: 'Flawless Aviator!',
                  25: 'Invincible Master!',
                  50: 'Undefeated Champion!',
                  100: 'Flappy Demigod!',
                  200: 'Eternal Legend!',
                };
                const title = titles[reached] || 'Untouchable Phoenix!';
                soundEngine.playFanfare();
                propsRef.current.onMilestone(reached, title);
              }
            }

            // Remove off-screen pipes
            if (p.x + p.width < -50) {
              pipes.splice(i, 1);
            }
          }

          // Background scrolling
          groundOffsetRef.current = (groundOffsetRef.current + pipeSpeed) % 24;
          cloudOffsetRef.current = (cloudOffsetRef.current + 0.5) % width;
        } else {
          // Idle floating bob
          bird.y = height * 0.44 + Math.sin(frameCountRef.current * 0.06) * 12;
          bird.angle = Math.sin(frameCountRef.current * 0.06) * 0.05;
          bird.wingAngle += 0.15;
          groundOffsetRef.current = (groundOffsetRef.current + 1.2) % 24;
          cloudOffsetRef.current = (cloudOffsetRef.current + 0.3) % width;
        }
      }

      // --- RENDERING PIPELINE ---

      // 1. SKY GRADIENT
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#38bdf8'); // Sky blue
      skyGrad.addColorStop(0.6, '#7dd3fc');
      skyGrad.addColorStop(1, '#bae6fd');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, groundY);

      // 2. STRATOSPHERE STARS & AURORA (Top 80px)
      ctx.save();
      for (const star of skyStarsRef.current) {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc((star.x - cloudOffsetRef.current * 0.3 + width) % width, star.y, star.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 3. PARALLAX DISTANT CLOUDS & CITY SILHOUETTES
      ctx.save();
      // Distant hills / city
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.ellipse(width * 0.25, groundY + 10, 180, 50, 0, 0, Math.PI * 2);
      ctx.ellipse(width * 0.75, groundY + 20, 220, 60, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy clouds
      const renderCloud = (cx: number, cy: number, scale: number) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
        ctx.beginPath();
        ctx.arc(cx, cy, 22 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 18 * scale, cy - 8 * scale, 26 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 42 * scale, cy, 20 * scale, 0, Math.PI * 2);
        ctx.arc(cx + 22 * scale, cy + 8 * scale, 24 * scale, 0, Math.PI * 2);
        ctx.fill();
      };

      const cloud1X = ((width * 0.15 - cloudOffsetRef.current * 0.6) % (width + 100)) - 50;
      const cloud2X = ((width * 0.65 - cloudOffsetRef.current * 0.8) % (width + 100)) - 50;
      const cloud3X = ((width * 0.95 - cloudOffsetRef.current * 0.5) % (width + 100)) - 50;
      renderCloud(cloud1X < -60 ? cloud1X + width + 100 : cloud1X, 85, 1.1);
      renderCloud(cloud2X < -60 ? cloud2X + width + 100 : cloud2X, 140, 0.85);
      renderCloud(cloud3X < -60 ? cloud3X + width + 100 : cloud3X, 70, 0.95);
      ctx.restore();

      // 4. PIPES RENDERING
      pipesRef.current.forEach((p) => {
        if (p.shattered) return; // Shattered pipes disappear into particle explosion!

        const part = p.partOffset || 0;
        const topH = Math.max(10, p.topHeight - part);
        const botStart = p.topHeight + p.gap + part;
        const botH = Math.max(10, groundY - botStart);

        ctx.save();

        // Pipe Body Styling
        const drawPipe = (x: number, y: number, w: number, h: number, isTop: boolean) => {
          // Main tube gradient
          const pipeGrad = ctx.createLinearGradient(x, 0, x + w, 0);
          pipeGrad.addColorStop(0, '#15803d');
          pipeGrad.addColorStop(0.2, '#22c55e');
          pipeGrad.addColorStop(0.4, '#4ade80');
          pipeGrad.addColorStop(0.8, '#16a34a');
          pipeGrad.addColorStop(1, '#14532d');

          ctx.fillStyle = pipeGrad;
          ctx.fillRect(x, y, w, h);

          // Tube border
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 2.5;
          ctx.strokeRect(x, y, w, h);

          // Pipe Cap
          const capHeight = 26;
          const capOverhang = 6;
          const capX = x - capOverhang;
          const capW = w + capOverhang * 2;
          const capY = isTop ? y + h - capHeight : y;

          const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
          capGrad.addColorStop(0, '#15803d');
          capGrad.addColorStop(0.25, '#4ade80');
          capGrad.addColorStop(0.75, '#22c55e');
          capGrad.addColorStop(1, '#052e16');

          ctx.fillStyle = capGrad;
          ctx.fillRect(capX, capY, capW, capHeight);
          ctx.strokeRect(capX, capY, capW, capHeight);

          // Cute invincibility badge on pipe cap
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(capX + capW / 2, capY + capHeight / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        };

        // Top Pipe
        drawPipe(p.x, 0, p.width, topH, true);
        // Bottom Pipe
        drawPipe(p.x, botStart, p.width, botH, false);

        // If pipe has parted, show a subtle golden divine ray
        if (part > 5) {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.18)';
          ctx.fillRect(p.x - 10, topH, p.width + 20, botStart - topH);
        }

        ctx.restore();
      });

      // 5. GROUND & TRAMPOLINE TIER
      ctx.save();
      // Dirt body
      ctx.fillStyle = '#d97706';
      ctx.fillRect(0, groundY, width, groundHeight);

      // Darker dirt texture bands
      ctx.fillStyle = '#b45309';
      for (let dx = -groundOffsetRef.current; dx < width; dx += 24) {
        ctx.fillRect(dx, groundY + 18, 12, groundHeight - 18);
      }

      // Springy Grass Top Layer (Bounces when trampoline is hit!)
      if (trampolineAnimRef.current > 0) {
        trampolineAnimRef.current -= 0.8;
      }
      const springWobble = Math.sin(trampolineAnimRef.current * 0.8) * trampolineAnimRef.current * 0.5;

      // Grass Top
      const grassGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 16);
      grassGrad.addColorStop(0, '#4ade80');
      grassGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = grassGrad;
      ctx.fillRect(0, groundY + springWobble, width, 16);

      // Trampoline / Spring Flowers on grass to indicate bouncy safety
      for (let fx = 20; fx < width; fx += 60) {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(fx, groundY + springWobble + 6, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(fx, groundY + springWobble + 6, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Outline between grass and dirt
      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, groundY + springWobble);
      ctx.lineTo(width, groundY + springWobble);
      ctx.stroke();

      ctx.restore();

      // 6. PARTICLES RENDERING
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const part = particlesRef.current[i];
        part.x += part.vx;
        part.y += part.vy;
        part.life++;

        if (part.rotation !== undefined && part.vRot !== undefined) {
          part.rotation += part.vRot;
        }

        const progress = part.life / part.maxLife;
        const alpha = Math.max(0, 1 - progress);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = part.color;

        ctx.translate(part.x, part.y);
        if (part.rotation) ctx.rotate(part.rotation);

        if (part.shape === 'star') {
          // Draw mini star
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(Math.cos((18 + s * 72) * 0.01745) * part.size, -Math.sin((18 + s * 72) * 0.01745) * part.size);
            ctx.lineTo(Math.cos((54 + s * 72) * 0.01745) * (part.size * 0.5), -Math.sin((54 + s * 72) * 0.01745) * (part.size * 0.5));
          }
          ctx.closePath();
          ctx.fill();
        } else if (part.shape === 'square') {
          ctx.fillRect(-part.size / 2, -part.size / 2, part.size, part.size);
        } else if (part.shape === 'feather') {
          ctx.beginPath();
          ctx.ellipse(0, 0, part.size * 2, part.size, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Circle
          ctx.beginPath();
          ctx.arc(0, 0, part.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (part.life >= part.maxLife) {
          particlesRef.current.splice(i, 1);
        }
      }

      // 7. BIRD RENDERING
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(bird.angle);

      // Invincible Glow Aura
      const auraColor = currentSkin === 'golden' ? 'rgba(251, 191, 36, 0.45)' : 'rgba(56, 189, 248, 0.35)';
      ctx.fillStyle = auraColor;
      ctx.beginPath();
      ctx.arc(0, 0, bird.radius + 6 + Math.sin(frameCountRef.current * 0.15) * 2, 0, Math.PI * 2);
      ctx.fill();

      // Bird Body Colors based on Skin
      let bodyColor = '#facc15';
      let bellyColor = '#fef08a';
      let wingColor = '#eab308';
      let eyeColor = '#ffffff';

      if (currentSkin === 'golden') {
        bodyColor = '#f59e0b';
        bellyColor = '#fde68a';
        wingColor = '#d97706';
      } else if (currentSkin === 'phoenix') {
        bodyColor = '#06b6d4';
        bellyColor = '#a5f3fc';
        wingColor = '#0284c7';
      } else if (currentSkin === 'party') {
        bodyColor = '#f43f5e';
        bellyColor = '#fbcfe8';
        wingColor = '#e11d48';
      }

      // Body circle / oval
      ctx.fillStyle = bodyColor;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, bird.radius + 2, bird.radius, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Chubby belly patch
      ctx.fillStyle = bellyColor;
      ctx.beginPath();
      ctx.ellipse(2, 4, bird.radius * 0.65, bird.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.arc(6, -6, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Pupil (looks forward confidently)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(8, -6, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(9, -7.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Beak (cheerful confident smile)
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(11, -3);
      ctx.lineTo(22, 1);
      ctx.lineTo(11, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Wing (Animated with wingAngle)
      ctx.save();
      ctx.translate(-5, 1);
      const flapRotate = Math.sin(bird.wingAngle) * 0.45;
      ctx.rotate(flapRotate);
      ctx.fillStyle = wingColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();

      // Accessories / Skin features:
      if (currentSkin === 'golden') {
        // Shiny Golden Crown with Ruby
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-7, -13);
        ctx.lineTo(-7, -21);
        ctx.lineTo(-2, -16);
        ctx.lineTo(3, -22);
        ctx.lineTo(8, -16);
        ctx.lineTo(13, -21);
        ctx.lineTo(13, -13);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Ruby in crown
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.arc(3, -15, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentSkin === 'party') {
        // Cool sunglasses
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(4, -9, 9, 6);
        ctx.fillRect(-2, -9, 7, 6);
        ctx.fillRect(4, -8, 2, 2);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(4, -9, 9, 6);

        // Party Hat
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.moveTo(-4, -13);
        ctx.lineTo(1, -26);
        ctx.lineTo(6, -13);
        ctx.closePath();
        ctx.fill();
        // Pom-pom on top
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(1, -27, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // 8. FLOATING COMBAT / VICTORY TEXTS
      for (let i = floatTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatTextsRef.current[i];
        ft.y -= 1.1;
        ft.life++;

        const progress = ft.life / ft.maxLife;
        const alpha = Math.max(0, 1 - progress);
        const scale = 1 + Math.sin(progress * Math.PI) * 0.2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `900 ${Math.round((ft.size || 18) * scale)}px system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';

        // High contrast text outline
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 4;
        ctx.strokeText(ft.text, ft.x, ft.y);

        ctx.fillStyle = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.life >= ft.maxLife) {
          floatTextsRef.current.splice(i, 1);
        }
      }

      // 9. IDLE START PROMPT OVERLAY
      if (!started) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
        ctx.fillRect(0, 0, width, height);

        // Pulsing Start Badge
        const badgeY = height * 0.56;
        const pulse = 1 + Math.sin(frameCountRef.current * 0.08) * 0.05;

        ctx.translate(width / 2, badgeY);
        ctx.scale(pulse, pulse);

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(-140, -32, 280, 64, 16);
        ctx.fill();
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '800 19px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText('TAP OR SPACE TO FLAP', 0, -3);

        ctx.font = '600 13px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#16a34a';
        ctx.fillText('100% Guaranteed Win Rate Active', 0, 18);

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      onClick={flap}
      className="relative w-full h-full min-h-[460px] cursor-pointer select-none overflow-hidden rounded-2xl shadow-xl border-4 border-emerald-500/20 bg-sky-200"
    >
      <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />
    </div>
  );
};
