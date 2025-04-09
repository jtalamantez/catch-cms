import type { CollectionConfig } from 'payload'

export const Recipes: CollectionConfig = {
  slug: "recipes",
  labels: {
    singular: "Recipe",
    plural: "Recipes",
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
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "dropPhrase",
      type: "text",
      required: false,
    },
    {
      name: "method",
      type: "textarea",
      required: false,
    },
    {
      name: "ingredients",
      type: "array", // Allows repeatable ingredient entries
      fields: [
        {
          name: "ingredient",
          type: "text",
          required: true,
        },
        {
          name: "unit",
          type: "select",
          options: ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "pcs"], // Customize as needed
          required: true,
        },
        {
          name: "qty",
          type: "number",
          required: true,
          min: 0.01,
        },
      ],
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

