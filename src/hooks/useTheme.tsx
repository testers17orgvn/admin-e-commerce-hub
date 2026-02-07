import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeEvent = 
  | 'default'
  | 'spring' 
  | 'summer' 
  | 'autumn' 
  | 'winter'
  | 'tet'
  | 'valentine'
  | 'mid_autumn'
  | 'halloween'
  | 'christmas';

export interface ThemeConfig {
  id: ThemeEvent;
  name: string;
  icon: string;
  description: string;
  colors: {
    accent: string;
    accentForeground: string;
    gold: string;
    goldLight: string;
    goldDark: string;
  };
  effects: {
    particles?: 'snow' | 'petals' | 'leaves' | 'hearts' | 'stars' | 'lanterns' | 'pumpkins';
    gradient?: string;
    overlay?: string;
  };
  mascots?: string[]; // Array of mascot emojis for floating decoration
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'default',
    name: 'Mặc định',
    icon: '🎨',
    description: 'Giao diện tiêu chuẩn với tone vàng sang trọng',
    colors: {
      accent: '38 92% 50%',
      accentForeground: '0 0% 8%',
      gold: '38 92% 50%',
      goldLight: '40 80% 70%',
      goldDark: '35 90% 40%',
    },
    effects: {},
  },
  {
    id: 'spring',
    name: 'Mùa Xuân',
    icon: '🌸',
    description: 'Hoa đào, sắc hồng nhẹ nhàng',
    colors: {
      accent: '330 80% 65%',
      accentForeground: '0 0% 100%',
      gold: '330 80% 65%',
      goldLight: '340 70% 80%',
      goldDark: '320 75% 50%',
    },
    effects: {
      particles: 'petals',
      gradient: 'linear-gradient(135deg, hsl(330, 80%, 65%), hsl(340, 70%, 80%))',
    },
    mascots: ['🦋', '🐝', '🐞'],
  },
  {
    id: 'summer',
    name: 'Mùa Hạ',
    icon: '☀️',
    description: 'Nắng vàng rực rỡ, năng động',
    colors: {
      accent: '45 100% 55%',
      accentForeground: '0 0% 8%',
      gold: '45 100% 55%',
      goldLight: '50 90% 70%',
      goldDark: '40 95% 45%',
    },
    effects: {
      particles: 'stars',
      gradient: 'linear-gradient(135deg, hsl(45, 100%, 55%), hsl(30, 100%, 60%))',
    },
    mascots: ['🌴', '🏖️', '🐚'],
  },
  {
    id: 'autumn',
    name: 'Mùa Thu',
    icon: '🍂',
    description: 'Lá vàng rơi, ấm áp',
    colors: {
      accent: '25 90% 50%',
      accentForeground: '0 0% 100%',
      gold: '25 90% 50%',
      goldLight: '35 85% 65%',
      goldDark: '20 85% 40%',
    },
    effects: {
      particles: 'leaves',
      gradient: 'linear-gradient(135deg, hsl(25, 90%, 50%), hsl(15, 85%, 45%))',
    },
    mascots: ['🦊', '🍄', '🌰'],
  },
  {
    id: 'winter',
    name: 'Mùa Đông',
    icon: '❄️',
    description: 'Tuyết trắng, lạnh lẽo thanh tao',
    colors: {
      accent: '200 80% 60%',
      accentForeground: '0 0% 100%',
      gold: '200 80% 60%',
      goldLight: '195 75% 75%',
      goldDark: '210 85% 45%',
    },
    effects: {
      particles: 'snow',
      gradient: 'linear-gradient(135deg, hsl(200, 80%, 60%), hsl(210, 75%, 70%))',
    },
    mascots: ['⛄', '🐧', '🦌'],
  },
  {
    id: 'tet',
    name: 'Tết Nguyên Đán',
    icon: '🧧',
    description: 'Đỏ may mắn, vàng thịnh vượng',
    colors: {
      accent: '0 85% 50%',
      accentForeground: '45 100% 50%',
      gold: '45 100% 50%',
      goldLight: '50 95% 60%',
      goldDark: '0 80% 45%',
    },
    effects: {
      particles: 'lanterns',
      gradient: 'linear-gradient(135deg, hsl(0, 85%, 50%), hsl(45, 100%, 50%))',
    },
    mascots: ['🐉', '🧨', '🎏'],
  },
  {
    id: 'valentine',
    name: 'Valentine',
    icon: '💕',
    description: 'Tình yêu lãng mạn, sắc hồng đỏ',
    colors: {
      accent: '340 80% 55%',
      accentForeground: '0 0% 100%',
      gold: '340 80% 55%',
      goldLight: '350 75% 70%',
      goldDark: '330 85% 45%',
    },
    effects: {
      particles: 'hearts',
      gradient: 'linear-gradient(135deg, hsl(340, 80%, 55%), hsl(350, 75%, 65%))',
    },
    mascots: ['🧸', '💘', '🕊️'],
  },
  {
    id: 'mid_autumn',
    name: 'Trung Thu',
    icon: '🏮',
    description: 'Đèn lồng, trăng tròn ấm áp',
    colors: {
      accent: '30 90% 55%',
      accentForeground: '0 0% 8%',
      gold: '30 90% 55%',
      goldLight: '40 85% 70%',
      goldDark: '25 88% 45%',
    },
    effects: {
      particles: 'lanterns',
      gradient: 'linear-gradient(135deg, hsl(30, 90%, 55%), hsl(45, 85%, 60%))',
    },
    mascots: ['🐇', '🌕', '🥮'],
  },
  {
    id: 'halloween',
    name: 'Halloween',
    icon: '🎃',
    description: 'Bí ngô, ma quỷ, cam đen',
    colors: {
      accent: '25 95% 50%',
      accentForeground: '0 0% 0%',
      gold: '25 95% 50%',
      goldLight: '30 90% 60%',
      goldDark: '20 90% 40%',
    },
    effects: {
      particles: 'pumpkins',
      gradient: 'linear-gradient(135deg, hsl(25, 95%, 50%), hsl(0, 0%, 10%))',
      overlay: 'hsl(0, 0%, 5%)',
    },
    mascots: ['🎃', '👻', '🧙‍♀️', '🦇', '💀'],
  },
  {
    id: 'christmas',
    name: 'Giáng Sinh',
    icon: '🎄',
    description: 'Xanh lá, đỏ, tuyết trắng',
    colors: {
      accent: '0 75% 50%',
      accentForeground: '0 0% 100%',
      gold: '120 60% 35%',
      goldLight: '0 70% 60%',
      goldDark: '120 55% 25%',
    },
    effects: {
      particles: 'snow',
      gradient: 'linear-gradient(135deg, hsl(0, 75%, 50%), hsl(120, 60%, 35%))',
    },
    mascots: ['🎅', '🤶', '🦌', '⛄', '🎁'],
  },
];

