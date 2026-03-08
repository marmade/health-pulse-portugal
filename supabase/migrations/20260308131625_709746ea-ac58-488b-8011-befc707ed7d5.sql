-- Add write policies for admin operations on keywords table
CREATE POLICY "Allow public insert on keywords" 
ON public.keywords FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on keywords" 
ON public.keywords FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on keywords" 
ON public.keywords FOR DELETE 
USING (true);

-- Add write policies for admin operations on debunking table
CREATE POLICY "Allow public insert on debunking" 
ON public.debunking FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on debunking" 
ON public.debunking FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on debunking" 
ON public.debunking FOR DELETE 
USING (true);

-- Add write policies for admin operations on news_items table
CREATE POLICY "Allow public update on news_items" 
ON public.news_items FOR UPDATE 
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on news_items" 
ON public.news_items FOR DELETE 
USING (true);