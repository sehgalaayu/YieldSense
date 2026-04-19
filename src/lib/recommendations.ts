import { FDProduct, UserProfile } from './types';
import { calculateYield } from './calculator';

export function scoreFD(fd: FDProduct, profile: UserProfile): number {
  const result = calculateYield({
    principal: profile.principal,
    grossRate: fd.grossRate,
    tenorMonths: profile.tenorMonths,
    taxSlab: profile.taxSlab,
    interestType: 'Cumulative',
  });

  const yieldScore = result.effectiveAnnualYield * 10; // Scale yield to points
  
  let safetyScore = 0;
  if (fd.bankType === 'PSU') safetyScore = 100;
  else if (fd.bankType === 'Private') safetyScore = 90;
  else if (fd.bankType === 'SmallFinance') safetyScore = 70;
  else if (fd.bankType === 'NBFC') safetyScore = 60;

  if (fd.dicgcInsured) safetyScore += 10;
  if (fd.rating === 'AAA') safetyScore += 10;

  let score = 0;
  
  switch (profile.goal) {
    case 'MaxYield':
      score = (yieldScore * 0.6) + (safetyScore * 0.2) + (fd.tenor === profile.tenorMonths ? 20 : 0);
      break;
    case 'Safety':
      score = (safetyScore * 0.7) + (yieldScore * 0.3);
      break;
    case 'Balanced':
      score = (yieldScore * 0.5) + (safetyScore * 0.5);
      break;
    default:
      score = (yieldScore * 0.5) + (safetyScore * 0.5);
  }

  return Math.min(10, score / 15); // Normalize to 1-10
}

export function getRecommendations(products: FDProduct[], profile: UserProfile): FDProduct[] {
  return products
    .filter(p => p.tenor === profile.tenorMonths || Math.abs(p.tenor - profile.tenorMonths) <= 6)
    .map(p => ({ ...p, score: scoreFD(p, profile) }))
    .sort((a: any, b: any) => b.score - a.score);
}
