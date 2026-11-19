/*
# Add deleted_at column to words table for recycle bin (soft delete)

1. Purpose
- Enable soft delete for words: when a user deletes a word, it gets marked with a timestamp
  instead of being permanently removed. The word can then be restored from the recycle bin.
- Words with a non-null deleted_at are excluded from normal queries.

2. Changes
- Add `deleted_at` column (timestamptz, nullable) to the `words` table.
- Default is NULL, meaning all existing words remain visible (not deleted).

3. Security
- No policy changes needed. The existing RLS policies already scope by auth.uid().
- The frontend will filter out deleted words in normal views and show them only in the recycle bin.
*/

ALTER TABLE words ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
