// importFromSlideCSV.js
// Usage: node importFromSlideCSV.js ./CHG_slide_parse_ALL_v3.csv

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from 'csv-parse/sync';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { ro } from 'payload/i18n/ro';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === CONFIG ===
const CSV_PATH = process.argv[2] || path.resolve(__dirname, './CHG_slide_parse_ALL_v3.csv');

// Your local Payload endpoints (same style you used previously)
const apiUrl = process.env.PAYLOAD_RECIPES_URL || `http://192.168.86.249:3000/api/recipes`;
const apiUrlPreps = process.env.PAYLOAD_PREPS_URL || `http://192.168.86.249:3000/api/recipes-prep`;

// Reuse your existing allergen catalogs
const STANDARD_ALLERGENS_PATH = process.env.STANDARD_ALLERGENS_PATH
  || path.resolve(__dirname, '../extract from excel/recipes/standard_allergen.json');
const UNIQUE_ALLERGENS_PATH = process.env.UNIQUE_ALLERGENS_PATH
  || path.resolve(__dirname, '../extract from excel/recipes/unique_allergens.json');

// Whether to try linking ingredients to sub-recipes by name
const LINK_SUB_RECIPES = true;

// === LOAD ALLERGEN TABLES ===
const standardAllergens = JSON.parse(fs.readFileSync(STANDARD_ALLERGENS_PATH, 'utf-8'));
// not strictly necessary for import, but keeping for parity with your workflow
const allergenMap = JSON.parse(fs.readFileSync(UNIQUE_ALLERGENS_PATH, 'utf-8')); // eslint-disable-line no-unused-vars

const manualAllergenMap = {
  'allium (garlic': 'Allium (Garlic, Onion)',
  'allium (onion': 'Allium (Garlic, Onion)',
  'allium (garlic)': 'Allium (Garlic, Onion)',
  'allium (onion)': 'Allium (Garlic, Onion)',
  'garlic)': 'Allium (Garlic, Onion)',
  'onion)': 'Allium (Garlic, Onion)',
  diary: 'Dairy',
  egg: 'Eggs',
  'fin fish': 'Fish',
  finfish: 'Fish',
  'finfish (salmon)': 'Fish',
  'fish roe': 'Fish',
  capsaicin: 'Capsaicin',
  capsacin: 'Capsaicin',
  capcasin: 'Capsaicin',
  'molusk (similar to shellfish but not the same)': 'Shellfish',
  'shellfish / lobster / crustacean': 'Shellfish',
  'shellfish / bivalves': 'Shellfish',
  'shellfish (bivalves)': 'Shellfish',
  'shellfish (lobster/crustacean)': 'Shellfish',
  'shellfish/crustacean (crab)': 'Shellfish',
  'shellfish (shrimp/crustacean)': 'Shellfish',
  'shellfish/lobster/crustaceans': 'Shellfish',
  'wheat/gluten': 'Gluten',
  'wheat / gluten': 'Gluten',
  'gluten/wheat': 'Gluten',
  'gluten (wheat)': 'Gluten',
  'stonefruit (avocado)': 'Stonefruit',
  'nightshade (potat starch)': 'Nightshade',
  'alcohol (nitrates)': 'Alcohol',
  msg: 'MSG',
};

// === HELPERS ===
const stripQuotes = (s = '') => {
  const QUOTES = `"'\u201C\u201D\u2018\u2019\u201E\u201F\u201A\u201B\u2039\u203A\u00AB\u00BB`;
  const t = s.trim();
  return t.length >= 2 && QUOTES.includes(t[0]) && QUOTES.includes(t.at(-1))
    ? t.slice(1, -1).trim()
    : t;
};

const normalizeAllergen = (raw) => {
  if (!raw) return null;
  const cleaned = raw.toLowerCase().trim().replace(/[()]/g, '').replace(/\s+/g, ' ');

  if (manualAllergenMap.hasOwnProperty(cleaned)) {
    const label = manualAllergenMap[cleaned];
    const matched = standardAllergens.find((a) => a.label.toLowerCase() === label.toLowerCase());
    return matched ? matched.value : null;
  }
  const exact = standardAllergens.find((a) => a.value === cleaned);
  if (exact) return exact.value;

  const byLabel = standardAllergens.find((a) => a.label.toLowerCase() === cleaned);
  if (byLabel) return byLabel.value;

  const fuzzy = standardAllergens.find(
    (a) => cleaned.includes(a.label.toLowerCase()) || cleaned.includes(a.value),
  );
  if (fuzzy) return fuzzy.value;

  console.warn(`⚠️ Unknown allergen: "${raw}"`);
  return null;
};

