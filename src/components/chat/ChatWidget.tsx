"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sendMessageAction, getMessagesAction, markAsReadAction } from "@/actions/chat.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ChatMessage {
  id: string;
  content: string;
  senderRole: "USER" | "ADMIN";
  createdAt: Date;
  isRead: boolean;
}

export default function ChatWidget() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    const res = await getMessagesAction(token);
    if (res.success && res.messages) {
      setMessages(res.messages as any);
      
      // Calculer les non-lus (venant de l'admin)
      const unread = (res.messages as any).filter((m: any) => m.senderRole === 'ADMIN' && !m.isRead).length;
      setUnreadCount(unread);
    }
  }, [token]);

  // Charger les messages et gérer le polling
  useEffect(() => {
    if (!token || user?.role === 'ADMIN') return;

    queueMicrotask(() => {
      fetchMessages();
    });
    const interval = setInterval(fetchMessages, 10000); // Poll every 10s

    return () => clearInterval(interval);
  }, [token, user?.role, fetchMessages]);

  // Scroller en bas quand un nouveau message arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Marquer comme lu quand on ouvre le chat
  useEffect(() => {
    if (isOpen && unreadCount > 0 && messages.length > 0 && token) {
      const conversationId = (messages[0] as any).conversationId;
      if (conversationId) {
        markAsReadAction(token, conversationId);
        // Defer state update to avoid cascading render warning
        queueMicrotask(() => {
          setUnreadCount(prev => prev > 0 ? 0 : prev);
        });
      }
    }
  }, [isOpen, unreadCount, messages, token]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || loading) return;

    setLoading(true);
    const res = await sendMessageAction(token, newMessage);
    if (res.success) {
      setNewMessage("");
      // Refresh instantané
      const refresh = await getMessagesAction(token);
      if (refresh.success) setMessages(refresh.messages as any);
    }
    setLoading(false);
  };

  // Ne pas afficher si pas connecté ou si admin (l'admin a son propre dashboard)
  if (!user || user.role === 'ADMIN') return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Fenêtre de Chat */}
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-sm">Équipe TalentPulse</p>
                <p className="text-[10px] text-blue-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  En ligne
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-3 bg-blue-50 rounded-full">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-slate-500 text-sm">
                  Bonjour ! Comment pouvons-nous vous aider aujourd&apos;hui ? Posez-nous vos questions ici.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.senderRole === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${
                    msg.senderRole === 'USER' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                    <p className={`text-[9px] mt-1 opacity-60 ${msg.senderRole === 'USER' ? 'text-right' : 'text-left'}`}>
                      {format(new Date(msg.createdAt), 'HH:mm', { locale: fr })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white flex gap-2 items-center">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Votre message..."
              className="flex-1 text-sm bg-slate-100 border-none rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
            <button 
              type="submit"
              disabled={loading || !newMessage.trim()}
              className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}

      {/* Bulle de Chat */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${
          isOpen 
            ? 'bg-slate-900 text-white' 
            : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
        }`}
      >
        {isOpen ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7" />}
        
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
