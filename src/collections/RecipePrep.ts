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
      name: 'dropPhrase',
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
          options: ['g', 'oz', 'ea', 'lbs', 'kg', 'ml', 'l', 'tsp', 'gal', 'tbsp', 'cup', 'pcs'], // Customize as needed
          required: true,
        },
        {
          name: 'qty',
          type: 'number',
          required: true,
          min: 0.01,
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
      name: 'yield',
      type: 'text',
      required: false,
    },
    {
        name: 'allergens',
        label: 'Allergies',
        type: 'select',
        hasMany: true,
        options: [
            { label: 'Gluten', value: 'gluten' },
            { label: 'Dairy', value: 'dairy' },
            { label: 'Eggs', value: 'eggs' },
            { label: 'Fish', value: 'fish' },
            { label: 'Shellfish', value: 'shellfish' },
            { label: 'Soy', value: 'soy' },
            { label: 'Peanuts', value: 'peanuts' },
            { label: 'Tree Nuts', value: 'tree_nuts' },
            { label: 'Sesame', value: 'sesame' },
            { label: 'Allium (Garlic, Onion)', value: 'allium' },
            { label: 'Pork', value: 'pork' },
            { label: 'Alcohol', value: 'alcohol' },
            { label: 'Ginger', value: 'ginger' },
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
