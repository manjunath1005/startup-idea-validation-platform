import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { reportsService, analysisService, startupService } from '../services/api';
import { Lightbulb, Plus, ArrowRight, Loader2, Sparkles, Trash2, Calendar } from 'lucide-react';

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

  const handleDeleteIdea = async (ideaId, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will permanently remove the startup concept and all AI-generated analyses.`)) {
      try {
        await startupService.deleteIdea(ideaId);
        await fetchReports();
      } catch (error) {
        console.error('Failed to delete startup idea', error);
        alert('Failed to delete the startup concept.');
      }
    }
  };

  const totalIdeas = reports.length;

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="text-sm text-slate-500 font-semibold">Loading your workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Welcome & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Startup Workspace</h1>
          <p className="text-slate-550 mt-1 text-sm">
            Review your startup concepts, check viability scores, and launch validation reports.
          </p>
        </div>
        <button
          onClick={() => navigate('/submit')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm cursor-pointer text-sm"
        >
          <Plus size={16} />
          New Validation
        </button>
      </div>

      {/* Startup Ideas Cards Focus */}
      {totalIdeas === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center flex flex-col items-center max-w-xl mx-auto mt-12 border border-slate-200">
          <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
            <Lightbulb size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No startup ideas yet</h3>
          <p className="text-slate-500 max-w-sm mb-6 text-xs leading-relaxed font-medium">
            Get started by entering details about the problem, solution, and target market of your business concept.
          </p>
          <button
            onClick={() => navigate('/submit')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-sm"
          >
            Submit Startup Concept
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report, index) => {
            const { idea, scores } = report;
            const isAnalyzing = triggeringId === idea.id;
            
            // Format created date
            const createdDate = new Date(idea.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Subtle color badge based on viability
            let scoreBadge = null;
            if (scores) {
              const val = scores.viability_score;
              if (val >= 80) {
                scoreBadge = (
                  <span className="text-[11px] bg-emerald-50/80 border border-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    {val}% Viability
                  </span>
                );
              } else if (val >= 60) {
                scoreBadge = (
                  <span className="text-[11px] bg-amber-50/80 border border-amber-100 text-amber-700 font-bold px-2 py-0.5 rounded-full">
                    {val}% Viability
                  </span>
                );
              } else {
                scoreBadge = (
                  <span className="text-[11px] bg-rose-50/80 border border-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-full">
                    {val}% Viability
                  </span>
                );
              }
            } else {
              scoreBadge = (
                <span className="text-[11px] bg-slate-50 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                  Not Evaluated
                </span>
              );
            }

            return (
              <div 
                key={idea.id} 
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 hover:shadow-sm transition-all duration-200 min-h-[220px]"
              >
                <div>
                  {/* Category & Viability Badge */}
                  <div className="flex justify-between items-center gap-2 mb-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {idea.industry}
                    </span>
                    {scoreBadge}
                  </div>

                  {/* Startup Name */}
                  <h3 className="text-base font-bold text-slate-900 tracking-tight line-clamp-1 mb-2">
                    {idea.name}
                  </h3>

                  {/* Description / Problem Statement */}
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4 font-medium">
                    {idea.problem_statement}
                  </p>

                  {/* Version Stats Grid */}
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-y-2.5 gap-x-4 text-[11px] text-slate-500 font-medium mb-4">
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Latest Version</span>
                      <span className="text-slate-800 font-extrabold text-xs">V{idea.version}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Total Versions</span>
                      <span className="text-slate-800 font-extrabold text-xs">{report.versions ? report.versions.length : 1}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Last Updated</span>
                      <span className="text-slate-800 font-extrabold text-xs">
                        {new Date(idea.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-bold">Latest Viability</span>
                      <span className={`font-extrabold text-xs ${
                        scores 
                          ? scores.viability_score >= 80 ? 'text-emerald-600'
                            : scores.viability_score >= 60 ? 'text-amber-600'
                            : 'text-rose-600'
                          : 'text-slate-400 font-semibold'
                      }`}>
                        {scores ? `${scores.viability_score}%` : 'Not Evaluated'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-auto">
                  {/* Date Created & Region/Model info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 pt-3 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400" />
                      {createdDate}
                    </span>
                    <span>
                      {idea.business_type} • {idea.country_region}
                    </span>
                  </div>

                  {/* Quick Actions bar */}
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => handleDeleteIdea(idea.id, idea.name)}
                      className="text-slate-450 hover:text-red-650 transition-colors flex items-center gap-1 text-xs font-semibold py-1 cursor-pointer"
                      title="Delete Startup Idea"
                    >
                      <Trash2 size={13} />
                      Delete
                    </button>

                    <div className="flex items-center gap-2">
                      {!scores ? (
                        <button
                          onClick={() => handleRunAllAnalysis(idea.id)}
                          disabled={isAnalyzing}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="animate-spin" size={12} />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              Run AI Engine
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/report/${idea.id}`)}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          View Reports
                          <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
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
