
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'staff');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User roles policies (only admin can manage)
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.is_admin());

-- Admin policies for CMS tables
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all products" ON public.products FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can manage all blogs" ON public.blogs FOR ALL USING (public.is_admin());
CREATE POLICY "Admins can view contacts" ON public.contacts FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update contacts" ON public.contacts FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete contacts" ON public.contacts FOR DELETE USING (public.is_admin());
CREATE POLICY "Admins can view orders" ON public.orders FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can manage settings" ON public.settings FOR ALL USING (public.is_admin());

-- Handle new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
