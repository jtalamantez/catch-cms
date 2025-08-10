import type { CollectionConfig, FieldAccess } from 'payload'
import { Units, Allergens } from '../utils/units';
import {Stores} from '../utils/stores';

// Only managers/admins can update FOH fields; everyone can read them

const hasRole = (req: any, roles: string[]) =>
    Array.isArray(req?.user?.roles) && req.user.roles.some((r: string) => roles.includes(r))


const fohFieldAccess = {
    read: () => true,
    create: ({ req }) => hasRole(req, ['admin', 'manager']),
    update: ({ req }) => hasRole(req, ['admin', 'manager']),
    //update: () => false, // Allow all to update
  } satisfies FieldAccess


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
    {
        name: 'stores',
        label: 'Location',
        type: 'select',
        hasMany: true,
        options: Stores,
        required: false,
      },
      {
        type: 'group',
        name: 'foh',
        label: 'FOH',
        admin: {  description: 'Fields for FOH staff' },
        fields: [
            {
                name: 'description',
                type: 'textarea',
                required: false,
                access: fohFieldAccess,
              },
              {
                name: 'dropline',
                label: 'Dropline',
                type: 'text',
                required: false,
                access: fohFieldAccess,
              },
              {
                name: 'components',
                label: 'Components',
                type: 'array',
                required: false,
                access: fohFieldAccess,
                fields: [
                  {
                    name: 'name',
                    label: 'Component Name',
                    type: 'text',
                    required: true,
                  },
                  {
                    name: 'ingredients',
                    type: 'text',
                    required: true,
                  },
                ]
              },
              {
                name: 'ingredients',
                label: 'Ingredients (PPSSG)',
                type: 'group',
                required: false,
                access: fohFieldAccess,
                fields: [
                  {
                    name: 'protein',
                    type: 'text',
                    required: false,
                  },
                    {
                        name: 'preparation',
                        type: 'text',
                        required: false,
                    },
                    {
                        name: 'sauce',
                        label: 'seasonal veg',
                        type: 'text',
                        required: false,
                    },
                    {
                        name: 'side',
                        type: 'text',
                        required: false,
                    },
                    {
                        name: 'garnish',
                        type: 'text',
                        required: false,
                    },
                  
                ]
              },
              {
                name: 'notes',
                type: 'textarea',
                required: false,
                access: fohFieldAccess,
              },

        ],
      }
  ],
}