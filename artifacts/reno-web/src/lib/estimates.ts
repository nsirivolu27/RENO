import { Concept } from './concepts';

export interface EstimatePreview {
  low: number;
  high: number;
  categories: {
    furniture: [number, number];
    lighting: [number, number];
    flooring: [number, number];
    walls: [number, number];
    fixtures: [number, number];
    labor: [number, number];
  };
  isRestyle: boolean;
}

export function generateEstimate(concept: Concept): EstimatePreview {
  const isRestyle = concept.scope === 'Restyle';
  const isLuxury = concept.style === 'Luxury';
  
  let mult = isLuxury ? 1.5 : 1.0;
  if (concept.room === 'Kitchen') mult *= 1.8;
  if (concept.room === 'Bathroom') mult *= 1.4;

  const budgetNum = parseInt((concept.budget || '').replace(/[^0-9]/g, '')) * 1000;
  const base = budgetNum > 0 ? budgetNum : (isRestyle ? 8000 : 25000);
  
  // deterministic drift based on ID
  const idHash = concept.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const drift = (idHash % 20) / 100; // 0 to 0.2
  
  const targetLow = base * mult * (1 + drift);
  const targetHigh = targetLow * 1.3;

  const categories = {
    furniture: [targetLow * 0.4, targetHigh * 0.4] as [number, number],
    lighting: [targetLow * 0.1, targetHigh * 0.1] as [number, number],
    flooring: (isRestyle ? [0, 0] : [targetLow * 0.15, targetHigh * 0.15]) as [number, number],
    walls: (isRestyle ? [targetLow * 0.05, targetHigh * 0.05] : [targetLow * 0.1, targetHigh * 0.1]) as [number, number],
    fixtures: (isRestyle ? [0, 0] : [targetLow * 0.15, targetHigh * 0.15]) as [number, number],
    labor: (isRestyle ? [targetLow * 0.1, targetHigh * 0.1] : [targetLow * 0.25, targetHigh * 0.25]) as [number, number],
  };

  const low = categories.furniture[0] + categories.lighting[0] + categories.flooring[0] + categories.walls[0] + categories.fixtures[0] + categories.labor[0];
  const high = categories.furniture[1] + categories.lighting[1] + categories.flooring[1] + categories.walls[1] + categories.fixtures[1] + categories.labor[1];

  return { low, high, categories, isRestyle };
}

export function formatCurrency(num: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}