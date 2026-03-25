import { useCallback } from 'react';
import { soundManager } from '../utils/sounds';

export function useSounds() {
  const play = useCallback((action: keyof typeof soundManager) => {
    if (typeof soundManager[action] === 'function') {
      (soundManager[action] as Function)();
    }
  }, []);

  return {
    play,
    like: useCallback(() => soundManager.like(), []),
    unlike: useCallback(() => soundManager.unlike(), []),
    comment: useCallback(() => soundManager.comment(), []),
    share: useCallback(() => soundManager.share(), []),
    save: useCallback(() => soundManager.save(), []),
    unsave: useCallback(() => soundManager.unsave(), []),
    openModal: useCallback(() => soundManager.openModal(), []),
    closeModal: useCallback(() => soundManager.closeModal(), []),
    navigate: useCallback(() => soundManager.navigate(), []),
    button: useCallback(() => soundManager.button(), []),
    notification: useCallback(() => soundManager.notification(), []),
    message: useCallback(() => soundManager.message(), []),
    refresh: useCallback(() => soundManager.refresh(), []),
    storyOpen: useCallback(() => soundManager.storyOpen(), []),
    storyClose: useCallback(() => soundManager.storyClose(), []),
    storyNext: useCallback(() => soundManager.storyNext(), []),
    storyPrev: useCallback(() => soundManager.storyPrev(), []),
    swipe: useCallback(() => soundManager.swipe(), []),
    delete: useCallback(() => soundManager.delete(), []),
    error: useCallback(() => soundManager.error(), []),
    success: useCallback(() => soundManager.success(), []),
    typing: useCallback(() => soundManager.typing(), []),
    search: useCallback(() => soundManager.search(), []),
    follow: useCallback(() => soundManager.follow(), []),
    unfollow: useCallback(() => soundManager.unfollow(), []),
    post: useCallback(() => soundManager.post(), []),
    setEnabled: useCallback((enabled: boolean) => soundManager.setEnabled(enabled), []),
    isEnabled: useCallback(() => soundManager.isEnabled(), []),
    setVolume: useCallback((volume: number) => soundManager.setVolume(volume), []),
    getVolume: useCallback(() => soundManager.getVolume(), []),
  };
}