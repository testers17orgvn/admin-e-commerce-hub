-- Add new roles to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'dealer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tester';

-- Add video_url column to products table for product review videos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;