import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();


const apiUrl = `http://192.168.86.250:3000/api/recipes-prep`;


// Load external allergen files
const standardAllergens = JSON.parse(fs.readFileSync('../extract from excel/recipes/standard_allergen.json', 'utf-8'));
const allergenMap = JSON.parse(fs.readFileSync('../extract from excel/recipes/unique_allergens.json', 'utf-8'));

const manualAllergenMap = {
  'allium (garlic': 'Allium (Garlic, Onion)',
  'allium (onion': 'Allium (Garlic, Onion)',
  'allium (garlic)': 'Allium (Garlic, Onion)',
  'allium (onion)': 'Allium (Garlic, Onion)',
  'garlic)': 'Allium (Garlic, Onion)',
  'onion)': 'Allium (Garlic, Onion)',
  'diary': 'Dairy',
  'egg': 'Eggs',
  'fin fish': 'Fish',
  'finfish': 'Fish',
  'finfish (salmon)': 'Fish',
  'fish roe': 'Fish',
  'capsaicin': 'Capsaicin',
  'capsacin': 'Capsaicin',
  'capcasin': 'Capsaicin',
  'molusk (similar to shellfish but not the same)': 'Shellfish',
  'shellfish / lobster / crustacean': 'Shellfish',
  'shellfish / bivalves': 'Shellfish',
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
  'msg': 'MSG'
};

const normalizeAllergen = (raw) => {
    if (!raw) return null;
  
    const cleaned = raw.toLowerCase().trim().replace(/[()]/g, '').replace(/\s+/g, ' ');
  
    // 1. Check manual map (fix typos or formatting issues)
    if (manualAllergenMap.hasOwnProperty(cleaned)) {
      const label = manualAllergenMap[cleaned];
      const matched = standardAllergens.find((a) => a.label.toLowerCase() === label.toLowerCase());
      return matched ? matched.value : null;
    }
  
    // 2. Check if cleaned allergen matches any standard `value` exactly
    const exact = standardAllergens.find(a => a.value === cleaned);
    if (exact) return exact.value;
  
    // 3. Check if cleaned allergen matches any standard `label` (case-insensitive)
    const byLabel = standardAllergens.find(a => a.label.toLowerCase() === cleaned);
    if (byLabel) return byLabel.value;
  
    // 4. Optional: loose contains matching on label or value
    const fuzzy = standardAllergens.find(a =>
      cleaned.includes(a.label.toLowerCase()) || cleaned.includes(a.value)
    );
    if (fuzzy) return fuzzy.value;
  
    console.warn(`⚠️ Unknown allergen: "${raw}"`);
    return null;
  };

const importCSV = async (filePath) => {
  const parser = fs.createReadStream(filePath).pipe(parse({ columns: ['field', 'value'], trim: true }));
  let section = 'meta';
  let recipe = {
    name: '',
    description: '',
    prepTime: '',
    shelfLife: '',
    kitchenTools: '',
    equipment: '',
    dishes: '',
    stations: '',
    method: '',
    category: ['dinner', 'brunch'],
    totalYield: {qty: 0, unit: 'gr'},
    allergens: [],
    ingredients: [],
    method: ''
  };

  for await (const row of parser) {
    const field = row.field?.trim();
    const value = row.value?.trim();

    if (!field && !value) continue;

    if (field === '=== Ingredients ===') {
      section = 'ingredients';
      continue;
    }

    if (field === '=== Prep Steps ===') {
      section = 'steps';
      continue;
    }

    if (section === 'meta') {
      if (field === 'Recipe Name') recipe.name = value;
      else if (field === 'Description') recipe.description = value;
      else if (field === 'Stations') recipe.stations = value;
        else if (field === 'Kitchen Tools') recipe.kitchenTools = value;
        else if (field === 'Equipment') recipe.equipment = value;
        else if (field === 'Dishes') recipe.dishes = value;
        else if (field === 'Prep Time') recipe.prepTime = value;
        else if (field === 'Shelf Life') recipe.shelfLife = value;
        else if (field === 'Recipe Yield Unit' && value) {
            recipe.totalYield.unit = value.toLowerCase();
        }
        else if (field === 'Recipe Yield (Batch x1)' && value) {
            recipe.totalYield.qty = parseFloat(value);
        }
        else if (field === 'Allergies') {
        recipe.allergens = value.split(',').map((a) => normalizeAllergen(a)).filter(Boolean);
      }
    }

    if (section === 'ingredients' && value) {
      const ingredient = field;
      const parts = value.split(',');
      const parsed = {
        ingredient,
        unit: '',
        qty: 0,
        "cuts-prep-brand": ''
      };
      const unitMatch = value.match(/Unit:\s*([^,]+)/);
      const qtyMatch = value.match(/Batch x1:\s*([^,]+)/);
      const prepMatch = value.match(/Prep\/Brand:\s*(.*)/); // capture everything after this
    
      if (unitMatch) parsed.unit = unitMatch[1].trim().toLowerCase();
      if (qtyMatch) parsed.qty = parseFloat(qtyMatch[1].trim());
      if (prepMatch) parsed["cuts-prep-brand"] = prepMatch[1].trim();
    
      recipe.ingredients.push(parsed);

    }

    if (section === 'steps' && field.toLowerCase().startsWith('step')) {
        recipe.method += `${value}\n`;
    }
  }

  console.log(`📦 Uploading "${recipe.name}"...`);

  //console.log('Recipe:', recipe);

  
  try {
    // Step 1: Try to fetch existing recipe by name
    const searchUrl = `${apiUrl}?where[name][equals]=${encodeURIComponent(recipe.name)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        Authorization: `users API-Key ${process.env.ADMIN_API_KEY}`,
      }
    });
    const searchData = await searchRes.json();
    const existing = searchData?.docs?.[0];

    let method = 'POST';
    let targetUrl = apiUrl;

    if (existing) {
      method = 'PATCH';
      targetUrl = `${apiUrl}/${existing.id}`;
    }

    // Step 2: POST or PATCH based on existence
    const res = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${process.env.ADMIN_API_KEY}`,
      },
      body: JSON.stringify(recipe),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ Failed to ${method === 'POST' ? 'upload' : 'update'} "${recipe.name}": ${text}`);
    } else {
      console.log(`✅ ${method === 'POST' ? 'Uploaded' : 'UPDATED $$$'} recipe "${recipe.name}"`);
    }
  } catch (err) {
    console.error(`❌ Error processing "${recipe.name}":`, err);
  }


};



const importAllCSVsInFolder = async (folderPath) => {
    const files = fs.readdirSync(folderPath);
  
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(folderPath, file);
        console.log(`\n🔍 Processing: ${file}`);
        await importCSV(filePath);
      }
    }
  };

  /*
const importAllCSVsInFolder = async (folderPath) => {
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.csv'));
  
    // Limit to first 20 CSV files
    const filesToProcess = files.slice(120, 150);
  
    for (const file of filesToProcess) {
      const filePath = path.join(folderPath, file);
      console.log(`\n🔍 Processing: ${file}`);
      await importCSV(filePath);
    }
  
    if (files.length > 20) {
      console.log(`⚠️ Only processed 20 out of ${files.length} CSV files. Rerun if you want to continue.`);
    }
  };
  */
  
  // Replace with your actual folder path, e.g., './recipes'
  const recipesFolderPath = '../extract from excel/recipes';
  importAllCSVsInFolder(recipesFolderPath);

  //importCSV('../extract from excel/garlic_chips.csv');
