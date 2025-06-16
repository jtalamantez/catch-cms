import type { CollectionConfig } from 'payload'

export const RecipesPrep: CollectionConfig = {
  slug: 'recipes-prep',
  labels: {
    singular: 'Culinary - Prep Recipe',
    plural: 'Culinary - Prep Recipes',
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
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'dishes',
      type: 'text',
      required: false,
    },
    {
      name: 'method',
      type: 'textarea',
      required: false,
    },
    {
      name: 'ingredients',
      type: 'array', // Allows repeatable ingredient entries
      fields: [
        {
          name: 'ingredient',
          type: 'text',
          required: true,
        },
        {
          name: 'unit',
          type: 'select',
          options: ['gr', 'oz', 'ea', 'lbs', 'kg', 'ml', 'l', 'tsp', 'gal', 'tbsp', 'cup', 'pcs', 'qt','tt','bag','case','box'], // Customize as needed
          required: true,
        },
        {
          name: 'qty',
          type: 'number',
          required: false,
          //min: 0.01,
        },
        {
            name: 'cuts-prep-brand',
            type: 'text',
            required: false,
          },
        {
          name: 'isSubRecipe',
          type: 'checkbox',
          label: 'Is this a sub-recipe?',
          defaultValue: false,
        },
        {
          name: 'linkedRecipe',
          type: 'relationship',
          relationTo: 'recipes',
          label: 'Select sub-recipe',
          admin: {
            condition: (_, siblingData) => siblingData.isSubRecipe === true,
          },
        },
      ],
    },
    {
      name: 'category',
      type: 'select',
      hasMany: true,

      options: [
        { label: '', value: '' }, // ✅ blank/default
        { label: 'Dinner', value: 'dinner' },
        { label: 'Brunch', value: 'brunch' },
      ],
      required: false,
    },
    {
      name: 'prepTime',
      label: 'Prep Time',
      type: 'text',
    },

    {
      name: 'shelfLife',
      label: 'Shelf Life',
      type: 'text',
    },

    {
      name: 'stations',
      label: 'Station(s)',
      type: 'text',
    },

    {
      name: 'equipment',
      label: 'Equipment',
      type: 'textarea',
    },

    {
      name: 'kitchenTools',
      label: 'Kitchen Tools',
      type: 'textarea',
    },
    {
        name: 'totalYield',
        label: 'Yield',
        type: 'group',
        fields: [
          { name: 'qty', type: 'number' },
          {
            name: 'unit',
            type: 'select',
            options: ['gr', 'oz', 'ea', 'lbs', 'kg', 'ml', 'l', 'tsp', 'gal', 'tbsp', 'cup', 'pcs', 'qt','tt','bag','case','box'], // Customize as needed
            required: false,
          },
        ]
      },
    {
        name: 'allergens',
        label: 'Allergies',
        type: 'select',
        hasMany: true,
        options: [
            { "label": "Alcohol", "value": "alcohol" },
            { "label": "Allium", "value": "allium" },
            { "label": "Anchovy", "value": "anchovy" },
            { "label": "Ancient Grains", "value": "ancient_grains" },
            { "label": "Black Pepper", "value": "black_pepper" },
            { "label": "Capsaicin", "value": "capsaicin" },
            { "label": "Cilantro", "value": "cilantro" },
            { "label": "Cinnamon", "value": "cinnamon" },
            { "label": "Citrus", "value": "citrus" },
            { "label": "Dairy", "value": "dairy" },
            { "label": "Eggs", "value": "eggs" },
            { "label": "Fish", "value": "fish" },
            { "label": "Fish Roe", "value": "fish_roe" },
            { "label": "Fryer Cross Contact", "value": "fryer_cc_issues" },
            { "label": "Garlic", "value": "garlic" },
            { "label": "Ginger", "value": "ginger" },
            { "label": "Gluten", "value": "gluten" },
            { "label": "Honey", "value": "honey" },
            { "label": "MSG", "value": "msg" },
            { "label": "Mollusk", "value": "mollusk" },
            { "label": "Mushroom", "value": "mushroom" },
            { "label": "Mustard", "value": "mustard" },
            { "label": "Nightshade", "value": "nightshade" },
            { "label": "Onion", "value": "onion" },
            { "label": "Peanuts", "value": "peanuts" },
            { "label": "Pineapple", "value": "pineapple" },
            { "label": "Pork", "value": "pork" },
            { "label": "Seafood", "value": "seafood" },
            { "label": "Sesame", "value": "sesame" },
            { "label": "Shellfish", "value": "shellfish" },
            { "label": "Soy", "value": "soy" },
            { "label": "Stonefruit", "value": "stonefruit" },
            { "label": "Sulfites", "value": "sulfites" },
            { "label": "Tree Nuts", "value": "tree_nuts" },
            { "label": "Wheat", "value": "wheat" }
          ],
      },
    {
      name: 'images',
      type: 'array',
      required: false,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media', // Connects to the media collection
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          required: false,
        },
      ],
    },
  ],
}
