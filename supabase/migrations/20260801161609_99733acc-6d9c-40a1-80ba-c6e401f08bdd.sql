CREATE TABLE public.email_captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.email_captures TO anon, authenticated;
GRANT ALL ON public.email_captures TO service_role;

ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an email" ON public.email_captures
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE TABLE public.usage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL CHECK (event IN ('calculated', 'shared', 'email_captured')),
  band TEXT CHECK (band IN ('red', 'amber', 'green')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT INSERT ON public.usage_events TO anon, authenticated;
GRANT ALL ON public.usage_events TO service_role;

ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log an anonymous event" ON public.usage_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);