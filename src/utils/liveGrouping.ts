import { Live } from '../types';

// Utility function to group lives by year and month
export const groupLivesByYearMonth = (lives: Live[]) => {
  const grouped: Record<string, Record<string, Live[]>> = {};
  
  lives.forEach(live => {
    const date = new Date(live.date);
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString(); // 0-indexed, so +1
    
    if (!grouped[year]) {
      grouped[year] = {};
    }
    if (!grouped[year][month]) {
      grouped[year][month] = [];
    }
    
    grouped[year][month].push(live);
  });
  
  return grouped;
};

// Utility function to format year/month for display
export const formatYearMonth = (year: string, month: string) => {
  return `${year}年${month}月`;
};