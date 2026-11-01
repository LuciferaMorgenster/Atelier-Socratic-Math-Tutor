import React, { useState } from 'react';
import { Header } from './components/Header';
import { ProblemUploader } from './components/ProblemUploader';
import { ScratchpadCanvas } from './components/ScratchpadCanvas';
import { SocraticChat, ChatMessage } from './components/SocraticChat';
import {
  Sparkles,
  BookMarked,
  RotateCcw,
  Compass,
  MessageSquare,
  Edit2,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const [activeProblemImage, setActiveProblemImage] = useState<string | null>(null);
  const [problemSummary, setProblemSummary] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Mobile layout switch
  const [mobileTab, setMobileTab] = useState<'canvas' | 'chat'>('chat');

  // Handle new problem upload or sample selection
  const handleProblemSelected = async (imageBase64: string, studentNote?: string) => {
    setActiveProblemImage(imageBase64);
    setIsLoading(true);
    setErrorMessage(null);

    // Initial user action in chat
    const initialUserMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: studentNote
        ? `I have uploaded my problem. Student note: "${studentNote}". Please walk me through Step 1.`
        : 'I have uploaded my problem. Please walk me through Step 1 without giving away the final answer.',
      timestamp: Date.now(),
    };

    setMessages([initialUserMsg]);

    try {
      const response = await fetch('/api/analyze-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          studentNote,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze the mathematics problem.');
      }

      const tutorText = data.response;
      setProblemSummary(tutorText.slice(0, 300));
      if (data.modelUsed) setModelUsed(data.modelUsed);

      const tutorMsg: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'model',
        content: tutorText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, tutorMsg]);
      setMobileTab('chat');
    } catch (err: any) {
      console.error('Error analyzing problem:', err);
      setErrorMessage(err.message || 'Something went wrong while analyzing the problem.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending multi-turn messages or Socratic inquiry triggers
  const handleSendMessage = async (
    text: string,
    actionType?: 'question' | 'why_did_we_do_that' | 'give_hint' | 'explain_term'
  ) => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage(null);

    let displayPrompt = text;
    if (actionType === 'why_did_we_do_that') {
      displayPrompt = 'Why did we do that? Could you explain the concept behind that step?';
    } else if (actionType === 'give_hint') {
      displayPrompt = 'I am feeling stuck. Can you give me a smaller, gentle hint?';
    } else if (actionType === 'explain_term') {
      displayPrompt = 'Can you explain the mathematical terms or notation here in plain language?';
    }

    const newMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: displayPrompt,
      timestamp: Date.now(),
    };

    const updatedHistory = [...messages, newMsg];
    setMessages(updatedHistory);

    try {
      // Format prior history for Express backend
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/tutor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemSummary,
          history: historyPayload,
          message: text,
          actionType,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to receive tutor guidance.');
      }

      if (data.modelUsed) setModelUsed(data.modelUsed);

      const tutorReply: ChatMessage = {
        id: `tutor-${Date.now()}`,
        role: 'model',
        content: data.response,
        timestamp: Date.now(),
        isConceptExplanation: actionType === 'why_did_we_do_that',
      };

      setMessages((prev) => [...prev, tutorReply]);
    } catch (err: any) {
      console.error('Error in tutor chat:', err);
      setErrorMessage(err.message || 'Tutor service encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetProblem = () => {
    setActiveProblemImage(null);
    setProblemSummary('');
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2A2421]">
      {/* Top Bar Header adhering to Top Bar contract */}
      <Header
        onNewProblem={handleResetProblem}
        hasActiveProblem={!!activeProblemImage}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 overflow-hidden">
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-xs text-[#991B1B] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-[#DC2626] font-semibold hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {!activeProblemImage ? (
          /* Intake / Zero-State View */
          <div className="flex-1 flex flex-col justify-center items-center">
            <ProblemUploader
              onProblemSelected={handleProblemSelected}
              isLoading={isLoading}
            />
          </div>
        ) : (
          /* Active Split-Screen Tutoring Workspace */
          <div className="flex-1 flex flex-col h-[calc(100vh-6.5rem)] overflow-hidden">
            {/* Mobile View Switcher */}
            <div className="lg:hidden flex items-center justify-center p-1 bg-[#EAE2D5] rounded-xl mb-3 shrink-0">
              <button
                onClick={() => setMobileTab('canvas')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  mobileTab === 'canvas'
                    ? 'bg-white text-[#2A2421] shadow-2xs'
                    : 'text-[#6B5E52]'
                }`}
              >
                <Edit2 className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Problem & Scratchpad</span>
              </button>
              <button
                onClick={() => setMobileTab('chat')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors ${
                  mobileTab === 'chat'
                    ? 'bg-white text-[#2A2421] shadow-2xs'
                    : 'text-[#6B5E52]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#C85A32]" />
                <span>Socratic Dialogue</span>
              </button>
            </div>

            {/* Desktop Two-Zone Split Layout */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 overflow-hidden">
              {/* Left Zone: Problem Image & Interactive Canvas Slate (6 columns) */}
              <div
                className={`h-full min-h-0 lg:col-span-6 ${
                  mobileTab === 'canvas' ? 'block' : 'hidden lg:block'
                }`}
              >
                <ScratchpadCanvas
                  problemImageUrl={activeProblemImage}
                  problemTitle="Active Calculus/Algebra Problem"
                />
              </div>

              {/* Right Zone: Multi-turn Socratic Chat (6 columns) */}
              <div
                className={`h-full min-h-0 lg:col-span-6 ${
                  mobileTab === 'chat' ? 'block' : 'hidden lg:block'
                }`}
              >
                <SocraticChat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  modelUsed={modelUsed}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
