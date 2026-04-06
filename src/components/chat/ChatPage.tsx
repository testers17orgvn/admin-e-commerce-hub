import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat, ChatConversation } from '@/hooks/useChat';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NewChatDialog } from './NewChatDialog';
import { OnlineIndicator } from './OnlineIndicator';
import { 
  Send, Search, MessageCircle, Users, ArrowLeft, ImagePlus, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function ChatPage() {
  const { user } = useAuth();
  const {
    conversations, messages, activeConversation,
    setActiveConversation, sendMessage, startDirectChat,
  } = useChat();
  const { isUserOnline, getLastSeen } = useOnlineStatus();

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Hôm qua ' + format(date, 'HH:mm');
    return format(date, 'dd/MM HH:mm', { locale: vi });
  };

  const getConvName = (conv: ChatConversation) => {
    if (conv.title) return conv.title;
    const other = conv.participants?.find(p => p.user_id !== user?.id);
    return other?.profile?.full_name || other?.profile?.email || 'Người dùng';
  };

  const getConvAvatar = (conv: ChatConversation) => {
    const other = conv.participants?.find(p => p.user_id !== user?.id);
    return other?.profile?.avatar_url || null;
  };

  const getOtherUserId = (conv: ChatConversation) => {
    return conv.participants?.find(p => p.user_id !== user?.id)?.user_id || null;
  };

  const filteredConvs = conversations.filter(c => {
    if (!searchTerm) return true;
    return getConvName(c).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeConv = conversations.find(c => c.id === activeConversation);

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] max-h-[800px] rounded-2xl border bg-card overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r flex flex-col bg-card",
        activeConversation && "hidden md:flex"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-primary" />
              Tin nhắn
            </h2>
            <NewChatDialog onStartChat={startDirectChat} />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..." className="pl-9 h-9 rounded-full bg-muted border-0 text-sm" />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium">Chưa có cuộc trò chuyện</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConvs.map(conv => {
                const otherId = getOtherUserId(conv);
                return (
                  <button key={conv.id} onClick={() => setActiveConversation(conv.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors text-left",
                      activeConversation === conv.id && "bg-primary/5 border-l-2 border-l-primary"
                    )}>
                    <div className="relative shrink-0">
                      <Avatar className="h-11 w-11">
                        <AvatarImage src={getConvAvatar(conv) || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 font-semibold text-sm">
                          {getConvName(conv).charAt(0).toUpperCase()}
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
                        <p className="font-semibold text-sm truncate">{getConvName(conv)}</p>
                        {conv.last_message_at && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(conv.last_message_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground truncate">{conv.last_message || '...'}</p>
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
      </div>

      {/* Message Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        !activeConversation && "hidden md:flex"
      )}>
        {activeConversation && activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-3 sm:p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden shrink-0" onClick={() => setActiveConversation(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarImage src={getConvAvatar(activeConv) || ''} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10">
                  {getConvName(activeConv).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{getConvName(activeConv)}</p>
                {(() => {
                  const otherId = getOtherUserId(activeConv);
                  return otherId ? (
                    <OnlineIndicator isOnline={isUserOnline(otherId)} lastSeen={getLastSeen(otherId)} showText size="sm" />
                  ) : null;
                })()}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-3 sm:p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {messages.length === 0 && (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="h-8 w-8 text-primary/30" />
                    </div>
                    <p className="font-medium">Bắt đầu cuộc trò chuyện</p>
                    <p className="text-xs text-muted-foreground mt-1">Gửi tin nhắn đầu tiên</p>
                  </div>
                )}
                {messages.map(msg => {
                  const isMine = msg.sender_id === user.id;
                  return (
                    <div key={msg.id} className={cn("flex gap-2.5", isMine && "flex-row-reverse")}>
                      {!isMine && (
                        <Avatar className="h-8 w-8 shrink-0 mt-1">
                          <AvatarImage src={msg.sender?.avatar_url || ''} />
                          <AvatarFallback className="text-xs bg-muted">
                            {msg.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn("max-w-[75%] sm:max-w-[70%]", isMine && "items-end")}>
                        {!isMine && (
                          <p className="text-[11px] text-muted-foreground mb-0.5 px-1">
                            {msg.sender?.full_name || 'Người dùng'}
                          </p>
                        )}
                        <div className={cn(
                          "px-3 sm:px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                          isMine 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted rounded-bl-md"
                        )}>
                          {msg.message_type === 'image' && msg.image_url && (
                            <img src={msg.image_url} alt="" className="rounded-lg max-w-full max-h-60 mb-1.5 cursor-pointer"
                              onClick={() => window.open(msg.image_url!, '_blank')} />
                          )}
                          {msg.content !== '📷 Ảnh' && msg.content}
                        </div>
                        <p className={cn("text-[10px] text-muted-foreground mt-0.5 px-1", isMine && "text-right")}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Image Preview */}
            {previewImage && (
              <div className="px-4 pt-2 flex items-center gap-2">
                <div className="relative">
                  <img src={previewImage} alt="" className="h-16 w-16 object-cover rounded-lg border" />
                  <button onClick={() => setPreviewImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-3 sm:p-4 border-t">
              <div className="flex items-center gap-2 sm:gap-3 max-w-2xl mx-auto">
                <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
                <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0"
                  onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <ImagePlus className="h-5 w-5 text-muted-foreground" />
                </Button>
                <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown} placeholder="Nhập tin nhắn..."
                  className="flex-1 h-10 sm:h-11 rounded-full bg-muted border-0 px-4 sm:px-5" />
                <Button size="icon" className="h-10 w-10 sm:h-11 sm:w-11 rounded-full shrink-0"
                  onClick={handleSend} disabled={!inputValue.trim() && !previewImage}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center mx-auto mb-5">
                <MessageCircle className="h-10 w-10 text-primary/30" />
              </div>
              <h3 className="font-bold text-lg">Chào mừng đến Chat</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Chọn cuộc trò chuyện hoặc tạo mới để bắt đầu nhắn tin
              </p>
              <div className="mt-4">
                <NewChatDialog onStartChat={startDirectChat} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
