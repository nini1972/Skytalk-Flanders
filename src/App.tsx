/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  MapPin, 
  Users, 
  MessageSquare, 
  Navigation, 
  Terminal, 
  Zap,
  Globe,
  Mic,
  ChevronRight,
  ChevronLeft,
  X,
  Play
} from 'lucide-react';
import { Lesson, UserStats, ChatMessage } from './types';
import { LESSONS } from './constants';
import { getCoPilotResponse, getTTS } from './services/gemini';

// --- Audio Helpers ---

const playPCM = async (base64Data: string) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const arrayBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
    
    // Assuming 16-bit PCM (2 bytes per sample)
    const float32Data = new Float32Array(arrayBuffer.byteLength / 2);
    const int16Data = new Int16Array(arrayBuffer);
    
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }

    const audioBuffer = audioCtx.createBuffer(1, float32Data.length, 24000);
    audioBuffer.getChannelData(0).set(float32Data);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();
  } catch (error) {
    console.error("Audio playback failed:", error);
  }
};

// --- Shared Components ---

const GlassPanel = ({ children, className = "", id }: { children: React.ReactNode, className?: string, id?: string }) => (
  <div id={id} className={`glass-panel rounded-xl overflow-hidden relative ${className}`}>
    <div className="scanline" />
    {children}
  </div>
);

