import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
  },
  fields: [],
  admin: {
    description: 'Upload JPG, PNG, or WEBP files only. Max size: 5MB. For best results, upload under 1MB.'
  },

  upload: {
    staticDir: 'media',
    mimeTypes: ['image/*'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
      },
      {
        name: 'mobile',
        width: 800,
        height: 600,
      },
      {
        name: 'web',
        width: 1600,
        height: 1200,
      },
    ],
    adminThumbnail: 'thumbnail',
    resizeOptions: {
      fit: 'cover',
    },
    formatOptions: {
      format: 'webp', // this helps reduce file sizes significantly
    },
    maxFileSize: 5 * 1024 * 1024, // 5 MB
  }
}


