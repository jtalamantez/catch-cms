import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();


const apiUrl = `http://192.168.86.250:3000/api/recipes-prep`;


// Load external allergen files
const standardAllergens = JSON.parse(fs.readFileSync('../recipes/standard_allergen.json', 'utf-8'));
const allergenMap = JSON.parse(fs.readFileSync('../recipes/unique_allergens.json', 'utf-8'));

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

    console.log(`Normalizing allergen: "${raw}"`);
  if (!raw) return null;

  const cleaned = raw.toLowerCase().trim().replace(/[()]/g, '').replace(/\s+/g, ' ');
console.log(`Cleaned allergen: "${cleaned}"`);


    // Check for manual mappings first
  if (manualAllergenMap.hasOwnProperty(cleaned)) {
    console.log(`Found manual allergen mapping for: "${cleaned}"`);
    const label = manualAllergenMap[cleaned];
    const value = label.toLowerCase().replace(/\s+/g, '_');
    return value;
  }

  // Check against standard allergens

  const match = Object.keys(standardAllergens).find((key) =>
    cleaned.includes(key.toLowerCase())
  );

  if (match) {
    const value = allergenMap[match];
    const label = standardAllergens.find((a) => a.value === value)?.label;
    return label ? value  : null;
  } else {
    console.warn(`⚠️  Unknown allergen: "${raw}"`);
    return null;
  }
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
    totalYield: {qty: 0, unit: ''},
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
        else if (field === 'Recipe Yield Unit') recipe.totalYield.unit = value.toLowerCase()
        else if (field === 'Recipe Yield (Batch x1)') recipe.totalYield.qty = parseFloat(value);
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
    
      if (unitMatch) parsed.unit = unitMatch[1].trim();
      if (qtyMatch) parsed.qty = parseFloat(qtyMatch[1].trim());
      if (prepMatch) parsed["cuts-prep-brand"] = prepMatch[1].trim();
    
      recipe.ingredients.push(parsed);

    }

    if (section === 'steps' && field.toLowerCase().startsWith('step')) {
        recipe.method += `${value}\n`;
    }
  }

  console.log(`📦 Uploading "${recipe.name}"...`);

  console.log('Recipe:', recipe);

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${process.env.ADMIN_API_KEY}`,
    },
      body: JSON.stringify(recipe),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error(`❌ Failed to upload recipe "${recipe.name}": ${text}`);
    } else {
      console.log(`✅ Uploaded recipe "${recipe.name}"`);
    }
  } catch (err) {
    console.error(`❌ Fetch error for "${recipe.name}":`, err);
  }
};

//importCSV('snapper_veg.csv');

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
  
  // Replace with your actual folder path, e.g., './recipes'
  const recipesFolderPath = '../recipes';
  importAllCSVsInFolder(recipesFolderPath);