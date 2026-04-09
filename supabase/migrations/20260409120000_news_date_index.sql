-- Índice na coluna date de news_items para queries por período
CREATE INDEX IF NOT EXISTS idx_news_items_date ON public.news_items (date DESC);
