import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ROLE_GUIDES, type GuideRole, type RoleGuideConfig } from '@/lib/roleGuideDefaults';

interface RoleGuideProps {
  role: GuideRole;
}

const getIcon = (name: string): React.ComponentType<{ className?: string }> => {
  const Lucide = Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  return Lucide[name] || Icons.Circle;
};

export function RoleGuide({ role }: RoleGuideProps) {
  const [config, setConfig] = useState<RoleGuideConfig>(ROLE_GUIDES[role]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('settings')
      .select('value')
      .eq('key', `role_guide_${role}`)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data?.value) return;
        try {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          if (parsed?.sections?.length) setConfig(parsed as RoleGuideConfig);
        } catch (e) {
          console.warn('Invalid role_guide config', e);
        }
      });
    return () => {
      mounted = false;
    };
  }, [role]);

  const AccentIcon = getIcon(config.accentIcon);

  return (
    <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
      <div className={cn('relative p-5 sm:p-6 bg-gradient-to-r border-b', config.headerGradient)}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shrink-0">
            <BookOpen className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              {config.title}
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{config.subtitle}</p>
          </div>
          <AccentIcon className="h-7 w-7 text-primary/20 ml-auto shrink-0" />
        </div>
      </div>

      <div className="divide-y">
        {config.sections.map((section, sIdx) => {
          const isExpanded = expandedId === section.id;
          const Icon = getIcon(section.icon);
          return (
            <div key={section.id}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : section.id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-sm font-bold text-muted-foreground shrink-0">
                  {sIdx + 1}
                </div>
                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm shrink-0', section.gradient)}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <p className="font-semibold text-sm">{section.title}</p>
                  <p className="text-xs text-muted-foreground">{section.items.length} hướng dẫn</p>
                </div>
                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                  {section.items.map((item, idx) => {
                    const ItemIcon = getIcon(item.icon);
                    return (
                      <div key={idx} className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0 border">
                          <ItemIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                          {item.tips && item.tips.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {item.tips.map((tip, i) => (
                                <p key={i} className="text-xs text-primary flex items-start gap-1.5">
                                  <Sparkles className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>{tip}</span>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
