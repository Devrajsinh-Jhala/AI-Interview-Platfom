// app/interview/room/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Vapi from "@vapi-ai/web";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Timer,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CodeEditor } from "@/components/interview/CodeEditor";
import { ProblemDisplay } from "@/components/interview/ProblemDisplay";
import { InterviewConfig } from "@/types/interview";

// Define the structure for a transcript message for feedback
interface FeedbackTranscriptMessage {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

// Type for messages displayed in the UI transcript
type DisplayMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

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

export default function InterviewRoomPage() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [interviewConfig, setInterviewConfig] =
    useState<InterviewConfig | null>(null);
  const [code, setCode] = useState(
    // Default initial code
    '// Write your C++ solution here\n\n#include <iostream>\n\nint main() {\n  // Your code here\n  std::cout << "Hello, C++!" << std::endl;\n  return 0;\n}\n'
  );
  const [problem, setProblem] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMicrophoneEnabled, setIsMicrophoneEnabled] = useState(true);
  const [displayTranscript, setDisplayTranscript] = useState<DisplayMessage[]>(
    []
  );
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
  const displayTranscriptEndRef = useRef<HTMLDivElement | null>(null);
  const lastDisplayTranscriptRef = useRef<{
    role: string;
    content: string;
    timestamp: number;
  }>({ role: "", content: "", timestamp: 0 });
  const displayTranscriptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalUtterancesRef = useRef<FeedbackTranscriptMessage[]>([]);
  const assistantModelOutputBufferRef = useRef<string>("");
  const assistantModelOutputTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentCodeRef.current = code;
  }, [code]);

  const processAssistantContentForProblem = useCallback(
    (textContent: string) => {
      if (textContent && typeof textContent === "string") {
        const normalizedContentForDetection = textContent
          .trim()
          .replace(/\s+/g, " ");
        if (
          normalizedContentForDetection.toUpperCase().includes("PROBLEM START")
        ) {
          const problemRegex =
            /PROBLEM\s*START([\s\S]*?)DESCRIPTION([\s\S]*?)PROBLEM\s*END/i;
          const match = textContent.match(problemRegex);
          if (match && match[1] && match[2]) {
            const title = match[1].trim();
            const description = match[2].trim();
            if (title && description) {
              setProblem({ title, description });
              console.log("🎯 Problem PARSED:", { title, description });
            } else {
              console.warn(
                "⚠️ Problem parsed but title or description is empty.",
                { title, description }
              );
              setProblem(null);
            }
          } else {
            console.warn("🔍 'PROBLEM START' found, but regex failed.", {
              content: textContent.substring(0, 100),
            });
            setProblem(null);
          }
        }
      }
    },
    []
  );

  const redirectToFeedbackPage = useCallback(() => {
    if (!interviewConfig) {
      console.error("Cannot redirect to feedback, interviewConfig is missing.");
      router.push("/");
      return;
    }
    if (assistantModelOutputBufferRef.current.trim().length > 0) {
      finalUtterancesRef.current.push({
        role: "assistant",
        content: assistantModelOutputBufferRef.current,
        timestamp: new Date(),
      });
      assistantModelOutputBufferRef.current = "";
    }
    if (lastDisplayTranscriptRef.current.content.length > 0) {
      finalUtterancesRef.current.push({
        role: lastDisplayTranscriptRef.current.role as "user" | "assistant",
        content: lastDisplayTranscriptRef.current.content,
        timestamp: new Date(lastDisplayTranscriptRef.current.timestamp),
      });
      lastDisplayTranscriptRef.current = {
        role: "",
        content: "",
        timestamp: 0,
      };
    }

    const uniqueFinalUtterances = Array.from(
      new Map(
        finalUtterancesRef.current.map((item) => [
          `${item.role}-${item.content}-${item.timestamp?.getTime()}`,
          item,
        ])
      ).values()
    );

    const feedbackData = {
      interviewConfig,
      problem,
      finalCode: currentCodeRef.current,
      cleanTranscript: uniqueFinalUtterances,
    };

    console.log("Data being saved for feedback:", feedbackData);
    localStorage.setItem("interviewFeedbackData", JSON.stringify(feedbackData));
    localStorage.removeItem("interviewConfig");
    router.push("/interview/feedback");
  }, [interviewConfig, problem, router]);

  const handleTimerExpire = useCallback(() => {
    console.log("⏰ Timer expired - preparing for feedback");
    if (vapiRef.current && isCallActive) {
      try {
        vapiRef.current.stop();
      } catch (err) {
        console.error("Error stopping call on timer expiration:", err);
      }
    }
    setIsCallActive(false);
    setIsEnding(true);
    redirectToFeedbackPage();
  }, [isCallActive, redirectToFeedbackPage]);

  const endCall = useCallback(
    (redirectForFeedback = true) => {
      console.log("🛑 Ending interview session");
      setIsEnding(true);
      if (vapiRef.current && isCallActive) {
        try {
          vapiRef.current.stop();
        } catch (err) {
          console.error("❌ Error ending call:", err);
        }
      }
      setIsCallActive(false); // Ensure call is marked inactive
      if (redirectForFeedback) {
        redirectToFeedbackPage();
      } else {
        localStorage.removeItem("interviewConfig");
        router.push("/");
      }
    },
    [isCallActive, redirectToFeedbackPage, router]
  );

  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode); // This updates currentCodeRef via useEffect
      if (codeUpdateTimeoutRef.current)
        clearTimeout(codeUpdateTimeoutRef.current);
      codeUpdateTimeoutRef.current = setTimeout(() => {
        if (isCallActive && vapiRef.current && newCode.trim().length > 0) {
          try {
            vapiRef.current.send({
              type: "add-message",
              message: {
                role: "system",
                content: `The candidate has updated their code. Current code:\n\`\`\`\n${newCode}\n\`\`\`\nSilently review this code. Only provide feedback if the candidate explicitly asks for help or seems very stuck with their verbal explanation. Do not comment on every minor change.`,
              },
            });
            console.log("📤 Candidate code update sent to Vapi AI.");
          } catch (err) {
            console.error("❌ Error sending code update to Vapi AI:", err);
          }
        }
      }, 2500);
    },
    [isCallActive]
  );

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_VAPI_API_KEY;
    if (!apiKey) {
      setError("Vapi API key is missing.");
      setInitialLoading(false);
      return;
    }

    if (!vapiRef.current) {
      try {
        const vapi = new Vapi(apiKey);
        vapiRef.current = vapi;

        vapi.on("call-start", () => {
          setIsCallActive(true);
          setIsConnecting(false);
          setError(null);
          console.log("🚀 Call started");
        });
        vapi.on("call-end", () => {
          setIsCallActive(false);
          setIsConnecting(false);
          setIsSpeaking({ user: false, assistant: false });
          console.log("📞 Call ended");
        });
        vapi.on("speech-start", () => {
          setIsSpeaking((prev) => ({ ...prev, user: true, assistant: false }));
          console.log("🎤 User speaking");
        });
        vapi.on("speech-end", () => {
          setIsSpeaking((prev) => ({ ...prev, user: false }));
          console.log("🔇 User stopped speaking");
        });
        vapi.on("error", (e: any) => {
          setError(e?.message || "Vapi error");
          setIsCallActive(false);
          setIsConnecting(false);
          console.error("❌ Vapi error:", e);
        });

        vapi.on("message", (message: any) => {
          console.log("📨 VAPI_MESSAGE_RAW:", JSON.stringify(message, null, 2));
          let fullAssistantUtteranceForProblemParsing: string | null = null;

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
                  "🕒 Assistant Model Output Buffer TIMEOUT processing."
                );
                processAssistantContentForProblem(
                  assistantModelOutputBufferRef.current
                );
                finalUtterancesRef.current.push({
                  role: "assistant",
                  content: assistantModelOutputBufferRef.current,
                  timestamp: new Date(),
                });
                assistantModelOutputBufferRef.current = ""; // Clear after processing
                setIsSpeaking((prev) => ({ ...prev, assistant: false }));
              }
            }, 1500);
          }

          if (message.type === "transcript") {
            const role = message.role === "assistant" ? "assistant" : "user";
            if (message.transcript) {
              // Add to finalUtterancesRef for feedback data
              if (message.transcriptType === "final" || role === "user") {
                finalUtterancesRef.current.push({
                  role,
                  content: message.transcript,
                  timestamp: new Date(),
                });
                if (
                  role === "assistant" &&
                  message.transcriptType === "final"
                ) {
                  fullAssistantUtteranceForProblemParsing = message.transcript;
                  if (assistantModelOutputTimeoutRef.current)
                    clearTimeout(assistantModelOutputTimeoutRef.current);
                  assistantModelOutputBufferRef.current = "";
                  setIsSpeaking((prev) => ({ ...prev, assistant: false }));
                }
              }
              // Logic for UI display transcript
              const newContent = message.transcript.trim();
              const currentTime = Date.now();
              if (displayTranscriptTimeoutRef.current)
                clearTimeout(displayTranscriptTimeoutRef.current);
              const shouldConsolidate =
                lastDisplayTranscriptRef.current.role === role &&
                currentTime - lastDisplayTranscriptRef.current.timestamp <
                  3500 &&
                (message.transcriptType !== "final" ||
                  newContent.length >
                    lastDisplayTranscriptRef.current.content.length);

              if (shouldConsolidate) {
                lastDisplayTranscriptRef.current.content = newContent;
                lastDisplayTranscriptRef.current.timestamp = currentTime;
              } else {
                if (lastDisplayTranscriptRef.current.content.length > 0) {
                  setDisplayTranscript((prev) =>
                    addUniqueDisplayMessage(prev, {
                      role: lastDisplayTranscriptRef.current.role as
                        | "user"
                        | "assistant",
                      content: lastDisplayTranscriptRef.current.content,
                      timestamp: new Date(
                        lastDisplayTranscriptRef.current.timestamp
                      ),
                    })
                  );
                }
                lastDisplayTranscriptRef.current = {
                  role,
                  content: newContent,
                  timestamp: currentTime,
                };
              }
              if (
                message.transcriptType === "final" ||
                currentTime - lastDisplayTranscriptRef.current.timestamp > 3000
              ) {
                if (lastDisplayTranscriptRef.current.content.length > 0) {
                  setDisplayTranscript((prev) =>
                    addUniqueDisplayMessage(prev, {
                      role: lastDisplayTranscriptRef.current.role as
                        | "user"
                        | "assistant",
                      content: lastDisplayTranscriptRef.current.content,
                      timestamp: new Date(
                        lastDisplayTranscriptRef.current.timestamp
                      ),
                    })
                  );
                  lastDisplayTranscriptRef.current = {
                    role: "",
                    content: "",
                    timestamp: 0,
                  };
                }
              } else {
                displayTranscriptTimeoutRef.current = setTimeout(() => {
                  if (lastDisplayTranscriptRef.current.content.length > 0) {
                    setDisplayTranscript((prev) =>
                      addUniqueDisplayMessage(prev, {
                        role: lastDisplayTranscriptRef.current.role as
                          | "user"
                          | "assistant",
                        content: lastDisplayTranscriptRef.current.content,
                        timestamp: new Date(
                          lastDisplayTranscriptRef.current.timestamp
                        ),
                      })
                    );
                    lastDisplayTranscriptRef.current = {
                      role: "",
                      content: "",
                      timestamp: 0,
                    };
                  }
                }, 3500);
              }
            }
          }

          if (
            message.type === "ai-message" &&
            message.message?.role === "assistant" &&
            message.message?.content
          ) {
            console.log("💬 Structured AI Message received.");
            fullAssistantUtteranceForProblemParsing = message.message.content;
            finalUtterancesRef.current.push({
              role: "assistant",
              content: message.message.content,
              timestamp: new Date(),
            });
            // Clear buffer as we have a full message
            if (assistantModelOutputTimeoutRef.current)
              clearTimeout(assistantModelOutputTimeoutRef.current);
            assistantModelOutputBufferRef.current = "";
            setIsSpeaking((prev) => ({ ...prev, assistant: false }));
          }

          if (fullAssistantUtteranceForProblemParsing) {
            processAssistantContentForProblem(
              fullAssistantUtteranceForProblemParsing
            );
          }

          if (
            message.type === "function-call" ||
            message.type === "conversation-update"
          ) {
            console.log("📋 Function call or conversation update:", message);
          }
        });
      } catch (err: any) {
        setError((err as Error).message);
        setInitialLoading(false);
      }
    }
    return () => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {}
        vapiRef.current = null;
      }
      if (displayTranscriptTimeoutRef.current)
        clearTimeout(displayTranscriptTimeoutRef.current);
      if (codeUpdateTimeoutRef.current)
        clearTimeout(codeUpdateTimeoutRef.current);
      if (assistantModelOutputTimeoutRef.current)
        clearTimeout(assistantModelOutputTimeoutRef.current);
    };
  }, [processAssistantContentForProblem]);

  const addUniqueDisplayMessage = (
    currentTranscript: DisplayMessage[],
    newMessage: DisplayMessage
  ): DisplayMessage[] => {
    const key = `${newMessage.role}-${
      newMessage.content
    }-${newMessage.timestamp.getTime()}`;
    const map = new Map(
      currentTranscript.map((m) => [
        `${m.role}-${m.content}-${m.timestamp.getTime()}`,
        m,
      ])
    );
    if (!map.has(key)) {
      map.set(key, newMessage);
    }
    return Array.from(map.values());
  };

  useEffect(() => {
    try {
      const configString = localStorage.getItem("interviewConfig");
      if (!configString) throw new Error("Interview config not found.");
      setInterviewConfig(JSON.parse(configString));
    } catch (err: any) {
      setError((err as Error).message + " Please reconfigure.");
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    displayTranscriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayTranscript]);

  const startCall = useCallback(() => {
    if (!vapiRef.current || !interviewConfig || isConnecting || isCallActive)
      return;
    console.log("🚀 Starting Vapi call...");
    setIsConnecting(true);
    setDisplayTranscript([]);
    setProblem(null);
    setError(null);
    finalUtterancesRef.current = [];
    assistantModelOutputBufferRef.current = "";
    // Reset code to default for the initial language of CodeEditor or a chosen default
    // setCode(getStarterTemplate("cpp")); // Assuming CodeEditor defaults to C++

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
      },
      voice: { provider: "openai", voiceId: "alloy" },
      firstMessage: `Hi! I'm your AI interviewer from ${companyNames}. Thanks for joining. To start, could you tell me a bit about your experience with ${
        interviewConfig.type === "dsa"
          ? "data structures and algorithms, and your preferred coding language for today"
          : "system design principles"
      }?`,
    };
    try {
      // @ts-ignore
      vapiRef.current.start(assistantConfig);
      console.log("✨ Call start request sent");
    } catch (err: any) {
      setError((err as Error).message);
      setIsConnecting(false);
    }
  }, [
    interviewConfig,
    isConnecting,
    isCallActive,
    processAssistantContentForProblem,
  ]);

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

  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />{" "}
        <p className="ml-3 text-lg">Loading Interview...</p>
      </div>
    );
  }
  if (isEnding) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Ending session and preparing feedback...</p>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    );
  }
  if (!interviewConfig && !initialLoading && !isEnding) {
    return (
      <div className="h-screen flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="mb-4 text-lg text-red-700 dark:text-red-400">
          {error || "Interview Configuration Error."}
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Please return to the setup page and configure your interview.
        </p>
        <Button onClick={() => router.push("/interview/configure")}>
          Reconfigure Interview
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      <header className="bg-background border-b px-4 py-2 flex justify-between items-center h-14 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => endCall(false)}
          disabled={isEnding}
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Exit (No Feedback)
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

      {error && !isEnding && (
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
            <span>×</span>
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
          <div className="border-t p-2 max-h-48 overflow-y-auto bg-slate-100 dark:bg-slate-800">
            <h3 className="text-xs font-semibold p-1 text-muted-foreground uppercase tracking-wider">
              Live Transcript
            </h3>
            {displayTranscript.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Conversation will appear here...
              </p>
            )}
            {displayTranscript.map((item, index) => (
              <div
                key={`${item.timestamp.getTime()}-${index}-${item.role}`}
                className={`text-xs p-1.5 my-1 rounded-md shadow-sm ${
                  item.role === "assistant"
                    ? "bg-blue-50 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200"
                    : "bg-green-50 dark:bg-green-900/40 text-green-800 dark:text-green-200"
                }`}
              >
                <strong className="font-medium">
                  {item.role === "assistant" ? "AI: " : "You: "}
                </strong>
                {item.content}
              </div>
            ))}
            <div ref={displayTranscriptEndRef} />
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
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  "🚀 Start Interview"
                )}
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={() => endCall(true)}
                className="w-full"
                size="lg"
                disabled={isEnding}
              >
                {isEnding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ending...
                  </>
                ) : (
                  "🛑 End Interview & Get Feedback"
                )}
              </Button>
            )}
            <div className="mt-2 text-center text-xs text-muted-foreground">
              {isCallActive
                ? "AI is listening. Take your time."
                : "Mic check before starting."}
            </div>
          </div>
        </div>

        <div className="flex flex-col bg-background rounded-lg shadow-md overflow-hidden">
          <div className="flex-1 min-h-0">
            <CodeEditor
              onChange={handleCodeChange} // Correctly pass the handler
              initialCode={code} // Pass the 'code' state to allow updates
              initialLanguage="cpp" // Default language for the editor instance
            />
          </div>
          {/* <div className="md:h-1/3 min-h-[200px] border-t overflow-y-auto p-4">
            <ProblemDisplay problem={problem} />
          </div> */}
        </div>
      </div>
    </div>
  );
}
