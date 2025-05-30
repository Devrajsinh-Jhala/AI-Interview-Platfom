// components/interview/DifficultySelector.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type DifficultyLevel = "easy" | "medium" | "hard";

interface DifficultySelectorProps {
  selectedDifficulty: DifficultyLevel;
  setSelectedDifficulty: React.Dispatch<React.SetStateAction<DifficultyLevel>>;
}

export function DifficultySelector({
  selectedDifficulty,
  setSelectedDifficulty,
}: DifficultySelectorProps) {
  const options = [
    { id: "easy", label: "Easy", color: "text-green-500" },
    { id: "medium", label: "Medium", color: "text-yellow-500" },
    { id: "hard", label: "Hard", color: "text-red-500" },
  ];

  return (
    <div className="flex rounded-lg border p-1 w-fit">
      {options.map((option) => {
        const isSelected = selectedDifficulty === option.id;

        return (
          <div key={option.id} className="relative">
            <button
              type="button"
              onClick={() =>
                setSelectedDifficulty(option.id as DifficultyLevel)
              }
              className={cn(
                "relative z-10 px-6 py-2.5 font-medium text-sm transition-colors",
                isSelected ? "text-primary-foreground" : option.color
              )}
            >
              {option.label}
            </button>

            {isSelected && (
              <motion.div
                layoutId="difficulty-selection"
                className="absolute inset-0 rounded bg-primary"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
