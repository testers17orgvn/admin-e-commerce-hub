import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface PopupConfig {
  enabled: boolean;
  title: string;
  message: string;
  image_url: string;
  button_text: string;
  button_url: string;
  show_close_button: boolean;
  close_button_delay: number;
  close_button_style: 'icon' | 'text' | 'icon_text';
  close_button_position: 'top-right' | 'top-left' | 'bottom-center';
  background_color: string;
  text_color: string;
  animation: 'slide-up' | 'fade' | 'scale' | 'slide-down';
  show_frequency: 'every_visit' | 'once_per_day' | 'once_per_session' | 'once';
  delay_seconds: number;
  overlay_dismiss: boolean;
  mobile_only: boolean;
}

export function MobilePopup() {
  const [config, setConfig] = useState<PopupConfig | null>(null);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeButtonVisible, setCloseButtonVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'mobile_popup')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          setConfig(data.value as unknown as PopupConfig);
        }
      });
  }, []);

  useEffect(() => {
    if (!config?.enabled) return;

    // Check mobile_only
    if (config.mobile_only && window.innerWidth > 768) return;

    // Check frequency
    const storageKey = 'mobile_popup_shown';
    const stored = localStorage.getItem(storageKey);

    if (config.show_frequency === 'once' && stored) return;
    if (config.show_frequency === 'once_per_session' && sessionStorage.getItem(storageKey)) return;
    if (config.show_frequency === 'once_per_day' && stored) {
      const lastShown = new Date(stored);
      const now = new Date();
      if (lastShown.toDateString() === now.toDateString()) return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      haptic('medium');
      localStorage.setItem(storageKey, new Date().toISOString());
      sessionStorage.setItem(storageKey, 'true');
    }, (config.delay_seconds || 0) * 1000);

    return () => clearTimeout(timer);
  }, [config]);

  // Close button delay
  useEffect(() => {
    if (!visible || !config) return;
    if (!config.show_close_button) return;

    if (config.close_button_delay === 0) {
      setCloseButtonVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setCloseButtonVisible(true);
    }, config.close_button_delay * 1000);

    return () => clearTimeout(timer);
  }, [visible, config]);

  const handleClose = useCallback(() => {
    setClosing(true);
    haptic('light');
    setTimeout(() => setVisible(false), 300);
  }, []);

  const handleCTA = useCallback(() => {
    if (config?.button_url) {
      if (config.button_url.startsWith('http')) {
        window.open(config.button_url, '_blank');
      } else {
        navigate(config.button_url);
      }
    }
    handleClose();
  }, [config, navigate, handleClose]);

  if (!visible || !config) return null;

  const closePositionClasses: Record<string, string> = {
    'top-right': 'top-3 right-3',
    'top-left': 'top-3 left-3',
    'bottom-center': 'bottom-3 left-1/2 -translate-x-1/2',
  };

  const animationMap: Record<string, string> = {
    'slide-up': closing ? 'animate-out slide-out-to-bottom duration-300' : 'animate-in slide-in-from-bottom duration-500',
    'slide-down': closing ? 'animate-out slide-out-to-top duration-300' : 'animate-in slide-in-from-top duration-500',
    'fade': closing ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-500',
    'scale': closing ? 'animate-out zoom-out-95 duration-300' : 'animate-in zoom-in-95 duration-500',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-black/60 backdrop-blur-sm',
          closing ? 'animate-out fade-out duration-300' : 'animate-in fade-in duration-300'
        )}
        onClick={config.overlay_dismiss ? handleClose : undefined}
      />

      {/* Popup */}
      <div
        className={cn(
          'relative z-10 mx-4 mb-6 w-full max-w-sm rounded-2xl p-6 shadow-2xl',
          animationMap[config.animation]
        )}
        style={{ backgroundColor: config.background_color, color: config.text_color }}
      >
        {/* Close button */}
        {config.show_close_button && closeButtonVisible && (
          <button
            onClick={handleClose}
            className={cn(
              'absolute z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium backdrop-blur-md transition-all',
              'bg-black/10 hover:bg-black/20 active:scale-95',
              'animate-in fade-in zoom-in-95 duration-300',
              closePositionClasses[config.close_button_position]
            )}
            style={{ color: config.text_color }}
          >
            {(config.close_button_style === 'icon' || config.close_button_style === 'icon_text') && (
              <X className="h-3.5 w-3.5" />
            )}
            {(config.close_button_style === 'text' || config.close_button_style === 'icon_text') && (
              <span>Đóng</span>
            )}
          </button>
        )}

        {/* Image */}
        {config.image_url && (
          <img
            src={config.image_url}
            alt="Popup"
            className="w-full h-36 object-cover rounded-xl mb-4 -mt-1"
          />
        )}

        {/* Content */}
        <h3 className="text-xl font-bold mb-2 leading-tight">{config.title}</h3>
        <p className="text-sm opacity-80 mb-5 leading-relaxed">{config.message}</p>

        {/* CTA */}
        <button
          onClick={handleCTA}
          className="w-full py-3 rounded-xl text-sm font-bold bg-accent text-accent-foreground shadow-lg active:scale-[0.97] transition-transform"
        >
          {config.button_text}
        </button>

        {/* Close delay indicator */}
        {config.show_close_button && !closeButtonVisible && config.close_button_delay > 0 && (
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="h-1 w-16 rounded-full bg-black/10 overflow-hidden">
              <div
                className="h-full bg-black/30 rounded-full"
                style={{
                  animation: `popup-progress ${config.close_button_delay}s linear forwards`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popup-progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
