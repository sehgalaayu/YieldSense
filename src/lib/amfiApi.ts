// Fetch current NAV for a scheme code
export const fetchCurrentNAV = async (schemeCode: string): Promise<number | null> => {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
    const data = await res.json();
    if (data.status === 'SUCCESS' && data.data?.[0]?.nav) {
      return parseFloat(data.data[0].nav);
    }
    return null;
  } catch {
    return null;
  }
};

// Fetch historical NAV for returns calculation (last 365 days)
export const fetchHistoricalNAV = async (schemeCode: string): Promise<{date: string, nav: number}[]> => {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    const data = await res.json();
    if (data.status === 'SUCCESS') {
      return data.data.slice(0, 365).map((d: any) => ({
        date: d.date,
        nav: parseFloat(d.nav)
      }));
    }
    return [];
  } catch {
    return [];
  }
};

// Calculate 1Y return from historical NAV
export const calculate1YReturn = (historicalData: {date: string, nav: number}[]): number | null => {
  if (historicalData.length < 2) return null;
  const latestNAV = historicalData[0].nav;
  // Find NAV closest to 365 days ago
  const oneYearAgoNAV = historicalData[historicalData.length - 1].nav;
  return parseFloat((((latestNAV - oneYearAgoNAV) / oneYearAgoNAV) * 100).toFixed(2));
};

let cachedAmfiList: {schemeCode: string, schemeName: string}[] | null = null;

// Search AMFI fund list (full list of all schemes)
export const searchAMFIFunds = async (query: string): Promise<{schemeCode: string, schemeName: string}[]> => {
  try {
    if (!cachedAmfiList) {
      const res = await fetch('https://api.mfapi.in/mf');
      cachedAmfiList = await res.json();
    }
    const q = query.toLowerCase();
    return (cachedAmfiList || [])
      .filter((f: any) => f.schemeName.toLowerCase().includes(q))
      .slice(0, 10)
      .map((f: any) => ({
        schemeCode: String(f.schemeCode),
        schemeName: f.schemeName
      }));
  } catch {
    return [];
  }
};
