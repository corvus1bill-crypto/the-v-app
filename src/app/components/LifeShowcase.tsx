import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { FloatingParticles } from './FloatingParticles';
import { AnimatedButton } from './AnimatedButton';
import { PulsatingGlow } from './PulsatingGlow';
import { ShimmerLoader, ShimmerCard } from './ShimmerLoader';
import { TouchRipple } from './TouchRipple';
import { AnimatedCounter, formatCount } from './AnimatedCounter';
import { GlitchText } from './GlitchText';
import { DynamicBackground } from './DynamicBackground';
import { LiveIndicator } from './LiveIndicator';

interface LifeShowcaseProps {
  onClose: () => void;
}

export function LifeShowcase({ onClose }: LifeShowcaseProps) {
  const [counter, setCounter] = useState(1234);
  const [bgVariant, setBgVariant] = useState<'grid' | 'gradient' | 'dots' | 'waves'>('grid');

  return (
    <motion.div
      className="absolute inset-0 z-[100] bg-background overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dynamic Background Demo */}
      <DynamicBackground variant={bgVariant} animate={true} />
      <FloatingParticles count={15} color="var(--primary)" />

      <div className="relative z-10 p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <GlitchText intensity="medium">
            <h1 className="text-4xl font-black">LIFE SHOWCASE</h1>
          </GlitchText>
          <button
            onClick={onClose}
            className="p-2 bg-black text-white border-4 border-black hover:bg-primary transition-colors"
          >
            <X size={24} strokeWidth={3} />
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-8">
          {/* Animated Buttons */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">ANIMATED BUTTONS</h2>
            <div className="flex flex-wrap gap-4">
              <AnimatedButton variant="primary" onClick={() => alert('Primary!')}>
                Primary Button
              </AnimatedButton>
              <AnimatedButton variant="secondary" onClick={() => alert('Secondary!')}>
                Secondary Button
              </AnimatedButton>
              <AnimatedButton variant="ghost" onClick={() => alert('Ghost!')}>
                Ghost Button
              </AnimatedButton>
            </div>
          </section>

          {/* Pulsating Glow */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">PULSATING GLOW</h2>
            <div className="flex flex-wrap gap-8">
              <PulsatingGlow color="#ff7a2e" intensity="low">
                <div className="w-24 h-24 bg-black border-4 border-black flex items-center justify-center text-white font-black">
                  LOW
                </div>
              </PulsatingGlow>
              <PulsatingGlow color="#ff7a2e" intensity="medium">
                <div className="w-24 h-24 bg-black border-4 border-black flex items-center justify-center text-white font-black">
                  MED
                </div>
              </PulsatingGlow>
              <PulsatingGlow color="#ff7a2e" intensity="high">
                <div className="w-24 h-24 bg-black border-4 border-black flex items-center justify-center text-white font-black">
                  HIGH
                </div>
              </PulsatingGlow>
            </div>
          </section>

          {/* Touch Ripple */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">TOUCH RIPPLE</h2>
            <div className="flex flex-wrap gap-4">
              <TouchRipple className="border-4 border-black">
                <div className="w-40 h-40 bg-primary flex items-center justify-center text-black font-black">
                  TAP ME!
                </div>
              </TouchRipple>
              <TouchRipple className="border-4 border-black" color="#22c55e">
                <div className="w-40 h-40 bg-black text-white flex items-center justify-center font-black">
                  TAP ME TOO!
                </div>
              </TouchRipple>
            </div>
          </section>

          {/* Animated Counter */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">ANIMATED COUNTER</h2>
            <div className="space-y-4">
              <div className="text-6xl font-black">
                <AnimatedCounter value={counter} />
              </div>
              <div className="flex gap-2">
                <AnimatedButton onClick={() => setCounter(c => c + 100)}>+100</AnimatedButton>
                <AnimatedButton onClick={() => setCounter(c => c + 1000)}>+1K</AnimatedButton>
                <AnimatedButton variant="secondary" onClick={() => setCounter(0)}>Reset</AnimatedButton>
              </div>
              <p className="text-sm font-mono">
                Formatted: <AnimatedCounter value={counter} formatter={formatCount} />
              </p>
            </div>
          </section>

          {/* Live Indicator */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">LIVE INDICATOR</h2>
            <div className="flex flex-wrap items-center gap-8">
              <LiveIndicator size="sm" label="LIVE" />
              <LiveIndicator size="md" label="STREAMING" color="#22c55e" />
              <LiveIndicator size="lg" label="ON AIR" color="#ef4444" />
            </div>
          </section>

          {/* Glitch Text */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">GLITCH TEXT</h2>
            <div className="space-y-4">
              <GlitchText intensity="low" className="text-2xl font-black">
                Low Intensity Glitch
              </GlitchText>
              <GlitchText intensity="medium" className="text-2xl font-black">
                Medium Intensity Glitch
              </GlitchText>
              <GlitchText intensity="high" className="text-2xl font-black">
                High Intensity Glitch
              </GlitchText>
            </div>
          </section>

          {/* Shimmer Loader */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">SHIMMER LOADER</h2>
            <div className="space-y-4">
              <ShimmerCard />
              <div className="flex gap-4">
                <ShimmerLoader width="150px" height="150px" className="border-4 border-black" />
                <div className="flex-1 space-y-2">
                  <ShimmerLoader width="100%" height="20px" className="border-2 border-black" />
                  <ShimmerLoader width="80%" height="20px" className="border-2 border-black" />
                  <ShimmerLoader width="60%" height="20px" className="border-2 border-black" />
                </div>
              </div>
            </div>
          </section>

          {/* Background Variants */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">BACKGROUND VARIANTS</h2>
            <div className="flex flex-wrap gap-2">
              <AnimatedButton 
                variant={bgVariant === 'grid' ? 'primary' : 'ghost'}
                onClick={() => setBgVariant('grid')}
              >
                Grid
              </AnimatedButton>
              <AnimatedButton 
                variant={bgVariant === 'gradient' ? 'primary' : 'ghost'}
                onClick={() => setBgVariant('gradient')}
              >
                Gradient
              </AnimatedButton>
              <AnimatedButton 
                variant={bgVariant === 'dots' ? 'primary' : 'ghost'}
                onClick={() => setBgVariant('dots')}
              >
                Dots
              </AnimatedButton>
              <AnimatedButton 
                variant={bgVariant === 'waves' ? 'primary' : 'ghost'}
                onClick={() => setBgVariant('waves')}
              >
                Waves
              </AnimatedButton>
            </div>
          </section>

          {/* Floating Particles Info */}
          <section className="border-4 border-black bg-white p-6">
            <h2 className="text-2xl font-black mb-4">FLOATING PARTICLES</h2>
            <p className="font-mono text-sm">
              Ambient particles float in the background throughout the entire app, adding subtle
              life and movement to create a more dynamic and engaging experience.
            </p>
          </section>
        </div>

        <div className="mt-8 text-center">
          <AnimatedButton variant="primary" onClick={onClose}>
            Close Showcase
          </AnimatedButton>
        </div>
      </div>
    </motion.div>
  );
}