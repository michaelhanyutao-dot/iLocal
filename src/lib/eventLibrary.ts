import { useEffect, useMemo, useState } from 'react';

type EventBucket = 'saved' | 'liked' | 'planned';

const storageKeys: Record<EventBucket, string> = {
  saved: 'ilocal.savedEvents',
  liked: 'ilocal.likedEvents',
  planned: 'ilocal.plannedEvents',
};

const readIds = (bucket: EventBucket): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(storageKeys[bucket]);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const writeIds = (bucket: EventBucket, ids: string[]) => {
  window.localStorage.setItem(storageKeys[bucket], JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent('ilocal:event-library-change'));
};

export const toggleEventId = (bucket: EventBucket, eventId: string) => {
  const current = readIds(bucket);
  const next = current.includes(eventId)
    ? current.filter((id) => id !== eventId)
    : [eventId, ...current];

  writeIds(bucket, next);
  return next.includes(eventId);
};

export const useEventLibrary = () => {
  const [savedIds, setSavedIds] = useState<string[]>(() => readIds('saved'));
  const [likedIds, setLikedIds] = useState<string[]>(() => readIds('liked'));
  const [plannedIds, setPlannedIds] = useState<string[]>(() => readIds('planned'));

  useEffect(() => {
    const sync = () => {
      setSavedIds(readIds('saved'));
      setLikedIds(readIds('liked'));
      setPlannedIds(readIds('planned'));
    };

    window.addEventListener('storage', sync);
    window.addEventListener('ilocal:event-library-change', sync);

    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('ilocal:event-library-change', sync);
    };
  }, []);

  return useMemo(
    () => ({
      savedIds,
      likedIds,
      plannedIds,
      isSaved: (eventId: string) => savedIds.includes(eventId),
      isLiked: (eventId: string) => likedIds.includes(eventId),
      isPlanned: (eventId: string) => plannedIds.includes(eventId),
      toggleSaved: (eventId: string) => toggleEventId('saved', eventId),
      toggleLiked: (eventId: string) => toggleEventId('liked', eventId),
      togglePlanned: (eventId: string) => toggleEventId('planned', eventId),
    }),
    [likedIds, plannedIds, savedIds],
  );
};
