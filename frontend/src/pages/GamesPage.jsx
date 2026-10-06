import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconRocket, IconBulb, IconClipboard, IconBarChart, IconZap, IconClock, IconLock } from '../components/Icons';

const games = [
  {
    id: 'space-shooter',
    title: 'Galactic Transform Shooter',
    tagline: 'Retro Arcade Space Combat',
    description: 'Blast through waves of alien enemies in this fast-paced space shooter. Dodge, evolve your ship Mk I–V, deploy wingmen allies, and survive the cosmos!',
    emoji: 'rocket',
    accent: '#0df',
    url: '/space-shooter/game.html',
    instructions: {
      overview: 'Pilot your starfighter against relentless waves of hostile extraterrestrials. Destroy enemies to collect power-ups, score points, and evolve into devastating starships.',
      objective: 'Survive as many waves as possible and set a legendary galactic high score!',
      controls: {
        keyboard: [
          { key: 'W / A / S / D or Arrow Keys', action: 'Pilot & steer the starship in 8 directions' },
          { key: 'Auto-Fire', action: 'Ship continuously shoots automatically' },
          { key: 'Mouse Click / Enter', action: 'Select wave upgrade cards' },
        ],
        mobile: [
          { touch: 'Touch & Drag Anywhere', action: 'Directly steer and guide the ship with 1:1 precision' },
          { touch: 'Tap Upgrades', action: 'Tap desired upgrade cards at wave milestones' },
        ],
      },
      tips: [
        'Collect yellow glowing power-ups for temporary hyper-charged fire rates.',
        'Choose "Ship Transform" when available to upgrade base damage, bullets, and ship tier (Mk I to Mk V).',
        'Wingmen automatically track and eliminate the most dangerous threats on the battlefield.',
        'Keep moving in wide circles to avoid enemy homing missiles and burst shots.',
      ],
    },
  },
  {
    id: 'tic-tac-toe',
    title: 'Tic-Tac-Toe',
    tagline: 'Cyber Neon Strategy Classic',
    description: 'Challenge a friend in local 2-player mode or test your wits against Easy and Unbeatable AI. Fast, strategic, and relaxing!',
    emoji: '⭕',
    accent: '#f472b6',
    url: '/tic-tac-toe/index.html',
    instructions: {
      overview: 'Place your marks on the 3x3 grid. The first player to connect three identical marks horizontally, vertically, or diagonally wins the round.',
      objective: 'Outsmart the AI or your opponent with tactical corner and center control.',
      controls: {
        keyboard: [
          { key: 'Keys 1 to 9 (or Numpad)', action: 'Quick-drop your mark directly on squares 1 (top-left) to 9 (bottom-right)' },
          { key: 'Arrow Keys / WASD', action: 'Navigate focus around the grid' },
          { key: 'Enter / Spacebar', action: 'Place mark on the currently selected grid cell' },
          { key: 'R Key', action: 'Quick reset current board' },
        ],
        mobile: [
          { touch: 'Tap Any Tile', action: 'Instant one-tap mark placement' },
          { touch: 'Mode Buttons', action: 'Easily switch between 2-Player, AI Easy, and AI Hard' },
        ],
      },
      tips: [
        'Taking the center square (Square 5) gives the highest strategic flexibility.',
        'Watch out for fork opportunities where you can create two simultaneous winning threats.',
        'In "AI Hard" mode, the computer uses the minimax algorithm and will never lose a match!',
      ],
    },
  },
  {
    id: 'glow-pong',
    title: 'Glow Pong',
    tagline: 'Futuristic High-Speed Air Hockey',
    description: 'Face off against challenging AI or play 2-player split-screen with neon physics, dynamic sparks, and speed-accelerating rallies!',
    emoji: '🏓',
    accent: '#10b981',
    url: '/glow-pong/index.html',
    instructions: {
      overview: 'Defend your goal line while curving and driving the plasma ball past your opponent. Long rallies accelerate ball velocity for intense matches!',
      objective: 'First player to reach 5 points wins the arena championship.',
      controls: {
        keyboard: [
          { key: 'W / S or Up / Down', action: 'Move Paddle & Serve / Launch Ball' },
          { key: 'Up / Down Arrows', action: 'Move Player 2 (Right Paddle) in 2-Player mode' },
          { key: 'Spacebar', action: 'Serve Ball / Pause & Resume Match' },
          { key: 'R Key', action: 'Reset match and scores' },
        ],
        mobile: [
          { touch: 'Drag on Left Side', action: 'Glide Paddle & instantly launch serve toward opponent' },
          { touch: 'Drag on Right Side', action: 'Glide Player 2 paddle & serve in 2-Player local mode' },
        ],
      },
      tips: [
        'Hit the ball with the outer edges of your paddle to impart steep angle spin.',
        'Anticipate wall bounces to intercept fast rebounds early.',
        'In AI Expert mode, the bot uses trajectory prediction, so sharp angles are key to scoring!',
      ],
    },
  },
  {
    id: 'hover-racer',
    title: 'CyberGlide: Neon Velocity',
    tagline: '3D Anti-Gravity Hover Racer (WipEout Style)',
    description: 'Blaze through a dizzying 3D roller-coaster track in deep space. Choose your plasma hovercraft, blast over boost gates, drift banked curves, and outrun 5 rival AI racers!',
    emoji: '🏎️',
    accent: '#a855f7',
    url: '/hover-racer/index.html',
    instructions: {
      overview: 'Pilot an ultra-high-speed anti-gravity craft along a neon-lit 3D spline speedway. Master roll banking, air-brakes, and booster pads across a 3-lap Grand Prix championship.',
      objective: 'Take 1st place on the podium and set a new lap record on the Neon Speedway!',
      controls: {
        keyboard: [
          { key: 'W or Up Arrow', action: 'Full Throttle Acceleration (Up to 450+ KM/H)' },
          { key: 'A / D or Left / Right', action: 'Steer & Lean/Bank into sharp curves' },
          { key: 'S or Down Arrow', action: 'Air-Brakes to drift tightly around hairpins' },
          { key: 'Spacebar / Shift', action: 'Engage Overdrive Turbo Boost' },
          { key: 'C Key', action: 'Cycle Camera (Chase Close, Chase Far, Cockpit FPV)' },
          { key: 'P or Esc', action: 'Pause / Resume Grand Prix' },
        ],
        mobile: [
          { touch: 'On-Screen D-Pad', action: 'Left/Right steering and banking controls' },
          { touch: 'Boost & Brake Buttons', action: 'Trigger turbo overdrive or sharp deceleration' },
        ],
      },
      tips: [
        'Hit every glowing neon gate / boost pad on the track for instant velocity surges.',
        'Avoid scraping the outer barriers at top speed to preserve your shield integrity.',
        'Tap the air-brake (S / Down Arrow) while turning hard to slide through steep corkscrews.',
        'Switch to Cockpit FPV (C Key) for the most immersive high-speed rush!',
      ],
    },
  },
];

