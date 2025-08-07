import type { CollectionConfig } from 'payload'
import { Units, Allergens } from '../utils/units';

export const CocktailRecipes: CollectionConfig = {
  slug: "cocktail-recipes",
  versions: {
    drafts: true, // 👈 Enables draft/publish system
  },
  labels: {
    singular: "Beverage - Cocktail Build",
    plural: "Beverage - Cocktail Builds",
  },
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: () => true, // Publicly readable
    create: () => true, // Allow all to create
    update: () => true,
    delete: () => true,
  },
  fields: [
    {
        name: 'archived',
        type: 'checkbox',
        label: 'Archived (do not show in app)',
        defaultValue: false,
      },      
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "method",
      type: "textarea",
      required: false,
    },
    {
        name: "ingredients",
        type: "array", // Allows repeatable ingredient entries
        label: "Build Recipe",
        fields: [
          {
            name: "ingredient",
            type: "text",
            required: true,
          },
          {
            name: "unit",
            type: "select",
            options: [
                { label: "(none)", value: "" }, // this is the blank unit
                { label: "oz", value: "oz" },
                { label: "fl oz", value: "fl_oz" },
                { label: "ml", value: "ml" },
                { label: "dash", value: "dash" },
                { label: "tsp", value: "tsp" },
                { label: "tbsp", value: "tbsp" },
                { label: "g", value: "g" },
                { label: "drop", value: "drop" },
                { label: "splash", value: "splash" },
                { label: "ea", value: "ea" }

              ],
            required: true,
          },
          {
            name: "qty",
            type: "number",
            required: true,
            min: 0.01,
          },
          {
            name: "isSubRecipe",
            type: "checkbox",
            label: "Is this a sub-recipe?",
            defaultValue: false,
          }, 
        {
            name: "linkedRecipe",
            type: "relationship",
            relationTo: ["cocktail-prep-items", "cocktail-batch-recipes"],
            maxDepth:4,
            label: "Select sub-recipe",
            admin: {
              condition: (_, siblingData) => siblingData.isSubRecipe === true,
            },        
        }  
        ],
      },
    {
        name: "ingredients_full",
        type: "array", // Allows repeatable ingredient entries
        label: "Full Recipe",
        fields: [
          {
            name: "ingredient",
            type: "text",
            required: true,
          },
          {
            name: "unit",
            type: "select",
            options: 
            //["","oz", "fl oz", "g", "kg", "ml", "l", "tsp", "tbsp", "cup", "pcs", "ea", "splash", "dash", "drop", "quart"],
            
            
            [
                { label: "(none)", value: "" }, // this is the blank unit
                { label: "oz", value: "oz" },
                { label: "fl oz", value: "fl_oz" },
                { label: "ml", value: "ml" },
                { label: "dash", value: "dash" },
                { label: "tsp", value: "tsp" },
                { label: "tbsp", value: "tbsp" },
                { label: "g", value: "g" },
                { label: "drop", value: "drop" },
                { label: "splash", value: "splash" },
                { label: "ea", value: "ea" }

              ],

            required: true,
          },
          {
            name: "qty",
            type: "number",
            required: true,
            min: 0.01,
          },
          {
            name: "isSubRecipe",
            type: "checkbox",
            label: "Is this a sub-recipe?",
            defaultValue: false,
          }, 
        {
            name: "linkedRecipe",
            type: "relationship",
            relationTo: ["cocktail-prep-items", "cocktail-batch-recipes"],
            maxDepth:4,
            label: "Select sub-recipe",
            admin: {
              condition: (_, siblingData) => siblingData.isSubRecipe === true,
            },        
        }  
        ],
      },
      {
        name: 'spirit',
        label: 'Base Spirit',
        type: 'select',
        hasMany: true,
        options: [
            { "label": "N/A", "value": "non_alcoholic" },
            { "label": "Bourbon", "value": "bourbon" },
            { "label": "Gin", "value": "gin" },
            { "label": "Mezcal", "value": "mezcal" },
            { "label": "Rum", "value": "rum" },
            { "label": "Scotch", "value": "scotch" },
            { "label": "Tequila", "value": "tequila" },
            { "label": "Vermouth", "value": "vermouth" },
            { "label": "Vodka", "value": "vodka" },
            { "label": "Whiskey", "value": "whiskey" },
            { "label": "Wine", "value": "wine" },
        ],
      },
      {
        name: 'allergens',
        label: 'Allergies',
        type: 'select',
        hasMany: true,
        options: Allergens,
      },
    {
        name: "yield",
        type: "text",
        required: false,
      },
    {
        name: "ice",
        type: "text",
        required: false,
      },
      {
        name: "garnish",
        type: "text",
        required: false,
      },
      {
        name: "glassware",
        type: "text",
        required: false,
      },
      {
        name: "description",
        type: "textarea",
        required: false,
      },
    {
        name: "images",
        type: "array",
        required: false,
        fields: [
          {
            name: "image",
            type: "upload",
            relationTo: "media", // Connects to the media collection
            required: true,
          },
          {
            name: "caption",
            type: "text",
            required: false,
          },
        ],
      },
  ],
};

