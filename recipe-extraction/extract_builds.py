import os
import json
import pandas as pd

unique_units = set()
unique_allergens = set()

def extract_recipe_build(sheet_name: str, df: pd.DataFrame, output_csv_path: str):
    global unique_units, unique_allergens

    metadata = {
        "Recipe Name": sheet_name,
        "Implemented": df.iloc[0, 2] if df.shape[0] > 0 else None,
        "Last Revised": df.iloc[1, 2] if df.shape[0] > 1 else None,
        "Kitchen": df.iloc[2, 2] if df.shape[0] > 2 else None,
        "Stations": df.iloc[3, 2] if df.shape[0] > 3 else None,
        "Menu Type": df.iloc[4, 2] if df.shape[0] > 4 else None,
        "Meal Period": df.iloc[5, 2] if df.shape[0] > 5 else None,
        "Meal Type": df.iloc[6, 2] if df.shape[0] > 6 else None,
        "Preparation Time": df.iloc[7, 2] if df.shape[0] > 7 else None,
    }

    # Plate and Utensils (disambiguate by content)
    plate_labels = df[df.iloc[:, 1] == "Plate:"]
    if not plate_labels.empty and len(plate_labels.index) >= 2:
        instructions = df.iloc[plate_labels.index[0], 2]
        plate_type = df.iloc[plate_labels.index[1], 2]
        metadata["Plating Instructions"] = instructions
        metadata["Plate Type"] = plate_type

    # Utensils (optional)
    utensil_row = df[df.iloc[:, 1] == "Utensils:"]
    if not utensil_row.empty:
        metadata["Utensils"] = df.iloc[utensil_row.index[0], 2]

    # Ingredients
    ingredients = []
    header_row = df[df.iloc[:, 1] == "Unit"]
    if not header_row.empty:
        start_row = header_row.index[0] + 1
        for i in range(start_row, df.shape[0]):
            qty = df.iloc[i, 0]
            unit = df.iloc[i, 1]
            name = df.iloc[i, 2]
            prep = df.iloc[i, 3]

            if pd.isna(name) or str(name).strip() == "":
                break

            if unit and str(unit).strip().lower() != "nan":
                unique_units.add(str(unit).strip().lower())
            else:
                print(f"⚠️  Missing unit in build: '{sheet_name}' on row {i+1} for ingredient: '{name}'")

            ingredients.append({
                "Ingredient": name,
                "Unit": unit,
                "Qty": qty,
                "Cut/Prep": prep
            })

    ingredients_df = pd.DataFrame(ingredients).rename(columns={"Ingredient": "Field"})
    if not ingredients_df.empty:
        ingredients_df["Value"] = (
            "Unit: " + ingredients_df["Unit"].astype(str) +
            ", Qty: " + ingredients_df["Qty"].astype(str) +
            ", Prep: " + ingredients_df["Cut/Prep"].fillna("").astype(str)
        )
        ingredients_df = ingredients_df[["Field", "Value"]]

    # Steps: Pick-up Steps + Plate Build
    steps = []
    for label in ["Pick-Up Steps", "Plate Build"]:
        match_row = df[df.iloc[:, 1] == label]
        if not match_row.empty:
            start_idx = match_row.index[0] + 1
            for i in range(start_idx, df.shape[0]):
                val = df.iloc[i, 1]
                if pd.isna(val) or str(val).strip() == "":
                    break
                steps.append({"Field": f"{label} Step {len(steps)+1}", "Value": val})

    steps_df = pd.DataFrame(steps)

    # Allergies
    allergy_row = df[df.iloc[:, 1] == "Allergies:"]
    if not allergy_row.empty:
        index = allergy_row.index[0] + 1
        allergy_text = df.iloc[index, 1]
        metadata["Allergies"] = allergy_text
        for a in str(allergy_text).split(","):
            label = a.strip()
            if label:
                value = label.lower().replace(" ", "_")
                unique_allergens.add((label, value))

    # Final Export
    metadata_df = pd.DataFrame([{"Field": k, "Value": v} for k, v in metadata.items()])
    section1 = pd.DataFrame([{"Field": "=== Ingredients ===", "Value": ""}])
    section2 = pd.DataFrame([{"Field": "=== Steps ===", "Value": ""}])

    final_parts = [metadata_df]
    if not ingredients_df.empty:
        final_parts += [section1, ingredients_df]
    if not steps_df.empty:
        final_parts += [section2, steps_df]

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
    export_all_builds("builds.xlsx", "builds")
