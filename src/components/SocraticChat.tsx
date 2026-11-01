import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  HelpCircle,
  Sparkles,
  Lightbulb,
  Compass,
  ArrowRight,
  BrainCircuit,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { MathRenderer } from '../utils/mathRenderer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isConceptExplanation?: boolean;
}

interface SocraticChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, actionType?: 'question' | 'why_did_we_do_that' | 'give_hint' | 'explain_term') => Promise<void>;
  isLoading: boolean;
  modelUsed?: string;
  currentStepHint?: string;
}

export const SocraticChat: React.FC<SocraticChatProps> = ({
  messages,
  onSendMessage,
  isLoading,
  modelUsed,
}) => {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    setInputText('');
    onSendMessage(text);
  };

  // Helper to extract suggested questions from the last model message
  const getSuggestedQuestions = (): string[] => {
    if (messages.length === 0) return [];
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role !== 'model') return [];

    const lines = lastMsg.content.split('\n');
    const suggestions: string[] = [];
    let insideSuggestions = false;

    for (const line of lines) {
      if (line.toLowerCase().includes('suggested questions:') || line.toLowerCase().includes('suggested next steps:')) {
        insideSuggestions = true;
        continue;
      }
      if (insideSuggestions) {
        const trimmed = line.trim();
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          suggestions.push(trimmed.replace(/^[-*]\s*/, '').trim());
        } else if (trimmed.match(/^\d+\./)) {
          suggestions.push(trimmed.replace(/^\d+\.\s*/, '').trim());
        } else if (!trimmed) {
          // empty line might end it if we already have items
          if (suggestions.length >= 2) break;
        }
      }
    }

    return suggestions.slice(0, 3);
  };

  const dynamicSuggestions = getSuggestedQuestions();

  // Math quick insert symbols
  const mathSymbols = ['∫', 'dx', 'dy/dx', '√', '²', '∑', 'π', '∞', 'e^x', 'θ', '±'];

  const insertSymbol = (sym: string) => {
    setInputText((prev) => prev + sym);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] border border-[#E3D9CC] rounded-xl overflow-hidden shadow-sm">
      {/* Thread Header */}
      <div className="px-5 py-3.5 bg-[#F2EDE4] border-b border-[#E3D9CC] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#C85A32]/10 flex items-center justify-center text-[#C85A32]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#2A2421] font-serif-atelier">
              Socratic Guidance Thread
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-[#7A6D61]">
              <span>Paced learning</span>
              <span>·</span>
              <span>Step-by-step discovery</span>
              {modelUsed && (
                <>
                  <span>·</span>
                  <span className="text-[#C85A32] font-mono">{modelUsed}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-[#52463D] bg-white/80 px-2.5 py-1 rounded-md border border-[#E3D9CC]">
          <BrainCircuit className="w-3.5 h-3.5 text-[#C85A32]" />
          <span className="font-medium text-[11px]">Thinking Mode: High</span>
        </div>
      </div>

      {/* Message Thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#7A6D61]">
            <Compass className="w-10 h-10 text-[#C85A32]/40 mb-3" />
            <h3 className="text-base font-serif font-semibold text-[#2A2421]">Your Socratic Atelier is Ready</h3>
            <p className="text-xs max-w-sm mt-1 text-[#6B5E52] leading-relaxed">
              Upload a photo of your calculus or algebra problem. We will gently examine Step 1 together and build intuition without spoiling the solution.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {/* Speaker name */}
              <div className="text-[11px] font-medium text-[#7A6D61] mb-1 px-1 flex items-center gap-1.5">
                {msg.role === 'user' ? (
                  <span>You (Student)</span>
                ) : (
                  <>
                    <span className="font-semibold text-[#8C3A1E] font-serif">Atelier Tutor</span>
                    {msg.isConceptExplanation && (
                      <span className="text-[#C85A32] text-[10px] bg-[#C85A32]/10 px-1.5 py-0.2 rounded font-sans">
                        Deep Concept Breakdown
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[92%] md:max-w-[85%] rounded-2xl p-4 transition-shadow ${
                  msg.role === 'user'
                    ? 'bg-[#2A2421] text-[#FAF7F2] rounded-br-xs shadow-xs'
                    : msg.isConceptExplanation
                    ? 'bg-[#FDF8F3] border-2 border-[#C85A32]/30 text-[#2A2421] rounded-bl-xs shadow-sm'
                    : 'bg-[#FFFFFF] border border-[#E3D9CC] text-[#2A2421] rounded-bl-xs shadow-xs'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                ) : (
                  <MathRenderer content={msg.content} />
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading state indicator */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-1">
            <div className="text-[11px] font-medium text-[#8C3A1E] px-1 font-serif flex items-center gap-1.5">
              <span>Atelier Tutor</span>
              <span className="text-[10px] text-[#A84824] animate-pulse">thinking deeply...</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E3D9CC] rounded-2xl rounded-bl-xs p-4 shadow-xs flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#C85A32] border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-[#5C534D]">
                <p className="font-medium text-[#2A2421]">Formulating the next Socratic step...</p>
                <p className="text-[11px] text-[#8C8178]">Carefully verifying algebraic reasoning</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Socratic Contextual Action Deck */}
      <div className="px-4 py-2 bg-[#F6F2EA] border-t border-[#E3D9CC] space-y-2">
        {/* Core Inquiry Triggers (The key requirement: "Why did we do that?") */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => onSendMessage('', 'why_did_we_do_that')}
            disabled={isLoading || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FDF8F3] text-[#A84824] hover:text-[#8C3A1E] text-xs font-semibold rounded-lg border border-[#E3D9CC] hover:border-[#C85A32] transition-colors disabled:opacity-40 whitespace-nowrap shadow-2xs"
            title="Ask why the tutor or step chose this particular move"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#C85A32]" />
            <span>Why did we do that?</span>
          </button>

          <button
            onClick={() => onSendMessage('', 'give_hint')}
            disabled={isLoading || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FDF8F3] text-[#473D35] hover:text-[#2A2421] text-xs font-medium rounded-lg border border-[#E3D9CC] transition-colors disabled:opacity-40 whitespace-nowrap shadow-2xs"
            title="Get a gentle nudge on this step"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D9822B]" />
            <span>Give me a smaller hint</span>
          </button>

          <button
            onClick={() => onSendMessage('', 'explain_term')}
            disabled={isLoading || messages.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#FDF8F3] text-[#473D35] hover:text-[#2A2421] text-xs font-medium rounded-lg border border-[#E3D9CC] transition-colors disabled:opacity-40 whitespace-nowrap shadow-2xs"
            title="Explain the symbols and terminology"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#6B5E52]" />
            <span>Explain the terms</span>
          </button>
        </div>

        {/* Dynamic Contextual Suggestions parsed from tutor turn */}
        {dynamicSuggestions.length > 0 && !isLoading && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-medium text-[#7A6D61] shrink-0">Try asking:</span>
            {dynamicSuggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => onSendMessage(sug)}
                className="px-2.5 py-1 text-[11px] bg-[#EAE2D5] hover:bg-[#DFD5C5] text-[#2A2421] rounded-md transition-colors whitespace-nowrap shrink-0 border border-[#D5CABB]"
              >
                {sug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input Composer */}
      <div className="p-3 bg-[#F2EDE4] border-t border-[#E3D9CC]">
        {/* Quick math symbol chips */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] text-[#7A6D61] font-mono mr-1">Math:</span>
          {mathSymbols.map((sym) => (
            <button
              key={sym}
              type="button"
              onClick={() => insertSymbol(sym)}
              className="px-1.5 py-0.5 text-xs font-mono bg-white hover:bg-[#EFE9DF] text-[#2A2421] rounded border border-[#E3D9CC] transition-colors"
            >
              {sym}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            placeholder={
              messages.length === 0
                ? 'Upload a photo above to begin...'
                : "Type your step, answer, or question (e.g. 'Is u = x?')..."
            }
            className="flex-1 px-3.5 py-2.5 text-sm bg-white border border-[#DED4C5] rounded-xl text-[#2A2421] placeholder-[#8C8178] focus:outline-none focus:ring-2 focus:ring-[#C85A32] focus:border-transparent transition-all shadow-2xs"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2.5 bg-[#C85A32] hover:bg-[#B34B26] disabled:bg-[#D5CABB] text-white rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
