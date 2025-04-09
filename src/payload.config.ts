// storage-adapter-import-placeholder
//import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { postgresAdapter } from '@payloadcms/db-postgres';
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'

import { s3Storage } from '@payloadcms/storage-s3'
import { Media } from './collections/Media'


import { Recipes } from './collections/Recipes'
import { CocktailRecipes } from './collections/CocktailRecipes'
import { CocktailPrepItems } from './collections/CocktailPrep'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Recipes, CocktailRecipes, CocktailPrepItems],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  /*
  db: sqliteAdapter({
    client: {
      url: process.env.DATABASE_URI || '',
    },
  }),
  */
  db: postgresAdapter({
      pool: {
          connectionString: process.env.DATABASE_URI || '',
        },
    }),
  sharp,
  plugins: [
    payloadCloudPlugin(),
    // storage-adapter-placeholder
    s3Storage({
        collections: {
          media: {
            prefix: 'media',
          }
        },
        bucket: process.env.S3_BUCKET!,
        config: {
            forcePathStyle: true, // required for Supabase
            endpoint: process.env.S3_ENDPOINT, // Supabase-specific
            region: process.env.S3_REGION, // required, but not used by Supabase
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID!,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
        },
      }),
  ],
})
