import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

type EventBucket = 'saved' | 'liked' | 'planned';
type EventAction = EventBucket | 'visited';

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
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<string[]>(() => readIds('saved'));
  const [likedIds, setLikedIds] = useState<string[]>(() => readIds('liked'));
  const [plannedIds, setPlannedIds] = useState<string[]>(() => readIds('planned'));

  const syncFromLocalStorage = useCallback(() => {
    setSavedIds(readIds('saved'));
    setLikedIds(readIds('liked'));
    setPlannedIds(readIds('planned'));
  }, []);

  useEffect(() => {
    window.addEventListener('storage', syncFromLocalStorage);
    window.addEventListener('ilocal:event-library-change', syncFromLocalStorage);

    return () => {
      window.removeEventListener('storage', syncFromLocalStorage);
      window.removeEventListener('ilocal:event-library-change', syncFromLocalStorage);
    };
  }, [syncFromLocalStorage]);

  useEffect(() => {
    if (!user) {
      syncFromLocalStorage();
      return;
    }

    let cancelled = false;

    const syncRemoteActions = async () => {
      const { data, error } = await supabase
        .from('event_user_actions')
        .select('event_id, action')
        .eq('user_id', user.id);

      if (cancelled) return;

      if (error) {
        console.error('Error syncing event actions:', error);
        syncFromLocalStorage();
        return;
      }

      const idsByAction: Record<EventBucket, string[]> = {
        saved: [],
        liked: [],
        planned: [],
      };

      data?.forEach((actionRow) => {
        if (actionRow.action === 'saved' || actionRow.action === 'liked' || actionRow.action === 'planned') {
          idsByAction[actionRow.action].push(actionRow.event_id);
        }
      });

      writeIds('saved', idsByAction.saved);
      writeIds('liked', idsByAction.liked);
      writeIds('planned', idsByAction.planned);
      syncFromLocalStorage();
    };

    void syncRemoteActions();

    return () => {
      cancelled = true;
    };
  }, [syncFromLocalStorage, user]);

  const persistRemoteAction = useCallback(
    async (action: EventAction, eventId: string, active: boolean) => {
      if (!user) return;

      if (active) {
        const { error } = await supabase
          .from('event_user_actions')
          .upsert(
            {
              user_id: user.id,
              event_id: eventId,
              action,
            },
            { onConflict: 'user_id,event_id,action' },
          );

        if (error) console.error('Error saving event action:', error);
        return;
      }

      const { error } = await supabase
        .from('event_user_actions')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .eq('action', action);

      if (error) console.error('Error deleting event action:', error);
    },
    [user],
  );

  const toggleBucket = useCallback(
    (bucket: EventBucket, eventId: string) => {
      const active = toggleEventId(bucket, eventId);
      void persistRemoteAction(bucket, eventId, active);
      return active;
    },
    [persistRemoteAction],
  );

  return useMemo(
    () => ({
      savedIds,
      likedIds,
      plannedIds,
      isSaved: (eventId: string) => savedIds.includes(eventId),
      isLiked: (eventId: string) => likedIds.includes(eventId),
      isPlanned: (eventId: string) => plannedIds.includes(eventId),
      toggleSaved: (eventId: string) => toggleBucket('saved', eventId),
      toggleLiked: (eventId: string) => toggleBucket('liked', eventId),
      togglePlanned: (eventId: string) => toggleBucket('planned', eventId),
    }),
    [likedIds, plannedIds, savedIds, toggleBucket],
  );
};
