
-- Create test_runs table
CREATE TABLE public.test_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url TEXT NOT NULL,
  scenario_id TEXT NOT NULL DEFAULT 'smoke_v1',
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'passed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  options JSONB DEFAULT '{}'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  findings JSONB DEFAULT '{"consoleErrors":[],"failedRequests":[]}'::jsonb,
  report_path TEXT,
  assets JSONB DEFAULT '{}'::jsonb
);

-- Create app_settings table
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.app_settings (key, value) VALUES
  ('runner_mode', '"mock"'),
  ('external_runner_url', '""'),
  ('external_runner_api_key', '""'),
  ('allow_localhost', 'false'),
  ('max_runs_per_day', '10');

-- RLS: allow all access for demo (no auth)
ALTER TABLE public.test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to test_runs" ON public.test_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Create storage bucket for test assets
INSERT INTO storage.buckets (id, name, public) VALUES ('test-assets', 'test-assets', true);

-- Storage RLS: allow all access for demo
CREATE POLICY "Allow public read on test-assets" ON storage.objects FOR SELECT USING (bucket_id = 'test-assets');
CREATE POLICY "Allow public insert on test-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'test-assets');
CREATE POLICY "Allow public update on test-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'test-assets');
