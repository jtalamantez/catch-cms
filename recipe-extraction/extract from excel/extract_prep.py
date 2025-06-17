import os
import json
import pandas as pd

unique_units = set()
unique_allergens = set()

def extract_recipe_v4(sheet_name: str, df: pd.DataFrame, output_csv_path: str):
    global unique_units, unique_allergens

    metadata = {
        "Recipe Name": sheet_name,
        "Implemented": df.iloc[0, 4] if df.shape[0] > 0 else None,
        "Created": df.iloc[1, 4] if df.shape[0] > 1 else None,
        "Shelf Life": df.iloc[2, 4] if df.shape[0] > 2 else None,
        "Stations": df.iloc[3, 4] if df.shape[0] > 3 else None,
        "Prep Time": df.iloc[4, 4] if df.shape[0] > 4 else None,
        "Dishes": df.iloc[5, 4] if df.shape[0] > 5 else None,
        "Description": df.iloc[8, 4] if df.shape[0] > 8 else None,
        "Equipment": df.iloc[10, 8] if df.shape[0] > 10 else None,
        "Kitchen Tools": df.iloc[11, 8] if df.shape[0] > 11 else None,
    }

    # Allergies
    allergies_row = df[df.iloc[:, 1] == "Allergies:"]
    if not allergies_row.empty:
        allergies_index = allergies_row.index[0] + 1
        if allergies_index < df.shape[0]:
            allergy_info = df.iloc[allergies_index, 1]
            if pd.notna(allergy_info):
                metadata["Allergies"] = allergy_info
                for allergen in str(allergy_info).split(","):
                    label = allergen.strip()
                    if label:
                        value = label.lower().replace(" ", "_")
                        unique_allergens.add((label, value))


    # Ingredients
    ingredients = []
    start_row = 14
    for i in range(start_row, df.shape[0]):
        idx = df.iloc[i, 1]
        ingredient_name = df.iloc[i, 2]

        if pd.isna(idx) or not str(idx).strip().isdigit():
            break
        if pd.isna(ingredient_name):
            break

        unit = df.iloc[i, 5]
        batch_x1 = df.iloc[i, 6]
        batch_x2 = df.iloc[i, 7]
        batch_x3 = df.iloc[i, 8]
        batch_x4 = df.iloc[i, 9]
        cut_prep = df.iloc[i, 10]

        batches = [batch_x1, batch_x2, batch_x3, batch_x4]
        batch_strs = [str(b).strip().lower() for b in batches]

        # Handle "tt" / "to taste"
        if any(b in ["tt", "to taste"] for b in batch_strs):
            batch_x1 = batch_x2 = batch_x3 = batch_x4 = 0
            unit = "tt"

        # Convert batch values safely to numeric for filtering
        batch_values = pd.to_numeric([batch_x1, batch_x2, batch_x3, batch_x4], errors='coerce')
        if pd.isna(ingredient_name) or str(ingredient_name).strip() == "":
            break

        if unit and str(unit).strip():
            unique_units.add(str(unit).strip().lower())
        else:
            print(f"⚠️  Missing unit in recipe: '{sheet_name}' on row {i + 1} for ingredient: '{ingredient_name}'")


        ingredients.append({
            "Ingredient": ingredient_name,
            "Unit": unit,
            "Batch x1": batch_x1,
            "Batch x2": batch_x2,
            "Batch x3": batch_x3,
            "Batch x4": batch_x4,
            "Cut/Prep/Brand": cut_prep if pd.notna(cut_prep) else "",
        })


    ingredients_df = pd.DataFrame(ingredients).rename(columns={"Ingredient": "Field"})
    if not ingredients_df.empty:
        ingredients_df["Value"] = (
            "Unit: " + ingredients_df["Unit"].astype(str) +
            ", Batch x1: " + ingredients_df["Batch x1"].astype(str) +
            ", Batch x2: " + ingredients_df["Batch x2"].astype(str) +
            ", Batch x3: " + ingredients_df["Batch x3"].astype(str) +
            ", Batch x4: " + ingredients_df["Batch x4"].astype(str) +
            ", Prep/Brand: " + ingredients_df["Cut/Prep/Brand"].fillna("").astype(str)
        )
        ingredients_df = ingredients_df[["Field", "Value"]]

    # Recipe Yield + Unit
    header_row_index = df[df.iloc[:, 5] == "Unit"].index
    if not header_row_index.empty:
        yield_row_index = header_row_index[0] - 1
        if yield_row_index >= 0:
            recipe_yields = df.iloc[yield_row_index, 6:10].values
            yield_unit = df.iloc[yield_row_index, 5]  # e.g., "gr", "hotel pan", etc.
            metadata["Recipe Yield Unit"] = yield_unit
            metadata["Recipe Yield (Batch x1)"] = recipe_yields[0]
            metadata["Recipe Yield (Batch x2)"] = recipe_yields[1]
            metadata["Recipe Yield (Batch x3)"] = recipe_yields[2]
            metadata["Recipe Yield (Batch x4)"] = recipe_yields[3]


    # Prep Steps
    prep_steps = df.loc[35:55, 'Unnamed: 3'].dropna().reset_index(drop=True)
    prep_steps_df = pd.DataFrame({
        "Field": ["Step " + str(i + 1) for i in range(len(prep_steps))],
        "Value": prep_steps
    })

    # Assemble final export
    metadata_df = pd.DataFrame([{"Field": k, "Value": v} for k, v in metadata.items()])
    section_break_1 = pd.DataFrame([{"Field": "=== Ingredients ===", "Value": ""}])
    section_break_2 = pd.DataFrame([{"Field": "=== Prep Steps ===", "Value": ""}])

    parts = [metadata_df]
    if not ingredients_df.empty:
        parts += [section_break_1, ingredients_df]
    if not prep_steps_df.empty:
        parts += [section_break_2, prep_steps_df]

    final_df = pd.concat(parts, ignore_index=True)
    final_df.to_csv(output_csv_path, index=False)
    print(f"✅ Saved: {output_csv_path}")

# === Entry point to loop all sheets ===
def export_all_recipes(excel_path: str, output_folder: str):
    os.makedirs(output_folder, exist_ok=True)
    xls = pd.ExcelFile(excel_path)

    for sheet_name in xls.sheet_names:
        if sheet_name.lower().strip() == "recipe template":
            continue
        df = xls.parse(sheet_name)
        safe_name = sheet_name.lower().replace(" ", "_").replace("/", "-")
        output_csv = os.path.join(output_folder, f"{safe_name}.csv")
        extract_recipe_v4(sheet_name, df, output_csv)

    # Output units and allergens
    with open(os.path.join(output_folder, "unique_units.json"), "w") as f:
        json.dump(sorted(unique_units), f, indent=2)
    with open(os.path.join(output_folder, "unique_allergens.json"), "w") as f:
        json.dump(
            [{"label": l, "value": v} for l, v in sorted(unique_allergens)],
            f,
            indent=2
        )
    print("📦 Exported unique units and allergens to JSON.")

# Run it!
if __name__ == "__main__":
    export_all_recipes("CANY Prep Recipes.xlsx", "recipes")
