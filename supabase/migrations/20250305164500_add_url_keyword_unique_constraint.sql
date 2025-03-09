-- Delete duplicate URL/keyword pairs, keeping the most recently updated one
DELETE FROM url_keyword_pairs a USING url_keyword_pairs b
WHERE a.url = b.url 
  AND a.keyword = b.keyword 
  AND a.id > b.id;

-- Add unique constraint to prevent duplicate URL/keyword pairs
ALTER TABLE url_keyword_pairs ADD CONSTRAINT url_keyword_unique UNIQUE (url, keyword); 