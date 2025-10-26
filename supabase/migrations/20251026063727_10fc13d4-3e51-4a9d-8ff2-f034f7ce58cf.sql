-- Create storage bucket for prescription images
INSERT INTO storage.buckets (id, name, public)
VALUES ('prescription-images', 'prescription-images', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for prescription images bucket
CREATE POLICY "Users can upload their own prescription images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own prescription images"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own prescription images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'prescription-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create user_settings table for storing preferences like Mapbox token
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  mapbox_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates on user_settings
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON public.user_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();