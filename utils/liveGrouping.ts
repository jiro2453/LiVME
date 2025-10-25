import type { Live, LiveGroup } from '../types';

export const isPastLive = (date: string): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const liveDate = new Date(date);
  liveDate.setHours(0, 0, 0, 0);
  return liveDate < today;
};

export const groupLivesByMonth = (lives: Live[]): LiveGroup => {
  const groups: LiveGroup = {};

  lives.forEach(live => {
    const date = new Date(live.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}年${month}月`;

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(live);
  });

  // Sort each group by date
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  return groups;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}年${month}月${day}日`;
};

export const formatDateTime = (dateString: string, timeString?: string): string => {
  let formatted = formatDate(dateString);
  if (timeString) {
    formatted += ` ${timeString}`;
  }
  return formatted;
};
