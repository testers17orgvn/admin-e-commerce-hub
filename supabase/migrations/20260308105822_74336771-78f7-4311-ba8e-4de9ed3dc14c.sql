
-- Add new_contacts column to notification_settings
ALTER TABLE public.notification_settings ADD COLUMN IF NOT EXISTS new_contacts boolean DEFAULT true;

-- Create trigger function to notify admins on new contact
CREATE OR REPLACE FUNCTION public.notify_admins_new_contact()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_record RECORD;
BEGIN
  FOR admin_record IN 
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      admin_record.user_id,
      '📩 Liên hệ mới từ ' || NEW.name,
      'Email: ' || NEW.email || CASE WHEN NEW.subject IS NOT NULL THEN ' - ' || NEW.subject ELSE '' END,
      'contact',
      '/admin/contacts'
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on contacts table
DROP TRIGGER IF EXISTS on_new_contact_notify_admins ON public.contacts;
CREATE TRIGGER on_new_contact_notify_admins
  AFTER INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_new_contact();
