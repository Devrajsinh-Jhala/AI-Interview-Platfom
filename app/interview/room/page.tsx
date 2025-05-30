// app/interview/room/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import { ArrowLeft, Mic, MicOff, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { ProblemDisplay } from "@/components/interview/ProblemDisplay";
import { InterviewConfig } from "@/types/interview";

// Enhanced Timer component
function InterviewTimer({
  isActive,
  onExpire,
}: {
  isActive: boolean;
  onExpire: () => void;
}) {
  const [time, setTime] = useState(30 * 60);
  const prevIsActiveRef = useRef(false);

  useEffect(() => {
    if (isActive && !prevIsActiveRef.current) {
      setTime(30 * 60);
    }
    prevIsActiveRef.current = isActive;

    let timerInterval: NodeJS.Timeout | undefined;
    if (isActive) {
      timerInterval = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            if (timerInterval) clearInterval(timerInterval);
            onExpire();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [isActive, onExpire]);

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
          <div
            className={`text-8xl mb-4 transition-all duration-500 ${
              isSpeaking ? "animate-pulse text-blue-500" : "text-slate-400"
            }`}
          >
            🤖
          </div>
          {isActive && (
            <div className="absolute -top-2 -right-2">
              <div className="h-4 w-4 bg-green-500 rounded-full animate-ping"></div>
              <div className="absolute top-0 h-4 w-4 bg-green-500 rounded-full"></div>
            </div>
          )}
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
  }>({ user: false, assistant: false });
  const [isEnding, setIsEnding] = useState(false);

  const currentCodeRef = useRef(code);
  const codeUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const lastTranscriptRef = useRef<{
    role: string;
    content: string;
    timestamp: number;
  }>({ role: "", content: "", timestamp: 0 });
  const transcriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const assistantModelOutputBufferRef = useRef<string>("");
  const assistantModelOutputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimerExpire = useCallback(() => {
    console.log("⏰ Timer expired - ending interview session");
    if (vapiRef.current && isCallActive) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.error("Error stopping call on timer expiration:", err);
      }
    }
    setIsCallActive(false);
    setIsEnding(true);
    localStorage.removeItem("interviewConfig");
    setTimeout(() => router.push("/"), 3000);
  }, [isCallActive, router]);

  const endCall = useCallback(
    (redirect = true) => {
      console.log("🛑 Ending interview session...");
      setIsEnding(true);
      if (vapiRef.current && isCallActive) {
        try {
          vapiRef.current.stop();
        } catch (err) {
          console.error("❌ Error ending call:", err);
        }
      }
      setIsCallActive(false);
      localStorage.removeItem("interviewConfig");
      if (redirect) {
        setTimeout(() => router.push("/"), 2000);
      }
    },
    [isCallActive, router]
  );

  // Problem Parsing Function (defined once, used by Vapi message handler)
  const processAssistantContentForProblem = useCallback(
    (textContent: string) => {
      if (textContent && typeof textContent === "string") {
        const normalizedContentForDetection = textContent
          .trim()
          .replace(/\s+/g, " ");
        console.log(
          "🧼 Problem Parsing Function: Normalized Content for Detection:",
          normalizedContentForDetection
        );

        // Use original textContent for regex to preserve newlines for description
        if (
          normalizedContentForDetection.toUpperCase().includes("PROBLEM START")
        ) {
          console.log("✅ 'PROBLEM START' detected in content for parsing.");
          const problemRegex =
            /PROBLEM\s*START([\s\S]*?)DESCRIPTION([\s\S]*?)PROBLEM\s*END/i;
          const match = textContent.match(problemRegex);

          if (match && match[1] && match[2]) {
            const title = match[1].trim();
            const description = match[2].trim();
            console.log(
              "🎯 Problem PARSED SUCCESSFULLY (from processAssistantContentForProblem):",
              { title, description }
            );
            if (title && description) {
              setProblem({ title, description });
            } else {
              console.warn(
                "⚠️ Problem parsed but title or description is empty after trim.",
                { title, description }
              );
              setProblem(null);
            }
          } else {
            console.warn(
              "🔍 'PROBLEM START' found, but regex failed on content.",
              "\nRegex:",
              problemRegex.toString(),
              "\nOriginal Content for Regex:",
              textContent.substring(0, 500) + "...", // Log snippet
              "\nMatch object:",
              match
            );
            setProblem(null);
          }
        } else {
          // console.log("🚫 'PROBLEM START' not found in this processed assistant content.");
        }
      }
    },
    []
  ); // Empty dependency array as it uses no props/state directly

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    console.log("🔧 Initializing Vapi with API key present:", !!apiKey);

    if (!apiKey) {
      setError("Vapi API key is missing. Please check your .env.local file.");
      setInitialLoading(false);
      return;
    }

    if (!vapiRef.current) {
      try {
        const vapi = new Vapi(apiKey);
        vapiRef.current = vapi;
        console.log("✅ Vapi instance created successfully");

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
        });

        vapi.on("speech-start", () => {
          console.log("🎤 User started speaking");
          setIsSpeaking((prev) => ({ ...prev, user: true, assistant: false }));
        });

        vapi.on("speech-end", () => {
          console.log("🔇 User stopped speaking");
          setIsSpeaking((prev) => ({ ...prev, user: false }));
        });

        vapi.on("message", (message: any) => {
          console.log("📨 VAPI_MESSAGE_RAW:", JSON.stringify(message, null, 2));
          let fullAssistantUtteranceForParsing: string | null = null;

          if (
            message.type === "model-output" &&
            message.output &&
            typeof message.output === "string"
          ) {
            assistantModelOutputBufferRef.current += message.output;
            setIsSpeaking((prev) => ({
              ...prev,
              assistant: true,
              user: false,
            }));
            if (assistantModelOutputTimeoutRef.current)
              clearTimeout(assistantModelOutputTimeoutRef.current);
            assistantModelOutputTimeoutRef.current = setTimeout(() => {
              if (assistantModelOutputBufferRef.current.trim().length > 0) {
                console.log(
                  "🕒 Assistant Model Output Buffer TIMEOUT - Processing accumulated content."
                );
                processAssistantContentForProblem(
                  assistantModelOutputBufferRef.current
                );
                assistantModelOutputBufferRef.current = "";
                setIsSpeaking((prev) => ({ ...prev, assistant: false }));
              }
            }, 1500);
          }

          if (message.type === "transcript") {
            if (message.role === "assistant" && message.transcript) {
              if (message.transcriptType === "final") {
                console.log(
                  "🎤 Assistant FINAL Transcript received. Processing for problem."
                );
                fullAssistantUtteranceForParsing = message.transcript;
                if (assistantModelOutputTimeoutRef.current)
                  clearTimeout(assistantModelOutputTimeoutRef.current);
                assistantModelOutputBufferRef.current = "";
                setIsSpeaking((prev) => ({ ...prev, assistant: false }));
              }
            }
            // Transcript display logic
            const newContent = message.transcript?.trim() || "";
            const role = message.role === "assistant" ? "assistant" : "user";
            const currentTime = Date.now();

            if (transcriptTimeoutRef.current)
              clearTimeout(transcriptTimeoutRef.current);

            const shouldConsolidate =
              lastTranscriptRef.current.role === role &&
              currentTime - lastTranscriptRef.current.timestamp < 3500 &&
              (message.transcriptType !== "final" ||
                newContent.length > lastTranscriptRef.current.content.length);

            if (shouldConsolidate) {
              lastTranscriptRef.current.content = newContent;
              lastTranscriptRef.current.timestamp = currentTime;
            } else {
              if (lastTranscriptRef.current.content.length > 0) {
                setTranscript((prev) =>
                  addUniqueMessage(prev, {
                    role: lastTranscriptRef.current.role as
                      | "user"
                      | "assistant",
                    content: lastTranscriptRef.current.content,
                    timestamp: new Date(lastTranscriptRef.current.timestamp),
                  })
                );
              }
              lastTranscriptRef.current = {
                role,
                content: newContent,
                timestamp: currentTime,
              };
            }

            if (
              message.transcriptType === "final" ||
              currentTime - lastTranscriptRef.current.timestamp > 3000
            ) {
              if (lastTranscriptRef.current.content.length > 0) {
                setTranscript((prev) =>
                  addUniqueMessage(prev, {
                    role: lastTranscriptRef.current.role as
                      | "user"
                      | "assistant",
                    content: lastTranscriptRef.current.content,
                    timestamp: new Date(lastTranscriptRef.current.timestamp),
                  })
                );
                lastTranscriptRef.current = {
                  role: "",
                  content: "",
                  timestamp: 0,
                };
              }
            } else {
              transcriptTimeoutRef.current = setTimeout(() => {
                if (lastTranscriptRef.current.content.length > 0) {
                  setTranscript((prev) =>
                    addUniqueMessage(prev, {
                      role: lastTranscriptRef.current.role as
                        | "user"
                        | "assistant",
                      content: lastTranscriptRef.current.content,
                      timestamp: new Date(lastTranscriptRef.current.timestamp),
                    })
                  );
                  lastTranscriptRef.current = {
                    role: "",
                    content: "",
                    timestamp: 0,
                  };
                }
              }, 3500);
            }
          }

          if (
            message.type === "ai-message" &&
            message.message?.role === "assistant" &&
            message.message?.content
          ) {
            console.log(
              "💬 Structured AI Message received. Processing for problem."
            );
            fullAssistantUtteranceForParsing = message.message.content;
            if (assistantModelOutputTimeoutRef.current)
              clearTimeout(assistantModelOutputTimeoutRef.current);
            assistantModelOutputBufferRef.current = "";
            setIsSpeaking((prev) => ({ ...prev, assistant: false }));
          }

          if (fullAssistantUtteranceForParsing) {
            processAssistantContentForProblem(fullAssistantUtteranceForParsing);
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
          let errorMessage =
            error?.message ||
            error?.error ||
            (typeof error === "string" && error) ||
            "An unknown Vapi error occurred.";
          setError(`Vapi error: ${errorMessage}`);
          setIsCallActive(false);
          setIsConnecting(false);
          setIsSpeaking({ user: false, assistant: false });
        });
      } catch (err: any) {
        console.error("❌ Error initializing Vapi:", err);
        setError(`Failed to initialize Vapi: ${err.message}`);
        setInitialLoading(false);
      }
    }

    return () => {
      if (vapiRef.current) {
        try {
          console.log("🧹 Cleaning up Vapi instance");
          vapiRef.current.stop();
        } catch (e) {
          console.error("Error stopping Vapi on cleanup:", e);
        }
        vapiRef.current = null;
      }
      if (transcriptTimeoutRef.current)
        clearTimeout(transcriptTimeoutRef.current);
      if (codeUpdateTimeoutRef.current)
        clearTimeout(codeUpdateTimeoutRef.current);
      if (assistantModelOutputTimeoutRef.current)
        clearTimeout(assistantModelOutputTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processAssistantContentForProblem]); // Added processAssistantContentForProblem to dependencies

  // Helper function to add unique messages to transcript array
  const addUniqueMessage = (
    currentTranscript: Message[],
    newMessage: Message
  ): Message[] => {
    const exists = currentTranscript.some(
      (msg) =>
        msg.role === newMessage.role &&
        msg.content === newMessage.content &&
        msg.timestamp.getTime() === newMessage.timestamp.getTime()
    );
    if (!exists) {
      return [...currentTranscript, newMessage];
    }
    return currentTranscript;
  };

  useEffect(() => {
    try {
      const configString = localStorage.getItem("interviewConfig");
      if (!configString)
        throw new Error("Interview configuration not found in localStorage.");
      const config: InterviewConfig = JSON.parse(configString);
      setInterviewConfig(config);
      console.log("📋 Interview config loaded:", config);
    } catch (err: any) {
      console.error("❌ Error loading interview configuration:", err);
      setError(err.message + " Please reconfigure your interview.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      currentCodeRef.current = newCode;
      if (codeUpdateTimeoutRef.current)
        clearTimeout(codeUpdateTimeoutRef.current);
      codeUpdateTimeoutRef.current = setTimeout(() => {
        if (isCallActive && vapiRef.current && newCode.trim().length > 10) {
          try {
            vapiRef.current.send({
              type: "add-message",
              message: {
                role: "system",
                content: `Candidate code update:\n\`\`\`\n${newCode}\n\`\`\`\nSilently review. Only comment if asked or if they are very stuck.`,
              },
            });
            console.log("📤 Code update sent");
          } catch (err) {
            console.error("❌ Error sending code update:", err);
          }
        }
      }, 3000);
    },
    [isCallActive]
  );

  const startCall = useCallback(() => {
    if (!vapiRef.current) {
      setError("Vapi not initialized. Please refresh.");
      return;
    }
    if (!interviewConfig) {
      setError("Interview config missing. Please reconfigure.");
      return;
    }
    if (isConnecting || isCallActive) return;

    console.log("🚀 Starting Vapi call...");
    setIsConnecting(true);
    setTranscript([]);
    setProblem(null);
    setError(null);
    setIsSpeaking({ user: false, assistant: false });
    assistantModelOutputBufferRef.current = ""; // Clear buffer before new call

    const companyNames = interviewConfig.companies
      .map((c) => c.name)
      .join(" and ");
    const interviewTypeText =
      interviewConfig.type === "dsa"
        ? "Data Structures & Algorithms"
        : "System Design";

    const systemPrompt = `You are an AI Technical Interviewer for ${companyNames}.
Your ONLY purpose is to conduct this ${interviewTypeText} interview at ${interviewConfig.difficulty} difficulty.
This is a 30-minute session.

STRICT INSTRUCTIONS:
1.  ROLE ADHERENCE: Your sole function is this technical interview. Politely refuse ANY requests outside this scope (e.g., jokes, poems, general chit-chat, personal opinions). Example refusal: "My purpose is to conduct this technical interview. Let's focus on the problem." or "I can only assist with the interview questions. Shall we continue?"
2.  INTERVIEW FLOW:
    a.  Start with the 'firstMessage' provided. Wait for the candidate's response.
    b.  Ask 1-2 brief, relevant background questions (e.g., "Tell me about your experience with [JavaScript/Python/etc.] and algorithms."). WAIT for full answers.
    c.  Present ONE coding problem. Use this EXACT format, including these exact keywords on their own lines where appropriate:
        PROBLEM_START
        [The Full Problem Title Here]
        DESCRIPTION
        [The Full Detailed Problem Description Here, including examples, inputs, outputs, and constraints. Use newlines for readability within the description.]
        PROBLEM_END
    d.  After presenting, explicitly say "You can take your time to think, ask clarifying questions, and then outline your approach before coding. Let me know when you're ready to discuss or start coding." Then WAIT PATIENTLY.
3.  PATIENCE & GUIDANCE:
    a.  BE EXTREMELY PATIENT. Wait at least 10-15 seconds of silence from the candidate before offering help or speaking, unless they explicitly ask. They need time to think.
    b.  DO NOT INTERRUPT. Allow thinking pauses.
    c.  If stuck, provide small, incremental hints. Don't give away the solution.
    d.  After they provide a solution, discuss time/space complexity and potential optimizations or edge cases.
4.  CODE REVIEW: You'll get system messages with code updates. Review silently. Only comment on code if asked, or if they claim to be finished and the code has obvious major issues related to the core logic.

Your persona: Professional, encouraging, clear, and very patient. Your goal is a positive and fair interview experience.`;

    const assistantConfig = {
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }],
      }, // Using gpt-4o
      voice: { provider: "openai", voiceId: "alloy" },
      firstMessage: `Hi! I'm your AI interviewer from ${companyNames}. Thanks for joining. To start, could you tell me a bit about your experience with ${
        interviewConfig.type === "dsa"
          ? "data structures and algorithms, and your preferred coding language for today"
          : "system design principles"
      }?`,
    };

    console.log(
      "📞 Starting call with config. System Prompt snippet:",
      systemPrompt.substring(0, 200) + "..."
    );
    try {
      // @ts-ignore
      vapiRef.current.start(assistantConfig);
      console.log("✨ Call start request sent");
    } catch (err: any) {
      console.error("❌ Error starting call:", err);
      setError(`Failed to start call: ${err.message || "Unknown Vapi error"}`);
      setIsConnecting(false);
    }
  }, [
    interviewConfig,
    isConnecting,
    isCallActive,
    processAssistantContentForProblem,
  ]); // Added processAssistantContentForProblem

  const toggleMicrophone = useCallback(() => {
    if (vapiRef.current && isCallActive) {
      try {
        const newMutedState = !isMicrophoneEnabled;
        vapiRef.current.setMuted(newMutedState);
        setIsMicrophoneEnabled(!newMutedState);
        console.log(
          newMutedState ? "🔇 Mic MUTED by Vapi" : "🎤 Mic UNMUTED by Vapi"
        );
      } catch (err) {
        console.error("❌ Error toggling mic:", err);
      }
    }
  }, [isMicrophoneEnabled, isCallActive]);

  // --- UI Rendering ---
  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-lg">Loading interview settings...</p>
        </div>
      </div>
    );
  }

  if (isEnding) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center bg-background p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-semibold mb-4">
            Interview Session Ended
          </h1>
          <p className="text-muted-foreground mb-6">
            Thank you! You'll be redirected shortly.
          </p>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!interviewConfig && !initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center p-4">
        <div className="text-center bg-background p-8 rounded-lg shadow-xl max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold mb-4 text-destructive">
            Configuration Error
          </h1>
          <p className="text-muted-foreground mb-6">
            {error || "Interview configuration missing. Please reconfigure."}
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

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="bg-background border-b px-4 py-2 flex justify-between items-center h-14 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => endCall()}
          disabled={isEnding}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Exit Interview
        </Button>
        <div className="flex items-center space-x-4">
          <InterviewTimer
            isActive={isCallActive}
            onExpire={handleTimerExpire}
          />
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
          disabled={!isCallActive || isConnecting || isEnding}
        >
          {isMicrophoneEnabled ? (
            <Mic className="h-4 w-4 mr-2" />
          ) : (
            <MicOff className="h-4 w-4 mr-2" />
          )}
          {isMicrophoneEnabled ? "Mute" : "Unmute"}
        </Button>
      </header>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mx-4 mt-2"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button
            onClick={() => setError(null)}
            className="absolute top-0 bottom-0 right-0 px-4 py-3"
          >
            <span className="text-xl">×</span>
          </button>
        </div>
      )}

      <div className="flex-1 grid md:grid-cols-2 gap-4 p-4 overflow-hidden">
        <div className="flex flex-col bg-background rounded-lg shadow-md overflow-hidden">
          <div className="flex-1 p-4">
            <AnimatedRobot
              isActive={isCallActive}
              isSpeaking={isSpeaking.assistant}
            />
          </div>
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
                {isConnecting ? "Connecting..." : "🚀 Start Interview"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => endCall()}
                className="w-full"
                size="lg"
                disabled={isEnding}
              >
                {isEnding ? "Ending..." : "🛑 End Interview"}
              </Button>
            )}
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {isCallActive
                ? "🎤 Take your time. The AI is patient!"
                : "Ensure mic is enabled before starting."}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-background rounded-lg shadow-md overflow-hidden">
          <div className="flex-1 min-h-0">
            <CodeEditor onChange={handleCodeChange} />
          </div>
          {/* <div className="md:h-1/3 min-h-[200px] border-t overflow-y-auto p-4">
            <ProblemDisplay problem={problem} />
            {console.log("📜 Problem Displayed:", problem)}
          </div> */}
        </div>
      </div>
    </div>
  );
}