const GamesPage = () => {
  const [selected, setSelected] = useState(null);
  const [activeInstructionGame, setActiveInstructionGame] = useState(null);
  const [inGameInstructionsOpen, setInGameInstructionsOpen] = useState(false);
  
  // Timer & Route Protection State
  const [hasValidTimer, setHasValidTimer] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isTimeExceeded, setIsTimeExceeded] = useState(false);
  const [showNoExamModal, setShowNoExamModal] = useState(false);

  const navigate = useNavigate();

  // Route Protection & Timer Check
  React.useEffect(() => {
    const checkTimer = () => {
      const expiryStr = sessionStorage.getItem('arcadeAccessExpiry');
      if (!expiryStr) {
        setHasValidTimer(false);
        setSecondsRemaining(null);
        return;
      }

      const expiry = parseInt(expiryStr, 10);
      const now = Date.now();
      const diff = expiry - now;

      if (isNaN(expiry) || diff <= 0) {
        // Timer exhausted!
        sessionStorage.removeItem('arcadeAccessExpiry');
        setHasValidTimer(false);
        setSecondsRemaining(0);
        setIsTimeExceeded(true);
        setSelected(null); // Exit any active game immediately
      } else {
        setHasValidTimer(true);
        setSecondsRemaining(Math.ceil(diff / 1000));
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle exit game message from iframes
  React.useEffect(() => {
    const handleMessage = (e) => {
      if (e.data && (e.data === 'EXIT_GAME' || e.data.type === 'EXIT_GAME')) {
        setSelected(null);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const formatCountdown = (secs) => {
    if (secs === null || secs === undefined || secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAttemptPlay = (game) => {
    if (!hasValidTimer || secondsRemaining <= 0) {
      setShowNoExamModal(true);
    } else {
      setSelected(game);
    }
  };

  // Active Game Screen (Full-screen game view)
  if (selected) {
    return (
      <div style={{
        position: 'fixed', inset: 0, backgroundColor: '#050510', zIndex: 50,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Game Top Navigation Bar */}
        <div style={{
          height: '56px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'rgba(5,5,16,0.95)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          zIndex: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSelected(null)}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '6px 14px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.15)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.28)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                e.currentTarget.style.color = '#f87171';
              }}
            >
              🚪 Exit Game
            </button>
            <span style={{ color: '#fff', fontSize: '0.95rem', fontWeight: '700', letterSpacing: '0.5px' }}>
              {selected.emoji} {selected.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Live In-Game Arcade Countdown Badge */}
            {hasValidTimer && secondsRemaining !== null && (
              <div style={{
                background: secondsRemaining < 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 221, 255, 0.12)',
                border: `1px solid ${secondsRemaining < 120 ? 'rgba(239, 68, 68, 0.5)' : 'rgba(0, 221, 255, 0.3)'}`,
                color: secondsRemaining < 120 ? '#f87171' : '#0df',
                padding: '5px 12px',
                borderRadius: '20px',
                fontSize: '0.82rem',
                fontWeight: '800',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                animation: secondsRemaining < 120 ? 'pulse 1s infinite alternate' : 'none',
              }}>
                <IconClock size='0.9em' color='currentColor' /> {formatCountdown(secondsRemaining)}
              </div>
            )}

            <button
              onClick={() => setInGameInstructionsOpen(!inGameInstructionsOpen)}
              style={{
                background: inGameInstructionsOpen ? selected.accent : 'rgba(255,255,255,0.08)',
                color: inGameInstructionsOpen ? '#000' : '#fff',
                border: `1px solid ${inGameInstructionsOpen ? selected.accent : 'rgba(255,255,255,0.15)'}`,
                padding: '6px 14px',
                borderRadius: '30px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
              }}
            >
              📖 {inGameInstructionsOpen ? 'Close Controls' : 'How to Play'}
            </button>
          </div>
        </div>

        {/* Floating in-game instructions overlay */}
        {inGameInstructionsOpen && (
          <div style={{
            position: 'absolute',
            top: '64px',
            right: '16px',
            maxWidth: '420px',
            width: 'calc(100vw - 32px)',
            background: 'rgba(10, 10, 26, 0.95)',
            border: `1px solid ${selected.accent}66`,
            boxShadow: `0 16px 40px rgba(0,0,0,0.8), 0 0 24px ${selected.accent}33`,
            borderRadius: '18px',
            padding: '20px',
            zIndex: 70,
            backdropFilter: 'blur(16px)',
            color: '#fff',
            maxHeight: 'calc(100vh - 100px)',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: selected.accent }}>
                🎮 {selected.title} Controls
              </h3>
              <button
                onClick={() => setInGameInstructionsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '6px' }}>
                ⌨️ Keyboard Controls
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selected.instructions.controls.keyboard.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <span style={{ fontFamily: 'monospace', color: '#0df', fontWeight: '700' }}>{c.key}</span>
                    <span style={{ color: '#cbd5e1', textAlign: 'right', marginLeft: '10px' }}>{c.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#f472b6', marginBottom: '6px' }}>
                📱 Mobile & Touch Controls
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selected.instructions.controls.mobile.map((c, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                    <span style={{ color: '#f472b6', fontWeight: '700' }}>{c.touch}</span>
                    <span style={{ color: '#cbd5e1', textAlign: 'right', marginLeft: '10px' }}>{c.action}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: '#fbbf24', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <IconBulb size='0.9em' color='#fbbf24' /> Pro Tips
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: '#94a3b8', fontSize: '0.8rem', lineHeight: '1.5' }}>
                {selected.instructions.tips.slice(0, 2).map((tip, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Game iframe fills remaining viewport */}
        <iframe
          src={selected.url}
          style={{ flex: 1, width: '100%', border: 'none', display: 'block' }}
          title={selected.title}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        background: 'radial-gradient(ellipse at top, #101035 0%, #050510 60%, #03030a 100%)',
        padding: '50px 20px 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: '#fff',
      }}
    >
      {/* Page Header */}
      <div style={{ textAlign: 'center', marginBottom: '48px', maxWidth: '650px' }}>
        <div style={{ fontSize: '3.2rem', marginBottom: '12px', filter: 'drop-shadow(0 0 20px rgba(0,221,255,0.4))' }}>🎮</div>
        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.2rem)',
            fontWeight: '900',
            background: 'linear-gradient(90deg, #0df 0%, #a855f7 50%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
          }}
        >
          Chill & Arcade Zone
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: '1.6', margin: '0 auto' }}>
          Take a breather! Enjoy casual arcade games complete with full mobile touch and responsive keyboard controls.
        </p>
      </div>

      {/* Top Banner: Warning when no exam completed or timer expired */}
      {!hasValidTimer && (
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '14px 20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.6rem' }}><IconLock size='1.6rem' color='#fca5a5' /></span>
            <div>
              <div style={{ fontWeight: '800', color: '#fca5a5', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
                EXAM ACCESS REQUIRED
              </div>
              <div style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                Only after completing an exam can you unlock and play games in the Chill & Arcade Zone (10-minute session).
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
              color: '#fff',
              border: 'none',
              borderRadius: '30px',
              padding: '8px 20px',
              fontSize: '0.85rem',
              fontWeight: '800',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <IconClipboard size='1em' color='currentColor' style={{ marginRight: '6px' }} /> Start an Exam Now
          </button>
        </div>
      )}

      {/* Live Timer Banner when valid exam session active */}
      {hasValidTimer && secondsRemaining !== null && (
        <div style={{
          width: '100%',
          maxWidth: '960px',
          background: secondsRemaining < 120 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 221, 255, 0.08)',
          border: `1px solid ${secondsRemaining < 120 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 221, 255, 0.3)'}`,
          borderRadius: '16px',
          padding: '12px 20px',
          marginBottom: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: `0 0 25px ${secondsRemaining < 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 221, 255, 0.15)'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}><IconClock size='1.4rem' color={secondsRemaining < 120 ? '#fca5a5' : '#0df'} /></span>
            <div>
              <span style={{ fontWeight: '800', color: secondsRemaining < 120 ? '#fca5a5' : '#0df', fontSize: '0.92rem' }}>
                POST-EXAM CHILL SESSION ACTIVE:
              </span>
              <span style={{ color: '#cbd5e1', fontSize: '0.85rem', marginLeft: '8px' }}>
                You have {formatCountdown(secondsRemaining)} remaining before returning to your results.
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/results')}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#fff',
              borderRadius: '30px',
              padding: '6px 16px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'; }}
          >
            <IconBarChart size='1em' color='currentColor' style={{ marginRight: '6px' }} /> Return to Results
          </button>
        </div>
      )}

      {/* Main Games Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          width: '100%',
          maxWidth: '960px',
        }}
      >
        {games.map((game) => (
          <div
            key={game.id}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '32px 26px',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backdropFilter: 'blur(16px)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.borderColor = `${game.accent}66`;
              e.currentTarget.style.boxShadow = `0 20px 50px ${game.accent}22`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Ambient Background Glow */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              right: '-50px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${game.accent}25, transparent 70%)`,
              pointerEvents: 'none',
            }} />

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '3.5rem' }}>{game.emoji}</div>
                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: `${game.accent}15`,
                  color: game.accent,
                  border: `1px solid ${game.accent}44`,
                }}>
                  Responsive & Ready
                </span>
              </div>

              <h2 style={{
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: '800',
                marginBottom: '6px',
                letterSpacing: '0.5px',
              }}>
                {game.title}
              </h2>
              <div style={{ color: game.accent, fontSize: '0.85rem', fontWeight: '600', marginBottom: '14px' }}>
                {game.tagline}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: '1.6', marginBottom: '24px' }}>
                {game.description}
              </p>

              {/* Quick Controls Snapshot Pill */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '24px',
              }}>
                <span style={{ background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  ⌨️ WASD / Arrows
                </span>
                <span style={{ background: 'rgba(255,255,255,0.06)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  📱 Touch Drag & Tap
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleAttemptPlay(game)}
                style={{
                  flex: 1.4,
                  background: `linear-gradient(135deg, ${game.accent}, #0055ff)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50px',
                  padding: '12px 20px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  boxShadow: `0 0 20px ${game.accent}33`,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                ▶ Play Now
              </button>

              <button
                onClick={() => setActiveInstructionGame(game)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0',
                  borderRadius: '50px',
                  padding: '12px 16px',
                  fontSize: '0.88rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.borderColor = game.accent;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                }}
              >
                📖 How to Play
              </button>
            </div>
          </div>
        ))}

        {/* Coming Soon Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '36px 28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '260px',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '14px', opacity: 0.5 }}><IconZap size='3rem' color='#0df' /></div>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', fontWeight: '700', margin: '0 0 6px 0' }}>More Arcade Classics In Development</p>
          <p style={{ color: '#475569', fontSize: '0.85rem', maxWidth: '280px', margin: 0 }}>
            Stay tuned for upcoming puzzle and retro action games designed for all devices.
          </p>
        </div>
      </div>

      {/* ⏰ POPUP 1: Time Limit in Arcade Zone Exceeded */}
      {isTimeExceeded && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 2, 8, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #180a0a 0%, #0d0714 100%)',
              border: '2px solid rgba(239, 68, 68, 0.6)',
              boxShadow: '0 0 80px rgba(239, 68, 68, 0.35)',
              borderRadius: '28px',
              maxWidth: '480px',
              width: '100%',
              padding: '48px 36px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '16px', filter: 'drop-shadow(0 0 20px rgba(239,68,68,0.5))' }}>
              <IconClock size='4rem' color='#f87171' />
            </div>

            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: '900',
                color: '#f87171',
                marginBottom: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Time Limit in the Arcade Zone Exceeded
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Your 10-minute chill session has concluded. It's time to review your assessment results!
            </p>

            <button
              onClick={() => navigate('/results')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '16px 28px',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <IconBarChart size='1em' color='currentColor' style={{ marginRight: '6px' }} /> Return to My Result
            </button>
          </div>
        </div>
      )}

      {/* 🔒 POPUP 2: Access Without Completing Exam -> Only Button to Start Exam */}
      {showNoExamModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(2, 2, 8, 0.94)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #0e1222 0%, #080a14 100%)',
              border: '2px solid rgba(0, 221, 255, 0.5)',
              boxShadow: '0 0 80px rgba(0, 221, 255, 0.25)',
              borderRadius: '28px',
              maxWidth: '480px',
              width: '100%',
              padding: '48px 36px',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
              <div style={{ fontSize: '4rem', marginBottom: '16px', filter: 'drop-shadow(0 0 20px rgba(0,221,255,0.5))' }}>
                <IconLock size='4rem' color='#0df' />
            </div>

            <h2
              style={{
                fontSize: '1.6rem',
                fontWeight: '900',
                background: 'linear-gradient(90deg, #0df, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px',
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              Exam Required
            </h2>

            <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.6', marginBottom: '32px' }}>
              Only after completing an exam can you play games in the Chill & Arcade Zone. Start an assessment now to unlock your 10-minute arcade session!
            </p>

            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #0df, #0055ff)',
                color: '#fff',
                border: 'none',
                borderRadius: '50px',
                padding: '16px 28px',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 0 30px rgba(0, 221, 255, 0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <IconClipboard size='1em' color='currentColor' style={{ marginRight: '6px' }} /> Start an Exam
            </button>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ marginTop: '50px', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/results')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#64748b',
            padding: '10px 28px',
            borderRadius: '30px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; }}
        >
          <IconBarChart size='1em' color='currentColor' style={{ marginRight: '6px' }} /> Go to Results instead
        </button>
      </div>
    </div>
  );
};

export default GamesPage;
