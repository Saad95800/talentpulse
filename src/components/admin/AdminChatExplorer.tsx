"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Send, User, Clock, MessageSquare, Check, CheckCheck } from "lucide-react";
import { getAdminChatListAction, getMessagesAction, sendMessageAction, markAsReadAction } from "@/actions/chat.action";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Conversation {
  id: string;
  userId: string;
  updatedAt: Date;
  user: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
  messages: {
    content: string;
    createdAt: Date;
    senderId: string;
    isRead: boolean;
  }[];
}

interface Message {
  id: string;
  content: string;
  senderRole: "USER" | "ADMIN";
  createdAt: Date;
  isRead: boolean;
  conversationId: string;
}

export default function AdminChatExplorer({ token, initialUserId }: { token: string, initialUserId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(initialUserId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Charger la liste des conversations
  const fetchConversations = async () => {
    const res = await getAdminChatListAction(token);
    if (res.success && res.conversations) {
      setConversations(res.conversations as any);
      
      // Si on a un userId initial (depuis le mail), on le sélectionne
      if (initialUserId && !selectedUser) {
        setSelectedUser(initialUserId);
      }
    }
  };

  // Charger les messages de l'utilisateur sélectionné
  const fetchMessages = async () => {
    if (!selectedUser) return;
    const res = await getMessagesAction(token, selectedUser);
    if (res.success && res.messages) {
      setMessages(res.messages as any);
      
      // Marquer comme lu
      const conv = conversations.find(c => c.userId === selectedUser);
      if (conv) {
        markAsReadAction(token, conv.id);
      }
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000); // 15s pour la liste
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 8000); // 8s pour le chat actif
    return () => clearInterval(interval);
  }, [selectedUser, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || loading) return;

    setLoading(true);
    const res = await sendMessageAction(token, newMessage, selectedUser);
    if (res.success) {
      setNewMessage("");
      fetchMessages();
      fetchConversations();
    }
    setLoading(false);
  };

  const filteredConversations = conversations.filter(c => 
    c.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[700px] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-fadeIn">
      {/* Sidebar - Liste des Utilisateurs */}
      <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white mb-4">Conversations</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Aucune conversation trouvée.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const lastMsg = conv.messages[0];
              const isSelected = selectedUser === conv.userId;
              const hasUnread = lastMsg && !lastMsg.isRead && lastMsg.senderId === conv.userId;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedUser(conv.userId)}
                  className={`w-full p-4 flex items-center gap-4 transition-all border-b border-slate-800/50 hover:bg-slate-800/50 ${
                    isSelected ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    isSelected ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {(conv.user.firstName?.[0] || conv.user.email[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <p className={`font-semibold truncate text-sm ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                        {conv.user.firstName} {conv.user.lastName}
                      </p>
                      {lastMsg && (
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">
                          {format(new Date(conv.updatedAt), 'HH:mm', { locale: fr })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate ${hasUnread ? 'text-white font-bold' : 'text-slate-500'}`}>
                        {lastMsg ? lastMsg.content : "Nouvelle conversation"}
                      </p>
                      {hasUnread && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-900/30">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  {conversations.find(c => c.userId === selectedUser)?.user.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {conversations.find(c => c.userId === selectedUser)?.user.email}
                  </p>
                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                    Utilisateur actif
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                 {/* Actions d'en-tête si besoin */}
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6"
            >
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.senderRole === 'ADMIN' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-3xl shadow-lg relative transition-all hover:scale-[1.01] ${
                    msg.senderRole === 'ADMIN' 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 mt-2 opacity-60 text-[10px] ${msg.senderRole === 'ADMIN' ? 'justify-end' : 'justify-start'}`}>
                      <Clock className="w-3 h-3" />
                      {format(new Date(msg.createdAt), 'dd MMM HH:mm', { locale: fr })}
                      {msg.senderRole === 'ADMIN' && (
                        msg.isRead ? <CheckCheck className="w-3 h-3 text-emerald-400" /> : <Check className="w-3 h-3" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Response Input */}
            <div className="p-6 border-t border-slate-800 bg-slate-900">
              <form onSubmit={handleSend} className="flex gap-3 items-center">
                <input 
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre réponse..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none shadow-inner"
                />
                <button 
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 active:scale-95"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="p-6 bg-slate-800/50 rounded-full border border-slate-700">
              <MessageSquare className="w-12 h-12 text-slate-400" />
            </div>
            <p className="text-lg font-medium">Sélectionnez une conversation pour commencer</p>
            <p className="text-sm">Vous recevrez des notifications ici dès qu&apos;un utilisateur vous contacte.</p>
          </div>
        )}
      </div>
    </div>
  );
}
