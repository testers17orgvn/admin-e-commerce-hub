
CREATE TABLE public.chatbot_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL DEFAULT 'FAQ',
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.chatbot_knowledge TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chatbot_knowledge TO authenticated;
GRANT ALL ON public.chatbot_knowledge TO service_role;

ALTER TABLE public.chatbot_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active knowledge"
  ON public.chatbot_knowledge FOR SELECT
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage knowledge"
  ON public.chatbot_knowledge FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_chatbot_knowledge_updated_at
  BEFORE UPDATE ON public.chatbot_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chatbot_knowledge_category ON public.chatbot_knowledge(category, sort_order);
