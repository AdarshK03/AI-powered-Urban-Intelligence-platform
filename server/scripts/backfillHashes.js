import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/db.js';
import { createImageHashes } from '../utils/imageHash.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, '..');

async function backfill() {
  console.log('Starting backfill of issue_photo_hashes...');
  const issuesRes = await query('SELECT id, reference_number, photos FROM issues');
  console.log(`Found ${issuesRes.rows.length} issues to check.`);

  let backfilled = 0;
  for (const row of issuesRes.rows) {
    const photos = typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos || [];
    for (const p of photos) {
      const url = typeof p === 'string' ? p : p.url;
      if (url && url.startsWith('/uploads/')) {
        const filePath = path.join(serverDir, url);
        if (fs.existsSync(filePath)) {
          const buf = fs.readFileSync(filePath);
          const base64 = 'data:image/jpeg;base64,' + buf.toString('base64');
          try {
            const hashes = await createImageHashes(base64);
            const hashesToInsert = [hashes?.exactHash, hashes?.normalizedHash].filter(Boolean);
            for (const h of hashesToInsert) {
              await query(
                `INSERT INTO issue_photo_hashes (issue_id, image_hash)
                 VALUES ($1, $2)
                 ON CONFLICT (image_hash) DO NOTHING`,
                [row.id, h]
              );
              backfilled++;
            }
          } catch (err) {
            console.warn(`Error hashing photo for issue ${row.id}:`, err.message);
          }
        } else {
          console.log(`File not found: ${filePath}`);
        }
      }
    }
  }

  const countRes = await query('SELECT count(*) FROM issue_photo_hashes');
  console.log(`Backfill complete. Total hashes in issue_photo_hashes: ${countRes.rows[0].count}`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});
