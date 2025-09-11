import type { CollectionConfig } from 'payload'
import {Stores} from '../utils/stores';

export const AppUsers: CollectionConfig = {
    slug: 'appUsers',
    auth: true,
    labels: {
        singular: 'App User',
        plural: 'App Users',
    },
    access: {
      read: () => true,
    },
    fields: [
        {
            name: 'email',
            type: 'email',
            required: true,
            unique: true,
          },
          {
            name: 'name',
            type: 'text',
            required: true,
            },

      {
        name: 'role',
        type: 'select',
        hasMany: true, // ✅ allows multiple selections
        required: true,
        options: [
            { label: 'Bar', value: 'foh' },
            { label: 'Server', value: 'server' },

            { label: 'Sales', value: 'foh' }, //THIS WILL BEDELETED
            { label: 'Support', value: 'support' },
            { label: 'BOH', value: 'boh' },
            { label: 'Admin', value: 'admin' },
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
    ],
}
