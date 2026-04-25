-- Bucket public pour les visuels de cosmétiques (PNG IA)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cosmetics', 'cosmetics', true)
ON CONFLICT (id) DO NOTHING;

-- Lecture publique uniquement
CREATE POLICY "cosmetics images public read"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cosmetics');