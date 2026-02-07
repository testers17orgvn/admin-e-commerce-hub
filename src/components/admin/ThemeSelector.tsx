import { useTheme, THEMES, ThemeEvent } from '@/hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Sun, Leaf, Snowflake, Heart, Moon, Gift, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const THEME_ICONS: Record<ThemeEvent, React.ReactNode> = {
  default: <Palette className="h-5 w-5" />,
  spring: <span className="text-xl">🌸</span>,
  summer: <Sun className="h-5 w-5 text-yellow-500" />,
  autumn: <Leaf className="h-5 w-5 text-orange-500" />,
  winter: <Snowflake className="h-5 w-5 text-blue-400" />,
  tet: <span className="text-xl">🧧</span>,
  valentine: <Heart className="h-5 w-5 text-pink-500" />,
  mid_autumn: <Moon className="h-5 w-5 text-amber-400" />,
  halloween: <span className="text-xl">🎃</span>,
  christmas: <Gift className="h-5 w-5 text-green-500" />,
};

const THEME_CATEGORIES = {
  seasons: {
    title: 'Theo Mùa',
    themes: ['spring', 'summer', 'autumn', 'winter'],
  },
  events: {
    title: 'Theo Sự Kiện',
    themes: ['tet', 'valentine', 'mid_autumn', 'halloween', 'christmas'],
  },
};

export function ThemeSelector() {
  const { currentTheme, setTheme, themeConfig, isLoading } = useTheme();

  const handleSelectTheme = async (themeId: ThemeEvent) => {
    await setTheme(themeId);
    toast.success(`Đã áp dụng theme: ${THEMES.find(t => t.id === themeId)?.name}`);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const defaultTheme = THEMES.find(t => t.id === 'default')!;

  return (
    <div className="space-y-8">
      {/* Current Theme Preview */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                Theme Hiện Tại
              </CardTitle>
              <CardDescription>Xem trước giao diện đang sử dụng</CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {themeConfig.icon} {themeConfig.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div 
            className="rounded-lg p-6 flex items-center justify-center gap-4"
            style={{ 
              background: themeConfig.effects.gradient || `linear-gradient(135deg, hsl(${themeConfig.colors.accent}), hsl(${themeConfig.colors.goldLight}))` 
            }}
          >
            <div className="text-center text-white">
              <p className="text-4xl mb-2">{themeConfig.icon}</p>
              <p className="font-semibold">{themeConfig.name}</p>
              <p className="text-sm opacity-80">{themeConfig.description}</p>
              {themeConfig.effects.particles && (
                <Badge className="mt-2 bg-white/20 text-white">
                  Hiệu ứng: {themeConfig.effects.particles}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Theme */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Mặc Định</CardTitle>
        </CardHeader>
        <CardContent>
          <button
            onClick={() => handleSelectTheme('default')}
            className={cn(
              "w-full rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg text-left",
              currentTheme === 'default' 
                ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                : "border-border hover:border-accent/50"
            )}
          >
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-2xl"
                style={{ 
                  background: `linear-gradient(135deg, hsl(${defaultTheme.colors.accent}), hsl(${defaultTheme.colors.goldLight}))` 
                }}
              >
                {THEME_ICONS.default}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{defaultTheme.name}</h4>
                  {currentTheme === 'default' && (
                    <Check className="h-4 w-4 text-accent" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{defaultTheme.description}</p>
              </div>
              <div className="flex gap-1">
                {['accent', 'gold', 'goldLight'].map((key) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                    style={{ backgroundColor: `hsl(${defaultTheme.colors[key as keyof typeof defaultTheme.colors]})` }}
                  />
                ))}
              </div>
            </div>
          </button>
        </CardContent>
      </Card>

      {/* Seasonal Themes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Leaf className="h-5 w-5" />
            {THEME_CATEGORIES.seasons.title}
          </CardTitle>
          <CardDescription>Thay đổi giao diện theo 4 mùa trong năm</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {THEME_CATEGORIES.seasons.themes.map(themeId => {
              const theme = THEMES.find(t => t.id === themeId)!;
              const isSelected = currentTheme === themeId;
              
              return (
                <button
                  key={themeId}
                  onClick={() => handleSelectTheme(themeId as ThemeEvent)}
                  className={cn(
                    "rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group",
                    isSelected 
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <div 
                    className="w-full aspect-video rounded-lg mb-3 flex items-center justify-center text-3xl relative overflow-hidden"
                    style={{ 
                      background: theme.effects.gradient || `linear-gradient(135deg, hsl(${theme.colors.accent}), hsl(${theme.colors.goldLight}))` 
                    }}
                  >
                    <span className="relative z-10 transform group-hover:scale-125 transition-transform">
                      {theme.icon}
                    </span>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{theme.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">{theme.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      {Object.values(theme.colors).slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full border border-background shadow-sm"
                          style={{ backgroundColor: `hsl(${color})` }}
                        />
                      ))}
                    </div>
                    {theme.mascots && (
                      <span className="text-xs">{theme.mascots.slice(0, 2).join('')}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Event Themes */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {THEME_CATEGORIES.events.title}
          </CardTitle>
          <CardDescription>Theme đặc biệt cho các dịp lễ và sự kiện</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {THEME_CATEGORIES.events.themes.map(themeId => {
              const theme = THEMES.find(t => t.id === themeId)!;
              const isSelected = currentTheme === themeId;
              
              return (
                <button
                  key={themeId}
                  onClick={() => handleSelectTheme(themeId as ThemeEvent)}
                  className={cn(
                    "rounded-xl border-2 p-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left group",
                    isSelected 
                      ? "border-accent bg-accent/5 ring-2 ring-accent/20" 
                      : "border-border hover:border-accent/50"
                  )}
                >
                  <div 
                    className="w-full aspect-square rounded-lg mb-2 flex items-center justify-center text-4xl relative overflow-hidden"
                    style={{ 
                      background: theme.effects.gradient || `linear-gradient(135deg, hsl(${theme.colors.accent}), hsl(${theme.colors.goldLight}))` 
                    }}
                  >
                    <span className="relative z-10 transform group-hover:scale-125 transition-transform">
                      {theme.icon}
                    </span>
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 bg-white rounded-full p-0.5 shadow">
                        <Check className="h-3 w-3 text-accent" />
                      </div>
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-center">{theme.name}</h4>
                  {theme.effects.particles && (
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      ✨ {theme.effects.particles}
                    </p>
                  )}
                  {theme.mascots && theme.mascots.length > 0 && (
                    <p className="text-xs text-center mt-0.5">
                      {theme.mascots.slice(0, 3).join(' ')}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Color Preview */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Bảng Màu Hiện Tại</CardTitle>
          <CardDescription>Các màu đang được áp dụng trong giao diện</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {Object.entries(themeConfig.colors).map(([name, value]) => (
              <div key={name} className="flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-lg shadow-md border-2 border-background"
                  style={{ backgroundColor: `hsl(${value})` }}
                />
                <div>
                  <p className="text-xs font-medium capitalize">{name.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xs text-muted-foreground font-mono">hsl({value})</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
