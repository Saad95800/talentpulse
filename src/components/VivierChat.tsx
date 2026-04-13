"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { queryVivierIA, ChatMessage } from '@/actions/vivier.action';
import { 
  Send, 
  Bot, 
  User as UserIcon, 
  Loader2, 
  MessageSquare,
  Sparkles,
  Trash2
} from 'lucide-react';

export default function VivierChat() {
  const userId = useSelector((state: RootState) => state.user.id);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll automatique vers le bas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const result = await queryVivierIA(userId, newMessages);
      if (result.success && result.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: result.message! }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, j'ai rencontré une erreur technique." }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Erreur de connexion avec l'IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-3xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header du Chat */}
      <div className="bg-main p-6 flex justify-between items-center bg-gradient-to-r from-main to-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-white font-bold leading-none mb-1">Assistant Vivier IA</h3>
            <div className="flex items-center gap-1.5 ">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Connecté au vivier</span>
            </div>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"
          title="Effacer la conversation"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Zone des messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-100 scroll-smooth shadow-inner"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center px-10 border-2 border-dashed border-slate-300 rounded-[2.5rem] mt-4">
            <div className="p-4 bg-white rounded-2xl shadow-sm mb-4">
              <MessageSquare className="w-8 h-8 text-primary/50" />
            </div>
            <h4 className="font-bold text-main mb-2">Comment puis-je vous aider ?</h4>
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              Posez une question sur vos candidats, demandez un comparatif ou identifiez les experts par techno.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 w-full max-w-xs">
              <Suggestion 
                text="Qui matche le mieux pour du React ?" 
                onClick={() => setInput("Qui matche le mieux pour un poste de développeur React ?")}
              />
              <Suggestion 
                text="Fais-moi un résumé de mon vivier" 
                onClick={() => setInput("Fais-moi un résumé rapide des candidats présents dans mon vivier.")}
              />
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div 
            key={i} 
            className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`p-2 rounded-xl shrink-0 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-white text-main shadow-md border border-slate-300'}`}>
              {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`
              max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed
              ${m.role === 'user' 
                ? 'bg-primary text-white rounded-tr-none shadow-xl shadow-primary/20' 
                : 'bg-white text-main rounded-tl-none shadow-md border border-slate-200 font-bold'}
            `}>
              {m.content}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 animate-in fade-in duration-300">
            <div className="p-2 bg-white rounded-xl shadow-md border border-slate-300">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 flex items-center gap-3">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span className="text-xs font-black text-slate-700 animate-pulse">L'IA analyse votre vivier...</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative group">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Posez votre question sur les candidats..."
            className="w-full pl-6 pr-14 py-4 bg-slate-100 border border-slate-300 rounded-2xl outline-none focus:border-primary focus:bg-white transition-all font-black text-main text-sm disabled:opacity-50 placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-white rounded-xl hover:bg-primary-hover active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase tracking-widest pl-1">
          <Sparkles className="w-3 h-3 text-secondary fill-current" />
          Intelligence Artificielle Claude 3.5 Sonnet
        </div>
      </div>
    </div>
  );
}

function Suggestion({ text, onClick }: { text: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="text-[11px] p-3.5 bg-white border-2 border-slate-200 rounded-xl text-main font-black hover:border-primary hover:text-primary transition-all text-left shadow-md group"
    >
      <span className="opacity-80 group-hover:opacity-100">{text}</span>
    </button>
  );
}
