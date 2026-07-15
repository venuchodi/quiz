import React, { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
  ArrowLeft as ArrowLeftIcon, RefreshCw as RefreshCwIcon, Trophy as TrophyIcon, 
  Users as UsersIcon, Percent as PercentIcon, HelpCircle as HelpCircleIcon, 
  Eye as EyeIcon, AlertTriangle as AlertTriangleIcon
} from "lucide-react";
import { DashboardStats, Attempt } from "../types";

interface AnalyticsPanelProps {
  quizCode: string;
  onBackToDashboard: () => void;
}

export default function AnalyticsPanel({ 
  quizCode, 
  onBackToDashboard 
}: AnalyticsPanelProps) {
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudentAttempt, setSelectedStudentAttempt] = useState<Attempt | null>(null);
  const [viewingDetails, setViewingDetails] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [quizCode]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quizzes/${quizCode.toUpperCase()}/analytics`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCwIcon className="w-10 h-10 text-black animate-spin mx-auto" />
        <p className="text-black text-sm uppercase tracking-wider font-black font-mono">Aggregating student assessment logs...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 text-center space-y-4">
        <AlertTriangleIcon className="w-12 h-12 text-red-600 mx-auto" />
        <h3 className="text-xl font-black uppercase tracking-tighter">No Analytics Data Available</h3>
        <button onClick={onBackToDashboard} className="px-5 py-2 bg-white text-black border-2 border-black font-black uppercase tracking-wider cursor-pointer shadow-neo-sm">
          Back
        </button>
      </div>
    );
  }

  // format time helper
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Prepare distribution data for distribution chart (0-40%, 41-60%, 61-80%, 81-100%)
  const brackets = [
    { name: "0-40%", count: 0, color: "#f87171" },
    { name: "41-60%", count: 0, color: "#fbbf24" },
    { name: "61-80%", count: 0, color: "#60a5fa" },
    { name: "81-100%", count: 0, color: "#34d399" }
  ];

  stats.studentAttempts.forEach((att) => {
    if (att.percentage <= 40) brackets[0].count++;
    else if (att.percentage <= 60) brackets[1].count++;
    else if (att.percentage <= 80) brackets[2].count++;
    else brackets[3].count++;
  });

  // Prepare question level stats
  const questionPerformanceData = stats.questionStats.map((q, idx) => ({
    name: `Q${idx + 1}`,
    "Correct Rate (%)": q.correctPercentage,
    correctCount: q.correctCount,
    incorrectCount: q.incorrectCount,
    questionText: q.text
  }));

  // Find most missed questions
  const mostMissedQuestions = [...stats.questionStats]
    .sort((a, b) => a.correctPercentage - b.correctPercentage)
    .slice(0, 3)
    .filter(q => q.correctPercentage < 70);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 space-y-8" id="analytics-panel-container">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button 
            onClick={onBackToDashboard}
            className="flex items-center gap-2 text-slate-600 hover:text-black font-black uppercase tracking-wider mb-3 text-xs cursor-pointer"
          >
            <ArrowLeftIcon className="w-4 h-4 text-black" />
            <span>Back to Dashboard</span>
          </button>
          
          <h2 className="text-3xl font-black uppercase tracking-tighter italic flex items-center gap-2">
            <span>Assessment Analytics Report</span>
            <span className="text-xs bg-indigo-100 text-black border-2 border-black px-2 py-0.5 font-mono font-black shadow-neo-sm">{quizCode}</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-semibold tracking-wide uppercase">
            Real-time visual monitoring of student competencies and concept mastery.
          </p>
        </div>

        <button 
          onClick={fetchAnalytics}
          className="px-5 py-3 bg-white hover:bg-slate-50 text-black border-2 border-black font-black uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-neo-sm"
        >
          <RefreshCwIcon className="w-4 h-4" />
          <span>Sync Real-time Attempts</span>
        </button>
      </div>

      {stats.totalAttempts === 0 ? (
        /* Empty Analytics View */
        <div className="bg-white p-12 border-4 border-black text-center shadow-neo-lg">
          <UsersIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-2xl font-black uppercase tracking-tighter">No Attempts Recorded Yet</h3>
          <p className="text-slate-600 text-sm max-w-md mx-auto mt-2 font-medium">
            Share the quiz code <span className="font-mono font-black text-indigo-600 underline">{quizCode}</span> with your class. Once students submit their answers, analytical charts will compile here immediately.
          </p>
        </div>
      ) : (
        /* Dashboard Charts and Tables */
        <div className="space-y-10">
          
          {/* KPI COUNTERS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-white p-5 border-2 border-black shadow-neo flex items-center gap-4">
              <div className="p-3 bg-violet-100 text-black border border-black shadow-neo-sm">
                <UsersIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Submissions</p>
                <h3 className="text-3xl font-black text-black">{stats.totalAttempts}</h3>
              </div>
            </div>

            <div className="bg-white p-5 border-2 border-black shadow-neo flex items-center gap-4">
              <div className="p-3 bg-[#fde047] text-black border border-black shadow-neo-sm">
                <TrophyIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Class Average</p>
                <h3 className="text-3xl font-black text-black">
                  {stats.averageScore} <span className="text-xs text-slate-400 font-bold">/ {stats.questionStats.length}</span>
                </h3>
              </div>
            </div>

            <div className="bg-white p-5 border-2 border-black shadow-neo flex items-center gap-4">
              <div className="p-3 bg-emerald-100 text-black border border-black shadow-neo-sm">
                <PercentIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Passing Rate</p>
                <h3 className="text-3xl font-black text-black">{stats.passingRate}%</h3>
              </div>
            </div>

            <div className="bg-white p-5 border-2 border-black shadow-neo flex items-center gap-4">
              <div className="p-3 bg-blue-100 text-black border border-black shadow-neo-sm">
                <TrophyIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">High vs Low</p>
                <h3 className="text-3xl font-black text-black">
                  {stats.highestScore} <span className="text-xs text-slate-400">vs</span> <span className="text-slate-600">{stats.lowestScore}</span>
                </h3>
              </div>
            </div>

          </div>

          {/* TWO MAIN VISUAL CHARTS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Grade Score Distribution */}
            <div className="bg-white border-2 border-black p-5 shadow-neo space-y-4">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Grade Score Distribution</h3>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-0.5">Quantity of students grouped by final grade range</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={brackets} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#000000" fontSize={11} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="#000000" fontSize={11} tickLine={false} />
                    <Tooltip cursor={{ fill: "transparent" }} />
                    <Bar dataKey="count" radius={[0, 0, 0, 0]} stroke="#000000" strokeWidth={2}>
                      {brackets.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Question Performance */}
            <div className="bg-white border-2 border-black p-5 shadow-neo space-y-4">
              <div>
                <h3 className="text-xl font-black uppercase italic tracking-tight">Question Correctness Rates</h3>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mt-0.5">Success percentages for each MCQ in the assessment</p>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={questionPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="#000000" fontSize={11} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#000000" fontSize={11} tickLine={false} />
                    <Tooltip formatter={(value) => [`${value}%`, "Correct rate"]} labelFormatter={(label) => `Question: ${label}`} />
                    <Bar dataKey="Correct Rate (%)" fill="#6366f1" radius={[0, 0, 0, 0]} stroke="#000000" strokeWidth={2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* ACTIVE CLASSROOM LEARNING GAP DIAGNOSIS */}
          {mostMissedQuestions.length > 0 && (
            <div className="bg-amber-50 border-4 border-black p-6 space-y-4 shadow-neo-lg">
              <div className="flex items-center gap-2 text-black">
                <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                <h3 className="text-lg font-black uppercase tracking-tight italic">Actionable Classroom Learning Gaps Detected</h3>
              </div>
              <p className="text-xs text-slate-800 leading-relaxed max-w-4xl font-bold uppercase tracking-wide">
                The following questions had low correctness scores (under 70%). These indicate active concept deficiencies that should be targeted during upcoming class review lectures:
              </p>
              
              <div className="space-y-3 mt-2">
                {mostMissedQuestions.map((q) => (
                  <div key={q.questionId} className="bg-white border-2 border-black p-4 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-neo-sm">
                    <div className="flex-1">
                      <span className="font-black uppercase tracking-widest text-slate-500 block">Question Content:</span>
                      <p className="text-black mt-1 font-bold italic">"{q.text}"</p>
                    </div>
                    <div className="text-left md:text-right whitespace-nowrap bg-red-100 border-2 border-black px-3 py-2 font-black uppercase tracking-wide shadow-neo-sm">
                      <span className="text-red-700 block">Correct rate: {q.correctPercentage}%</span>
                      <span className="text-slate-800 text-[10px]">Missed by {q.incorrectCount} students</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DETAILED STUDENT LOG SHEETS */}
          <div className="bg-white border-4 border-black shadow-neo-lg overflow-hidden">
            <div className="px-6 py-4 border-b-2 border-black bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight italic">Detailed Student Attempts Log</h3>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide mt-1">Full tabular log sheet of individual submissions</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-black text-white uppercase tracking-wider font-bold">
                    <th className="p-4 border-r border-slate-700">Student Name</th>
                    <th className="p-4 border-r border-slate-700">Raw Score</th>
                    <th className="p-4 border-r border-slate-700">Grade %</th>
                    <th className="p-4 border-r border-slate-700">Time Spent</th>
                    <th className="p-4 border-r border-slate-700">Date Completed</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {stats.studentAttempts.map((attempt) => {
                    const isPassed = attempt.percentage >= 50; // default pass check
                    return (
                      <tr key={attempt.id} className="hover:bg-slate-50">
                        <td className="p-4 font-black text-black border-r border-slate-200">{attempt.studentName}</td>
                        <td className="p-4 font-bold text-slate-700 border-r border-slate-200">{attempt.score} / {attempt.totalQuestions}</td>
                        <td className="p-4 border-r border-slate-200">
                          <span className={`px-2.5 py-1.5 border border-black font-black uppercase text-[10px] shadow-neo-sm ${
                            isPassed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                          }`}>
                            {attempt.percentage}%
                          </span>
                        </td>
                        <td className="p-4 font-mono text-slate-700 border-r border-slate-200">{formatTime(attempt.timeTaken)}</td>
                        <td className="p-4 text-slate-500 border-r border-slate-200 font-bold">
                          {new Date(attempt.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedStudentAttempt(attempt);
                              setViewingDetails(true);
                            }}
                            className="px-3 py-2 bg-white hover:bg-slate-50 text-black border-2 border-black font-black uppercase tracking-wider text-[10px] flex items-center gap-1 cursor-pointer shadow-neo-sm ml-auto"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Review Card</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* STUDENT LOG POPUP DRAWER */}
          {viewingDetails && selectedStudentAttempt && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-white border-4 border-black max-w-2xl w-full p-6 shadow-neo-lg flex flex-col max-h-[85vh] overflow-hidden">
                
                {/* Header */}
                <div className="flex items-center justify-between border-b-2 border-black pb-4 mb-4 shrink-0">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Student Diagnostic Log</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">Feedback breakdown for <span className="text-black font-black underline">{selectedStudentAttempt.studentName}</span></p>
                  </div>
                  <button 
                    onClick={() => setViewingDetails(false)}
                    className="px-3 py-1.5 bg-black hover:bg-slate-800 text-white font-black uppercase tracking-wider text-xs cursor-pointer border-2 border-black shadow-neo-sm"
                  >
                    Close
                  </button>
                </div>

                {/* Scrollable breakdown */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-1 font-sans">
                  
                  {/* Attempt KPIs */}
                  <div className="grid grid-cols-3 gap-4 bg-[#fde047] p-4 border-2 border-black shadow-neo">
                    <div className="text-center">
                      <span className="block text-[9px] text-black font-black uppercase tracking-widest mb-0.5">Raw Score</span>
                      <span className="text-xl font-black text-black">{selectedStudentAttempt.score} / {selectedStudentAttempt.totalQuestions}</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] text-black font-black uppercase tracking-widest mb-0.5">Grade %</span>
                      <span className="text-xl font-black text-black">{selectedStudentAttempt.percentage}%</span>
                    </div>
                    <div className="text-center">
                      <span className="block text-[9px] text-black font-black uppercase tracking-widest mb-0.5">Time Spent</span>
                      <span className="text-xl font-black text-black font-mono">{formatTime(selectedStudentAttempt.timeTaken)}</span>
                    </div>
                  </div>

                  {/* AI Learning suggestions */}
                  <div className="p-5 bg-indigo-600 text-white border-2 border-black shadow-neo relative overflow-hidden">
                    <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-sm mb-2">
                      <UsersIcon className="w-4 h-4 text-[#fde047] fill-[#fde047]" />
                      <span>AI Student Study Advice (Google Gemini)</span>
                    </div>
                    <p className="text-xs leading-relaxed text-indigo-50 font-medium">
                      {selectedStudentAttempt.aiSuggestions}
                    </p>
                  </div>

                  {/* Question list with chosen options */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Answer Sheet Review</h4>
                    
                    {Object.entries(selectedStudentAttempt.questionFeedback).map(([qId, rawFb], idx) => {
                      const fb = rawFb as { isCorrect: boolean; studentAnswer: string; correctAnswer: string; explanation: string };
                      return (
                        <div key={qId} className={`p-4 border-2 border-black space-y-3 shadow-neo-sm ${
                          fb.isCorrect ? "bg-emerald-50/20" : "bg-red-50/20"
                        }`}>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-black text-black font-mono bg-slate-100 border border-black px-1.5 py-0.5 shadow-neo-sm">MCQ {idx + 1}</span>
                            <span className={`font-black uppercase tracking-wider text-[10px] border border-black px-1.5 py-0.5 shadow-neo-sm ${fb.isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                              {fb.isCorrect ? "Correct" : "Incorrect"}
                            </span>
                          </div>
                          
                          <div className="text-xs font-bold text-black leading-relaxed">
                            {questionPerformanceData.find(q => q.name === `Q${idx + 1}`)?.questionText || "Question Content"}
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-1 text-[11px] font-sans">
                            <div>
                              <span className="text-slate-400 font-black uppercase text-[9px] tracking-wider block">Student's Choice:</span>
                              <span className={`font-black uppercase tracking-wide text-xs ${fb.isCorrect ? "text-emerald-800" : "text-red-800"}`}>
                                {fb.studentAnswer}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-black uppercase text-[9px] tracking-wider block">Correct Answer:</span>
                              <span className="font-black uppercase tracking-wide text-xs text-emerald-800">{fb.correctAnswer}</span>
                            </div>
                          </div>

                          <div className="text-[10px] text-slate-700 bg-white border border-black p-3 font-semibold leading-relaxed">
                            <strong className="uppercase text-[9px] text-indigo-600 block mb-1">Pedagogical tip:</strong>
                            {fb.explanation}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
