-- Create keywords table
CREATE TABLE public.keywords (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  axis TEXT NOT NULL,
  source TEXT NOT NULL,
  current_volume INT NOT NULL DEFAULT 0,
  previous_volume INT NOT NULL DEFAULT 0,
  change_percent DECIMAL NOT NULL DEFAULT 0,
  trend TEXT NOT NULL DEFAULT 'stable',
  last_peak TEXT,
  is_emergent BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trend_data table
CREATE TABLE public.trend_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword_id UUID REFERENCES public.keywords(id) ON DELETE CASCADE NOT NULL,
  period_date DATE NOT NULL,
  search_index INT NOT NULL DEFAULT 0,
  year_label INT NOT NULL,
  region TEXT NOT NULL DEFAULT 'PT',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create debunking table
CREATE TABLE public.debunking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  title TEXT NOT NULL,
  classification TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create news_items table
CREATE TABLE public.news_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  outlet TEXT NOT NULL,
  date DATE NOT NULL,
  url TEXT NOT NULL,
  related_term TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debunking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;

-- Allow public read access (these are public reference data)
CREATE POLICY "Allow public read on keywords" ON public.keywords FOR SELECT USING (true);
CREATE POLICY "Allow public read on trend_data" ON public.trend_data FOR SELECT USING (true);
CREATE POLICY "Allow public read on debunking" ON public.debunking FOR SELECT USING (true);
CREATE POLICY "Allow public read on news_items" ON public.news_items FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_keywords_axis ON public.keywords(axis);
CREATE INDEX idx_keywords_term ON public.keywords(term);
CREATE INDEX idx_trend_data_keyword ON public.trend_data(keyword_id);
CREATE INDEX idx_trend_data_region ON public.trend_data(region);
CREATE INDEX idx_debunking_term ON public.debunking(term);
CREATE INDEX idx_news_items_related_term ON public.news_items(related_term);