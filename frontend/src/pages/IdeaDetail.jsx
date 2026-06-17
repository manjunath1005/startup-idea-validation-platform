import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsService, analysisService } from '../services/api';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import {
  ArrowLeft, Download, RefreshCw, BarChart2, Shield, Eye, DollarSign,
  Briefcase, HeartHandshake, Loader2, Check, X, ChevronLeft, ChevronRight, Award
} from 'lucide-react';

const IdeaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Pitch deck carousel state
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const fetchReport = async () => {
    try {
      const response = await reportsService.getReport(id);
      setReport(response);
    } catch (error) {
      console.error('Failed to fetch report details', error);
      alert('Report could not be loaded.');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [id]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      await analysisService.runAll(id);
      await fetchReport();
    } catch (error) {
      console.error('Recalculation failed', error);
      alert('Failed to re-run AI evaluation.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!report?.idea?.name) return;
    setDownloading(true);
    try {
      await reportsService.downloadPdf(id, report.idea.name);
    } catch (error) {
      console.error('PDF download failed', error);
      alert('Failed to download report PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 pb-12 animate-fade-in">
        {/* Skeleton Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/30 p-6 rounded-2xl border border-slate-800/40 backdrop-blur-md">
          <div className="space-y-2.5 w-full max-w-md">
            <div className="w-24 h-4 bg-slate-850 rounded animate-pulse"></div>
            <div className="w-48 h-8 bg-slate-800 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-slate-850 rounded-full animate-pulse"></div>
              <div className="w-20 h-5 bg-slate-850 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="w-36 h-10 bg-slate-800 rounded-xl animate-pulse"></div>
            <div className="w-36 h-10 bg-slate-800 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton Tabs */}
        <div className="flex gap-2 border-b border-slate-800/60 pb-1 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-28 h-10 bg-slate-850 rounded-lg shrink-0 animate-pulse"></div>
          ))}
        </div>

        {/* Skeleton Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6 rounded-2xl h-80 flex flex-col justify-between">
              <div className="w-36 h-5 bg-slate-850 rounded animate-pulse"></div>
              <div className="w-48 h-48 rounded-full bg-slate-800/40 mx-auto flex items-center justify-center animate-pulse">
                <Loader2 className="animate-spin text-sky-500/40" size={32} />
              </div>
              <div className="w-full h-4 bg-slate-850 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-800 animate-pulse shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="w-32 h-5 bg-slate-850 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-slate-850 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-slate-850 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="w-28 h-5 bg-slate-850 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-850 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-slate-850 rounded animate-pulse"></div>
                <div className="w-5/6 h-4 bg-slate-850 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { idea, scores, swot, competitors, revenue, canvas, pitch_deck } = report;

  // Format Recharts data
  const chartData = [
    { subject: 'Viability', value: scores?.viability_score || 0 },
    { subject: 'Market Opportunity', value: scores?.market_opportunity_score || 0 },
    { subject: 'Competition Safety', value: scores?.competition_score || 0 },
    { subject: 'Revenue Potential', value: scores?.revenue_potential_score || 0 },
    { subject: 'Risk safety', value: scores?.risk_assessment_score || 0 },
  ];

  const barChartData = [
    { name: 'Viability', score: scores?.viability_score || 0, fill: '#0ea5e9' },
    { name: 'Market', score: scores?.market_opportunity_score || 0, fill: '#6366f1' },
    { name: 'Competition', score: scores?.competition_score || 0, fill: '#14b8a6' },
    { name: 'Revenue', score: scores?.revenue_potential_score || 0, fill: '#f59e0b' },
    { name: 'Risk Safety', score: scores?.risk_assessment_score || 0, fill: '#f43f5e' },
  ];

  const tabs = [
    { id: 'overview', name: 'Viability Overview', icon: BarChart2 },
    { id: 'swot', name: 'SWOT Analysis', icon: Shield },
    { id: 'competitors', name: 'Competitor Intelligence', icon: Eye },
    { id: 'revenue', name: 'Monetization Strategy', icon: DollarSign },
    { id: 'canvas', name: 'Business Canvas', icon: Briefcase },
    { id: 'pitchdeck', name: 'Pitch Deck', icon: Award },
    { id: 'mentor', name: 'Mentor Advice', icon: HeartHandshake },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Detail Header / Control bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/30 p-6 rounded-2xl border border-slate-800/40 backdrop-blur-md">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2 font-medium"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-white tracking-wide">{idea.name}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
            <span className="bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              {idea.industry}
            </span>
            <span>•</span>
            <span>{idea.business_type}</span>
            <span>•</span>
            <span>{idea.country_region}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {recalculating ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                Run AI Re-Evaluation
              </>
            )}
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-sky-500/10 disabled:opacity-50 disabled:pointer-events-none"
          >
            {downloading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Generating PDF...
              </>
            ) : (
              <>
                <Download size={16} />
                Download PDF Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex overflow-x-auto pb-1 border-b border-slate-800/60 gap-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                isActive
                  ? 'border-sky-500 text-white bg-sky-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-sky-400' : 'text-slate-400'} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-6 animate-fade-in-up" key={activeTab}>
        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Scores & charts */}
            <div className="lg:col-span-7 space-y-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Viability Scores Radar</h3>
                
                {scores ? (
                  <div className="h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" stroke="#94a3b8" fontSize={11} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                        <Radar
                          name="Evaluation"
                          dataKey="value"
                          stroke="#0ea5e9"
                          fill="#0ea5e9"
                          fillOpacity={0.25}
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-500 text-sm">
                    AI Viability Score analysis not run. Trigger evaluation above.
                  </div>
                )}
              </div>

              {/* Bar chart fallback / secondary visual */}
              {scores && (
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Metric Breakdown</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical">
                        <XAxis type="number" domain={[0, 100]} stroke="#475569" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={90} />
                        <Tooltip
                          contentStyle={{ background: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Bar 
                          dataKey="score" 
                          radius={[0, 4, 4, 0]} 
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Text Analysis */}
            <div className="lg:col-span-5 space-y-6">
              {/* Overall Score Circle Card */}
              {scores && (
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-6 bg-gradient-to-br from-slate-900 to-brand-950">
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-extrabold shrink-0 shadow-lg ${
                    scores.viability_score >= 80
                      ? 'border-emerald-500 text-emerald-400 shadow-emerald-500/10'
                      : scores.viability_score >= 60
                      ? 'border-yellow-500 text-yellow-400 shadow-yellow-500/10'
                      : 'border-rose-500 text-rose-400 shadow-rose-500/10'
                  }`}>
                    {scores.viability_score}%
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Overall Viability Score</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      This score reflects cumulative ratings for demand severity, market scope, revenue dynamics, and barrier execution.
                    </p>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Executive Verdict</h3>
                {scores ? (
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    {scores.explanation}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">AI Summary not available. Click re-evaluation to load.</p>
                )}
              </div>

              {/* Suggestions list */}
              {scores && (
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Priority Improvements</h3>
                  <ul className="space-y-3">
                    {scores.improvement_suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 text-xs shrink-0 mt-0.5 font-bold">
                          {index + 1}
                        </span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: SWOT */}
        {activeTab === 'swot' && (
          <div className="space-y-6">
            {swot ? (
              <>
                {/* 2x2 SWOT grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="swot-s p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <h4 className="font-extrabold text-emerald-400 uppercase tracking-wider text-sm">Strengths</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.strengths.map((str, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                          <Check size={14} className="text-emerald-400 mt-1 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="swot-w p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                      <h4 className="font-extrabold text-rose-400 uppercase tracking-wider text-sm">Weaknesses</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.weaknesses.map((weak, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                          <X size={14} className="text-rose-400 mt-1 shrink-0" />
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="swot-o p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                      <h4 className="font-extrabold text-blue-400 uppercase tracking-wider text-sm">Opportunities</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.opportunities.map((opp, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                          <span className="text-blue-400 font-bold shrink-0 mt-0.5">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="swot-t p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      <h4 className="font-extrabold text-amber-400 uppercase tracking-wider text-sm">Threats</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.threats.map((thr, i) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2 leading-relaxed">
                          <span className="text-amber-400 font-bold shrink-0 mt-0.5">⚠️</span>
                          <span>{thr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">SWOT Strategic Action Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {swot.recommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl text-sm text-slate-300 leading-relaxed">
                        <span className="text-sky-400 font-bold block mb-1 text-xs uppercase tracking-wider">Strategic Action {i+1}</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                SWOT Analysis not generated yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Competitor Intelligence */}
        {activeTab === 'competitors' && (
          <div className="space-y-6">
            {competitors ? (
              <>
                {/* Feature Comparison Table */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
                  <div className="p-6 border-b border-slate-800/60">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Feature Comparison Matrix</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-900/60 text-slate-300 border-b border-slate-800">
                          <th className="p-4 font-semibold">Competitor Name</th>
                          <th className="p-4 font-semibold">Market Position</th>
                          {competitors.competitors.length > 0 &&
                            Object.keys(competitors.competitors[0].comparison || {}).map((f) => (
                              <th key={f} className="p-4 font-semibold text-center">{f}</th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {/* Render client platform first */}
                        <tr className="bg-sky-500/5 hover:bg-sky-500/10 transition-colors">
                          <td className="p-4 font-bold text-sky-400">
                            {idea.name} <span className="text-[10px] bg-sky-500/15 px-2 py-0.5 rounded-full ml-2 text-sky-300 uppercase tracking-widest font-semibold">You</span>
                          </td>
                          <td className="p-4 text-slate-300 font-medium">Target disruptor</td>
                          {competitors.competitors.length > 0 &&
                            Object.keys(competitors.competitors[0].comparison || {}).map((f) => (
                              <td key={f} className="p-4 text-center">
                                <Check size={18} className="text-emerald-400 mx-auto" />
                              </td>
                            ))}
                        </tr>

                        {competitors.competitors.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                            <td className="p-4 font-bold text-white">
                              {comp.name}
                              {comp.website && comp.website !== 'N/A' && (
                                <span className="block text-[10px] text-slate-500 font-light mt-0.5">{comp.website}</span>
                              )}
                            </td>
                            <td className="p-4 text-slate-400 text-xs">
                              {comp.category} • <span className="text-slate-300 font-medium">{comp.market_position}</span>
                            </td>
                            {Object.entries(comp.comparison || {}).map(([feature, val]) => (
                              <td key={feature} className="p-4 text-center">
                                {val ? (
                                  <Check size={18} className="text-emerald-500/80 mx-auto" />
                                ) : (
                                  <X size={18} className="text-rose-500/60 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gaps Analysis */}
                  <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Market Gap Analysis</h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-light">
                      {competitors.market_gap_analysis}
                    </p>
                  </div>

                  {/* Differentiation Suggestions */}
                  <div className="glass-panel p-6 rounded-2xl">
                    <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">How to Differentiate</h3>
                    <ul className="space-y-3">
                      {competitors.differentiation_suggestions.map((diff, index) => (
                        <li key={index} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 text-xs shrink-0 mt-0.5 font-bold">
                            {index + 1}
                          </span>
                          <span>{diff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                Competitor Intelligence report not generated yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Revenue Model */}
        {activeTab === 'revenue' && (
          <div className="space-y-6">
            {revenue ? (
              <>
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between bg-gradient-to-r from-slate-900 to-brand-950">
                  <div>
                    <h4 className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Recommended Business Model</h4>
                    <span className="text-2xl font-black text-white mt-1 block">{revenue.recommended_model}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                    <DollarSign size={24} />
                  </div>
                </div>

                {/* Pricing Tiers cards */}
                <div>
                  <h3 className="text-base font-bold text-white mb-6 uppercase tracking-wider">Suggested Pricing Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {revenue.pricing_suggestions.map((tier, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between h-full relative overflow-hidden">
                        {idx === 1 && (
                          <div className="absolute top-0 right-0 bg-sky-500 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                            Recommended
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-2">{tier.tier_name}</span>
                          <div className="flex items-baseline gap-1.5 mb-6">
                            <span className="text-3xl font-extrabold text-white">{tier.price}</span>
                            <span className="text-xs text-slate-500 font-medium">{tier.frequency}</span>
                          </div>
                          
                          <ul className="space-y-3 mb-8">
                            {tier.features.map((f, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                                <Check size={12} className="text-sky-400 mt-0.5 shrink-0" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rationale */}
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-base font-bold text-white mb-4 uppercase tracking-wider">Monetization & Pricing Rationale</h3>
                  <p className="text-sm text-slate-300 leading-relaxed font-light">
                    {revenue.revenue_rationale}
                  </p>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                Revenue strategy report not generated yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Business Canvas */}
        {activeTab === 'canvas' && (
          <div className="space-y-6">
            {canvas ? (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Column 1: Key Partners */}
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl min-h-[220px] flex flex-col">
                  <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Key Partners</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1 font-light">
                    {canvas.key_partners}
                  </p>
                </div>

                {/* Column 2: Key Activities & Resources */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px]">
                    <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Key Activities</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1 font-light">
                      {canvas.key_activities}
                    </p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px]">
                    <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Key Resources</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1 font-light">
                      {canvas.key_resources}
                    </p>
                  </div>
                </div>

                {/* Column 3: Value Propositions */}
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl min-h-[220px] flex flex-col bg-sky-500/5 border-sky-500/20">
                  <h4 className="text-xs font-extrabold text-sky-300 uppercase tracking-wider mb-3">Value Propositions</h4>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line flex-1 font-medium">
                    {canvas.value_proposition}
                  </p>
                </div>

                {/* Column 4: Relationships & Channels */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px]">
                    <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Customer Relationships</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1 font-light">
                      {canvas.customer_relationships}
                    </p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px]">
                    <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Channels</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1 font-light">
                      {canvas.channels}
                    </p>
                  </div>
                </div>

                {/* Column 5: Customer Segments */}
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl min-h-[220px] flex flex-col">
                  <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Customer Segments</h4>
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line flex-1 font-light">
                    {canvas.customer_segments}
                  </p>
                </div>

                {/* Cost & Revenue Bottom row */}
                <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 rounded-2xl min-h-[120px]">
                    <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Cost Structure</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-light">
                      {canvas.cost_structure}
                    </p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl min-h-[120px]">
                    <h4 className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-3">Revenue Streams</h4>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-light">
                      {canvas.revenue_streams}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                Business Model Canvas has not been generated yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Pitch Deck */}
        {activeTab === 'pitchdeck' && (
          <div className="space-y-6">
            {pitch_deck && pitch_deck.slides?.length > 0 ? (
              <div className="max-w-4xl mx-auto flex flex-col items-stretch">
                {/* Actual slide display card */}
                <div 
                  key={currentSlideIndex} 
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-10 min-h-[380px] flex flex-col justify-between shadow-2xl relative animate-scale-in"
                >
                  <div className="absolute top-4 right-6 text-xs text-slate-500 font-semibold">
                    SLIDE {pitch_deck.slides[currentSlideIndex].slide_number} OF {pitch_deck.slides.length}
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-6 pr-10">
                      {pitch_deck.slides[currentSlideIndex].title}
                    </h3>
                    <ul className="space-y-4">
                      {pitch_deck.slides[currentSlideIndex].bullets.map((b, idx) => (
                        <li key={idx} className="text-sm sm:text-base text-slate-300 flex items-start gap-3 leading-relaxed font-light">
                          <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0 mt-2"></span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Design layout tip */}
                  <div className="border-t border-slate-800/80 pt-6 mt-8">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-widest block mb-1">Visual Layout Suggestion</span>
                    <p className="text-xs text-slate-400 italic">
                      {pitch_deck.slides[currentSlideIndex].visual_suggestion}
                    </p>
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex justify-between items-center mt-6">
                  <button
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2 px-4 rounded-xl flex items-center gap-1 text-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft size={16} />
                    Previous Slide
                  </button>

                  <div className="flex gap-1.5 overflow-x-auto px-4 max-w-[180px] sm:max-w-none">
                    {pitch_deck.slides.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlideIndex(i)}
                        className={`w-2 h-2 rounded-full transition-all shrink-0 ${
                          currentSlideIndex === i ? 'bg-sky-500 w-4' : 'bg-slate-700 hover:bg-slate-600'
                        }`}
                      ></button>
                    ))}
                  </div>

                  <button
                    disabled={currentSlideIndex === pitch_deck.slides.length - 1}
                    onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold py-2 px-4 rounded-xl flex items-center gap-1 text-sm disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    Next Slide
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                Pitch Deck slides have not been generated yet.
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Mentor Advice */}
        {activeTab === 'mentor' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {scores ? (
              <>
                {/* Customer Acquisition Ideas */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
                        <Award size={20} />
                      </div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wider">Customer Acquisition Tactics</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="text-sm text-slate-300 leading-relaxed">
                        <span className="text-teal-400 font-bold block mb-1 text-xs uppercase">Leverage Content Loops</span>
                        Create data-driven templates or calculators related to {idea.industry} to gather leads organically.
                      </li>
                      <li className="text-sm text-slate-300 leading-relaxed">
                        <span className="text-teal-400 font-bold block mb-1 text-xs uppercase">Niche Community Outreach</span>
                        Engage directly in specific forums, Slack networks, or subreddits where {idea.target_audience} congregates.
                      </li>
                      <li className="text-sm text-slate-300 leading-relaxed">
                        <span className="text-teal-400 font-bold block mb-1 text-xs uppercase">Targeted Partnerships</span>
                        Integrate or partner with non-competing softwares currently used by your customer segments to gain instant visibility.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Go-To-Market Plan */}
                <div className="glass-panel p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-base font-bold text-white uppercase tracking-wider">Launch & GTM Blueprint</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="border-l-2 border-indigo-500 pl-4 space-y-1">
                      <span className="text-xs font-semibold text-slate-400 block uppercase">Phase 1: Private Alpha (Weeks 1-4)</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Onboard 10-15 design partners from {idea.target_audience} on a manual, high-touch basis to iron out onboarding friction.
                      </p>
                    </div>

                    <div className="border-l-2 border-sky-500 pl-4 space-y-1">
                      <span className="text-xs font-semibold text-slate-400 block uppercase">Phase 2: Beta Launch (Weeks 5-8)</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Introduce self-serve subscription pricing, list on directories like Product Hunt and BetaList, and launch seed email loops.
                      </p>
                    </div>

                    <div className="border-l-2 border-teal-500 pl-4 space-y-1">
                      <span className="text-xs font-semibold text-slate-400 block uppercase">Phase 3: Scale Engine (Weeks 9+)</span>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Activate referral programs and transition from organic validation to paid search ads focused on conversion funnels.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-500 text-sm">
                Mentor advice is compile-linked with AI score evaluation. Generate evaluation to view.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IdeaDetail;
