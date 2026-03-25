import { memo, useState, useEffect } from 'react';
import { Home, Compass, PlusSquare, Flame, User } from 'lucide-react';
import { Screen } from "../App";

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  isHidden?: boolean;
  userAvatar?: string;
  onScrollToTop?: () => void;
}

export const BottomNav = memo(function BottomNav({ currentScreen, onNavigate, isHidden, userAvatar, onScrollToTop }: BottomNavProps) {
  const [tappedScreen, setTappedScreen] = useState<Screen | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>(currentScreen);

  useEffect(() => {
    if (currentScreen !== prevScreen) {
      setPrevScreen(currentScreen);
    }
  }, [currentScreen]);

  if (['create', 'story', 'messages', 'camera', 'vibecheck', 'spotlight', 'discover', 'viberecap'].includes(currentScreen as string) || isHidden) return null;

  const navItems: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: 'home',        icon: <Home        size={24} strokeWidth={2.5} />, label: 'Home' },
    { screen: 'leaderboard', icon: <Flame       size={24} strokeWidth={2.5} />, label: 'Trending' },
    { screen: 'create',      icon: <PlusSquare  size={24} strokeWidth={2.5} className="text-foreground" />, label: 'Create' },
    { screen: 'venture',     icon: <Compass     size={24} strokeWidth={2.5} />, label: 'Explore' },
  ];

  const handleTap = (screen: Screen) => {
    if (screen === 'home' && currentScreen === 'home' && onScrollToTop) {
      onScrollToTop();
      setTappedScreen(screen);
      setTimeout(() => setTappedScreen(null), 400);
      return;
    }
    setTappedScreen(screen);
    onNavigate(screen);
    setTimeout(() => setTappedScreen(null), 400);
  };

  return (
    /* The nav bar itself is on its own GPU layer so the repaint never bleeds up */
    <div
      className="fixed bottom-0 left-0 right-0 bg-background border-t-4 border-foreground px-4 pt-4 z-50 w-full"
      style={{
        paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))',
        paddingLeft: 'calc(1rem + env(safe-area-inset-left))',
        paddingRight: 'calc(1rem + env(safe-area-inset-right))',
        boxShadow: '0px -4px 0px 0px rgba(0,0,0,0.1)',
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        contain: 'layout paint',
      }}
    >
      <div className="flex items-center justify-around max-w-xl mx-auto">
        {navItems.map(({ screen, icon, label }) => {
          const isActive  = currentScreen === screen;
          const isCreate  = screen === 'create';
          return (
            <button
              key={screen}
              onClick={() => handleTap(screen)}
              aria-label={label}
              className={`relative flex flex-col items-center justify-center w-14 h-14 border-2 border-foreground rounded-xl active:scale-90 ${
                isCreate
                  ? 'bg-background shadow-[4px_4px_0px_0px_var(--foreground)]'
                  : isActive
                    ? 'bg-foreground text-background shadow-[2px_2px_0px_0px_var(--background)] translate-x-[1px] translate-y-[1px]'
                    : 'bg-background text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]'
              }`}
              style={{
                transition: 'transform 0.12s cubic-bezier(.22,.68,0,1.2), box-shadow 0.12s ease, background-color 0.12s ease',
                willChange: 'transform',
              }}
            >
              <div className={tappedScreen === screen ? 'nav-icon-bounce' : ''}>
                {icon}
              </div>

              {/* Active indicator dot */}
              {isActive && !isCreate && (
                <div
                  className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-1 bg-background border border-foreground rounded-full"
                  style={{ animation: 'navDotPop 0.3s cubic-bezier(.22,.68,0,1.2) both' }}
                />
              )}

              {/* Create pulse ring */}
              {isCreate && (
                <div className="absolute inset-0 rounded-xl" style={{ animation: 'pulseRing 2.5s ease-out infinite' }} />
              )}
            </button>
          );
        })}

        {/* Profile Tab */}
        <button
          onClick={() => handleTap('profile')}
          aria-label="Profile"
          className={`relative flex flex-col items-center justify-center w-14 h-14 border-2 border-foreground rounded-xl overflow-hidden active:scale-90 ${
            currentScreen === 'profile'
              ? 'shadow-[2px_2px_0px_0px_var(--background)] translate-x-[1px] translate-y-[1px] ring-2 ring-background'
              : 'bg-card text-foreground shadow-[4px_4px_0px_0px_var(--foreground)]'
          }`}
          style={{
            transition: 'transform 0.12s cubic-bezier(.22,.68,0,1.2), box-shadow 0.12s ease',
            willChange: 'transform',
          }}
        >
          <div className={tappedScreen === 'profile' ? 'nav-icon-bounce w-full h-full' : 'w-full h-full'}>
            {userAvatar ? (
              <img
                src={userAvatar}
                alt="Profile"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary/40">
                <User size={24} strokeWidth={2} className="text-foreground/50" />
              </div>
            )}
          </div>
          {currentScreen === 'profile' && (
            <div
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-1 bg-background border border-foreground rounded-full"
              style={{ animation: 'navDotPop 0.3s cubic-bezier(.22,.68,0,1.2) both' }}
            />
          )}
        </button>
      </div>
    </div>
  );
});
