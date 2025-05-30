// components/interview/InterviewTypeSelector.tsx
"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Code, Layout } from "lucide-react"
import { cn } from "@/lib/utils"

export type InterviewType = "dsa" | "system-design" | "both"

interface InterviewTypeSelectorProps {
  selectedType: InterviewType
  setSelectedType: React.Dispatch<React.SetStateAction<InterviewType>>
}

export function InterviewTypeSelector({ selectedType, setSelectedType }: InterviewTypeSelectorProps) {
  const options = [
    { 
      id: "dsa",
      label: "Data Structures & Algorithms", 
      description: "Solve coding problems focused on algorithms and data structures",
      icon: Code
    },
    { 
      id: "system-design", 
      label: "System Design", 
      description: "Design scalable systems and explain architectural decisions",
      icon: Layout
    },
    { 
      id: "both", 
      label: "Both", 
      description: "Practice both DSA and System Design in one interview session",
      icon: () => (
        <div className="flex">
          <Code className="h-5 w-5" />
          <div className="h-5 w-[1px] bg-current mx-0.5 opacity-30" />
          <Layout className="h-5 w-5" />
        </div>
      )
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {options.map((option) => {
        const Icon = option.icon
        const isSelected = selectedType === option.id
        
        return (
          <div
            key={option.id}
            className={cn(
              "relative cursor-pointer rounded-lg border-2 p-4 transition-all",
              isSelected 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-muted hover:border-muted-foreground/50"
            )}
            onClick={() => setSelectedType(option.id as InterviewType)}
          >
            {isSelected && (
              <motion.div
                layoutId="selection-pill"
                className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-primary"
                transition={{ type: "spring", duration: 0.5 }}
              >
                <svg className="h-6 w-6 text-primary-foreground" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.75 12.75l2.25 2.5 6.25-6.5" />
                </svg>
              </motion.div>
            )}
            
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="font-semibold mb-1">{option.label}</div>
            <p className="text-sm text-muted-foreground">{option.description}</p>
          </div>
        )
      })}
    </div>
  )
}
