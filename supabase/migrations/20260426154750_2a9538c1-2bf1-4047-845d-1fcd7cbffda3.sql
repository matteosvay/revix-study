INSERT INTO public.user_cosmetics (user_id, item_key, acquired_via)
SELECT '77aebf92-3adb-4517-a823-d7f76f181a99', ci.item_key, 'shop'
FROM public.cosmetic_items ci
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_cosmetics uc
  WHERE uc.user_id = '77aebf92-3adb-4517-a823-d7f76f181a99'
    AND uc.item_key = ci.item_key
);