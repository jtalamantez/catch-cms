import xlsx from 'xlsx';
import fetch from 'node-fetch';

const workbook = xlsx.readFile('CANY Prep Recipe Book.xlsx');
const sheetNames = workbook.SheetNames;

const allowedAllergies = {
  'gluten': 'Gluten', 'dairy': 'Dairy', 'eggs': 'Eggs', 'fish': 'Fish',
  'shellfish': 'Shellfish', 'soy': 'Soy', 'peanuts': 'Peanuts',
  'tree nuts': 'Tree Nuts', 'sesame': 'Sesame', 'allium': 'Allium (Garlic, Onion)', 'allium (garlic, onion)': 'Allium (Garlic, Onion)', 'pork': 'Pork'
};

const normalizeAllergy = (a) => {
  const key = a.trim().toLowerCase();
  const match = allowedAllergies[key];
  if (!match) console.warn(`⚠️ Skipped unknown allergy: ${a}`);
  return match ? key : null;
};

const importRecipe = async (data) => {
  const allergies = data.allergies?.split(',').map(normalizeAllergy).filter(Boolean) || [];
  const body = {
    name: data.name,
    method: data.method,
    ingredients: data.ingredients,
    allergies,
    // Add other normalized fields here
  };

  const res = await fetch('https://YOUR_DOMAIN/api/recipes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `users API token or bearer`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const error = await res.json();
    console.error(`❌ Error importing ${data.name}:`, error);
  } else {
    console.log(`✅ Imported ${data.name}`);
  }
};

for (const sheetName of sheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  // Normalize each sheet's content to match your schema
  const parsedRecipe = parseRecipeFromSheet(json, sheetName); // you'd define this
  if (parsedRecipe) {
    await importRecipe(parsedRecipe);
  }
}
