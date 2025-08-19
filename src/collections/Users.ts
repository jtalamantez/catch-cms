import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  labels: {
    singular: 'Backend User',
    plural: 'Backend Users',
},
  auth: true,
  fields: [
    {
        name: 'name',
        label: 'Name',
        type: 'text',
        //required: true,
    },
    {
        name: 'roles',
        label: 'Roles',
        type: 'select',
        hasMany: true,
        defaultValue: ['staff'],
        options: [
          { label: 'Admin', value: 'admin' },
          { label: 'Manager', value: 'manager' },
          { label: 'Chef', value: 'chef' },
          { label: 'FOH', value: 'foh' },
          { label: 'Staff', value: 'staff' },
        ],
      },
  ],
}
