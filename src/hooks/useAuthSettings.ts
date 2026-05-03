import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AuthPageSettings {
  auth_banner_url?: string;
  auth_welcome_title?: string;
  auth_welcome_subtitle?: string;
  auth_features?: string[];
  logo_url?: string;
  site_name?: string;
  // Form text
  auth_login_title?: string;
  auth_login_subtitle?: string;
  auth_signup_title?: string;
  auth_signup_subtitle?: string;
  auth_login_button?: string;
  auth_signup_button?: string;
  auth_switch_to_signup?: string;
  auth_switch_to_login?: string;
  // Messages
  auth_error_empty?: string;
  auth_error_name?: string;
  auth_error_duplicate?: string;
  auth_success_login?: string;
  auth_success_signup?: string;
  auth_footer_text?: string;
}

const ALL_KEYS = [
  'auth_banner_url', 'auth_welcome_title', 'auth_welcome_subtitle', 'auth_features',
  'logo_url', 'site_name',
  'auth_login_title', 'auth_login_subtitle', 'auth_signup_title', 'auth_signup_subtitle',
  'auth_login_button', 'auth_signup_button', 'auth_switch_to_signup', 'auth_switch_to_login',
  'auth_error_empty', 'auth_error_name', 'auth_error_duplicate',
  'auth_success_login', 'auth_success_signup', 'auth_footer_text',
];

export function useAuthSettings() {
  const [settings, setSettings] = useState<AuthPageSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('settings')
      .select('key, value')
      .in('key', ALL_KEYS)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, unknown> = {};
          data.forEach((r: { key: string; value: unknown }) => {
            if (r.key === 'auth_features') {
              const val = r.value as string;
              if (typeof val === 'string' && val.trim()) {
                map[r.key] = val.split('\n').filter(Boolean).slice(0, 4);
              }
            } else {
              map[r.key] = r.value;
            }
          });
          setSettings(
            Object.fromEntries(
              Object.entries(map).filter(([, v]) => v != null && v !== '')
            ) as AuthPageSettings
          );
        }
        setLoading(false);
      });
  }, []);

  return { settings, loading };
}
