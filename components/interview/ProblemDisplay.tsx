// components/interview/ProblemDisplay.tsx
"use client";

interface ProblemDisplayProps {
  problem: {
    title: string;
    description: string;
  } | null;
}

export function ProblemDisplay({ problem }: ProblemDisplayProps) {
  if (!problem) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">
          Waiting for interviewer to present a problem...
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-4">
      <h2 className="text-xl font-bold mb-4">{problem.title}</h2>
      <div className="whitespace-pre-line">{problem.description}</div>
    </div>
  );
}
