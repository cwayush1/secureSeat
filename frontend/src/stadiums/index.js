// ─── Stadium registry ─────────────────────────────────────────────────────────
// Add new stadiums here and they'll be auto-available everywhere.

import stad1    from './stad1';
import stad2 from './stad2';
import stad3 from './stad3';

const STADIUMS = {
  wankhede: stad1,
  eden_gardens: stad2,
  ahmedabad: stad3
};

// Look up a stadium by its id string
export function getStadium(id) {
  return STADIUMS[id] ?? null;
}

// All stadiums as an array (useful for dropdowns / listings)
export function getAllStadiums() {
  return Object.values(STADIUMS);
}

// All stadiums with their registry keys (for admin dropdowns)
export function getAllStadiumEntries() {
  return Object.entries(STADIUMS).map(([key, stadium]) => ({ key, ...stadium }));
}

export default STADIUMS;