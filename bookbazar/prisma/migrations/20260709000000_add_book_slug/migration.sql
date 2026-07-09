ALTER TABLE "books"
ADD COLUMN IF NOT EXISTS "slug" TEXT;

CREATE OR REPLACE FUNCTION book_slugify(input_text TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  result := lower(regexp_replace(trim(input_text), '[^a-zA-Z0-9]+', '-', 'g'));
  result := regexp_replace(result, '-+', '-', 'g');
  result := trim(both '-' from result);

  IF result = '' THEN
    result := 'book';
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

DO $$
DECLARE
  book_record RECORD;
  base_slug TEXT;
  candidate_slug TEXT;
  suffix INTEGER;
BEGIN
  FOR book_record IN
    SELECT id, title
    FROM "books"
    ORDER BY "createdAt", id
  LOOP
    base_slug := book_slugify(book_record.title);
    candidate_slug := base_slug;
    suffix := 2;

    WHILE EXISTS (
      SELECT 1
      FROM "books"
      WHERE slug = candidate_slug
        AND id <> book_record.id
    ) LOOP
      candidate_slug := base_slug || '-' || suffix;
      suffix := suffix + 1;
    END LOOP;

    UPDATE "books"
    SET slug = candidate_slug
    WHERE id = book_record.id;
  END LOOP;
END $$;

ALTER TABLE "books"
ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "books_slug_key" ON "books" ("slug");

DROP FUNCTION book_slugify(TEXT);