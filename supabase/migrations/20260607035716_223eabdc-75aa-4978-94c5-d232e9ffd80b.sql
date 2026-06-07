
ALTER TABLE public.chatbot_knowledge
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low'));

CREATE INDEX IF NOT EXISTS idx_chatbot_knowledge_priority
  ON public.chatbot_knowledge(priority, sort_order);
