import type { Airport } from '../types/crm';

export const AIRPORTS: Airport[] = [
  { code: 'TAS', city: 'Tashkent', country: 'Uzbekistan', name: 'Islam Karimov Tashkent International', timezone: 'UTC+5' },
  { code: 'SKD', city: 'Samarkand', country: 'Uzbekistan', name: 'Samarkand International Airport', timezone: 'UTC+5' },
  { code: 'BHK', city: 'Bukhara', country: 'Uzbekistan', name: 'Bukhara International Airport', timezone: 'UTC+5' },
  { code: 'UGC', city: 'Urgench', country: 'Uzbekistan', name: 'Urgench International Airport', timezone: 'UTC+5' },
  { code: 'FEG', city: 'Fergana', country: 'Uzbekistan', name: 'Fergana International Airport', timezone: 'UTC+5' },
  { code: 'IST', city: 'Istanbul', country: 'Turkey', name: 'Istanbul Airport', timezone: 'UTC+3' },
  { code: 'SAW', city: 'Istanbul', country: 'Turkey', name: 'Sabiha Gokcen International', timezone: 'UTC+3' },
  { code: 'AYT', city: 'Antalya', country: 'Turkey', name: 'Antalya Airport', timezone: 'UTC+3' },
  { code: 'DXB', city: 'Dubai', country: 'United Arab Emirates', name: 'Dubai International Airport', timezone: 'UTC+4' },
  { code: 'AUH', city: 'Abu Dhabi', country: 'United Arab Emirates', name: 'Zayed International Airport', timezone: 'UTC+4' },
  { code: 'DOH', city: 'Doha', country: 'Qatar', name: 'Hamad International Airport', timezone: 'UTC+3' },
  { code: 'JED', city: 'Jeddah', country: 'Saudi Arabia', name: 'King Abdulaziz International', timezone: 'UTC+3' },
  { code: 'LHR', city: 'London', country: 'United Kingdom', name: 'London Heathrow Airport', timezone: 'UTC+0' },
  { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle Airport', timezone: 'UTC+1' },
  { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt am Main Airport', timezone: 'UTC+1' },
  { code: 'MUC', city: 'Munich', country: 'Germany', name: 'Munich Airport', timezone: 'UTC+1' },
  { code: 'MXP', city: 'Milan', country: 'Italy', name: 'Milan Malpensa Airport', timezone: 'UTC+1' },
  { code: 'BCN', city: 'Barcelona', country: 'Spain', name: 'Josep Tarradellas Barcelona-El Prat', timezone: 'UTC+1' },
  { code: 'JFK', city: 'New York', country: 'United States', name: 'John F. Kennedy International', timezone: 'UTC-5' },
  { code: 'ALA', city: 'Almaty', country: 'Kazakhstan', name: 'Almaty International Airport', timezone: 'UTC+5' },
  { code: 'NQZ', city: 'Astana', country: 'Kazakhstan', name: 'Nursultan Nazarbayev International', timezone: 'UTC+5' },
  { code: 'BAK', city: 'Baku', country: 'Azerbaijan', name: 'Heydar Aliyev International (GYD)', timezone: 'UTC+4' },
  { code: 'GYD', city: 'Baku', country: 'Azerbaijan', name: 'Heydar Aliyev International', timezone: 'UTC+4' },
  { code: 'TBS', city: 'Tbilisi', country: 'Georgia', name: 'Shota Rustaveli Tbilisi International', timezone: 'UTC+4' },
  { code: 'ICN', city: 'Seoul', country: 'South Korea', name: 'Incheon International Airport', timezone: 'UTC+9' },
  { code: 'BKK', city: 'Bangkok', country: 'Thailand', name: 'Suvarnabhumi Airport', timezone: 'UTC+7' },
  { code: 'HKT', city: 'Phuket', country: 'Thailand', name: 'Phuket International Airport', timezone: 'UTC+7' },
  { code: 'KUL', city: 'Kuala Lumpur', country: 'Malaysia', name: 'Kuala Lumpur International', timezone: 'UTC+8' },
  { code: 'SIN', city: 'Singapore', country: 'Singapore', name: 'Singapore Changi Airport', timezone: 'UTC+8' },
  { code: 'MLE', city: 'Male', country: 'Maldives', name: 'Velana International Airport', timezone: 'UTC+5' },
  { code: 'SSH', city: 'Sharm El Sheikh', country: 'Egypt', name: 'Sharm El Sheikh International', timezone: 'UTC+2' },
];

export function findAirportByCode(code: string): Airport | undefined {
  const upper = code.trim().toUpperCase();
  return AIRPORTS.find((a) => a.code === upper);
}

export function searchAirports(query: string): Airport[] {
  const q = query.trim().toLowerCase();
  if (!q) return AIRPORTS.slice(0, 8);
  return AIRPORTS.filter(
    (a) =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
  ).slice(0, 10);
}
