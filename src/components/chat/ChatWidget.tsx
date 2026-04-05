import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat, ChatConversation, ChatMessage } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageCircle, Send, ArrowLeft, Search, X, 
  Users, Circle, ImagePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ChatWidgetProps {
  className?: string;
}

export function ChatWidget({ className }: ChatWidgetProps) {
  const { user } = useAuth();
  const {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
  } = useChat();
  
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const msg = inputValue;
    setInputValue('');
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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

  const getConversationInitial = (conv: ChatConversation) => {
    const name = getConversationName(conv);
    return name.charAt(0).toUpperCase();
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchTerm) return true;
    const name = getConversationName(c).toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  if (!user) return null;

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-bold animate-pulse">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[380px] h-[520px] bg-card border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            {activeConversation ? (
              <>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setActiveConversation(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">
                    {conversations.find(c => c.id === activeConversation) 
                      ? getConversationName(conversations.find(c => c.id === activeConversation)!)
                      : 'Chat'}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                    Đang hoạt động
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Tin nhắn</p>
                  <p className="text-xs text-muted-foreground">{conversations.length} cuộc trò chuyện</p>
                </div>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => { setIsOpen(false); setActiveConversation(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          {activeConversation ? (
            // Messages View
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
                            isMine 
                              ? "bg-primary text-primary-foreground rounded-br-md" 
                              : "bg-muted rounded-bl-md"
                          )}>
                            {msg.message_type === 'image' && msg.image_url && (
                              <img src={msg.image_url} alt="" className="rounded-lg max-w-full mb-1" />
                            )}
                            {msg.content}
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
              
              {/* Input */}
              <div className="p-3 border-t bg-card">
                <div className="flex items-center gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 h-10 rounded-full bg-muted border-0 px-4 text-sm"
                  />
                  <Button 
                    size="icon" 
                    className="h-10 w-10 rounded-full shrink-0" 
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            // Conversations List
            <>
              {/* Search */}
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm cuộc trò chuyện..."
                    className="pl-9 h-9 rounded-full bg-muted border-0 text-sm"
                  />
                </div>
              </div>

              <ScrollArea className="flex-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện</p>
                    <p className="text-xs text-muted-foreground mt-1">Nhắn tin với người bán hoặc admin</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setActiveConversation(conv.id)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                      >
                        <div className="relative shrink-0">
                          <Avatar className="h-11 w-11">
                            <AvatarImage src={getConversationAvatar(conv) || ''} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-semibold">
                              {getConversationInitial(conv)}
                            </AvatarFallback>
                          </Avatar>
                          {conv.type === 'group' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center border-2 border-card">
                              <Users className="h-2.5 w-2.5 text-muted-foreground" />
                            </div>
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
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.last_message || 'Bắt đầu trò chuyện'}
                            </p>
                            {(conv.unread_count || 0) > 0 && (
                              <Badge variant="destructive" className="h-5 min-w-5 text-[10px] rounded-full px-1.5 shrink-0">
                                {conv.unread_count}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
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