// Attempt to split a multi-line / bulleted text blob into lines
const splitLines = (text = '') => {
  if (!text) return [];
  // Handle bullets, semicolons, pipes, and newlines
  const replaced = text.replace(/\r\n/g, '\n').replace(/[•▪●·\-–—]\s+/g, '\n').replace(/[;|]/g, '\n');
  return replaced
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
};

// Very light ingredient parser: "1 cup Sugar" -> qty=1, unit=cup, ingredient=Sugar
const parseIngredientLine = (line) => {
  // Match qty (including fractions like 1/2, 1 1/2, decimals), optional unit, then name
  const m =
    line.match(
      /^\s*(?:(\d+(?:\s+\d+\/\d+|\.\d+|\/\d+)?)\s*)?([a-zA-Z]+)?\s*(.+)$/,
    ) || [];
  let [, qtyRaw, unitRaw, nameRaw] = m;
  let qty = 0;
  let unit = '';
  let ingredient = line.trim();

  if (nameRaw) {
    ingredient = nameRaw.trim();
  }
  if (unitRaw && /^[a-zA-Z]+$/.test(unitRaw)) {
    unit = unitRaw.toLowerCase();
  }
  if (qtyRaw) {
    // Convert "1 1/2" to decimal, or "1/2" -> 0.5
    const toNumber = (s) => {
      const parts = s.trim().split(' ');
      let total = 0;
      for (const p of parts) {
        if (p.includes('/')) {
          const [n, d] = p.split('/').map(Number);
          if (!isNaN(n) && !isNaN(d) && d !== 0) total += n / d;
        } else {
          const f = parseFloat(p);
          if (!isNaN(f)) total += f;
        }
      }
      return total;
    };
    const q = toNumber(qtyRaw);
    if (!isNaN(q)) qty = q;
  }

  return {
    ingredient,
    unit,
    qty,
    'cuts-prep-brand': '',
    linkedRecipe: null,
    isSubRecipe: false,
  };
};

const buildIngredients = async (blob) => {
  const lines = splitLines(blob);
  const items = lines.map(parseIngredientLine);

  if (!LINK_SUB_RECIPES) return items;

  // Try to link to /recipes-prep by name (best-effort)
  for (const item of items) {
    if (!item.ingredient) continue;
    try {
      const searchUrl = `${apiUrlPreps}?where[name][like]=${encodeURIComponent(item.ingredient)}`;
      const res = await fetch(searchUrl, {
        headers: { Authorization: `users API-Key 4c531276e72f41e17cc5e785` },
      });
      const data = await res.json();
      const match = data?.docs?.[0];
      if (match?.id) {
        item.linkedRecipe = match.id;
        item.isSubRecipe = true;
        console.log(`🔗 Linked sub-recipe "${item.ingredient}" -> ${match.id}`);
      }
    } catch (e) {
      console.warn(`⚠️ Link lookup failed for "${item.ingredient}":`, e.message);
    }
  }
  return items;
};


function parseFOHIngredients(blob = "") {
    const result = {
      protein: '',
      preparation: '',
      sauce: '',
      side: '',
      garnish: ''
    };
  
    // Regex to match each label/value pair (up to the next label)
    const regex = /(?:Protein|Preparation|Sauce|Side|Garnish):([\s\S]*?)(?=(Protein|Preparation|Sauce|Side|Garnish):|$)/gi;
  
    let match;
    while ((match = regex.exec(blob)) !== null) {
      const label = match[0].split(':')[0].trim().toLowerCase(); // e.g., 'protein'
      const value = match[1].trim();
  
      if (label in result) {
        result[label] = value;
      }
    }
  
    return result;
  }
  

  function parseFOHComponents(blob = "") {
    const lines = blob
      .split(/\n|;/) // allow for line breaks or semicolon separation
      .map(line => line.trim())
      .filter(Boolean);
  
    const components = [];
  
    for (const line of lines) {
      const [namePart, ingredientsPart] = line.split(/:(.+)/).map(s => s?.trim()); // split only on first colon
      if (namePart && ingredientsPart) {
        components.push({
          name: namePart,
          ingredients: ingredientsPart
        });
      }
    }
  
    return components;
  }
   

const buildAllergens = (blob) => {
  if (!blob) return [];
  return blob
    .split(/[,;/|]/)
    .map((s) => s.trim())
    .map(normalizeAllergen)
    .filter(Boolean);
};

