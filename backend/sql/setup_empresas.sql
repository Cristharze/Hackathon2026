-- ── Tabla contribuyentes externos ────────────────────────────
CREATE TABLE IF NOT EXISTS contribuyentes_externos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      TEXT        NOT NULL,
  descripcion TEXT,
  primera_vez DATE        NOT NULL DEFAULT CURRENT_DATE,
  ultima_vez  DATE        NOT NULL DEFAULT CURRENT_DATE,
  total_kg    NUMERIC(12,3) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 22 Empresas aliadas de Fundares ──────────────────────────
INSERT INTO empresas (nombre, sector, ciudad) VALUES
  ('Ecomanager',                    'OTRO',          'Santa Cruz'),
  ('Ascensores',                    'OTRO',          'Santa Cruz'),
  ('Ciagro',                        'OTRO',          'Santa Cruz'),
  ('BAS',                           'OTRO',          'Santa Cruz'),
  ('Curupau S.R.L.',                'OTRO',          'Santa Cruz'),
  ('Interlogi',                     'OTRO',          'Santa Cruz'),
  ('Construpanel',                  'CONSTRUCCION',  'Santa Cruz'),
  ('PXB',                           'OTRO',          'Santa Cruz'),
  ('Cedare',                        'OTRO',          'Santa Cruz'),
  ('REEcicla',                      'OTRO',          'Santa Cruz'),
  ('Sofia',                         'ALIMENTOS',     'Santa Cruz'),
  ('Newrest',                       'ALIMENTOS',     'Santa Cruz'),
  ('Bufalo',                        'OTRO',          'Santa Cruz'),
  ('INEA S.R.L.',                   'OTRO',          'Santa Cruz'),
  ('Tropiflor',                     'OTRO',          'Santa Cruz'),
  ('Banco de la Nacion Argentina',  'SERVICIOS',     'Santa Cruz'),
  ('Las Lomas',                     'OTRO',          'Santa Cruz'),
  ('Inplaz',                        'OTRO',          'Santa Cruz'),
  ('Mecpetrol',                     'OTRO',          'Santa Cruz'),
  ('Bago',                          'SALUD',         'Santa Cruz'),
  ('Empacar S.A.',                  'MANUFACTURA',   'Santa Cruz'),
  ('Batebol S.A.',                  'OTRO',          'Santa Cruz')
ON CONFLICT DO NOTHING;
