import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatConversation {
  id: string;
  title: string | null;
  type: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
  participants?: ChatParticipant[];
}

export interface ChatParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string | null;
  profile?: { full_name: string | null; avatar_url: string | null; email: string | null };
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: string;
  image_url: string | null;
  is_read: boolean;
  created_at: string;
  sender?: { full_name: string | null; avatar_url: string | null };
}

export function useChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    
    const { data: participantData } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    if (!participantData || participantData.length === 0) {
      setConversations([]);
      return;
    }

    const convIds = participantData.map(p => p.conversation_id);

    const { data: convData } = await supabase
      .from('chat_conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (!convData) { setConversations([]); return; }

    // Fetch participants with profiles
    const { data: allParticipants } = await supabase
      .from('chat_participants')
      .select('*')
      .in('conversation_id', convIds);

    const participantUserIds = [...new Set((allParticipants || []).map(p => p.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, email')
      .in('id', participantUserIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Fetch last messages
    const enriched: ChatConversation[] = await Promise.all(convData.map(async (conv) => {
      const { data: lastMsg } = await supabase
        .from('chat_messages')
        .select('content, created_at')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const { count } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', conv.id)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      const convParticipants = (allParticipants || [])
        .filter(p => p.conversation_id === conv.id)
        .map(p => ({ ...p, profile: profileMap.get(p.user_id) || null }));

      return {
        ...conv,
        last_message: lastMsg?.content,
        last_message_at: lastMsg?.created_at,
        unread_count: count || 0,
        participants: convParticipants as ChatParticipant[],
      };
    }));

    setConversations(enriched);
  }, [user]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (!data) { setMessages([]); return; }

    // Fetch sender profiles
    const senderIds = [...new Set(data.map(m => m.sender_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', senderIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setMessages(data.map(m => ({
      ...m,
      sender: profileMap.get(m.sender_id) || null,
    })) as ChatMessage[]);

    // Mark as read
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user.id)
      .eq('is_read', false);

    // Update last_read_at
    await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id);
  }, [user]);

  // Send message
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!user || !activeConversation || !content.trim()) return;

    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: activeConversation,
      sender_id: user.id,
      content: content.trim(),
      message_type: imageUrl ? 'image' : 'text',
      image_url: imageUrl || null,
    });

    if (!error) {
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', activeConversation);
    }

    return { error };
  }, [user, activeConversation]);

  // Start or find a direct conversation
  const startDirectChat = useCallback(async (otherUserId: string) => {
    if (!user) return null;

    // Check existing direct conversation
    const { data: myConvs } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const { data: theirConvs } = await supabase
      .from('chat_participants')
      .select('conversation_id')
      .eq('user_id', otherUserId);

    if (myConvs && theirConvs) {
      const mySet = new Set(myConvs.map(c => c.conversation_id));
      const common = theirConvs.filter(c => mySet.has(c.conversation_id));

      for (const c of common) {
        const { data: conv } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('id', c.conversation_id)
          .eq('type', 'direct')
          .maybeSingle();
        
        if (conv) {
          setActiveConversation(conv.id);
          return conv.id;
        }
      }
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from('chat_conversations')
      .insert({ type: 'direct' })
      .select()
      .single();

    if (!newConv) return null;

    await supabase.from('chat_participants').insert([
      { conversation_id: newConv.id, user_id: user.id },
      { conversation_id: newConv.id, user_id: otherUserId },
    ]);

    setActiveConversation(newConv.id);
    await fetchConversations();
    return newConv.id;
  }, [user, fetchConversations]);

  // Start chat with an admin (picks the first admin found)
  const startAdminChat = useCallback(async () => {
    if (!user) return null;
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(5);
    const adminId = admins?.find(a => a.user_id !== user.id)?.user_id;
    if (!adminId) return null;
    return startDirectChat(adminId);
  }, [user, startDirectChat]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    fetchConversations();

    const channel = supabase
      .channel('chat-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
      }, (payload) => {
        const newMsg = payload.new as any;
        // If it's for the active conversation, add to messages
        if (newMsg.conversation_id === activeConversation) {
          // Fetch sender profile and add
          supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newMsg.sender_id)
            .single()
            .then(({ data: profile }) => {
              setMessages(prev => [...prev, { ...newMsg, sender: profile }]);
            });

          // Mark as read if not from us
          if (newMsg.sender_id !== user.id) {
            supabase
              .from('chat_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
          }
        }
        // Refresh conversation list
        fetchConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, activeConversation, fetchConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation);
    } else {
      setMessages([]);
    }
  }, [activeConversation, fetchMessages]);

  return {
    conversations,
    messages,
    activeConversation,
    setActiveConversation,
    sendMessage,
    startDirectChat,
    startAdminChat,
    fetchConversations,
    loading,
  };
}
