export type DuplicateComparableEvent = {
  title: string;
  date: string;
  time: string;
  address: string;
};

export type EventDuplicateMatch<T extends DuplicateComparableEvent> = {
  event: T;
  reason: string;
};

export const findEventDuplicateMatches = <T extends DuplicateComparableEvent>(
  event: DuplicateComparableEvent,
  existingEvents: T[],
): EventDuplicateMatch<T>[] => {
  if (!event.title || !event.date) return [];

  const titleKey = normalizeEventComparable(event.title);
  const addressKey = normalizeEventComparable(event.address);
  const timeKey = normalizeEventTime(event.time);

  return existingEvents
    .map((existingEvent) => {
      const sameTitleAndDate = normalizeEventComparable(existingEvent.title) === titleKey && existingEvent.date === event.date;
      const samePlaceAndTime = Boolean(addressKey)
        && normalizeEventComparable(existingEvent.address) === addressKey
        && existingEvent.date === event.date
        && normalizeEventTime(String(existingEvent.time).slice(0, 5)) === timeKey;

      if (sameTitleAndDate) return { event: existingEvent, reason: '同标题同日期' };
      if (samePlaceAndTime) return { event: existingEvent, reason: '同日期同时间同地址' };
      return null;
    })
    .filter((match): match is EventDuplicateMatch<T> => Boolean(match));
};

const normalizeEventTime = (value: string) => {
  const trimmed = value.trim();
  if (/^\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2})[:：](\d{2})/);
  if (!match) return trimmed;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
};

const normalizeEventComparable = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，,。.\-—_·]/g, '');
