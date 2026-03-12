
CREATE POLICY "Allow public insert on sobre_conteudo"
ON public.sobre_conteudo FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Allow public update on sobre_conteudo"
ON public.sobre_conteudo FOR UPDATE TO public
USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete on sobre_conteudo"
ON public.sobre_conteudo FOR DELETE TO public
USING (true);
