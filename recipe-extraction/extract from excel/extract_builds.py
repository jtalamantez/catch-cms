import os
import json
import pandas as pd

unique_units = set()
unique_allergens = set()

def extract_recipe_build(sheet_name: str, df: pd.DataFrame, output_csv_path: str):
    global unique_units, unique_allergens

    df.to_csv('debug.csv')

    metadata = {
        "Recipe Name": sheet_name,
        "Implemented": df.iloc[0, 4] if df.shape[0] > 0 else None,
        "Last Revised": df.iloc[1, 4] if df.shape[0] > 1 else None,
        "Kitchen": df.iloc[2, 4] if df.shape[0] > 2 else None,
        "Stations": df.iloc[3, 4] if df.shape[0] > 3 else None,
        "Menu Type": df.iloc[4, 4] if df.shape[0] > 4 else None,
        "Meal Period": df.iloc[5, 4] if df.shape[0] > 5 else None,
        "Meal Type": df.iloc[6, 4] if df.shape[0] > 6 else None,
        "Preparation Time": df.iloc[7, 4] if df.shape[0] > 7 else None,
    }

    # Plate and Utensils (disambiguate by content)
    plate_labels = df[df.iloc[:, 6] == "Plate:"]
    if not plate_labels.empty and len(plate_labels.index) >= 2:
        instructions = df.iloc[plate_labels.index[0], 8]
        plate_type = df.iloc[plate_labels.index[1], 8]
        metadata["Plating Instructions"] = instructions
        metadata["Plate Type"] = plate_type

    #print out the metadata for debugging
    print(f"Extracting build for: {sheet_name}")
    print("Metadata:", metadata)

    # Utensils (optional)
    utensil_row = df[df.iloc[:, 6] == "Utensils:"]
    if not utensil_row.empty:
        metadata["Utensils"] = df.iloc[utensil_row.index[0], 8]

    # Ingredients
    ingredients = []
    start_row = 19  # Hardcoded starting row for ingredients (zero-based index)
    
    for i in range(start_row, df.shape[0]):
        name = df.iloc[i, 4]
        unit = df.iloc[i, 3]
        qty = df.iloc[i, 2]
        prep = df.iloc[i, 9]
    
        # Stop processing if the ingredient name is missing or empty
        if pd.isna(name) or str(name).strip() == "":
            break

        # Convert qty to a string and strip whitespace
        qty_str = str(qty).strip().lower()

        # Handle "tt" / "to taste"
        if qty_str in ["tt", "to taste"]:
            qty = 0  # Set qty to 0 for "to taste"
            unit = "tt"

        # Convert qty safely to numeric for filtering
        qty_numeric = pd.to_numeric(qty, errors='coerce')

        # Check for name ingredient name
        if pd.isna(name) or str(name).strip() == "":
            break    

    
        # Check for missing or invalid units
        if unit and str(unit).strip().lower() != "nan":
            unique_units.add(str(unit).strip().lower())
        else:
            print(f"⚠️  Missing unit in build: '{sheet_name}' on row {i+1} for ingredient: '{name}'")
    
        # Append the ingredient details to the list
        ingredients.append({
            "Ingredient": name,
            "Unit": unit,
            "Qty": qty,
            "Cut/Prep": prep
        })

    # print out the ingredients for debugging
    print(f"Found {len(ingredients)} ingredients in build: {sheet_name}")
    print("Ingredients:", ingredients)


    ingredients_df = pd.DataFrame(ingredients).rename(columns={"Ingredient": "Field"})
    if not ingredients_df.empty:
        ingredients_df["Value"] = (
            "Unit: " + ingredients_df["Unit"].astype(str) +
            ", Qty: " + ingredients_df["Qty"].astype(str) +
            ", Prep: " + ingredients_df["Cut/Prep"].fillna("").astype(str)
        )
        ingredients_df = ingredients_df[["Field", "Value"]]

    # Steps: Pick-Up Steps
    steps = df.loc[39:, 'Unnamed: 3'].dropna().reset_index(drop=True)
    steps_df = pd.DataFrame({
        "Field": ["Step " + str(i + 1) for i in range(len(steps))],
        "Value": steps
    })

    # print out the steps for debugging
    print(f"Found {len(steps_df)} steps in build: {sheet_name}")
    print("Steps:", steps_df)


    # Plate Build
    plate_build = []
    start_row = 52  # Hardcoded starting row for Plate Build    
    for i in range(start_row, df.shape[0]):
        value = df.iloc[i, 2]  # Extract value from column 'Unnamed: 2'
        
        # Stop processing if the value is missing, empty, or indicates the next section
        if pd.isna(value) or str(value).strip() == "" or str(value).strip().lower() == "allergies:":
            break
        
        # Append the value to the list
        plate_build.append(value)
    
    # Create DataFrame for Plate Build
    plate_build_df = pd.DataFrame({
        "Field": ["Step " + str(i + 1) for i in range(len(plate_build))],
        "Value": plate_build
    })
    # print out the plate build for debugging
    print(f"Found {len(plate_build_df)} plate build steps in build: {sheet_name}")
    print("Plate Build Steps:", plate_build_df)

    # Allergies
    allergies_row = df[df.iloc[:, 2] == "Allergies:"]
    if not allergies_row.empty:
        allergies_index = allergies_row.index[0] + 1
        if allergies_index < df.shape[0]:
            allergy_info = df.iloc[allergies_index, 2]  # Retrieve allergy info from column 3 (Unnamed: 2)
            if pd.notna(allergy_info):
                metadata["Allergies"] = allergy_info
                for allergen in str(allergy_info).split(","):
                    label = allergen.strip()
                    if label:
                        value = label.lower().replace(" ", "_")
                        unique_allergens.add((label, value))

    # Final Export
    metadata_df = pd.DataFrame([{"Field": k, "Value": v} for k, v in metadata.items()])
    section1 = pd.DataFrame([{"Field": "=== Ingredients ===", "Value": ""}])
    section2 = pd.DataFrame([{"Field": "=== Steps ===", "Value": ""}])
    section3 = pd.DataFrame([{"Field": "=== Plate Build ===", "Value": ""}])

    final_parts = [metadata_df]
    if not ingredients_df.empty:
        final_parts += [section1, ingredients_df]
    if not steps_df.empty:
        final_parts += [section2, steps_df]
    if not plate_build_df.empty:
        final_parts += [section3, plate_build_df]

    final_df = pd.concat(final_parts, ignore_index=True)
    final_df.to_csv(output_csv_path, index=False)
    print(f"✅ Build exported: {output_csv_path}")

def export_all_builds(excel_path: str, output_folder: str):
    os.makedirs(output_folder, exist_ok=True)
    xls = pd.ExcelFile(excel_path)

    for sheet_name in xls.sheet_names:
        if sheet_name.lower().strip() == "recipe template":
            continue
        df = xls.parse(sheet_name)
        safe_name = sheet_name.lower().replace(" ", "_").replace("/", "-")
        output_csv = os.path.join(output_folder, f"{safe_name}.csv")
        extract_recipe_build(sheet_name, df, output_csv)

    with open(os.path.join(output_folder, "unique_units.json"), "w") as f:
        json.dump(sorted(unique_units), f, indent=2)
    with open(os.path.join(output_folder, "unique_allergens.json"), "w") as f:
        json.dump(
            [{"label": l, "value": v} for l, v in sorted(unique_allergens)],
            f,
            indent=2
        )
    print("📦 Exported unique units and allergens to JSON.")

# Run script
if __name__ == "__main__":
    export_all_builds("CATCH_builds.xlsx", "builds")
