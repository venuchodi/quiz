import React, { useState, useEffect } from "react";
import { 
  GraduationCap, Users, ShieldAlert, Sparkles, BookOpen, 
  HelpCircle, CheckCircle, Flame, ServerCrash
} from "lucide-react";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentPortal from "./components/StudentPortal";
import AnalyticsPanel from "./components/AnalyticsPanel";

export default function App() {
  
  // Roles: 'teacher' | 'student' | 'admin'
  const [currentRole, setCurrentRole] = useState<"teacher" | "student" | "admin">("teacher");
  
  // App routing/view helpers
  const [selectedQuizForAnalytics, setSelectedQuizForAnalytics] = useState<string | null>(null);
  const [studentJoinCode, setStudentJoinCode] = useState<string>("");

  // Simulated System State for Admin Control panel
  const [containerStats, setContainerStats] = useState({
    serverTime: new Date().toLocaleTimeString(),
    latency: "24ms",
    dbStatus: "Healthy (Persistent JSON Engine)",
    uptime: "2h 45m"
  });

  // URL query prefill handler
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("joinCode") || params.get("code");
    if (code) {
      setStudentJoinCode(code.toUpperCase().trim());
      setCurrentRole("student");
    }

    // Refresh server stats for admin simulated panel
    const timer = setInterval(() => {
      setContainerStats(prev => ({
        ...prev,
        serverTime: new Date().toLocaleTimeString()
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827] font-sans flex flex-col justify-between" id="app-root-shell">
      
      {/* GLOBAL BRAND HEADER & ROLE ROUTER */}
      <header className="bg-white border-b-2 border-black sticky top-0 z-40" id="global-nav-header">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Branding */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            setSelectedQuizForAnalytics(null);
            setStudentJoinCode("");
            setCurrentRole("teacher");
          }}>
            <div className="w-12 h-12 bg-indigo-600 text-white border-2 border-black flex items-center justify-center shadow-neo-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black tracking-tighter uppercase italic leading-none flex items-center gap-1">
                <span>EduQuiz AI</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest mt-1">ADVANCED ASSESSMENT ENGINE v2.4</p>
            </div>
          </div>

          {/* Center Segment Control Switcher */}
          <div className="bg-white p-1 flex items-center gap-1 border-2 border-black shadow-neo-sm">
            <button
              id="role-teacher-tab"
              onClick={() => {
                setSelectedQuizForAnalytics(null);
                setCurrentRole("teacher");
              }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                currentRole === "teacher" 
                  ? "bg-black text-white" 
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Teacher Workspace</span>
            </button>

            <button
              id="role-student-tab"
              onClick={() => {
                setCurrentRole("student");
              }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                currentRole === "student" 
                  ? "bg-emerald-600 text-white border-l-0 border-black" 
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Student Exam Room</span>
            </button>

            <button
              id="role-admin-tab"
              onClick={() => {
                setCurrentRole("admin");
              }}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all ${
                currentRole === "admin" 
                  ? "bg-red-600 text-white" 
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Admin Hub</span>
            </button>
          </div>

          {/* Quick Active Indicators */}
          <div className="hidden md:flex items-center gap-2 border-2 border-black px-3 py-1 bg-indigo-50 font-mono text-xs font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="uppercase tracking-wide text-black">ENGINE OPERATIONAL</span>
          </div>

        </div>
      </header>

      {/* CORE ACTIVE WORKSPACE CONTENT SWITCHER */}
      <main className="flex-1">
        
        {/* 1. TEACHER VIEW */}
        {currentRole === "teacher" && (
          <>
            {selectedQuizForAnalytics ? (
              <AnalyticsPanel 
                quizCode={selectedQuizForAnalytics} 
                onBackToDashboard={() => setSelectedQuizForAnalytics(null)} 
              />
            ) : (
              <TeacherDashboard 
                onSelectQuizForAnalytics={(code) => setSelectedQuizForAnalytics(code)}
                onSwitchToStudent={(code) => {
                  setStudentJoinCode(code);
                  setCurrentRole("student");
                }}
              />
            )}
          </>
        )}

        {/* 2. STUDENT VIEW */}
        {currentRole === "student" && (
          <StudentPortal 
            initialJoinCode={studentJoinCode}
            onBackToDashboard={() => {
              setStudentJoinCode("");
              setCurrentRole("teacher");
            }}
          />
        )}

        {/* 3. SYSTEMS ADMIN CONTROL CONSOLE */}
        {currentRole === "admin" && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
            <div className="bg-rose-50 border-4 border-black p-6 md:p-8 text-black shadow-neo-lg">
              <h2 className="text-4xl font-black uppercase tracking-tighter italic flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-red-600" />
                <span>Super Administrator System Terminal</span>
              </h2>
              <p className="text-slate-700 text-xs font-semibold tracking-widest uppercase mt-2">
                Global telemetry and system diagnostics for container state auditing, server configurations, and database purge tools.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Telemetry Status Card */}
              <div className="bg-white border-2 border-black p-6 shadow-neo space-y-6">
                <h3 className="text-xl font-black uppercase italic tracking-tight border-b border-black pb-2">Active Server Telemetry</h3>
                
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Node Environment</span>
                    <span className="font-mono text-black font-bold bg-slate-100 border border-black px-2 py-1">Production (Cloud Run)</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Inbound Reverse Proxy</span>
                    <span className="font-mono text-black font-bold bg-slate-100 border border-black px-2 py-1">Port 3000 Ingress</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">In-Memory Database Engine</span>
                    <span className="font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-500 px-2 py-1">{containerStats.dbStatus}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Current Server Time</span>
                    <span className="font-mono text-black font-bold border-2 border-black bg-yellow-50 px-2 py-1">{containerStats.serverTime}</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Tools */}
              <div className="bg-white border-2 border-black p-6 shadow-neo space-y-6">
                <h3 className="text-xl font-black uppercase italic tracking-tight border-b border-black pb-2">Administrative Actions</h3>
                
                <div className="space-y-4 text-xs">
                  <p className="text-slate-600 font-medium leading-relaxed">
                    Perform system-wide maintenance, database optimization, or simulated stress-testing of classroom assessment triggers.
                  </p>
                  
                  <div className="pt-2 space-y-3">
                    <button 
                      onClick={() => {
                        alert("Database indices synchronized and mock datasets refreshed safely.");
                      }}
                      className="w-full py-3 bg-white hover:bg-slate-50 text-black font-black uppercase tracking-wider border-2 border-black cursor-pointer shadow-neo-sm transition-all"
                    >
                      Audit Data Integrity
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm("WARNING: Are you sure you want to trigger database compression? Active attempts will remain intact.")) {
                          alert("System garbage collection triggered. Compacted memory heap size: 14.8 MB.");
                        }
                      }}
                      className="w-full py-3 bg-red-100 hover:bg-red-200 text-red-800 font-black uppercase tracking-wider border-2 border-black cursor-pointer shadow-neo-sm transition-all"
                    >
                      Trigger Garbage Collection
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-black text-white border-t-2 border-black py-8" id="global-application-footer">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] font-bold tracking-widest uppercase">
          <div>
            &copy; 2026 EduQuiz AI Assessment Platform. Powered by Google Gemini 3.5 Flash.
          </div>
          <div className="flex gap-6">
            <a href="#terms" onClick={(e) => { e.preventDefault(); alert("EduQuiz AI complies with standard security rules and WCAG 2.2 accessibility parameters."); }} className="hover:text-indigo-400 transition-colors">Privacy & WCAG Compliance</a>
            <span>•</span>
            <span className="text-indigo-400">Platform Version: 2.4.0 (Bold Typography)</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