function cleanDescription(text = '') {
    const trimmed = text.trim();
    if (trimmed.toLowerCase().startsWith('description')) {
      // Remove leading "Description", optionally followed by ":" or "-"
      return trimmed.replace(/^description\s*[:\-]?\s*/i, '').trim();
    }
    return trimmed;
  }
  

  function cleanDropline(text = '') {
    if (!text) return '';
  
    // Step 1: remove leading "dropline", case-insensitive
    let cleaned = text.trim();
    if (cleaned.toLowerCase().startsWith('dropline')) {
      cleaned = cleaned.replace(/^dropline\s*[:\-]?\s*/i, '').trim();
    }
  
    // Step 2: remove surrounding quotes — smart, unicode, or straight
    const QUOTES = `"'“”‘’‚Äú‚Äù«»‹›„‟`;
  
    // If both ends are matching quote types or common smart/escaped quotes
    if (
      cleaned.length >= 2 &&
      QUOTES.includes(cleaned[0]) &&
      QUOTES.includes(cleaned.slice(-1))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }
  
    // Step 3: fix common encoding issues (like from CSV)
    cleaned = cleaned.replace(/‚Äú|â€œ|â€˜|“|”|‘|’/g, '').trim();
  
    return cleaned;
  }
  

const csvToRecipes = async (rows) => {
    const out = [];
  
    for (const row of rows) {
      const title = (row['Title'] || '').trim();
      if (!title) continue;

  
      const ingredientsRaw = row['ingredients'] || '';
    const parsedIngredients = parseFOHIngredients(ingredientsRaw);


        const componentsRaw = row['components'] || '';
const parsedComponents = parseFOHComponents(componentsRaw);

      const recipe = {
        name: 'aa_'+title,
        menuCategory: row['category'] || null,
        /*
        category: ['dinner', 'brunch'],
        allergens: buildAllergens(row['Allergies'] || ''),
        foh: {
          description: cleanDescription(row['description'] || ''),
          dropline: cleanDropline(row['dropline'] || ''),
          miseEnPlace: (row['mise'] || '').trim(),
          notes: (row['notes'] || '').trim(),
          components: parsedComponents,
          ingredients: parsedIngredients
        },
        // Add other top-level recipe fields here if needed
        */
        };
  
      // If you're extracting PPSSG (protein/prep/sauce/side/garnish) from a field
      // like row['Ingredients (PPSSG)'], parse it here.
  
      // Optionally: parse foh.components from a custom text blob (structured input preferred)
  
      out.push(recipe);
    }
  
    return out;
  };

const upsertRecipe = async (recipe) => {
    const searchUrl = `${apiUrl}?where[name][equals]=${encodeURIComponent(recipe.name)}`;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `users API-Key 4c531276e72f41e17cc5e785`,
    };
  
    // Check if exists
    const searchRes = await fetch(searchUrl, { headers });
    const searchData = await searchRes.json();
    const existing = searchData?.docs?.[0];

  
    const method = existing ? 'PATCH' : 'POST';
    const targetUrl = existing ? `${apiUrl}/${existing.id}` : apiUrl;
  
    const res = await fetch(targetUrl, {
      method,
      headers,
      body: JSON.stringify(recipe),
    });

    console.log(recipe);    
  
    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ ${method === 'POST' ? 'Create' : 'Update'} failed for "${recipe.name}": ${text}`);
    } else {
      console.log(`✅ ${method === 'POST' ? 'Created' : 'Updated'} "${recipe.name}"`);
    }
  };
  
  const main = async () => {
    /*
    if (!process.env.ADMIN_API_KEY) {
      console.error('❌ Missing ADMIN_API_KEY in your .env');
      process.exit(1);
    }
      */
  
    if (!fs.existsSync(CSV_PATH)) {
      console.error(`❌ CSV not found: ${CSV_PATH}`);
      process.exit(1);
    }
  
    console.log(`📥 Reading: ${CSV_PATH}`);
    const csvRaw = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = parse(csvRaw, { columns: true, skip_empty_lines: true });
  
    console.log(`🧩 Converting ${rows.length} rows to recipe objects...`);
    const recipes = await csvToRecipes(rows);
  
    for (const r of recipes) {
      await upsertRecipe(r);
    }
  
    console.log('🎉 Done.');
  };
  
  main().catch((e) => {
    console.error('Unhandled error:', e);
    process.exit(1);
  });