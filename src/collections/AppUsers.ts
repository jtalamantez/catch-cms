import type { CollectionConfig } from 'payload'
import {Stores} from '../utils/stores';

export const AppUsers: CollectionConfig = {
    slug: 'appUsers',
    auth: true,
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
            { label: 'FOH', value: 'foh' },
            { label: 'BOH', value: 'boh' },
            { label: 'Bartender', value: 'bartender' },
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
