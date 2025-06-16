import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import fetch from 'node-fetch';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const csvFilePath = join(__dirname, 'asparagus_payload_import.csv');
const apiUrl = `http://192.168.86.250:3000/api/recipes`;


// Known/allowed units
const allowedUnits = new Set(["g", "gr", "oz", "lbs", "ea", "kg", "ml", "l", "tsp", "gal", "tbsp", "cup", "pcs"]);

// Normalization map
const unitMap = {
  //gr: 'g',
};

// Track unexpected units
const unexpectedUnits = new Set();

const importCSV = async () => {
  const parser = fs.createReadStream(csvFilePath).pipe(parse({ columns: true, trim: true }));

  for await (const record of parser) {

    console.log('Record:', JSON.stringify(record, null, 2));

    const ingredients = record.ingredients.split(';').map(entry => {
      const [ingredient, qty, unitRaw, prep] = entry.split('|');
      const unit = unitMap[unitRaw?.trim()] || unitRaw?.trim();

      console.log('Ingredient:', ingredient);
        console.log('qty:', qty);
        console.log('Prep:', prep);
        console.log('Unit:', unit);

      if (!allowedUnits.has(unit)) {
        unexpectedUnits.add(unit);
      }

      return {
        ingredient: ingredient?.trim(),
        qty: qty?.trim(),
        unit,
        prep: prep?.trim(),
      };
    });


    let rawAllergies = record.allergies;

// Handle if CSV cell contains a stringified JSON array
if (typeof rawAllergies === 'string' && rawAllergies.startsWith('[')) {
  try {
    rawAllergies = JSON.parse(rawAllergies);
  } catch (e) {
    console.warn('❌ Invalid allergy JSON:', rawAllergies);
    rawAllergies = [];
  }
} else if (typeof rawAllergies === 'string') {
  // Handle basic comma-separated values
  rawAllergies = rawAllergies.split(',').map(a => a.trim());
}

const allowedAllergies = {
  'gluten': 'Gluten',
  'dairy': 'Dairy',
  'eggs': 'Eggs',
  'fish': 'Fish',
  'shellfish': 'Shellfish',
  'soy': 'Soy',
  'peanuts': 'Peanuts',
  'tree nuts': 'Tree Nuts',
  'sesame': 'Sesame',
  'allium': 'Allium (Garlic, Onion)',
  'allium (garlic, onion)': 'Allium (Garlic, Onion)',
  'pork': 'Pork',
};

const normalizeAllergy = (a) => {
  const key = a.trim().toLowerCase();
  return allowedAllergies[key] ? key : null;
};

const allergies = rawAllergies
  ?.map(normalizeAllergy)
  .filter(Boolean);


    const body = {
      name: record.name,
      method: record.method,
      prepTime: record.prepTime,
      shelfLife: record.shelfLife,
      usedInDish: record.usedInDish,
      stations: record.stations,
      equipment: record.equipment,
      kitchenTools: record.kitchenTools,
      allergens: allergies,
      ingredients,
    };

    console.log(JSON.stringify(body, null, 2));


    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `users API-Key ${process.env.ADMIN_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Error importing recipe:', data);
      } else {
        console.log('✅ Imported:', data.name || data.id);
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
    }
  }

  if (unexpectedUnits.size > 0) {
    console.warn('\n⚠️ Unexpected units found (not in allowed list):');
    console.warn([...unexpectedUnits].join(', '));
  }
};

importCSV();
