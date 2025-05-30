// app/interview/room/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { ArrowLeft, Mic, MicOff, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { InterviewConfig } from "@/types/interview";

// Enhanced Timer component with expiration callback
function InterviewTimer({ onExpire }: { onExpire: () => void }) {
  const [time, setTime] = useState(30 * 60); // 30 minutes in seconds

  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [onExpire]);

  const minutes = Math.floor(time / 60);
  const seconds = time % 60;
  const isLowTime = minutes < 5 && time > 0;
  const isExpired = time === 0;

  return (
    <div className="flex items-center">
      <Timer className="h-4 w-4 mr-2" />
      <span
        className={`font-mono ${
          isExpired
            ? "text-red-600 font-bold"
            : isLowTime
            ? "text-red-500 animate-pulse"
            : "text-muted-foreground"
        }`}
      >
        {minutes.toString().padStart(2, "0")}:
        {seconds.toString().padStart(2, "0")}
      </span>
      {isExpired && (
        <span className="ml-2 text-xs text-red-600 font-medium">EXPIRED</span>
      )}
    </div>
  );
}

// Animated Robot Component
function AnimatedRobot({
  isActive,
  isSpeaking,
}: {
  isActive: boolean;
  isSpeaking: boolean;
}) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div
          className={`relative transition-all duration-300 ${
            isActive ? "scale-110" : "scale-100"
          }`}
        >
          {/* Robot Icon */}
          <div
            className={`text-8xl mb-4 transition-all duration-500 ${
              isSpeaking ? "animate-pulse text-blue-500" : "text-slate-400"
            }`}
          >
            🤖
          </div>

          {/* Animated indicators */}
          {isActive && (
            <div className="absolute -top-2 -right-2">
              <div className="h-4 w-4 bg-green-500 rounded-full animate-ping"></div>
              <div className="absolute top-0 h-4 w-4 bg-green-500 rounded-full"></div>
            </div>
          )}

          {/* Sound waves when speaking */}
          {isSpeaking && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="flex space-x-1">
                <div
                  className="w-1 bg-blue-500 animate-pulse"
                  style={{ height: "20px", animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1 bg-blue-500 animate-pulse"
                  style={{ height: "30px", animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1 bg-blue-500 animate-pulse"
                  style={{ height: "25px", animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold">AI Interviewer</h3>
          <p className="text-sm text-muted-foreground">
            {!isActive
              ? "Ready to start your interview"
              : isSpeaking
              ? "Speaking..."
              : "Listening..."}
          </p>
        </div>
      </div>
    </div>
  );
}

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function InterviewRoomPage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [interviewConfig, setInterviewConfig] =
    useState<InterviewConfig | null>(null);
  const [code, setCode] = useState(
    "// Write your JavaScript solution here\n\nfunction solution() {\n  // Your code here\n}\n"
  );
  const [problem, setProblem] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<{
    user: boolean;
    assistant: boolean;
  }>({
    user: false,
    assistant: false,
  });
  const [isEnding, setIsEnding] = useState(false);

  // Refs for managing state
  const currentCodeRef = useRef(code);
  const codeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Refs for transcript consolidation
  const lastTranscriptRef = useRef<{
    role: string;
    content: string;
    timestamp: number;
  }>({
    role: "",
    content: "",
    timestamp: 0,
  });
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle timer expiration
  const handleTimerExpire = useCallback(() => {
    console.log("⏰ Timer expired - ending interview session");

    if (vapiRef.current && isCallActive) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.error("Error stopping call on timer expiration:", err);
      }
    }

    setIsEnding(true);
    localStorage.removeItem("interviewConfig");

    setTimeout(() => {
      router.push("/");
    }, 2000);
  }, [isCallActive, router]);

  // Enhanced end call function with redirection
  const endCall = useCallback(() => {
    console.log("🛑 Ending interview session...");
    setIsEnding(true);

    if (vapiRef.current && isCallActive) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.error("❌ Error ending call:", err);
      }
    }

    localStorage.removeItem("interviewConfig");

    setTimeout(() => {
      router.push("/");
    }, 1500);
  }, [isCallActive, router]);

  // Initialize Vapi
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    console.log("🔧 Initializing Vapi with API key present:", !!apiKey);

    if (!apiKey) {
      setError("Vapi API key is missing. Please check your .env.local file.");
      return;
    }

    if (!vapiRef.current) {
      try {
        const vapi = new Vapi(apiKey);
        vapiRef.current = vapi;
        console.log("✅ Vapi instance created successfully");

        // Set up event listeners
        vapi.on("call-start", () => {
          console.log("🚀 Call started successfully");
          setIsCallActive(true);
          setIsConnecting(false);
          setError(null);
        });

        vapi.on("call-end", () => {
          console.log("📞 Call ended");
          setIsCallActive(false);
          setIsConnecting(false);
          setIsSpeaking({ user: false, assistant: false });

          if (!isEnding) {
            setTimeout(() => {
              router.push("/");
            }, 1000);
          }
        });

        vapi.on("speech-start", () => {
          console.log("🎤 User started speaking");
          setIsSpeaking((prev) => ({ ...prev, user: true }));
        });

        vapi.on("speech-end", () => {
          console.log("🔇 User stopped speaking");
          setIsSpeaking((prev) => ({ ...prev, user: false }));
        });

        // Enhanced message handler with transcript consolidation
        vapi.on("message", (message: any) => {
          console.log("📨 Message received:", message);

          // Handle transcript messages with debounced consolidation
          if (message.type === "transcript" && message.transcript) {
            const newContent = message.transcript.trim();
            const role = message.role === "assistant" ? "assistant" : "user";
            const currentTime = Date.now();

            // Clear existing timeout
            if (transcriptTimeoutRef.current) {
              clearTimeout(transcriptTimeoutRef.current);
            }

            // Update speaking indicator for assistant
            if (role === "assistant") {
              setIsSpeaking((prev) => ({ ...prev, assistant: true }));
            }

            // Check if we should consolidate with the last transcript
            const shouldConsolidate =
              lastTranscriptRef.current.role === role &&
              currentTime - lastTranscriptRef.current.timestamp < 4000 && // Increased patience
              newContent.length > lastTranscriptRef.current.content.length;

            if (shouldConsolidate) {
              lastTranscriptRef.current = {
                role,
                content: newContent,
                timestamp: currentTime,
              };
            } else {
              if (lastTranscriptRef.current.content.length > 5) {
                const finalMessage: Message = {
                  role: lastTranscriptRef.current.role as "user" | "assistant",
                  content: lastTranscriptRef.current.content,
                  timestamp: new Date(lastTranscriptRef.current.timestamp),
                };

                setTranscript((prev) => {
                  const lastInTranscript = prev[prev.length - 1];
                  if (
                    lastInTranscript &&
                    lastInTranscript.content === finalMessage.content &&
                    lastInTranscript.role === finalMessage.role
                  ) {
                    return prev;
                  }
                  return [...prev, finalMessage];
                });
              }

              lastTranscriptRef.current = {
                role,
                content: newContent,
                timestamp: currentTime,
              };
            }

            // Set a longer timeout for more patience
            transcriptTimeoutRef.current = setTimeout(() => {
              if (lastTranscriptRef.current.content.length > 5) {
                const finalMessage: Message = {
                  role: lastTranscriptRef.current.role as "user" | "assistant",
                  content: lastTranscriptRef.current.content,
                  timestamp: new Date(lastTranscriptRef.current.timestamp),
                };

                setTranscript((prev) => {
                  const lastInTranscript = prev[prev.length - 1];
                  if (
                    lastInTranscript &&
                    lastInTranscript.content === finalMessage.content &&
                    lastInTranscript.role === finalMessage.role
                  ) {
                    return prev;
                  }
                  return [...prev, finalMessage];
                });

                lastTranscriptRef.current = {
                  role: "",
                  content: "",
                  timestamp: 0,
                };
              }

              setIsSpeaking((prev) => ({ ...prev, assistant: false }));
            }, 3500); // Increased from 2000 to 3500ms for more patience

            // Handle problem detection in assistant messages
            if (message.role === "assistant" && message.transcript) {
              const transcript = message.transcript.toLowerCase();

              if (
                transcript.includes("problem") &&
                (transcript.includes("start") || transcript.includes("begin"))
              ) {
                let problemTitle = "";

                const titleMatch = message.transcript.match(
                  /problem\s+start[.:]?\s*([^.]+)/i
                );
                if (titleMatch) {
                  problemTitle = titleMatch[1].trim();
                }

                if (problemTitle) {
                  setProblem({
                    title: problemTitle,
                    description: "Loading problem description...",
                  });

                  console.log("🎯 Problem title detected:", problemTitle);
                }
              }

              if (
                problem &&
                problem.description === "Loading problem description..." &&
                message.role === "assistant"
              ) {
                const transcript = message.transcript;

                if (
                  transcript.includes("given") ||
                  transcript.includes("array") ||
                  transcript.includes("return") ||
                  transcript.includes("input") ||
                  transcript.includes("output") ||
                  transcript.includes("example")
                ) {
                  const enhancedDescription = `${transcript}`;

                  setProblem((prev) =>
                    prev
                      ? {
                          ...prev,
                          description: enhancedDescription,
                        }
                      : null
                  );

                  console.log("🎯 Problem description updated");
                }
              }
            }
          }

          if (
            message.type === "function-call" ||
            message.type === "conversation-update"
          ) {
            console.log("📋 Function call or conversation update:", message);
          }
        });

        vapi.on("error", (error: any) => {
          console.error("❌ Vapi error:", error);
          let errorMessage = "Unknown error occurred";

          if (error.message) {
            errorMessage = error.message;
          } else if (typeof error === "string") {
            errorMessage = error;
          } else if (error.error) {
            errorMessage = error.error;
          }

          setError(`Vapi error: ${errorMessage}`);
          setIsCallActive(false);
          setIsConnecting(false);
          setIsSpeaking({ user: false, assistant: false });
        });
      } catch (err: any) {
        console.error("❌ Error initializing Vapi:", err);
        setError(`Failed to initialize Vapi: ${err.message}`);
      }
    }

    return () => {
      if (vapiRef.current) {
        try {
          console.log("🧹 Cleaning up Vapi instance");
          vapiRef.current.stop();
        } catch (e) {
          console.error("Error stopping Vapi:", e);
        }
        vapiRef.current = null;
      }

      if (transcriptTimeoutRef.current) {
        clearTimeout(transcriptTimeoutRef.current);
      }
      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }
    };
  }, [router, isEnding]);

  // Load interview configuration
  useEffect(() => {
    try {
      const configString = localStorage.getItem("interviewConfig");
      if (!configString) {
        throw new Error("Interview configuration not found");
      }
      const config: InterviewConfig = JSON.parse(configString);
      setInterviewConfig(config);
      console.log("📋 Interview config loaded:", config);
    } catch (err) {
      console.error("❌ Error loading interview configuration:", err);
      setError(
        "Failed to load interview configuration. Please go back and configure the interview."
      );
    } finally {
      setInitialLoading(false);
    }
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  // Handle code changes with debounced sending to AI
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      currentCodeRef.current = newCode;

      if (codeUpdateTimeoutRef.current) {
        clearTimeout(codeUpdateTimeoutRef.current);
      }

      // Increased delay for more patience
      codeUpdateTimeoutRef.current = setTimeout(() => {
        if (isCallActive && vapiRef.current && newCode.trim().length > 20) {
          try {
            vapiRef.current.send({
              type: "add-message",
              message: {
                role: "system",
                content: `The candidate has updated their code. Current code:\n\`\`\`\n${newCode}\n\`\`\`\n\nPlease review silently and only provide feedback if the candidate asks for help or gets stuck.`,
              },
            });
            console.log("📤 Code update sent to assistant");
          } catch (err) {
            console.error("❌ Error sending code update:", err);
          }
        }
      }, 5000); // Increased from 3000 to 5000ms for more patience
    },
    [isCallActive]
  );

  // Start the interview call with enhanced patience
  const startCall = useCallback(() => {
    if (!vapiRef.current) {
      setError("Vapi not initialized. Please refresh the page.");
      return;
    }
    if (!interviewConfig) {
      setError(
        "Interview configuration not loaded. Please go back and configure the interview."
      );
      return;
    }
    if (isConnecting || isCallActive) {
      console.warn("⚠️ Call already in progress or connecting");
      return;
    }

    console.log("🚀 Starting Vapi call...");
    setIsConnecting(true);
    setTranscript([]);
    setProblem(null);
    setError(null);
    setIsSpeaking({ user: false, assistant: false });

    const companyNames = interviewConfig.companies
      .map((c) => c.name)
      .join(", ");
    const interviewTypeText =
      interviewConfig.type === "dsa"
        ? "Data Structures & Algorithms"
        : interviewConfig.type === "system-design"
        ? "System Design"
        : "technical";

    // Enhanced system prompt with patience instructions
    const systemPrompt = `You are an AI technical interviewer for ${companyNames}.

You are conducting a ${interviewTypeText} interview at ${interviewConfig.difficulty} difficulty level.

CRITICAL BEHAVIOR INSTRUCTIONS - FOLLOW THESE STRICTLY:
- BE EXTREMELY PATIENT: Wait at least 7-10 seconds of complete silence before speaking again
- DO NOT INTERRUPT when the candidate is thinking, pausing, or processing
- DO NOT rush the candidate or make them feel pressured
- Only speak when the candidate has clearly finished their thought or explicitly asks for help
- Allow natural thinking time - thinking pauses are normal and expected
- Don't fill every silence with words - give them space to think and code

This is a 30-minute interview. Follow these steps with PATIENCE:
1. Introduce yourself briefly as an AI technical interviewer (then WAIT for their response)
2. Ask 1-2 background questions about programming experience (WAIT for complete answers)
3. Present ONE coding problem clearly using natural speech (then let them think and ask questions)
4. Be supportive and encouraging, but don't rush them
5. Only provide hints when they're clearly stuck for a long time (not just thinking)
6. Ask about time/space complexity only AFTER they complete their solution

REMEMBER: The candidate needs time to think, plan, and code. Your job is to be patient and supportive, not to fill every moment with talking.

You will receive system messages when the candidate updates their code. Review silently unless they ask for feedback.

Keep your responses conversational, encouraging, and PATIENT. Give them space to think!`;

    // Vapi assistant configuration
    const assistantConfig = {
      model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
      },
      voice: {
        provider: "openai",
        voiceId: "alloy",
      },
      firstMessage: `Hi there! I'm your AI technical interviewer today. Before we dive into the coding challenge, could you briefly tell me about your programming background and experience?`,
    };

    console.log("📞 Starting call with enhanced patience config");

    try {
      // @ts-ignore
      vapiRef.current.start(assistantConfig);
      console.log("✨ Call start request sent");
    } catch (err: any) {
      console.error("❌ Error starting call:", err);
      setError(`Failed to start call: ${err.message || "Unknown error"}`);
      setIsConnecting(false);
    }
  }, [interviewConfig, isConnecting, isCallActive]);

  // Toggle microphone mute/unmute
  const toggleMicrophone = useCallback(() => {
    if (vapiRef.current && isCallActive) {
      try {
        const newMutedState = !isMicrophoneEnabled;
        vapiRef.current.setMuted(newMutedState);
        setIsMicrophoneEnabled(!newMutedState);
        console.log(
          newMutedState ? "🔇 Microphone muted" : "🎤 Microphone unmuted"
        );
      } catch (err) {
        console.error("❌ Error toggling microphone:", err);
      }
    }
  }, [isMicrophoneEnabled, isCallActive]);

  // Loading state
  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading interview settings...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Preparing your AI interviewer...
          </p>
        </div>
      </div>
    );
  }

  // Session ending state
  if (isEnding) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center bg-background p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-4">
            Interview Session Ended
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you for using our AI interview platform. You&apos;ll be
            redirected to the home page shortly.
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">
              Redirecting...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Configuration error state
  if (!interviewConfig) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center bg-background p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-4 text-destructive">
            Configuration Error
          </h1>
          <p className="text-muted-foreground mb-6">
            Interview configuration could not be loaded. Please configure your
            interview first.
          </p>
          <Button
            onClick={() => router.push("/interview/configure")}
            className="w-full"
          >
            Configure Interview
          </Button>
        </div>
      </div>
    );
  }

  // Main interview interface
  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="bg-background border-b px-4 py-2 flex justify-between items-center h-14 shrink-0">
        <Button variant="ghost" size="sm" onClick={endCall} disabled={isEnding}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Exit Interview
        </Button>

        <div className="flex items-center space-x-4">
          <InterviewTimer onExpire={handleTimerExpire} />
          {interviewConfig && (
            <span className="text-sm text-muted-foreground hidden md:inline">
              {interviewConfig.companies.map((c) => c.name).join(", ")} |{" "}
              {interviewConfig.type.toUpperCase()} |{" "}
              {interviewConfig.difficulty}
            </span>
          )}
        </div>

        <Button
          variant={isMicrophoneEnabled ? "outline" : "secondary"}
          size="sm"
          onClick={toggleMicrophone}
          disabled={!isCallActive || isEnding}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4 mr-2" />
          ) : (
            <MicOff className="h-4 w-4 mr-2" />
          )}
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </Button>
      </header>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 mx-4 mt-2 rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium mb-1">⚠️ Error</h3>
              <p className="text-sm">{error}</p>
              <p className="text-xs mt-1 opacity-75">
                Make sure your microphone permissions are enabled and your API
                key is valid.
              </p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs underline ml-4 hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main content grid */}
      <div className="flex-1 grid md:grid-cols-2 gap-4 p-4 overflow-hidden">
        {/* Left panel - Robot and controls */}
        <div className="flex flex-col bg-background rounded-lg shadow-md overflow-hidden">
          {/* Robot Section */}
          <div className="flex-1 p-4">
            <AnimatedRobot
              isActive={isCallActive}
              isSpeaking={isSpeaking.assistant}
            />
          </div>

          {/* Chat Toggle Button */}
          {/* <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <span>Chat Transcript ({transcript.length})</span>
              </div>
              {isChatOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </Button>
          </div> */}

          {/* Collapsible Chat Window */}
          {/* {isChatOpen && (
            <div className="border-t bg-slate-50 dark:bg-slate-900 max-h-48 overflow-y-auto">
              <div className="p-3 space-y-2">
                {transcript.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Conversation will appear here...
                  </p>
                ) : (
                  transcript.map((item, index) => (
                    <div
                      key={`${item.role}-${index}-${item.timestamp.getTime()}`}
                      className={`text-xs p-2 rounded ${
                        item.role === "assistant"
                          ? "bg-blue-100 dark:bg-blue-900/50"
                          : "bg-green-100 dark:bg-green-900/50"
                      }`}
                    >
                      <div className="font-medium mb-1">
                        {item.role === "assistant" ? "🤖 AI" : "👤 You"}
                      </div>
                      <div className="whitespace-pre-wrap">{item.content}</div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
          )} */}

          {/* Control panel */}
          <div className="border-t p-4 shrink-0 bg-slate-50 dark:bg-slate-900">
            {!isCallActive ? (
              <Button
                onClick={startCall}
                disabled={
                  isConnecting || !interviewConfig || !!error || isEnding
                }
                className="w-full"
                size="lg"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Connecting...
                  </>
                ) : (
                  <>🚀 Start Interview</>
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={endCall}
                className="w-full"
                size="lg"
                disabled={isEnding}
              >
                {isEnding ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Ending...
                  </>
                ) : (
                  <>🛑 End Interview</>
                )}
              </Button>
            )}
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {isCallActive
                ? "🎤 Take your time to think. The AI is patient!"
                : "Make sure your microphone is enabled before starting."}
            </div>
          </div>
        </div>

        {/* Right panel - Code editor and problem description */}
        <div className="flex flex-col bg-background rounded-lg shadow-md overflow-hidden">
          <div className="flex-1 min-h-0">
            <CodeEditor onChange={handleCodeChange} />
          </div>
          {/* <div className="md:h-1/3 min-h-[200px] border-t overflow-y-auto">
            <ProblemDisplay problem={problem} />
          </div> */}
        </div>
      </div>
    </div>
  );
}
