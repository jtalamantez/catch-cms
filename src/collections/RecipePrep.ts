import type { CollectionConfig } from 'payload'
import { Units, Allergens } from '../utils/units';


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
      unique: true, // <-- this ensures no duplicate names in the DB

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
          options: Units,
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
            options: Units,
            required: false,
          },
        ]
      },
    {
        name: 'allergens',
        label: 'Allergies',
        type: 'select',
        hasMany: true,
        options: Allergens,
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