const LevelIndicator = ({ value, label, icon: Icon, color }: { value: number, label: string, icon: any, color: string }) => (
  <div className="flex flex-col gap-1 w-full">
    <div className="flex justify-between items-end text-[10px] font-mono tracking-widest uppercase opacity-70">
      <div className="flex items-center gap-1">
        <Icon size={12} className={color} />
        {label}
      </div>
      <span>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
      <motion.div 
        className={`h-full ${color.replace('text-', 'bg-')}`}
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = React.useState<'missions' | 'copilot' | 'stats'>('missions');
  const [selectedLesson, setSelectedLesson] = React.useState<Lesson | null>(null);
  const [showDebrief, setShowDebrief] = React.useState(false);
  const [debriefText, setDebriefText] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);
  const [signalLevel, setSignalLevel] = React.useState(0);
  const [systemError, setSystemError] = React.useState<string | null>(null);
  const [userStats, setUserStats] = React.useState<UserStats>({
    fuel: 85,
    altitude: 12400,
    lastFlight: '2036-05-13',
    completedMissions: [],
    preferredLanguage: 'en-US'
  });

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const analyzerRef = React.useRef<AnalyserNode | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const recognitionRef = React.useRef<any>(null);

  // Auto-scroll to bottom on chat update
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // High-performance frequency monitoring
  const updateAudioLevels = () => {
    if (!analyzerRef.current) return;
    
    // Use Frequency Data for better sensitivity to speaking range
    const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(dataArray);
    
    // Focus on human speech frequencies (roughly the middle of the spectrum we're capturing)
    let total = 0;
    const startBin = 2; // Skip sub-bass
    const endBin = Math.min(dataArray.length, 32); 
    for (let i = startBin; i < endBin; i++) {
      total += dataArray[i];
    }
    const average = total / (endBin - startBin);
    
    // Boost signal for visibility (0-100 scale)
    const boosted = Math.min(100, Math.round(average * 2.5));
    setSignalLevel(boosted);
    setIsSpeaking(boosted > 15);
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
  };

  const handleSendMessage = async (e?: React.FormEvent, manualText?: string) => {
    if (e) e.preventDefault();
    const textToSend = manualText || userInput;
    if (!textToSend.trim()) return;

    const newMessage: ChatMessage = { role: 'user', text: textToSend };
    setChatHistory(prev => [...prev, newMessage]);
    setUserInput('');
    setIsTyping(true);
    setSystemError(null);

    try {
      const response = await getCoPilotResponse(chatHistory, textToSend);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setSystemError("SIGNAL LOST: Connection to Zaventem ATC timed out.");
      setChatHistory(prev => [...prev, { role: 'model', text: "Error: Signal lost. Check your connection to Zaventem ATC." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpeak = async (text: string) => {
    try {
      const audio = await getTTS(text);
      if (audio) {
        await playPCM(audio);
      }
    } catch (err) {
      console.error("TTS failed:", err);
      setSystemError("AUDIO FAULT: Unable to initialize voice synthesis.");
    }
  };

  const stopComms = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsListening(false);
    setIsSpeaking(false);
    setSignalLevel(0);
  };

  const handleVoiceInput = async () => {
    if (isListening) {
      stopComms();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSystemError("HARDWARE INCOMPATIBILITY: Recognition not supported.");
      return;
    }

    try {
      setSystemError(null);
      
      // 1. Initialize Audio Analyzer for the HUD bars
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      
      const source = audioCtx.createMediaStreamSource(stream);
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256; 
      source.connect(analyzer);
      analyzerRef.current = analyzer;
      
      // 2. Initialize Speech Engine
      const recognition = new SpeechRecognition();
      recognition.lang = userStats.preferredLanguage;
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsListening(true);
        updateAudioLevels();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setUserInput(transcript);
        
        if (event.results[0].isFinal) {
          handleSendMessage(undefined, transcript);
          stopComms();
        }
      };

      recognition.onerror = (event: any) => {
        stopComms();
        if (event.error === 'no-speech') {
          setSystemError("SIGNAL WEAK: No speech detected. Speak louder.");
        } else if (event.error === 'not-allowed') {
          setSystemError("SECURITY DENIAL: Mic access blocked.");
        } else {
          setSystemError(`FAULT: ${event.error.toUpperCase()}`);
        }
      };

      recognition.onend = () => {
        stream.getTracks().forEach(track => track.stop());
        audioCtx.close();
        stopComms();
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      setSystemError("PERMISSIONS: Microphone hardware rejected.");
    }
  };

  const initiatePractice = async () => {
    if (!selectedLesson) return;
    
    const lessonTitle = selectedLesson.title;
    setSelectedLesson(null);
    setActiveTab('copilot');
    
    setIsTyping(true);
    setChatHistory(prev => [...prev, { role: 'user', text: `I want to practice my Flemish for the mission: ${lessonTitle}.` }]);
    
    try {
      const response = await getCoPilotResponse(chatHistory, `The pilot wants to practice the mission: "${lessonTitle}". Start a short roleplay or quiz them on the phrases from this mission in a futuristic aviation context.`);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (err) {
      setSystemError("COMMS LINK FAILURE: AI practice module offline.");
    } finally {
      setIsTyping(false);
    }
  };

  const completeMission = async (id: string) => {
    if (!selectedLesson) return;
    
    // Start debrief generation
    setDebriefText("COMM LINK ESTABLISHED... ANALYZING MISSION DATA...");
    setShowDebrief(true);
    
    if (!userStats.completedMissions.includes(id)) {
      setUserStats(prev => ({
        ...prev,
        altitude: prev.altitude + 500,
        fuel: Math.max(0, prev.fuel - 10),
        completedMissions: [...prev.completedMissions, id]
      }));
    }

    try {
      const response = await getCoPilotResponse([], `I just completed the mission "${selectedLesson.title}". Give me a very short (2 sentence) aviation-themed congratulation in English, followed by one special "bonus" Flemish phrase related to this topic including its English translation. Keep it cool and futuristic.`);
      setDebriefText(response);
    } catch (err) {
      setDebriefText("Excellent landing, Pilot! Mission data synchronized with Zaventem flight records. Bonus phrase: 'Tot de volgende keer!' (Until next time!)");
    }

    setSelectedLesson(null);
  };

  return (
    <div className="h-screen w-full flex flex-col font-sans select-none overflow-hidden bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500 rounded-full blur-[100px] opacity-30" />
      </div>

      {/* Header HUD */}
      <header className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
            <Plane className="text-cyan-400" />
            <span className="text-white">SkyTalk</span>
            <span className="text-cyan-400 opacity-50">/FLANDERS</span>
          </h1>
          <div className="text-[10px] font-mono text-cyan-400/70 tracking-widest uppercase">
            Location: Milan (LIMC) → Brussels (EBBR)
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[10px] font-mono text-white/50 tracking-widest uppercase">Altitude</div>
            <div className="text-xl font-mono text-amber-400 leading-none">
              {userStats.altitude.toLocaleString()} <span className="text-xs opacity-50">FT</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-cyan-400 flex items-center justify-center bg-cyan-400/10 shadow-[0_0_10px_rgba(34,211,238,0.3)]">
            <Globe size={20} className="text-cyan-400" />
          </div>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden relative z-10">
        {/* Navigation Sidebar (Instrument Panel) */}
        <nav className="flex md:flex-col gap-2 md:w-16">
          {[
            { id: 'missions', icon: Navigation, label: 'Missions' },
            { id: 'copilot', icon: Terminal, label: 'Co-Pilot' },
            { id: 'stats', icon: Zap, label: 'Systems' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex-1 md:flex-initial aspect-square rounded-xl flex items-center justify-center transition-all duration-300 border ${
                activeTab === item.id 
                ? 'bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                : 'bg-white/5 text-white/40 border-white/10 hover:border-white/30'
              }`}
            >
              <item.icon size={24} />
            </button>
          ))}
        </nav>

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'missions' && (
              <motion.div
                key="missions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-bold tracking-tight uppercase flex items-center gap-2">
                    <Navigation size={18} className="text-amber-400" />
                    Flight Missions
                  </h2>
                  <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">3 Active Charts</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                  {LESSONS.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLesson(lesson)}
                      className="group text-left"
                    >
                      <GlassPanel className="h-full p-5 hover:bg-white/[0.08] transition-colors border-white/5 group-hover:border-white/20">
                        <div className="flex justify-between items-start mb-3">
                          <div className={`p-2 rounded-lg bg-white/5 ${
                            lesson.category === 'aviation' ? 'text-amber-400' : 
                            lesson.category === 'family' ? 'text-cyan-400' : 'text-emerald-400'
                          }`}>
                            {lesson.category === 'aviation' && <Plane size={20} />}
                            {lesson.category === 'family' && <Users size={20} />}
                            {lesson.category === 'travel' && <MapPin size={20} />}
                          </div>
                          {userStats.completedMissions.includes(lesson.id) && (
                            <Zap size={16} className="text-amber-400 fill-amber-400" />
                          )}
                        </div>
                        <h3 className="font-bold text-white mb-1">{lesson.title}</h3>
                        <p className="text-xs text-white/50 leading-relaxed line-clamp-2">{lesson.description}</p>
                        <div className="mt-4 flex items-center gap-1 text-[10px] font-mono text-cyan-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                          Initiate Takeoff <ChevronRight size={10} />
                        </div>
                      </GlassPanel>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'copilot' && (
              <motion.div
                key="copilot"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col"
              >
                <GlassPanel className="flex-1 flex flex-col p-4">
                  <div className="flex items-center justify-between border-bottom border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-cyan-400 flex items-center justify-center text-slate-950">
                        <Terminal size={18} />
                      </div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-tight">JARVIS-Vlaanderen</div>
                        <div className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          On-line / Co-Pilot mode
                        </div>
                      </div>
                    </div>
                    {/* Language Selector (Comms Frequency) */}
                    <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                      {[
                        { id: 'en-US', label: 'EN' },
                        { id: 'it-IT', label: 'IT' },
                        { id: 'nl-BE', label: 'BE' }
                      ].map(lang => (
                        <button
                          key={lang.id}
                          onClick={() => setUserStats(s => ({ ...s, preferredLanguage: lang.id as any }))}
                          className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${
                            userStats.preferredLanguage === lang.id 
                            ? 'bg-cyan-400 text-slate-950' 
                            : 'text-white/40 hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setChatHistory([])} className="text-white/30 hover:text-white/60 transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4 custom-scrollbar">
                    {chatHistory.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-8">
                        <MessageSquare size={48} className="text-white/10 mb-4" />
                        <p className="text-sm text-white/40 italic">
                          "Hey pilot! Need help with your Flemish? Just speak to me in English or Italian. I'll translate and keep your flight plan on track."
                        </p>
                      </div>
                    )}
                    {chatHistory.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                          msg.role === 'user' 
                          ? 'bg-cyan-400 text-slate-950 font-medium' 
                          : 'bg-white/10 text-white border border-white/10'
                        }`}>
                          {msg.text}
                          {msg.role === 'model' && (
                            <button 
                              onClick={() => handleSpeak(msg.text)}
                              className="block mt-2 text-[8px] uppercase tracking-widest text-cyan-400 hover:text-cyan-300 font-bold"
                            >
                              Play Audio
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white/10 rounded-2xl p-3 flex gap-1">
                          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {isListening && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <div className="text-[8px] font-mono text-amber-400 uppercase tracking-tighter w-16">Comm signal</div>
                      <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden flex gap-0.5">
                        {[...Array(20)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`flex-1 h-full transition-colors ${
                              (signalLevel / 5) > i ? 'bg-amber-400' : 'bg-white/5'
                            }`} 
                          />
                        ))}
                      </div>
                      <div className="text-[8px] font-mono text-white/40">{Math.round(signalLevel)}%</div>
                    </div>
                  )}

                  {systemError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-500/20 border border-red-500/50 rounded-lg px-3 py-1.5 flex items-center gap-2 mb-3"
                    >
                      <Zap size={14} className="text-red-500 animate-pulse" />
                      <span className="text-[10px] font-mono text-red-500 font-bold tracking-tight uppercase">System Alert: {systemError}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      placeholder="Enter command or phrase..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-cyan-400/50 transition-colors placeholder:text-white/20"
                    />
                    <button
                      type="submit"
                      disabled={!userInput.trim() || isTyping}
                      className="w-12 h-12 bg-cyan-400 text-slate-950 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all hover:scale-105"
                    >
                      <Zap size={20} />
                    </button>
                    <button 
                      type="button" 
                      onClick={handleVoiceInput}
                      className={`w-12 h-12 border rounded-xl flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                        isListening 
                        ? 'bg-amber-400 border-amber-400 text-slate-950 shadow-[0_0_25px_rgba(251,191,36,0.8)] scale-105' 
                        : 'border-white/10 text-white/40 hover:text-cyan-400 hover:border-cyan-400/50'
                      }`}
                    >
                      {isListening && (
                        <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-40 pointer-events-none">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                height: `${20 + (signalLevel / 2)}%`,
                                opacity: [0.3, 0.7, 0.3]
                              }}
                              transition={{ 
                                repeat: Infinity, 
                                duration: 0.5, 
                                delay: i * 0.1 
                              }}
                              className="w-1 bg-slate-950 rounded-full"
                            />
                          ))}
                        </div>
                      )}
                      <Mic size={20} className={`relative z-10 ${isListening ? 'animate-pulse' : ''}`} />
                    </button>
                  </form>
                </GlassPanel>
              </motion.div>
            )}

            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col gap-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassPanel className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-6 flex items-center gap-2">
                      <Zap size={14} className="text-amber-400" />
                      Energy & Resource Levels
                    </h3>
                    <div className="space-y-6">
                      <LevelIndicator value={userStats.fuel} label="Fuel Reserves" icon={Zap} color="text-amber-400" />
                      <LevelIndicator value={Math.min(100, userStats.altitude / 200)} label="Course Mastery" icon={Navigation} color="text-cyan-400" />
                      <LevelIndicator value={42} label="Cultural Integration" icon={Globe} color="text-emerald-400" />
                    </div>
                  </GlassPanel>

                  <GlassPanel className="p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                      <Terminal size={14} className="text-cyan-400" />
                      Log History
                    </h3>
                    <div className="space-y-3 font-mono text-[10px] text-white/40 uppercase">
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Last Update</span>
                        <span className="text-white">TODAY 14:00</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Current Deck</span>
                        <span className="text-white">ZAVENTEM 01</span>
                      </div>
                      <div className="flex justify-between border-b border-white/5 pb-2">
                        <span>Total XP</span>
                        <span className="text-white">{userStats.altitude} Units</span>
                      </div>
                      <div className="pt-2 text-[8px] italic leading-tight">
                        SYSTEMS STABLE. READY FOR NEXT MISSION INTO BELGIAN AIRSPACE. 
                      </div>
                    </div>
                  </GlassPanel>
                </div>

                <GlassPanel className="flex-1 p-6 relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent pointer-events-none" />
                  <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                    <Plane size={48} className="text-cyan-400 mb-4 animate-bounce" />
                    <h2 className="text-2xl font-black mb-2 italic">FLIGHT STATUS: ACTIVE</h2>
                    <p className="text-white/60 text-sm max-w-xs mb-6">
                      You've completed {userStats.completedMissions.length} missions this week. Your family in Belgium is waiting!
                    </p>
                    <button className="px-8 py-3 bg-white text-slate-950 font-bold rounded-lg uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                      Check Flight Plan
                    </button>
                  </div>
                </GlassPanel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer HUD */}
      <footer className="mt-6 flex justify-between items-end border-t border-white/10 pt-4 relative z-10">
        <div className="flex gap-6 items-center">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/30 uppercase">Fuel Status</span>
            <div className={`text-lg font-mono leading-none ${userStats.fuel < 20 ? 'text-red-500 animate-pulse' : 'text-amber-400'}`}>
              {userStats.fuel}%
            </div>
          </div>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/30 uppercase">System Time</span>
            <div className="text-lg font-mono text-cyan-400 leading-none uppercase">
              14:02 <span className="text-[10px] opacity-50">ZULU</span>
            </div>
          </div>
        </div>

        <div className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] hidden sm:block">
          Quantum Neural Link Established v3.6.0
        </div>
      </footer>

      {/* Lesson Overlay Modal */}
      <AnimatePresence>
        {selectedLesson && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-2xl w-full"
            >
              <GlassPanel className="p-1 border border-cyan-400/30">
                <div className="p-6 md:p-8 bg-slate-950/40">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">Mission Script</div>
                      <h2 className="text-2xl font-bold uppercase italic tracking-tight mb-2">{selectedLesson.title}</h2>
                      <div className="flex gap-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-3 h-1 rounded-full ${i < selectedLesson.difficulty ? 'bg-amber-400' : 'bg-white/10'}`} />
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedLesson(null)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6 mb-8 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedLesson.flemishPhrases.map((phrase, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group flex flex-col gap-2 p-4 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-400/30 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="text-lg font-bold text-cyan-400 font-mono italic">"{phrase.flemish}"</div>
                          <button 
                            onClick={() => handleSpeak(phrase.flemish)}
                            className="text-white/20 hover:text-white group-hover:text-cyan-400 transition-colors"
                          >
                            <Play size={16} fill="currentColor" />
                          </button>
                        </div>
                        <div className="text-sm text-white/70">{phrase.translation}</div>
                        <div className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                          Pronunciation: <span className="text-white/50 italic">{phrase.pronunciation}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => completeMission(selectedLesson.id)}
                      className="flex-1 py-4 bg-white text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Zap size={20} />
                      Complete Mission
                    </button>
                    <button 
                      onClick={initiatePractice}
                      className="px-6 py-4 border border-white/10 text-white/60 font-bold uppercase tracking-widest rounded-xl hover:border-white/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Mic size={20} />
                      Practice AI
                    </button>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mission Debrief Overlay */}
      <AnimatePresence>
        {showDebrief && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -2 }}
              animate={{ scale: 1, rotate: 0 }}
              className="max-w-md w-full"
            >
              <GlassPanel className="p-8 border-2 border-amber-400 pulsing-amber bg-slate-900">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-amber-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(251,191,36,0.6)]">
                    <Zap size={40} className="text-slate-950" />
                  </div>
                  
                  <h2 className="text-3xl font-black italic tracking-tighter text-white mb-2">MISSION ACCOMPLISHED</h2>
                  <div className="text-[10px] font-mono text-amber-400 tracking-[0.3em] uppercase mb-6">Flight Log Updated</div>
                  
                  <div className="w-full bg-white/5 rounded-xl p-6 border border-white/10 mb-6 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                    <div className="text-sm italic text-white/80 leading-relaxed font-mono">
                      {debriefText}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 w-full mb-8">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="text-[9px] text-white/40 uppercase mb-1">Altitude Gain</div>
                      <div className="text-xl font-bold text-cyan-400">+500 FT</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                      <div className="text-[9px] text-white/40 uppercase mb-1">Fuel Consumption</div>
                      <div className="text-xl font-bold text-amber-500">-10%</div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setShowDebrief(false)}
                    className="w-full py-4 bg-white text-slate-950 font-black uppercase tracking-[0.2em] rounded-xl hover:bg-amber-400 hover:scale-105 transition-all shadow-xl"
                  >
                    Close Log & Return
                  </button>
                </div>
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.4);
        }
      `}} />
    </div>
  );
}
