import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Loader2, Bot, User, Minimize2, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChatbot, setShowChatbot] = useState<boolean | null>(null); // null = loading
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch chatbot visibility setting from site settings
  useEffect(() => {
    api.get('/settings')
      .then(({ data }) => {
        // Default to true if field doesn't exist yet (before migration)
        setShowChatbot(data?.show_chatbot !== false);
      })
      .catch(() => {
        // On error, show chatbot by default
        setShowChatbot(true);
      });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        messages: [
          ...chatHistory.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        stream: false
      });

      const assistantMessage = response.data.choices[0].message.content;
      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan saat menghubungi asisten AI. Pastikan server backend Anda sedang aktif dan terhubung ke internet.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Still loading settings
  if (showChatbot === null) return null;

  // Hidden by admin setting
  if (!showChatbot) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50 group"
        aria-label="Buka Asisten AI"
      >
        <MessageSquare className="h-6 w-6 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold">1</span>
      </button>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-48px)] bg-card border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col z-50 transition-all duration-500 transform origin-bottom-right",
      isMinimized ? "h-[70px]" : "h-[600px] max-h-[calc(100vh-120px)]"
    )}>
      {/* Header */}
      <div className="p-4 bg-primary text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider leading-none">Asisten AI</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-tight">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label={isMinimized ? "Perluas" : "Perkecil"}
          >
            {isMinimized ? <TrendingUp className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Tutup chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Area */}
          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30"
          >
            {chatHistory.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="h-16 w-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="h-8 w-8" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-foreground">Halo {user?.display_name || 'Pembaca'}!</h4>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    Saya adalah asisten AI resmi website <b>Buya Elvisyam</b>. Ada yang bisa saya bantu hari ini?
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full mt-4">
                  {[
                    "Apa artikel terbaru hari ini?",
                    "Bagaimana cara daftar kursus?",
                    "Siapa penulis blog ini?"
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => setMessage(q)}
                      className="text-left p-3 rounded-2xl bg-white border border-border/50 text-[12px] font-medium hover:border-primary hover:text-primary transition-all shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatHistory.map((m, i) => (
              <div key={i} className={cn(
                "flex items-end gap-2",
                m.role === 'user' ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mb-1",
                  m.role === 'user' ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                )}>
                  {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "max-w-[80%] p-4 rounded-2xl text-sm shadow-sm whitespace-pre-line",
                  m.role === 'user' 
                    ? "bg-primary text-white rounded-br-none" 
                    : "bg-white border border-border/50 text-foreground rounded-bl-none"
                )}>
                  {m.content}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-end gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white border border-border/50 p-4 rounded-2xl rounded-bl-none shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <form 
            onSubmit={handleSendMessage}
            className="p-4 bg-card border-t border-border flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 bg-muted/50 border-none rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="h-11 w-11 rounded-2xl bg-primary text-white flex items-center justify-center disabled:opacity-50 disabled:scale-100 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              aria-label="Kirim pesan"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
