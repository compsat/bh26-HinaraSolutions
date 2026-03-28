import type { ApplianceType } from './types';

export interface ApplianceDefault {
  label: string;
  emoji: string;
  wattage: number;
  defaultHours: number;
  isAlwaysOn: boolean;
}

export const APPLIANCE_DEFAULTS: Record<ApplianceType, ApplianceDefault> = {
  ac:               { label: 'Air Conditioner',   emoji: '❄️', wattage: 1119, defaultHours: 8,    isAlwaysOn: false },
  refrigerator:     { label: 'Refrigerator',      emoji: '🧊', wattage: 150,  defaultHours: 24,   isAlwaysOn: true },
  electric_fan:     { label: 'Electric Fan',      emoji: '🌀', wattage: 75,   defaultHours: 10,   isAlwaysOn: false },
  washing_machine:  { label: 'Washing Machine',   emoji: '🧺', wattage: 500,  defaultHours: 1,    isAlwaysOn: false },
  rice_cooker:      { label: 'Rice Cooker',       emoji: '🍚', wattage: 800,  defaultHours: 1,    isAlwaysOn: false },
  microwave:        { label: 'Microwave',         emoji: '🍲', wattage: 1000, defaultHours: 0.5,  isAlwaysOn: false },
  tv:               { label: 'Television',        emoji: '📺', wattage: 100,  defaultHours: 5,    isAlwaysOn: false },
  computer:         { label: 'Computer / Laptop', emoji: '💻', wattage: 200,  defaultHours: 6,    isAlwaysOn: false },
  water_heater:     { label: 'Water Heater',      emoji: '🚿', wattage: 1500, defaultHours: 0.5,  isAlwaysOn: false },
  lighting:         { label: 'LED Lighting',      emoji: '💡', wattage: 10,   defaultHours: 8,    isAlwaysOn: false },
  flat_iron:        { label: 'Flat Iron',         emoji: '👔', wattage: 1000, defaultHours: 0.5,  isAlwaysOn: false },
  water_dispenser:  { label: 'Water Dispenser',   emoji: '🚰', wattage: 100,  defaultHours: 24,   isAlwaysOn: true },
  router:           { label: 'Router / Modem',    emoji: '📡', wattage: 12,   defaultHours: 24,   isAlwaysOn: true },
  other:            { label: 'Other',             emoji: '🔌', wattage: 100,  defaultHours: 1,    isAlwaysOn: false },
};

export const DEFAULT_RATE_PER_KWH = 11.8569;
export const PH_GRID_EMISSION_FACTOR = 0.7; // kg CO2 per kWh
export const DEFAULT_MONTHLY_BUDGET = 4000;

// Map signup IDs to our appliance_type enum
export const SIGNUP_ID_MAP: Record<string, ApplianceType> = {
  fridge: 'refrigerator',
  ac: 'ac',
  washer: 'washing_machine',
  tv: 'tv',
  microwave: 'microwave',
  computer: 'computer',
  lights: 'lighting',
  lighting: 'lighting',
  electric_fan: 'electric_fan',
  rice_cooker: 'rice_cooker',
  water_heater: 'water_heater',
  flat_iron: 'flat_iron',
  water_dispenser: 'water_dispenser',
  router: 'router',
};

export const ALL_APPLIANCE_TYPES: ApplianceType[] = [
  'ac', 'refrigerator', 'electric_fan', 'washing_machine', 'rice_cooker',
  'microwave', 'tv', 'computer', 'water_heater', 'lighting',
  'flat_iron', 'water_dispenser', 'router', 'other',
];
