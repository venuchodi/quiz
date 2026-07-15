import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, ListChecks, Clock, ArrowLeft, ArrowRight, Flag, 
  CheckCircle, XCircle, AlertCircle, RefreshCw, LogIn, ChevronLeft, ChevronRight, HelpCircle
} from "lucide-react";
import { Quiz, Attempt, Question } from "../types";

interface StudentPortalProps {
  initialJoinCode: string;
  onBackToDashboard: () => void;
}

export default function StudentPortal({ 
  initialJoinCode, 
  onBackToDashboard 
}: StudentPortalProps) {
  
  // Stages: 'join' | 'active' | 'results'
  const [stage, setStage] = useState<"join" | "active" | "results">("join");
  
  // Credentials
  const [joinCode, setJoinCode] = useState(initialJoinCode || "");
  const [studentName, setStudentName] = useState("");
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // Map of qId -> choice string
  const [flagged, setFlagged] = useState<Record<string, boolean>>({}); // Map of qId -> flagged boolean
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSingleQuestionView, setIsSingleQuestionView] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeTakenTotal, setTimeTakenTotal] = useState(0);

  // Results State
  const [submitLoading, setSubmitLoading] = useState(false);
  const [results, setResults] = useState<Attempt | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto pre-fill if initialJoinCode changes
  useEffect(() => {
    if (initialJoinCode) {
      setJoinCode(initialJoinCode);
    }
  }, [initialJoinCode]);

  // Handle active quiz timer
  useEffect(() => {
    if (timerActive && secondsRemaining > 0) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          setTimeTakenTotal(t => t + 1);
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Auto submit
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, secondsRemaining]);

  // Request sanitized quiz structure
  const handleJoinQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMsg("Please enter a 6-character quiz code.");
      return;
    }
    if (!studentName.trim()) {
      setErrorMsg("Please provide your name to start the quiz.");
      return;
    }

    setLoadingQuiz(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/quizzes/${joinCode.toUpperCase().trim()}`);
      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error || "Quiz not found. Please verify the code.");
        return;
      }
      
      const quizData = await res.json();
      setActiveQuiz(quizData);
      
      // Setup timing
      const limitMins = quizData.config.timeLimit || 0;
      if (limitMins > 0) {
        setSecondsRemaining(limitMins * 60);
        setTimerActive(true);
      } else {
        setSecondsRemaining(0);
        setTimerActive(false);
      }
      
      setAnswers({});
      setFlagged({});
      setCurrentQuestionIndex(0);
      setTimeTakenTotal(0);
      setStage("active");
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load quiz. Check your internet connection.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (qId: string, optionText: string) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: optionText
    }));
  };

  const handleToggleFlag = (qId: string) => {
    setFlagged(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleAutoSubmit = () => {
    alert("Time has run out! Your assessment is submitting automatically.");
    handleSubmitQuiz(true);
  };

  // Submit questions to server grading
  const handleSubmitQuiz = async (bypassConfirmation = false) => {
    if (!bypassConfirmation && !confirm("Are you sure you want to finish and submit your quiz answers?")) {
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setSubmitLoading(true);

    try {
      const res = await fetch(`/api/quizzes/${activeQuiz?.code}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName,
          answers,
          timeTaken: timeTakenTotal
        })
      });

      const data = await res.json();
      if (data.success) {
        setResults(data.attempt);
        setStage("results");
      } else {
        alert(data.error || "Failed to submit answers.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting answers. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#f9fafb] min-h-screen pb-16" id="student-portal-container">
      
      {/* 1. JOIN ASSIGNMENT STAGE */}
      {stage === "join" && (
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white border-4 border-black shadow-neo-lg p-6 md:p-8 space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-100 text-black border-2 border-black flex items-center justify-center mx-auto shadow-neo-sm">
                <LogIn className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">Student Portal</h2>
              <p className="text-xs text-slate-600 font-bold tracking-wide uppercase">
                Join secure assessment session
              </p>
            </div>

            <form onSubmit={handleJoinQuiz} className="space-y-5">
              
              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-1.5">
                  6-Digit Access Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="E.G. PHOTOS"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full text-center tracking-widest font-mono text-2xl font-black px-3 py-3 bg-slate-50 border-2 border-black text-slate-800 placeholder-slate-300 focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 uppercase tracking-widest mb-1.5">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border-2 border-black text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white text-sm font-bold"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-100 border-2 border-black text-red-900 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingQuiz}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider border-2 border-black cursor-pointer shadow-neo-sm transition-all disabled:opacity-50"
              >
                {loadingQuiz ? (
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>LOCATING ASSESSMENT...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>BEGIN ASSESSMENT</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            <div className="pt-4 border-t-2 border-black text-center">
              <button
                onClick={onBackToDashboard}
                className="text-xs font-black uppercase tracking-wider text-slate-500 hover:text-black cursor-pointer"
              >
                Return to Dashboard
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. ACTIVE SECURE QUIZ STAGE */}
      {stage === "active" && activeQuiz && (
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT COLUMN: QUESTION RAIL NAV (WCAG AA Navigation) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Timer card */}
            {activeQuiz.config.timeLimit > 0 && (
              <div className="bg-white p-4 border-2 border-black shadow-neo-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${secondsRemaining < 60 ? "text-red-600 animate-pulse" : "text-black"}`} />
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Remaining:</span>
                </div>
                <span className={`font-mono text-xl font-black ${secondsRemaining < 60 ? "text-red-600 animate-bounce" : "text-black"}`}>
                  {formatTime(secondsRemaining)}
                </span>
              </div>
            )}

            {/* Questions map */}
            <div className="bg-white p-4 border-2 border-black shadow-neo-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-black uppercase tracking-widest">Progress</h3>
                <span className="text-xs font-black font-mono text-slate-500 bg-slate-100 border border-black px-1.5 py-0.5">
                  {Object.keys(answers).length} / {activeQuiz.questions.length} DONE
                </span>
              </div>

              {/* Grid of buttons */}
              <div className="grid grid-cols-4 gap-2">
                {activeQuiz.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isFlagged = flagged[q.id];
                  const isCurrent = currentQuestionIndex === idx;

                  let bgClass = "bg-white border-black text-black hover:bg-slate-50 shadow-neo-sm";
                  if (isAnswered) bgClass = "bg-slate-300 border-black text-black font-black";
                  if (isFlagged) bgClass = "bg-yellow-200 border-black text-black font-bold";
                  if (isCurrent) bgClass = "bg-indigo-600 text-white border-black font-black ring-2 ring-indigo-300";

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setIsSingleQuestionView(true);
                      }}
                      className={`h-10 w-full border-2 text-xs font-black flex items-center justify-center cursor-pointer transition-all ${bgClass}`}
                    >
                      {idx + 1}
                      {isFlagged && <span className="w-1.5 h-1.5 rounded-full bg-red-600 absolute top-1 right-1 border border-black" />}
                    </button>
                  );
                })}
              </div>

              {/* View toggle */}
              <div className="pt-3 border-t-2 border-black flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Layout:</span>
                <button
                  onClick={() => setIsSingleQuestionView(prev => !prev)}
                  className="px-2.5 py-1.5 bg-black text-white text-[10px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-800"
                >
                  {isSingleQuestionView ? "All on Page" : "One by One"}
                </button>
              </div>

            </div>

            {/* Quick Warning block */}
            <div className="bg-amber-50 p-4 border-2 border-black shadow-neo-sm text-xs text-black space-y-1">
              <p className="font-black uppercase tracking-wider">⚠️ SECURE ACTIVE ASSESSMENT</p>
              <p className="font-medium text-slate-700 leading-relaxed">
                Closing this window or reloading the page before clicking Submit will erase your active attempts.
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: MCQ EXAM CARD */}
          <div className="lg:col-span-3 space-y-6">
            
            <div className="bg-white border-4 border-black shadow-neo-lg p-5 md:p-6">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-black pb-4 mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic">{activeQuiz.config.title}</h2>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{activeQuiz.config.subject} • {activeQuiz.questions.length} MCQS</p>
                </div>
                
                <button
                  onClick={() => handleSubmitQuiz(false)}
                  className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest border-2 border-black cursor-pointer shadow-neo-sm transition-all"
                >
                  Submit Assessment
                </button>
              </div>

              {/* 1. SINGLE QUESTION LAYOUT */}
              {isSingleQuestionView ? (
                <div className="space-y-6">
                  {/* Active Question Panel */}
                  {(() => {
                    const q = activeQuiz.questions[currentQuestionIndex];
                    if (!q) return null;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="px-3 py-1.5 bg-slate-100 border-2 border-black text-black text-xs font-black font-mono shadow-neo-sm">
                            MCQ {currentQuestionIndex + 1} OF {activeQuiz.questions.length}
                          </span>
                          <button
                            onClick={() => handleToggleFlag(q.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black text-xs font-black uppercase tracking-wider cursor-pointer transition-all ${
                              flagged[q.id] 
                                ? "bg-yellow-200 text-black" 
                                : "bg-white text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <Flag className={`w-3.5 h-3.5 ${flagged[q.id] ? "fill-black text-black" : ""}`} />
                            <span>{flagged[q.id] ? "Flagged" : "Flag For Review"}</span>
                          </button>
                        </div>

                        {/* Question Text */}
                        <div className="text-lg font-bold text-black whitespace-pre-wrap leading-relaxed pt-2">
                          {q.text}
                        </div>

                        {/* Options list */}
                        <div className="space-y-3 pt-3">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = answers[q.id] === opt;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => handleSelectOption(q.id, opt)}
                                className={`w-full text-left p-4 border-2 border-black transition-all cursor-pointer flex items-center gap-4 ${
                                  isSelected 
                                    ? "bg-indigo-50 border-2 border-black font-bold shadow-neo" 
                                    : "bg-white border-2 border-black hover:bg-slate-50 shadow-neo-sm"
                                }`}
                              >
                                <span className={`w-8 h-8 text-xs font-black flex items-center justify-center border-2 border-black transition-colors ${
                                  isSelected 
                                    ? "bg-black text-white" 
                                    : "bg-white text-black"
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="text-sm font-bold text-slate-800">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Navigation footer */}
                  <div className="flex items-center justify-between pt-6 border-t-2 border-black">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-40 text-black border-2 border-black text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-neo-sm"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>
                    
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuiz.questions.length - 1, prev + 1))}
                      disabled={currentQuestionIndex === activeQuiz.questions.length - 1}
                      className="px-4 py-2.5 bg-white hover:bg-slate-50 disabled:opacity-40 text-black border-2 border-black text-xs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-neo-sm"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                // 2. SCROLLABLE ALL QUESTIONS ON ONE PAGE
                <div className="space-y-8">
                  {activeQuiz.questions.map((q, idx) => (
                    <div key={q.id} className="border-b-2 border-dashed border-black pb-8 last:border-0 last:pb-0 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-black text-sm bg-slate-100 border-2 border-black px-2 py-0.5 shadow-neo-sm font-mono">Q{idx + 1}</span>
                        <button
                          onClick={() => handleToggleFlag(q.id)}
                          className={`flex items-center gap-1 border-2 border-black px-2 py-1 text-xs font-black uppercase tracking-wider cursor-pointer ${flagged[q.id] ? "bg-yellow-200" : "bg-white"}`}
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>Flag</span>
                        </button>
                      </div>

                      <div className="text-base font-bold text-black whitespace-pre-wrap">{q.text}</div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIdx) => {
                          const isSelected = answers[q.id] === opt;
                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectOption(q.id, opt)}
                              className={`text-left p-3.5 border-2 border-black transition-all cursor-pointer flex items-center gap-3 ${
                                isSelected 
                                  ? "bg-indigo-50 font-bold shadow-neo" 
                                  : "bg-white hover:bg-slate-50 shadow-neo-sm"
                              }`}
                            >
                              <span className="font-mono text-xs uppercase font-black text-black">
                                {String.fromCharCode(65 + oIdx)}:
                              </span>
                              <span className="text-xs font-bold text-slate-800">{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* 3. ASSESSMENT RESULTS & STUDY RECOMMENDATIONS STAGE */}
      {stage === "results" && results && activeQuiz && (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          
          {/* Main scoreboard */}
          <div className="bg-white border-4 border-black shadow-neo-lg p-6 md:p-8 space-y-6">
            
            {/* Header badge / pass check */}
            {(() => {
              const isPassed = results.percentage >= activeQuiz.config.passingScore;
              return (
                <div className="text-center space-y-2">
                  <div className={`w-20 h-20 border-4 border-black flex items-center justify-center mx-auto shadow-neo ${
                    isPassed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {isPassed ? <CheckCircle className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
                  </div>
                  
                  <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                    {isPassed ? "You Passed the Assessment!" : "Keep Practicing & Retake!"}
                  </h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
                    Student: <span className="text-black font-black underline">{results.studentName}</span> • Submitted safely
                  </p>
                </div>
              );
            })()}

            {/* Score Grid KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#fef08a] p-5 border-2 border-black shadow-neo">
              <div className="text-center border-r-2 border-black last:border-0">
                <span className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Final Score</span>
                <span className="text-3xl font-black text-black">{results.score}</span>
                <span className="text-xs text-slate-600 font-black"> / {results.totalQuestions}</span>
              </div>
              <div className="text-center border-r-2 border-black last:border-0">
                <span className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Percentage</span>
                <span className="text-3xl font-black text-black">{results.percentage}%</span>
                <span className="text-xs text-slate-600 block font-bold">PASS: {activeQuiz.config.passingScore}%</span>
              </div>
              <div className="text-center border-r-2 border-black last:border-0">
                <span className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Time Taken</span>
                <span className="text-3xl font-black text-black font-mono">{formatTime(results.timeTaken)}</span>
                <span className="text-xs text-slate-600 block font-bold">MM:SS spent</span>
              </div>
              <div className="text-center last:border-0">
                <span className="block text-[10px] font-black text-black uppercase tracking-widest mb-1">Incorrect MCQs</span>
                <span className="text-3xl font-black text-red-600">
                  {results.totalQuestions - results.score}
                </span>
                <span className="text-xs text-slate-600 block font-bold">Missed count</span>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex flex-col md:flex-row gap-3 pt-6 border-t-2 border-black justify-between items-center">
              <button
                onClick={onBackToDashboard}
                className="w-full md:w-auto px-5 py-3 bg-white hover:bg-slate-50 text-black font-black uppercase tracking-wider border-2 border-black cursor-pointer shadow-neo-sm transition-all text-center"
              >
                Return to Dashboard
              </button>
              
              <button
                onClick={() => {
                  setAnswers({});
                  setFlagged({});
                  setCurrentQuestionIndex(0);
                  setTimeTakenTotal(0);
                  setStage("active");
                }}
                className="w-full md:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider border-2 border-black cursor-pointer shadow-neo-sm transition-all text-center"
              >
                Retake Assessment
              </button>
            </div>

          </div>

          {/* AI PERSONALIZED STUDY ADVICE */}
          {results.aiSuggestions && (
            <div className="bg-indigo-600 border-4 border-black p-6 text-white shadow-neo-lg relative overflow-hidden">
              <div className="absolute right-4 bottom-4 opacity-5">
                <Sparkles className="w-32 h-32" />
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white text-black border-2 border-black shadow-neo-sm">
                  <Sparkles className="w-6 h-6 text-indigo-600 fill-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic tracking-tight">
                    Personalized AI Study Guide
                  </h3>
                  <p className="text-[10px] text-indigo-200 mt-1 uppercase font-black tracking-widest">Powered by Google Gemini 3.5 Flash</p>
                  <p className="text-sm text-indigo-50 mt-4 font-bold leading-relaxed whitespace-pre-wrap">
                    {results.aiSuggestions}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* QUESTION REVIEW BANK (DETAILED PEDAGOGY REVIEW) */}
          <div className="space-y-6">
            <h3 className="text-lg font-black uppercase tracking-tighter italic text-black">Pedagogical Review Breakdown</h3>
            
            {activeQuiz.questions.map((q, idx) => {
              const feedback = results.questionFeedback[q.id];
              const isCorrect = feedback?.isCorrect;
              const studentAnswer = feedback?.studentAnswer || "No Answer";
              const correctAnswer = q.correctAnswer;

              return (
                <div 
                  key={q.id}
                  className={`bg-white border-2 border-black p-5 space-y-4 shadow-neo transition-all ${
                    isCorrect ? "bg-emerald-50/20" : "bg-red-50/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1.5 bg-slate-100 border border-black text-black text-xs font-mono font-black shadow-neo-sm">
                      MCQ {idx + 1}
                    </span>
                    <span className={`px-2.5 py-1.5 text-xs font-black uppercase tracking-wider border border-black shadow-neo-sm flex items-center gap-1 ${
                      isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                    }`}>
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Correct</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Incorrect</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="text-base font-bold text-black whitespace-pre-wrap leading-relaxed">{q.text}</div>

                  {/* Answers review list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = opt === studentAnswer;
                      const isCorrectAnswer = opt === correctAnswer;

                      let btnBorder = "border-black";
                      let btnBg = "bg-white";
                      let optIndicator = "bg-white border-black text-black";

                      if (isCorrectAnswer) {
                        btnBorder = "border-2 border-black";
                        btnBg = "bg-emerald-100 font-bold";
                        optIndicator = "bg-emerald-600 text-white border-black";
                      } else if (isChosen) {
                        btnBorder = "border-2 border-black";
                        btnBg = "bg-red-100 font-bold";
                        optIndicator = "bg-red-600 text-white border-black";
                      }

                      return (
                        <div 
                          key={oIdx}
                          className={`p-3 border-2 text-xs flex items-center gap-3 shadow-neo-sm ${btnBg} ${btnBorder}`}
                        >
                          <span className={`w-6 h-6 border-2 text-[10px] font-black flex items-center justify-center ${optIndicator}`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="text-slate-800 font-bold flex-1">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pedagogical Explanation block */}
                  <div className="bg-slate-50 p-4 border-2 border-black shadow-neo-sm text-xs space-y-3">
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-black">
                      <HelpCircle className="w-4 h-4 text-indigo-600" />
                      <span>Pedagogical Explanation:</span>
                    </div>
                    <p className="text-slate-700 font-medium leading-relaxed">
                      {q.explanation}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-dashed border-black text-[10px] uppercase font-bold text-slate-500">
                      <div>
                        Bloom's Level: <span className="font-black text-black">{q.bloomTaxonomy}</span>
                      </div>
                      <div>
                        Outcome: <span className="font-black text-black">{q.learningOutcome}</span>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}
