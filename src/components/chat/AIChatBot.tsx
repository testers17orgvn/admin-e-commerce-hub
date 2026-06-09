import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAIChatbotSettings } from '@/hooks/useAIChatbotSettings';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

interface Msg { role: 'user' | 'assistant'; content: string }

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ENDPOINT = `${SUPABASE_URL}/functions/v1/ai-chatbot`;

export function AIChatBot() {
  const { settings, loading } = useAIChatbotSettings();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [streaming, setStreaming] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  if (loading || !settings.enabled) return null;

  const accent = settings.accent_color || '#3B82F6';

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || streaming) return;
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
        signal: ctrl.signal,
      });

      if (res.status === 429) { toast.error('Quá nhiều yêu cầu, vui lòng thử lại sau.'); setStreaming(false); return; }
      if (res.status === 402) { toast.error('Cần nạp credit AI.'); setStreaming(false); return; }
      if (!res.ok || !res.body) { toast.error('Không thể kết nối trợ lý.'); setStreaming(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      let acc = '';
      setMessages((m) => [...m, { role: 'assistant', content: '' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith('data:')) continue;
          const data = l.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content || '';
            if (delta) {
              acc += delta;
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: 'assistant', content: acc };
                return copy;
              });
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') toast.error('Lỗi: ' + (e.message || 'unknown'));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const reset = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  };

  return (
    <>
      {/* Floating launcher */}
      {!open && (
        <button
          aria-label="Mở trợ lý AI"
          onClick={() => setOpen(true)}
          className="group fixed right-3 sm:right-6 bottom-[9rem] lg:bottom-24 z-50 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center text-white overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            boxShadow: `0 10px 40px -10px ${accent}99`,
          }}
        >
          <span className="absolute inset-0 rounded-full animate-ping opacity-30" style={{ background: accent }} />
          {settings.avatar_url ? (
            <img src={settings.avatar_url} alt={settings.name} className="h-full w-full object-cover rounded-full" />
          ) : (
            <Bot className="h-5 w-5 sm:h-6 sm:w-6 relative z-10" />
          )}
          <span className="absolute top-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed right-2 left-2 sm:left-auto sm:right-6 bottom-[5.5rem] lg:bottom-6 z-50 sm:w-[400px] h-[calc(100dvh-7rem)] lg:h-[600px] max-h-[640px] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300 border border-border/50 bg-card"
        >
          {/* Header */}
          <div
            className="relative p-4 text-white overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="relative flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-white/40 shadow-lg">
                {settings.avatar_url && <AvatarImage src={settings.avatar_url} alt={settings.name} />}
                <AvatarFallback className="bg-white/20 text-white">
                  <Bot className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  {settings.name}
                  <Sparkles className="h-3.5 w-3.5" />
                </p>
                <p className="text-[11px] opacity-90 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                  Trợ lý AI · Đang hoạt động
                </p>
              </div>
              {messages.length > 0 && (
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={reset} aria-label="Xóa hội thoại">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 px-3 py-4 bg-gradient-to-b from-muted/30 to-transparent">
            <div className="space-y-3">
              {/* Welcome */}
              <div className="flex gap-2">
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  {settings.avatar_url && <AvatarImage src={settings.avatar_url} />}
                  <AvatarFallback className="bg-muted"><Bot className="h-3.5 w-3.5" /></AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2.5 text-sm">
                  {settings.welcome_message}
                </div>
              </div>

              {/* Suggestions */}
              {messages.length === 0 && settings.suggestions?.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 pl-9">
                  {settings.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:bg-muted transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m, i) => {
                const mine = m.role === 'user';
                return (
                  <div key={i} className={cn('flex gap-2', mine && 'flex-row-reverse')}>
                    {!mine && (
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        {settings.avatar_url && <AvatarImage src={settings.avatar_url} />}
                        <AvatarFallback className="bg-muted"><Bot className="h-3.5 w-3.5" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[80%] px-3.5 py-2.5 text-sm leading-relaxed break-words rounded-2xl',
                        mine
                          ? 'rounded-br-md text-white shadow-md'
                          : 'rounded-bl-md bg-muted text-foreground',
                      )}
                      style={mine ? { background: `linear-gradient(135deg, ${accent}, ${accent}cc)` } : undefined}
                    >
                      {mine ? (
                        m.content
                      ) : m.content ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1">
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <Loader2 className="h-4 w-4 animate-spin opacity-60" />
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-3 border-t bg-card">
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={settings.placeholder}
                disabled={streaming}
                className="flex-1 h-10 rounded-full bg-muted border-0 px-4 text-sm focus-visible:ring-2"
                style={{ ['--tw-ring-color' as any]: accent }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || streaming}
                className="h-10 w-10 rounded-full shrink-0 text-white border-0"
                style={{ background: `linear-gradient(135deg, ${accent}, ${accent}cc)` }}
              >
                {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Powered by AI · Trả lời có thể chưa chính xác 100%
            </p>
          </div>
        </div>
      )}
    </>
  );
}
