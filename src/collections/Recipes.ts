import type { CollectionConfig } from 'payload'
import { Units, Allergens } from '../utils/units';

export const Recipes: CollectionConfig = {
  slug: 'recipes',
  labels: {
    singular: 'Culinary - Plated Recipe',
    plural: 'Culinary - Plated Recipes',
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
      unique: true,
    },
    {
        name: 'method',
        label: 'Pick-up Steps',
        type: 'textarea',
        required: false,
      },
      {
        name: 'plateBuild',
        label: 'Plate Build',
        type: 'textarea',
        required: false,
      },
      {
        name: 'ingredients',
        type: 'array',
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
            relationTo: 'recipes-prep',
            label: 'Select sub-recipe',
            admin: {
              condition: (_, siblingData) => siblingData.isSubRecipe === true,
            },
          },
        ],
      },
    {
      name: 'implemented',
      type: 'text',
      required: false,
    },
    {
      name: 'lastRevised',
      type: 'date',
      required: false,
    },
    {
      name: 'prepTime',
      label: 'Prep Time',
      type: 'text',
    },

    {
      name: 'kitchen',
      label: 'Kitchen',
      type: 'text',
      required: false,
    },
    {
      name: 'stations',
      label: 'Station(s)',
      type: 'text',
    },
    {
      name: 'mealPeriod',
      label: 'Meal Period',
      type: 'text',
      required: false,
    },
    {
      name: 'mealType',
      label: 'Meal Type',
      type: 'text',
      required: false,
    },
    {
      name: 'platingInstructions',
      label: 'Plating Instructions',
      type: 'textarea',
      required: false,
    },
    {
      name: 'plateType',
      label: 'Plate Type',
      type: 'text',
      required: false,
    },
    {
        name: 'utensils',
        label: 'Utensils',
        type: 'textarea',
        required: false,
      },

    {
      name: 'category',
      label: 'App Category',
      type: 'select',
      hasMany: true,
      options: [
        { label: '', value: '' },
        { label: 'Dinner', value: 'dinner' },
        { label: 'Brunch', value: 'brunch' },
      ],
      required: false,
    },
    {
        name: 'menuCategory',
        label: 'Menu Category',
        type: 'select',
        options: [
          { label: 'Snacks', value: 'snacks' },
          { label: 'Salads', value: 'salads' },
            { label: 'From Japan', value: 'japan' },
            { label: 'Specialty Rolls', value: 'rolls' },
            { label: 'Hot Starters', value: 'hot_starters' },
            { label: 'Wagyu Hot Rock', value: 'hot_rock' },
            { label: 'Steak', value: 'steak' },
            { label: 'Seafood', value: 'seafood' },
            { label: 'Sides', value: 'sides' },
            { label: 'Desserts', value: 'desserts' },
        ],
        required: false,
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
          relationTo: 'media',
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