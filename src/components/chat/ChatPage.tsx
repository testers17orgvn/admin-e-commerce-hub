import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat, ChatConversation, ChatMessage } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NewChatDialog } from './NewChatDialog';
import { 
  Send, Search, MessageCircle, Users, Circle, ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';

export function ChatPage() {
  const { user } = useAuth();
  const {
    conversations, messages, activeConversation,
    setActiveConversation, sendMessage, startDirectChat,
  } = useChat();

  const [inputValue, setInputValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const filteredConvs = conversations.filter(c => {
    if (!searchTerm) return true;
    return getConvName(c).toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeConv = conversations.find(c => c.id === activeConversation);

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-2xl border bg-card overflow-hidden shadow-sm">
      {/* Sidebar */}
      <div className={cn(
        "w-80 border-r flex flex-col bg-card",
        activeConversation && "hidden md:flex"
      )}>
        {/* Header */}
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
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm..."
              className="pl-9 h-9 rounded-full bg-muted border-0 text-sm"
            />
          </div>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          {filteredConvs.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Users className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm font-medium">Chưa có cuộc trò chuyện</p>
              <p className="text-xs text-muted-foreground mt-1">Tạo chat mới để bắt đầu</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConvs.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 hover:bg-muted/50 transition-colors text-left",
                    activeConversation === conv.id && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={getConvAvatar(conv) || ''} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 font-semibold text-sm">
                      {getConvName(conv).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Message Area */}
      <div className={cn(
        "flex-1 flex flex-col",
        !activeConversation && "hidden md:flex"
      )}>
        {activeConversation && activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setActiveConversation(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarImage src={getConvAvatar(activeConv) || ''} />
                <AvatarFallback className="text-xs font-semibold bg-primary/10">
                  {getConvName(activeConv).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{getConvName(activeConv)}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
                  Trực tuyến
                </p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
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
                      <div className={cn("max-w-[70%]", isMine && "items-end")}>
                        {!isMine && (
                          <p className="text-[11px] text-muted-foreground mb-0.5 px-1">
                            {msg.sender?.full_name || 'Người dùng'}
                          </p>
                        )}
                        <div className={cn(
                          "px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                          isMine 
                            ? "bg-primary text-primary-foreground rounded-br-md" 
                            : "bg-muted rounded-bl-md"
                        )}>
                          {msg.message_type === 'image' && msg.image_url && (
                            <img src={msg.image_url} alt="" className="rounded-lg max-w-full mb-1.5" />
                          )}
                          {msg.content}
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

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3 max-w-2xl mx-auto">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 h-11 rounded-full bg-muted border-0 px-5"
                />
                <Button 
                  size="icon" 
                  className="h-11 w-11 rounded-full shrink-0" 
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
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
