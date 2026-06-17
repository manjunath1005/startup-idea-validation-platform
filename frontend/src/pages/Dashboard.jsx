import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { reportsService, analysisService } from '../services/api';
import { Lightbulb, Plus, TrendingUp, Cpu, Award, DollarSign, ArrowRight, Loader2, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState(null);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports');
      setReports(response.data);
    } catch (error) {
      console.error('Failed to load startup reports', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRunAllAnalysis = async (ideaId) => {
    setTriggeringId(ideaId);
    try {
      await analysisService.runAll(ideaId);
      await fetchReports();
    } catch (error) {
      console.error('Failed to trigger AI engine', error);
      alert('Failed to invoke Gemini AI validation. Please verify your GEMINI_API_KEY.');
    } finally {
      setTriggeringId(null);
    }
  };

  // Calculate high-level stats
  const totalIdeas = reports.length;
  const analyzedIdeas = reports.filter((r) => r.scores).length;
  
  const averageViability = analyzedIdeas > 0
    ? Math.round(reports.reduce((acc, curr) => acc + (curr.scores?.viability_score || 0), 0) / analyzedIdeas)
    : 0;

  const highestScore = analyzedIdeas > 0
    ? Math.max(...reports.map((r) => r.scores?.viability_score || 0))
    : 0;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-sky-400" size={36} />
          <span className="text-sm text-slate-400">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Startup Workspace</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Track, analyze, and optimize your business ideas in one central control panel.
          </p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold px-5 py-3 rounded-xl transition-all duration-300 flex items-center gap-2 hover:shadow-lg hover:shadow-sky-500/20"
        >
          <Plus size={18} />
          Validate New Idea
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 animate-fade-in-up">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
            <Lightbulb size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Total Ideas</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{totalIdeas}</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 animate-fade-in-up delay-75">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Cpu size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Analyzed by AI</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{analyzedIdeas}</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 animate-fade-in-up delay-150">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
            <Award size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Avg Viability</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{averageViability}%</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl flex items-center gap-4 animate-fade-in-up delay-200">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Highest Score</span>
            <span className="text-2xl font-bold text-white block mt-0.5">{highestScore}%</span>
          </div>
        </div>
      </div>

      {/* Startup ideas list grid */}
      {totalIdeas === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center flex flex-col items-center max-w-2xl mx-auto mt-8">
          <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center text-sky-400 mb-6">
            <Lightbulb size={36} className="animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No startup ideas submitted yet</h3>
          <p className="text-slate-400 max-w-sm mb-8 text-sm">
            Launch your validation workflow by submitting details about the problem, solution, and target market.
          </p>
          <button
            onClick={() => navigate('/submit')}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300"
          >
            Submit Startup Concept
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.map((report, index) => {
            const { idea, scores } = report;
            const isAnalyzing = triggeringId === idea.id;
            
            // Staggered entry animation delays
            const delayClass = index === 0 ? '' : index === 1 ? 'delay-100' : index === 2 ? 'delay-200' : 'delay-300';
            
            // Colorized glow boundaries based on assessment scores
            const hoverBorderGlow = !scores 
              ? 'hover:border-sky-500/30 hover:shadow-[0_0_20px_rgba(14,165,233,0.1)]' 
              : scores.viability_score >= 80 
              ? 'hover:border-emerald-500/40 hover:shadow-[0_0_24px_rgba(16,185,129,0.18)]' 
              : scores.viability_score >= 60 
              ? 'hover:border-yellow-500/40 hover:shadow-[0_0_24px_rgba(245,158,11,0.18)]' 
              : 'hover:border-rose-500/40 hover:shadow-[0_0_24px_rgba(244,63,94,0.18)]';

            return (
              <div 
                key={idea.id} 
                className={`glass-card p-6 rounded-2xl flex flex-col justify-between h-full relative overflow-hidden animate-fade-in-up hover:-translate-y-1.5 transition-all duration-300 ${delayClass} ${hoverBorderGlow}`}
              >
                {/* Visual grid decor */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>

                <div>
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white tracking-wide truncate max-w-[280px]">
                        {idea.name}
                      </h3>
                      <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
                        {idea.industry}
                      </span>
                    </div>

                    {scores ? (
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-base font-extrabold ${
                          scores.viability_score >= 80
                            ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                            : scores.viability_score >= 60
                            ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
                            : 'border-rose-500 text-rose-400 bg-rose-500/5'
                        }`}>
                          {scores.viability_score}%
                        </div>
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Viability</span>
                      </div>
                    ) : (
                      <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0">
                        Not Evaluated
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-3 mb-6">
                    {idea.problem_statement}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-slate-800/40 mt-auto">
                  <div className="text-xs text-slate-500">
                    Scope: <span className="text-slate-300 font-medium">{idea.country_region}</span>
                    <span className="mx-2">•</span>
                    Model: <span className="text-slate-300 font-medium">{idea.business_type}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!scores ? (
                      <button
                        onClick={() => handleRunAllAnalysis(idea.id)}
                        disabled={isAnalyzing}
                        className="bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles size={14} />
                            Run AI Engine
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/report/${idea.id}`)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-all"
                      >
                        Reports Dashboard
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
