// app/interview/configure/page.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, HelpCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CompanySelector, type Company } from '@/components/interview/CompanySelector'
import { InterviewTypeSelector, type InterviewType } from '@/components/interview/InterviewTypeSelector'
import { DifficultySelector, type DifficultyLevel } from '@/components/interview/DifficultySelector'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Add tooltip component
// npx shadcn-ui add tooltip

export default function InterviewConfigurePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [selectedCompanies, setSelectedCompanies] = useState<Company[]>([])
  const [selectedType, setSelectedType] = useState<InterviewType>("dsa")
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>("medium")
  
  // Error state
  const [error, setError] = useState("")
  
  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }
  
  // Handle form submission
  const handleStartInterview = async () => {
    // Validate form
    if (selectedCompanies.length === 0) {
      setError("Please select at least one company")
      return
    }
    
    setError("")
    setLoading(true)
    
    try {
      // In a real app, you'd prepare the interview on the server here
      // For now, we'll just simulate a delay and redirect
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Prepare interview configuration to pass to the interview room
      const interviewConfig = {
        companies: selectedCompanies,
        type: selectedType,
        difficulty: selectedDifficulty,
      }
      
      // Store in localStorage for now (later we could use server state)
      localStorage.setItem('interviewConfig', JSON.stringify(interviewConfig))
      
      // Redirect to interview room
      router.push('/interview/room')
    } catch (err) {
      console.error("Failed to prepare interview:", err)
      setError("Failed to prepare interview. Please try again.")
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push('/')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>
      
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-bold mb-2">Configure Your Interview</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Customize your practice interview to match your target companies and preferences.
          </p>
        </motion.div>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-md mb-6"
          >
            {error}
          </motion.div>
        )}
        
        <motion.div variants={itemVariants}>
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Target Companies</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the companies you're preparing for. This will tailor questions to their interview style.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Choose one or more companies that you're targeting for interviews.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanySelector
                selectedCompanies={selectedCompanies}
                setSelectedCompanies={setSelectedCompanies}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Interview Type</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Choose what type of technical questions you want to practice.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Select the type of interview questions you want to practice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InterviewTypeSelector
                selectedType={selectedType}
                setSelectedType={setSelectedType}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Difficulty Level</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <HelpCircle className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Set the challenge level of the interview questions.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Choose how challenging you want the interview questions to be.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DifficultySelector
                selectedDifficulty={selectedDifficulty}
                setSelectedDifficulty={setSelectedDifficulty}
              />
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants} className="flex justify-end">
          <Button 
            size="lg" 
            onClick={handleStartInterview}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing Interview...
              </>
            ) : (
              <>Start Interview</>
            )}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
