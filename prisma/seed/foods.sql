-- Seed inicial do FoodCatalog: 40 alimentos staples brasileiros baseados na
-- TACO (Tabela Brasileira de Composição de Alimentos, Unicamp NEPA, 4a ed).
-- IDs prefixados com "taco_" pra serem reconhecíveis e idempotentes via ON CONFLICT.
-- Aplicar via Supabase SQL Editor após a migration 20260603140000_add_nutri_vertical.
-- Re-executar é seguro: ON CONFLICT (id) DO NOTHING.

INSERT INTO "FoodCatalog" (id, name, brand, "isCustom", "createdById", source, "kcalPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g", "fiberPer100g") VALUES
  -- Grãos / cereais
  ('taco_arroz_branco_cozido',   'Arroz, branco, cozido',   NULL, false, NULL, 'TACO', 124, 2.5,  26.1, 0.2, 1.6),
  ('taco_arroz_integral_cozido', 'Arroz, integral, cozido', NULL, false, NULL, 'TACO', 124, 2.6,  25.8, 1.0, 2.7),
  ('taco_aveia_flocos',          'Aveia em flocos',         NULL, false, NULL, 'TACO', 394, 13.9, 66.6, 8.5, 9.1),
  ('taco_pao_frances',           'Pão francês',             NULL, false, NULL, 'TACO', 300, 8.0,  58.6, 3.1, 2.3),
  ('taco_pao_integral',          'Pão integral',            NULL, false, NULL, 'TACO', 253, 9.4,  48.3, 3.3, 6.9),
  ('taco_macarrao_cozido',       'Macarrão, cozido',        NULL, false, NULL, 'TACO', 102, 3.4,  19.9, 1.3, 1.6),

  -- Leguminosas
  ('taco_feijao_carioca_cozido', 'Feijão, carioca, cozido', NULL, false, NULL, 'TACO',  76, 4.8,  13.6, 0.5, 8.5),
  ('taco_feijao_preto_cozido',   'Feijão, preto, cozido',   NULL, false, NULL, 'TACO',  77, 4.5,  14.0, 0.5, 8.4),
  ('taco_lentilha_cozida',       'Lentilha, cozida',        NULL, false, NULL, 'TACO',  93, 6.3,  16.3, 0.5, 7.9),
  ('taco_grao_bico_cozido',      'Grão de bico, cozido',    NULL, false, NULL, 'TACO', 121, 5.1,  19.1, 2.2, 5.4),

  -- Carnes / ovos
  ('taco_frango_peito_grelhado', 'Frango, peito, grelhado',          NULL, false, NULL, 'TACO', 159, 32.0, 0.0,  3.0, NULL),
  ('taco_frango_coxa_assada',    'Frango, coxa, assada',             NULL, false, NULL, 'TACO', 215, 27.0, 0.0,  11.0, NULL),
  ('taco_carne_patinho_grelhado','Carne bovina, patinho, grelhado',  NULL, false, NULL, 'TACO', 156, 26.0, 0.0,  5.0, NULL),
  ('taco_carne_alcatra_grelhada','Carne bovina, alcatra, grelhada',  NULL, false, NULL, 'TACO', 170, 27.0, 0.0,  6.0, NULL),
  ('taco_tilapia_grelhada',      'Tilápia, grelhada',                NULL, false, NULL, 'TACO', 129, 26.0, 0.0,  2.6, NULL),
  ('taco_salmao_grelhado',       'Salmão, grelhado',                 NULL, false, NULL, 'TACO', 208, 22.0, 0.0,  12.0, NULL),
  ('taco_ovo_inteiro_cozido',    'Ovo, inteiro, cozido',             NULL, false, NULL, 'TACO', 146, 13.0, 0.6,  9.5, NULL),
  ('taco_ovo_clara_cozida',      'Ovo, clara, cozida',               NULL, false, NULL, 'TACO',  60, 13.0, 0.6,  0.0, NULL),

  -- Frutas
  ('taco_banana_prata',          'Banana, prata',           NULL, false, NULL, 'TACO',  98, 1.3,  26.0, 0.1, 2.0),
  ('taco_banana_nanica',         'Banana, nanica',          NULL, false, NULL, 'TACO',  92, 1.4,  23.8, 0.1, 1.9),
  ('taco_maca_vermelha',         'Maçã, vermelha, com casca', NULL, false, NULL, 'TACO', 56, 0.3, 15.2, 0.0, 1.3),
  ('taco_mamao_formosa',         'Mamão, formosa',          NULL, false, NULL, 'TACO',  45, 0.8,  11.6, 0.1, 1.8),
  ('taco_mamao_papaia',          'Mamão, papaia',           NULL, false, NULL, 'TACO',  40, 0.5,  10.4, 0.1, 1.0),
  ('taco_laranja_pera',          'Laranja, pera, com bagaço', NULL, false, NULL, 'TACO', 37, 0.7, 8.9, 0.1, 0.8),
  ('taco_abacate',               'Abacate, cru',            NULL, false, NULL, 'TACO',  96, 1.2,  6.0, 8.4, 6.3),
  ('taco_morango',               'Morango, cru',            NULL, false, NULL, 'TACO',  30, 0.9,  6.8, 0.3, 1.7),

  -- Laticínios
  ('taco_leite_integral',        'Leite de vaca, integral', NULL, false, NULL, 'TACO',  61, 2.9,  4.3, 3.2, NULL),
  ('taco_leite_desnatado',       'Leite de vaca, desnatado',NULL, false, NULL, 'TACO',  35, 3.4,  5.0, 0.2, NULL),
  ('taco_iogurte_natural',       'Iogurte, natural',        NULL, false, NULL, 'TACO',  51, 4.1,  6.4, 1.0, NULL),
  ('taco_queijo_mussarela',      'Queijo, mussarela',       NULL, false, NULL, 'TACO', 280, 22.0, 3.0, 20.0, NULL),
  ('taco_queijo_minas_frescal',  'Queijo, minas frescal',   NULL, false, NULL, 'TACO', 264, 17.4, 3.2, 20.2, NULL),

  -- Tubérculos / raízes
  ('taco_batata_inglesa_cozida', 'Batata, inglesa, cozida', NULL, false, NULL, 'TACO',  52, 1.2,  11.9, 0.0, 1.3),
  ('taco_batata_doce_cozida',    'Batata, doce, cozida',    NULL, false, NULL, 'TACO',  77, 0.6,  18.4, 0.1, 2.2),
  ('taco_mandioca_cozida',       'Mandioca, cozida',        NULL, false, NULL, 'TACO', 125, 0.6,  30.1, 0.3, 1.6),

  -- Hortaliças
  ('taco_brocolis_cozido',       'Brócolis, cozido',        NULL, false, NULL, 'TACO',  25, 2.1,  4.4, 0.4, 3.4),
  ('taco_couve_refogada',        'Couve, manteiga, refogada', NULL, false, NULL, 'TACO', 90, 1.9, 3.5, 7.7, 3.1),
  ('taco_tomate_cru',            'Tomate, com semente, cru', NULL, false, NULL, 'TACO', 15, 1.1, 3.1, 0.2, 1.2),
  ('taco_cenoura_crua',          'Cenoura, crua',           NULL, false, NULL, 'TACO',  34, 1.3,  7.7, 0.2, 3.2),
  ('taco_alface',                'Alface, americana, crua', NULL, false, NULL, 'TACO',  11, 1.4,  1.7, 0.1, 1.2),

  -- Gorduras / oleaginosas
  ('taco_azeite_oliva',          'Azeite de oliva, extra virgem', NULL, false, NULL, 'TACO', 884, 0.0, 0.0, 100.0, NULL),
  ('taco_amendoa',               'Amêndoa, sem casca',      NULL, false, NULL, 'TACO', 581, 18.6, 19.6, 47.3, 11.6),
  ('taco_castanha_para',         'Castanha do Pará',        NULL, false, NULL, 'TACO', 643, 14.5, 15.1, 63.5, 7.9)
ON CONFLICT (id) DO NOTHING;
