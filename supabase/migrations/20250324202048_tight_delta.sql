/*
  # Add Markdown Support to Chat Messages

  1. Changes
    - Add `is_markdown` boolean column to `chat_messages` table
    - This helps distinguish between plain text and markdown messages

  2. Notes
    - Existing messages will be marked as non-markdown by default
    - New messages can specify whether they contain markdown
*/

ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_markdown boolean DEFAULT false;