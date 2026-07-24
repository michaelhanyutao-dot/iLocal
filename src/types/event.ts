export interface EventLocation {
  address: string;
  lat: number;
  lng: number;
  district: string;
  accuracy: LocationAccuracy;
  note?: string;
  verifiedAt?: string;
}

export interface EventTicket {
  isFree: boolean;
  price?: number;
  ticketUrl?: string;
}

export type EventCategory = 'coffee' | 'music' | 'market' | 'party' | 'exhibition' | 'bar' | 'sports';
export type LocationAccuracy = 'precise' | 'area' | 'unverified';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  date: string;
  dateLabel?: string;
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
