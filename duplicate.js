import payload from 'payload';
import path from 'path';
import { fileURLToPath } from 'url';

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



(async () => {
    const id = 13
    
    
    await payload.init({
        secret: process.env.PAYLOAD_SECRET,
        local: true,
        config: path.resolve(__dirname, './src/payload.config.ts'),
    });

  const entry = await payload.findByID({
    collection: 'recipes',
    id: id,
  });

  await payload.create({
    collection: 'recipes-prep',
    data: {
      ...entry,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
    },
  });

  await payload.delete({
    collection: 'recipes',
    id: id,
  });

  console.log('Entry moved from prep to plated');
})();
