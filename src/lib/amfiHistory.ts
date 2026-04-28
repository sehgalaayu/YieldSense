import { fetchHistoricalNAV } from './amfiApi';

export interface NAVDataPoint {
  date: string;
  nav: number;
  dateFormatted: string;
}

// Get last 365 days of NAV data for a scheme
export const getYearlyNAVHistory = async (
  schemeCode: string
): Promise<NAVDataPoint[]> => {
  try {
    const history = await fetchHistoricalNAV(schemeCode);
    
    // Take last 365 data points, reverse to chronological order
    return history
      .slice(0, 365)
      .reverse()
      .map(d => ({
        date: d.date,
        nav: d.nav,
        dateFormatted: new Date(d.date.split('-').reverse().join('-'))
          .toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      }));
  } catch {
    return [];
  }
};

// Compare Regular vs Direct NAV history
export const getComparisonHistory = async (
  regularSchemeCode: string,
  directSchemeCode: string
): Promise<{
  regular: NAVDataPoint[];
  direct: NAVDataPoint[];
  performanceDiff: number; // Direct outperformance %
}> => {
  const [regularHistory, directHistory] = await Promise.all([
    getYearlyNAVHistory(regularSchemeCode),
    getYearlyNAVHistory(directSchemeCode),
  ]);

  // Calculate performance difference
  let performanceDiff = 0;
  if (regularHistory.length > 0 && directHistory.length > 0) {
    const regularReturn = 
      ((regularHistory[regularHistory.length-1].nav - regularHistory[0].nav) 
      / regularHistory[0].nav) * 100;
    const directReturn = 
      ((directHistory[directHistory.length-1].nav - directHistory[0].nav) 
      / directHistory[0].nav) * 100;
    performanceDiff = parseFloat((directReturn - regularReturn).toFixed(2));
  }

  return { regular: regularHistory, direct: directHistory, performanceDiff };
};
