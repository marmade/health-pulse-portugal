-- Add eixo badge and subcategoria to bookmarks
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS eixo text DEFAULT NULL;
ALTER TABLE public.bookmarks ADD COLUMN IF NOT EXISTS subcategoria text DEFAULT NULL;

-- Set subcategorias for existing fontes_referencia bookmarks
UPDATE public.bookmarks SET subcategoria = 'sociedades_cientificas'
WHERE categoria = 'fontes_referencia' AND (
  titulo ILIKE 'Sociedade Portuguesa%' OR
  titulo ILIKE 'Associação Portuguesa%' OR
  titulo ILIKE 'Federação das Sociedades%' OR
  titulo ILIKE 'Núcleo de Endocrinologia%' OR
  titulo ILIKE 'Clube Português%'
);

UPDATE public.bookmarks SET subcategoria = 'institucional'
WHERE categoria = 'fontes_referencia' AND (
  titulo ILIKE '%DGS%' OR titulo ILIKE '%Governo%' OR
  titulo ILIKE '%Ordem dos%' OR titulo ILIKE 'EIPAS%' OR
  titulo ILIKE 'Nutrimento%' OR titulo ILIKE 'Alimentação Saudável%'
);

UPDATE public.bookmarks SET subcategoria = 'ong_associacoes'
WHERE categoria = 'fontes_referencia' AND (
  titulo ILIKE '%Cruz Vermelha%' OR titulo ILIKE '%APAV%' OR
  titulo ILIKE '%Conselho Português%'
);

UPDATE public.bookmarks SET subcategoria = 'farmaceutica'
WHERE categoria = 'fontes_referencia' AND titulo ILIKE '%Bial%';

UPDATE public.bookmarks SET subcategoria = 'academia'
WHERE categoria = 'fontes_referencia' AND (
  titulo ILIKE '%GIMM%' OR titulo ILIKE '%Gulbenkian%' OR
  titulo ILIKE '%Neurociências%' OR titulo ILIKE '%90 Segundos%' OR
  titulo ILIKE '%HPA%'
);

UPDATE public.bookmarks SET subcategoria = 'referencia_clinica'
WHERE categoria = 'fontes_referencia' AND (
  titulo ILIKE '%MSD%' OR titulo ILIKE '%NewsFarma%'
);

UPDATE public.bookmarks SET subcategoria = 'outros'
WHERE categoria = 'fontes_referencia' AND subcategoria IS NULL;

-- Set eixo badges for relevant bookmarks
UPDATE public.bookmarks SET eixo = 'saude-mental'
WHERE titulo ILIKE '%Psiquiatria%' OR titulo ILIKE '%Suicidologia%'
  OR titulo ILIKE '%Psicologia%' OR titulo ILIKE '%Psicodrama%'
  OR titulo ILIKE '%Neuropediatria%' OR titulo ILIKE '%Neurociências%';

UPDATE public.bookmarks SET eixo = 'alimentacao'
WHERE titulo ILIKE '%Nutrição%' OR titulo ILIKE '%Alimentação%'
  OR titulo ILIKE '%Alimentar%' OR titulo ILIKE '%Obesidade%'
  OR titulo ILIKE '%Diabetologia%' OR titulo ILIKE '%Gastrenterologia%'
  OR titulo ILIKE '%Nutrimento%' OR titulo ILIKE '%EIPAS%'
  OR titulo ILIKE '%Endocrinologia%' OR titulo ILIKE '%Metabólica%';

UPDATE public.bookmarks SET eixo = 'menopausa'
WHERE titulo ILIKE '%Menopausa%' OR titulo ILIKE '%Ginecologia%'
  OR titulo ILIKE '%Obstetrícia%' OR titulo ILIKE '%Senologia%'
  OR titulo ILIKE '%Contracepção%' OR titulo ILIKE '%Reprodução%'
  OR titulo ILIKE '%Materno%' OR titulo ILIKE '%Andrologia%';

UPDATE public.bookmarks SET eixo = 'emergentes'
WHERE titulo ILIKE '%Oncologia%' OR titulo ILIKE '%Transplantação%'
  OR titulo ILIKE '%Vascular Cerebral%' OR titulo ILIKE '%Imunologia%'
  OR titulo ILIKE '%Hematologia%' OR titulo ILIKE '%Saúde Pública%'
  OR titulo ILIKE '%Saúde e Ambiente%' OR titulo ILIKE '%Hepatologia%';
