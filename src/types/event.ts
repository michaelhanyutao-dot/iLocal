export interface EventLocation {
  address: string;
  lat: number;
  lng: number;
  district: string;
}

export interface EventTicket {
  isFree: boolean;
  price?: number;
  ticketUrl?: string;
}

export type EventCategory = 'music' | 'market' | 'party' | 'exhibition' | 'bar' | 'sports';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  time: string;
  location: EventLocation;
  ticket: EventTicket;
  coverImage: string;
  organizer: string;
  tags: string[];
  attendees: number;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface FilterOptions {
  categories: EventCategory[];
  timeWindow: 'today' | 'tonight' | 'weekend' | 'all';
  maxDistance?: number;
}