import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Play, Square, Zap, Box, Waves, Palette, Info, X, EyeOff, Eye } from 'lucide-react';
import { useAudioAnalyzer } from './hooks/useAudioAnalyzer';
import { Visualizer } from './components/Visualizers';

type Mode = 'pure' | 'cubic' | 'waves';

export default function App() {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<Mode>('pure');
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [sensitivity, setSensitivity] = useState(1.0);
  
  const audioData = useAudioAnalyzer(isActive);

  const toggleActive = () => setIsActive(!isActive);

  const modes = [
    { id: 'pure', icon: Zap, label: 'Pure Strobo' },
    { id: 'cubic', icon: Box, label: 'Cubic Chaos' },
    { id: 'waves', icon: Waves, label: 'Dancing Waves' },
  ];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      {/* Background Visualizer */}
      <Visualizer audioData={audioData} mode={mode} sensitivity={sensitivity} />

      {/* Overlay UI */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 flex flex-col justify-between p-6 md:p-10 pointer-events-none"
          >
            {/* Header */}
            <div className="flex justify-between items-start pointer-events-auto">
              <div>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase italic">
                  MichiStrobe
                </h1>
                <p className="text-xs md:text-sm font-mono opacity-50 uppercase tracking-widest mt-2">
                  Music Reactive Visual Engine v1.0
                </p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setShowControls(false)}
                  className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors"
                  title="Hide UI"
                >
                  <EyeOff className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Center Play Button (if not active) */}
            {!isActive && (
              <div className="flex-1 flex items-center justify-center pointer-events-auto">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleActive}
                  className="w-32 h-32 md:w-48 md:h-48 bg-white text-black rounded-full flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.3)]"
                >
                  <Play className="w-12 h-12 md:w-20 md:h-20 fill-current" />
                  <span className="mt-2 font-bold uppercase tracking-tighter">Start Pulse</span>
                </motion.button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="space-y-6 pointer-events-auto max-w-2xl mx-auto w-full">
              {/* Mode Selector */}
              <div className="grid grid-cols-3 gap-4">
                {modes.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id as Mode)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                      mode === m.id 
                        ? 'bg-white text-black border-white' 
                        : 'bg-black/40 backdrop-blur-md border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <m.icon className={`w-6 h-6 mb-2 ${mode === m.id ? 'text-black' : 'text-white'}`} />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-tight">{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Stop / Play Toggle */}
              <div className="flex items-center justify-center bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                <button
                  onClick={toggleActive}
                  className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all font-bold uppercase tracking-tighter ${
                    isActive ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {isActive ? (
                    <>
                      <Square className="w-6 h-6 fill-current" />
                      <span>Stop Engine</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-6 h-6 fill-current" />
                      <span>Start Engine</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Engine Settings</h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">Audio Sensitivity</span>
                    </div>
                    <span className="text-sm font-mono font-bold">{(sensitivity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => setSensitivity(parseFloat(e.target.value))}
                    className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <div className="flex justify-between text-[10px] font-mono opacity-30 uppercase tracking-tighter">
                    <span>Low (Quiet)</span>
                    <span>High (Loud)</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[10px] font-mono opacity-30 uppercase leading-relaxed tracking-widest">
                    Adjust sensitivity to match your environment. Higher values make the engine more reactive to quieter sounds.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hidden Controls Toggle */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-colors z-50"
        >
          <Eye className="w-6 h-6" />
        </button>
      )}

      {/* Status Indicators */}
      {isActive && audioData && (
        <div className="absolute top-6 left-6 pointer-events-none flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Signal Strength</span>
            <div className="flex gap-1 mt-1">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1 h-3 rounded-full transition-colors ${
                    audioData.volume * 5 > i ? 'bg-emerald-400' : 'bg-white/10'
                  }`} 
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info Modal / Hint */}
      <div className="absolute bottom-6 left-6 pointer-events-none hidden md:block">
        <div className="flex items-center gap-2 text-[10px] font-mono opacity-30 uppercase tracking-widest">
          <Info className="w-3 h-3" />
          <span>Optimized for iPad Pro 12.9"</span>
        </div>
      </div>
    </div>
  );
}
