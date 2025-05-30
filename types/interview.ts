// types/interview.ts
import { Company } from "@/components/interview/CompanySelector"
import { InterviewType } from "@/components/interview/InterviewTypeSelector"
import { DifficultyLevel } from "@/components/interview/DifficultySelector"

export interface InterviewConfig {
  companies: Company[]
  type: InterviewType
  difficulty: DifficultyLevel
}
