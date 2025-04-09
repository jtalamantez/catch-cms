import fs from "fs";
import path from "path";
import csv from "csv-parser";
import fetch from "node-fetch"; // Ensure you're using ES module syntax

const API_URL = "http://192.168.86.35:3000/api/recipes"; // Adjust if using a different server

const importCSV = async () => {
  const recipes = [];

  fs.createReadStream(path.join(process.cwd(), "recipes.csv"))
    .pipe(csv())
    .on("data", (row) => {
      recipes.push({
        name: row.name,
        dropPhrase: row.dropPhrase,
        method: row.method,
        ingredients: row.ingredients
          ? row.ingredients.split(";").map((ingredient) => {
              const parts = ingredient.split("|");
              if (parts.length !== 3) {
                console.warn(`Skipping malformed ingredient: ${ingredient}`);
                return null;
              }
              return {
                ingredient: parts[0].trim(),
                qty: parseFloat(parts[1]),
                unit: parts[2].trim(),
              };
            }).filter(Boolean) // Remove null values if any ingredient is malformed
          : [],
      });
    })
    .on("end", async () => {
      console.log(`Importing ${recipes.length} recipes...`);

      for (const recipe of recipes) {
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(recipe),
          });

          if (!response.ok) {
            console.error(`Failed to insert ${recipe.name}:`, await response.text());
          } else {
            console.log(`Inserted: ${recipe.name}`);
          }
        } catch (error) {
          console.error(`Error inserting ${recipe.name}:`, error);
        }
      }

      console.log("CSV Import Completed!");
    });
};

importCSV();
