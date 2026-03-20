CREATE POLICY "Allow public insert on revisao_pares"
  ON public.revisao_pares FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on revisao_pares"
  ON public.revisao_pares FOR UPDATE
  USING (true)
  WITH CHECK (true);