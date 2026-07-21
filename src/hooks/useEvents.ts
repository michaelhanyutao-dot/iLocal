import { useEffect, useState } from 'react';
import {
  fetchActiveEvents,
  fetchEventById,
  getFallbackEventById,
  getFallbackEvents,
} from '@/lib/events';
import type { Event } from '@/types/event';

export const useEvents = () => {
  const [events, setEvents] = useState<Event[]>(() => getFallbackEvents());
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadEvents = async () => {
      try {
        const remoteEvents = await fetchActiveEvents();
        if (cancelled) return;

        if (remoteEvents.length === 0) {
          setEvents(getFallbackEvents());
          setUsingFallback(true);
          setError('Supabase 暂无活动数据，当前显示 demo 内容');
        } else {
          setEvents(remoteEvents);
          setUsingFallback(false);
          setError(null);
        }
      } catch (loadError) {
        if (cancelled) return;
        console.error('Error loading events:', loadError);
        setEvents(getFallbackEvents());
        setUsingFallback(true);
        setError('Supabase 活动数据暂不可用，当前显示 demo 内容');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadEvents();

    return () => {
      cancelled = true;
    };
  }, []);

  return { events, loading, usingFallback, error };
};

export const useEvent = (eventId?: string) => {
  const [event, setEvent] = useState<Event | null>(() => (eventId ? getFallbackEventById(eventId) : null));
  const [loading, setLoading] = useState(Boolean(eventId));
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setEvent(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadEvent = async () => {
      try {
        const remoteEvent = await fetchEventById(eventId);
        if (cancelled) return;

        if (remoteEvent) {
          setEvent(remoteEvent);
          setUsingFallback(false);
          setError(null);
        } else {
          setEvent(getFallbackEventById(eventId));
          setUsingFallback(true);
          setError('Supabase 未找到该活动，当前尝试显示 demo 内容');
        }
      } catch (loadError) {
        if (cancelled) return;
        console.error('Error loading event:', loadError);
        setEvent(getFallbackEventById(eventId));
        setUsingFallback(true);
        setError('Supabase 活动详情暂不可用，当前尝试显示 demo 内容');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  return { event, loading, usingFallback, error };
};
