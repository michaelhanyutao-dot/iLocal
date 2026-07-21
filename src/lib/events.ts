import barImage from '@/assets/bar-event.jpg';
import exhibitionImage from '@/assets/exhibition-event.jpg';
import marketImage from '@/assets/market-event.jpg';
import musicImage from '@/assets/music-event.jpg';
import partyImage from '@/assets/party-event.jpg';
import { mockEvents } from '@/data/mockEvents';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import type { Event, EventCategory } from '@/types/event';

export type EventRow = Tables<'events'>;
export type EventInsert = TablesInsert<'events'>;
export type EventUpdate = TablesUpdate<'events'>;

type EventWithTags = EventRow & {
  event_tags?: Array<{
    tags: Pick<Tables<'tags'>, 'name'> | null;
  }> | null;
};

const categoryImages: Record<EventCategory, string> = {
  coffee: marketImage,
  music: musicImage,
  market: marketImage,
  party: partyImage,
  exhibition: exhibitionImage,
  bar: barImage,
  sports: marketImage,
};

const eventCategories: EventCategory[] = ['coffee', 'music', 'market', 'party', 'exhibition', 'bar', 'sports'];

export const isEventCategory = (category: string): category is EventCategory =>
  eventCategories.includes(category as EventCategory);

export const formatDateLabel = (date: string) => {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const mapEventRowToEvent = (row: EventWithTags): Event => {
  const category = isEventCategory(row.category) ? row.category : 'market';
  const tags = row.event_tags
    ?.map((eventTag) => eventTag.tags?.name)
    .filter((tag): tag is string => Boolean(tag)) ?? [];

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category,
    date: row.date,
    dateLabel: formatDateLabel(row.date),
    time: row.time?.slice(0, 5) ?? '',
    location: {
      address: row.address,
      lat: Number(row.latitude),
      lng: Number(row.longitude),
      district: row.district ?? '',
    },
    ticket: {
      isFree: row.is_free,
      price: row.price == null ? undefined : Number(row.price),
      ticketUrl: row.ticket_url ?? undefined,
    },
    coverImage: row.cover_image || categoryImages[category],
    organizer: row.organizer ?? 'iLocal',
    tags,
    attendees: row.attendees ?? 0,
  };
};

export const fetchActiveEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_tags(tags(name))')
    .eq('status', 'active')
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((row) => mapEventRowToEvent(row as EventWithTags));
};

export const fetchEventById = async (eventId: string) => {
  const { data, error } = await supabase
    .from('events')
    .select('*, event_tags(tags(name))')
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapEventRowToEvent(data as EventWithTags) : null;
};

export const getFallbackEvents = () => mockEvents;

export const getFallbackEventById = (eventId: string) =>
  mockEvents.find((event) => event.id === eventId) ?? null;
