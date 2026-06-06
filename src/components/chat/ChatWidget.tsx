import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat, ChatConversation } from '@/hooks/useChat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { OnlineIndicator } from './OnlineIndicator';
import { 
  MessageCircle, Send, ArrowLeft, Search, X, 
  Users, ImagePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const { user } = useAuth();
  const { conversations, messages, activeConversation, setActiveConversation, sendMessage } = useChat();
  const { isUserOnline, getLastSeen } = useOnlineStatus();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() && !previewImage) return;
    const msg = inputValue;
    const img = previewImage;
    setInputValue('');
    setPreviewImage(null);
    await sendMessage(msg || '📷 Ảnh', img || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Chỉ hỗ trợ file ảnh'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Ảnh tối đa 5MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `chat/${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) { toast.error('Lỗi upload ảnh'); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    setPreviewImage(publicUrl);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Hôm qua ' + format(date, 'HH:mm');
    return format(date, 'dd/MM HH:mm', { locale: vi });
  };

  const getConversationName = (conv: ChatConversation) => {
    if (conv.title) return conv.title;
    const other = conv.participants?.find(p => p.user_id !== user?.id);
    return other?.profile?.full_name || other?.profile?.email || 'Người dùng';
  };

  const getConversationAvatar = (conv: ChatConversation) => {
    const other = conv.participants?.find(p => p.user_id !== user?.id);
    return other?.profile?.avatar_url || null;
  };

  const getOtherUserId = (conv: ChatConversation) => {
    return conv.participants?.find(p => p.user_id !== user?.id)?.user_id || null;
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    return getConversationName(c).toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!user) return null;

  return (
    <div className={cn("fixed bottom-36 right-4 sm:bottom-44 sm:right-6 z-50", className)}>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center">
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="w-[calc(100vw-2rem)] sm:w-[380px] h-[calc(100vh-6rem)] sm:h-[520px] max-h-[600px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 p-3 sm:p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            {activeConversation ? (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setActiveConversation(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  {(() => {
                    const conv = conversations.find(c => c.id === activeConversation);
                    const otherId = conv ? getOtherUserId(conv) : null;
                    return (
                      <>
                        <p className="font-semibold text-sm truncate">
                          {conv ? getConversationName(conv) : 'Chat'}
                        </p>
                        {otherId && <OnlineIndicator isOnline={isUserOnline(otherId)} lastSeen={getLastSeen(otherId)} showText size="sm" />}
                      </>
                    );
                  })()}
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
                  <MessageCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Tin nhắn</p>
                  <p className="text-xs text-muted-foreground">{conversations.length} cuộc trò chuyện</p>
                </div>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setIsOpen(false); setActiveConversation(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {activeConversation ? (
            <>
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-12">
                      <MessageCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Bắt đầu cuộc trò chuyện</p>
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={cn("flex gap-2", isMine && "flex-row-reverse")}>
                        {!isMine && (
                          <Avatar className="h-7 w-7 shrink-0 mt-1">
                            <AvatarImage src={msg.sender?.avatar_url || ''} />
                            <AvatarFallback className="text-xs bg-muted">
                              {msg.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={cn("max-w-[75%] space-y-0.5", isMine && "items-end")}>
                          {!isMine && (
                            <p className="text-[10px] text-muted-foreground px-1">
                              {msg.sender?.full_name || 'Người dùng'}
                            </p>
                          )}
                          <div className={cn(
                            "px-3 py-2 rounded-2xl text-sm leading-relaxed break-words",
                            isMine ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"
                          )}>
                            {msg.message_type === 'image' && msg.image_url && (
                              <img src={msg.image_url} alt="" className="rounded-lg max-w-full max-h-40 mb-1 cursor-pointer"
                                onClick={() => window.open(msg.image_url!, '_blank')} />
                            )}
                            {msg.content !== '📷 Ảnh' && msg.content}
                          </div>
                          <p className={cn("text-[10px] text-muted-foreground px-1", isMine && "text-right")}>
                            {formatMessageTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              
              {previewImage && (
                <div className="px-3 pt-2 flex items-center gap-2">
                  <div className="relative">
                    <img src={previewImage} alt="" className="h-12 w-12 object-cover rounded-lg border" />
                    <button onClick={() => setPreviewImage(null)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="p-3 border-t bg-card">
                <div className="flex items-center gap-2">
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full"
                    onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    <ImagePlus className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown} placeholder="Nhập tin nhắn..."
                    className="flex-1 h-9 sm:h-10 rounded-full bg-muted border-0 px-4 text-sm" />
                  <Button size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0"
                    onClick={handleSend} disabled={!inputValue.trim() && !previewImage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm..." className="pl-9 h-9 rounded-full bg-muted border-0 text-sm" />
                </div>
              </div>
              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => {
                      const otherId = getOtherUserId(conv);
                      return (
                        <button key={conv.id} onClick={() => setActiveConversation(conv.id)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left">
                          <div className="relative shrink-0">
                            <Avatar className="h-11 w-11">
                              <AvatarImage src={getConversationAvatar(conv) || ''} />
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-semibold">
                                {getConversationName(conv).charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            {otherId && (
                              <span className="absolute -bottom-0.5 -right-0.5">
                                <OnlineIndicator isOnline={isUserOnline(otherId)} size="sm" />
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm truncate">{getConversationName(conv)}</p>
                              {conv.last_message_at && (
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {formatMessageTime(conv.last_message_at)}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-xs text-muted-foreground truncate">{conv.last_message || 'Bắt đầu trò chuyện'}</p>
                              {(conv.unread_count || 0) > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-5 text-[10px] rounded-full px-1.5 shrink-0">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </>
          )}
        </div>
      )}
    </div>
  );
}
