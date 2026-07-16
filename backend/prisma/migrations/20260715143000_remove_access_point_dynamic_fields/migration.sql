DELETE FROM "asset_dynamic_field_values"
WHERE "product_type_field_id" IN (
  SELECT ptf."id"
  FROM "product_type_fields" ptf
  JOIN "product_types" pt ON pt."id" = ptf."product_type_id"
  WHERE lower(pt."display_name") LIKE '%access point%'
    AND ptf."section_name" = 'Access Point Details'
);

DELETE FROM "product_type_fields"
WHERE "id" IN (
  SELECT ptf."id"
  FROM "product_type_fields" ptf
  JOIN "product_types" pt ON pt."id" = ptf."product_type_id"
  WHERE lower(pt."display_name") LIKE '%access point%'
    AND ptf."section_name" = 'Access Point Details'
);
