/**
 * EduQuiz AI - Shared Type Definitions
 */

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionType = "mcq" | "multiple-select" | "true-false" | "fill-blank";

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string; // The option string or value
  explanation: string;
  difficulty: Difficulty;
  bloomTaxonomy: string; // e.g., "Remembering", "Understanding", "Applying", "Analyzing"
  learningOutcome: string;
}

export interface QuizConfig {
  title: string;
  description: string;
  subject: string;
  difficulty: Difficulty;
  questionCount: number;
  timeLimit: number; // In minutes, 0 for unlimited
  negativeMarking: boolean;
  passingScore: number; // e.g., 50 (percentage)
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
}

export interface Quiz {
  code: string;
  config: QuizConfig;
  questions: Question[];
  createdAt: string;
}

export interface Attempt {
  id: string;
  quizCode: string;
  studentName: string;
  answers: { [questionId: string]: string }; // Map of question ID to student's chosen option
  score: number; // Number of correct answers
  totalQuestions: number;
  percentage: number;
  timeTaken: number; // In seconds
  submittedAt: string;
  questionFeedback: {
    [questionId: string]: {
      isCorrect: boolean;
      studentAnswer: string;
      correctAnswer: string;
      explanation: string;
    };
  };
  aiSuggestions: string; // AI personalized improvement feedback
}

export interface DashboardStats {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  totalAttempts: number;
  passingRate: number; // percentage of students who passed
  questionStats: {
    questionId: string;
    text: string;
    correctCount: number;
    incorrectCount: number;
    correctPercentage: number;
  }[];
  studentAttempts: Attempt[];
}