interface ThemeContextType {
  currentTheme: ThemeEvent;
  setTheme: (theme: ThemeEvent) => Promise<void>;
  themeConfig: ThemeConfig;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeEvent>('default');
  const [isLoading, setIsLoading] = useState(true);

  const themeConfig = THEMES.find(t => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    applyThemeColors(themeConfig);
  }, [themeConfig]);

  const loadTheme = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'site_theme')
        .maybeSingle();
      
      if (data?.value) {
        setCurrentTheme(data.value as ThemeEvent);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
    setIsLoading(false);
  };

  const applyThemeColors = (config: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty('--accent', config.colors.accent);
    root.style.setProperty('--accent-foreground', config.colors.accentForeground);
    root.style.setProperty('--gold', config.colors.gold);
    root.style.setProperty('--gold-light', config.colors.goldLight);
    root.style.setProperty('--gold-dark', config.colors.goldDark);
    root.style.setProperty('--ring', config.colors.accent);
    root.style.setProperty('--sidebar-primary', config.colors.accent);
    root.style.setProperty('--sidebar-ring', config.colors.accent);
  };

  const setTheme = async (theme: ThemeEvent) => {
    setCurrentTheme(theme);
    
    // Save to database
    const { data: existing } = await supabase
      .from('settings')
      .select('id')
      .eq('key', 'site_theme')
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from('settings')
        .update({ value: theme as never })
        .eq('key', 'site_theme');
    } else {
      await supabase
        .from('settings')
        .insert([{ key: 'site_theme', value: theme as never }]);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme, themeConfig, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
