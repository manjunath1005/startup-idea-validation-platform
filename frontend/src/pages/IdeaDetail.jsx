import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { reportsService, analysisService } from '../services/api';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from 'recharts';
import {
  ArrowLeft, Download, RefreshCw, BarChart2, Shield, Eye, DollarSign,
  Briefcase, HeartHandshake, Loader2, Check, X, ChevronLeft, ChevronRight, Award,
  GitCompare, History, TrendingUp, TrendingDown
} from 'lucide-react';

const formatUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) {
    return url;
  }
  return `https://${url}`;
};

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

  // Compare tab state
  const [compareVerAId, setCompareVerAId] = useState('');
  const [compareVerBId, setCompareVerBId] = useState('');

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

  useEffect(() => {
    if (report?.versions && report.versions.length > 1) {
      const sorted = [...report.versions].sort((a, b) => a.version - b.version);
      const currentIndex = sorted.findIndex(v => v.id === id);
      
      if (currentIndex > 0) {
        setCompareVerAId(sorted[currentIndex - 1].id);
        setCompareVerBId(sorted[currentIndex].id);
      } else {
        setCompareVerAId(sorted[0].id);
        setCompareVerBId(sorted[sorted.length - 1].id);
      }
    }
  }, [report, id]);

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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="space-y-2.5 w-full max-w-md">
            <div className="w-24 h-4 bg-slate-100 rounded animate-pulse"></div>
            <div className="w-48 h-8 bg-slate-200 rounded animate-pulse"></div>
            <div className="flex gap-2">
              <div className="w-16 h-5 bg-slate-100 rounded-full animate-pulse"></div>
              <div className="w-20 h-5 bg-slate-100 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-3 w-full lg:w-auto">
            <div className="w-36 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
            <div className="w-36 h-10 bg-slate-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Skeleton Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-28 h-10 bg-slate-100 rounded-lg shrink-0 animate-pulse"></div>
          ))}
        </div>

        {/* Skeleton Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="glass-panel p-6 rounded-2xl h-80 flex flex-col justify-between border border-slate-200">
              <div className="w-36 h-5 bg-slate-100 rounded animate-pulse"></div>
              <div className="w-48 h-48 rounded-full bg-slate-100 mx-auto flex items-center justify-center animate-pulse">
                <Loader2 className="animate-spin text-blue-650/40" size={32} />
              </div>
              <div className="w-full h-4 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel p-6 rounded-2xl flex items-center gap-6 border border-slate-200">
              <div className="w-20 h-20 rounded-full bg-slate-100 animate-pulse shrink-0"></div>
              <div className="space-y-2 w-full">
                <div className="w-32 h-5 bg-slate-100 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-slate-100 rounded animate-pulse"></div>
                <div className="w-3/4 h-4 bg-slate-100 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-200">
              <div className="w-28 h-5 bg-slate-100 rounded animate-pulse"></div>
              <div className="space-y-2">
                <div className="w-full h-4 bg-slate-100 rounded animate-pulse"></div>
                <div className="w-full h-4 bg-slate-100 rounded animate-pulse"></div>
                <div className="w-5/6 h-4 bg-slate-100 rounded animate-pulse"></div>
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
    { name: 'Viability', score: scores?.viability_score || 0, fill: '#2563EB' },
    { name: 'Market', score: scores?.market_opportunity_score || 0, fill: '#0EA5E9' },
    { name: 'Competition', score: scores?.competition_score || 0, fill: '#10B981' },
    { name: 'Revenue', score: scores?.revenue_potential_score || 0, fill: '#F59E0B' },
    { name: 'Risk Safety', score: scores?.risk_assessment_score || 0, fill: '#EF4444' },
  ];

  const tabs = [
    { id: 'overview', name: 'Viability Overview', icon: BarChart2 },
    { id: 'swot', name: 'SWOT Analysis', icon: Shield },
    { id: 'competitors', name: 'Competitor Intelligence', icon: Eye },
    { id: 'revenue', name: 'Monetization Strategy', icon: DollarSign },
    { id: 'canvas', name: 'Business Canvas', icon: Briefcase },
    { id: 'pitchdeck', name: 'Pitch Deck', icon: Award },
    { id: 'mentor', name: 'Mentor Advice', icon: HeartHandshake },
    { id: 'compare', name: 'Compare Versions', icon: GitCompare },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Detail Header / Control bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors mb-2 font-semibold cursor-pointer"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>
          <div className="flex items-center flex-wrap gap-2.5">
            <h2 className="text-2xl font-bold text-slate-900 tracking-wide">{idea.name}</h2>
            {report.versions && report.versions.length > 1 ? (
              <select
                value={idea.id}
                onChange={(e) => navigate(`/report/${e.target.value}`)}
                className="px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm"
              >
                {report.versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    Version {v.version} ({new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) {v.viability_score ? `• ${v.viability_score}%` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="bg-slate-100 text-slate-550 border border-slate-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                Version 1
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold">
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
            onClick={() => navigate(`/submit?parent_id=${idea.parent_id || idea.id}`)}
            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-all cursor-pointer shadow-sm animate-pulse-glow"
          >
            <GitCompare size={16} className="text-slate-500" />
            Iterate Concept
          </button>

          <button
            onClick={handleRecalculate}
            disabled={recalculating}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-blue-500/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
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
      <div className="flex overflow-x-auto pb-1 border-b border-slate-200 gap-1 scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
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
              <div className="glass-panel p-6 rounded-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-800 mb-6 uppercase tracking-wider">Viability Scores Radar</h3>
                
                {scores ? (
                  <div className="h-80 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                        <PolarGrid stroke="#E2E8F0" />
                        <PolarAngleAxis dataKey="subject" stroke="#64748B" fontSize={11} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#94A3B8" />
                        <Radar
                          name="Evaluation"
                          dataKey="value"
                          stroke="#2563EB"
                          fill="#2563EB"
                          fillOpacity={0.15}
                          isAnimationActive={true}
                          animationDuration={800}
                          animationEasing="ease-out"
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-sm font-medium">
                    AI Viability Score analysis not run. Trigger evaluation above.
                  </div>
                )}
              </div>

              {/* Bar chart fallback / secondary visual */}
              {scores && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-base font-bold text-slate-800 mb-6 uppercase tracking-wider">Metric Breakdown</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical">
                        <XAxis type="number" domain={[0, 100]} stroke="#94A3B8" fontSize={11} />
                        <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} width={90} />
                        <Tooltip
                          contentStyle={{ background: '#ffffff', borderColor: '#E2E8F0', borderRadius: '8px' }}
                          labelStyle={{ color: '#0F172A', fontWeight: 'bold' }}
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
                <div className="glass-panel p-6 rounded-2xl flex items-center gap-6 bg-slate-50 border border-slate-200">
                  <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-extrabold shrink-0 shadow-sm ${
                    scores.viability_score >= 80
                      ? 'border-emerald-500 text-emerald-700 bg-emerald-50'
                      : scores.viability_score >= 60
                      ? 'border-amber-500 text-amber-700 bg-amber-50'
                      : 'border-rose-500 text-rose-700 bg-rose-50'
                  }`}>
                    {scores.viability_score}%
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-850">Overall Viability Score</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      This score reflects cumulative ratings for demand severity, market scope, revenue dynamics, and barrier execution.
                    </p>
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200">
                <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider">Executive Verdict</h3>
                {scores ? (
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    {scores.explanation}
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 font-medium">AI Summary not available. Click re-evaluation to load.</p>
                )}
              </div>

              {/* Suggestions list */}
              {scores && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider">Priority Improvements</h3>
                  <ul className="space-y-3">
                    {scores.improvement_suggestions.map((suggestion, index) => (
                      <li key={index} className="flex gap-3 text-sm text-slate-650 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 text-xs shrink-0 mt-0.5 font-bold">
                          {index + 1}
                        </span>
                        <span className="text-slate-600 font-semibold">{suggestion}</span>
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
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <h4 className="font-bold uppercase tracking-wider text-sm">Strengths</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.strengths.map((str, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                          <Check size={14} className="mt-1 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="swot-w p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      <h4 className="font-bold uppercase tracking-wider text-sm">Weaknesses</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.weaknesses.map((weak, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                          <X size={14} className="mt-1 shrink-0" />
                          <span>{weak}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Opportunities */}
                  <div className="swot-o p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                      <h4 className="font-bold uppercase tracking-wider text-sm">Opportunities</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.opportunities.map((opp, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                          <span className="font-bold shrink-0 mt-0.5">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Threats */}
                  <div className="swot-t p-6 rounded-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-650"></span>
                      <h4 className="font-bold uppercase tracking-wider text-sm">Threats</h4>
                    </div>
                    <ul className="space-y-2.5">
                      {swot.threats.map((thr, i) => (
                        <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                          <span className="font-bold shrink-0 mt-0.5">⚠️</span>
                          <span>{thr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white">
                  <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider">SWOT Strategic Action Plan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {swot.recommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm text-slate-700 leading-relaxed">
                        <span className="text-blue-600 font-bold block mb-1 text-xs uppercase tracking-wider">Strategic Action {i+1}</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200 bg-white">
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
                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                  <div className="p-6 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Feature Comparison Matrix</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                          <th className="p-4 font-semibold">Competitor Name</th>
                          <th className="p-4 font-semibold">Market Position</th>
                          {competitors.competitors.length > 0 &&
                            Object.keys(competitors.competitors[0].comparison || {}).map((f) => (
                              <th key={f} className="p-4 font-semibold text-center">{f}</th>
                            ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {/* Render client platform first */}
                        <tr className="bg-blue-50/30 hover:bg-blue-50 transition-colors">
                          <td className="p-4 font-bold text-blue-600">
                            {idea.name} <span className="text-[10px] bg-blue-100 px-2 py-0.5 rounded-full ml-2 text-blue-700 uppercase tracking-widest font-bold">You</span>
                          </td>
                          <td className="p-4 text-slate-700 font-medium">Target disruptor</td>
                          {competitors.competitors.length > 0 &&
                            Object.keys(competitors.competitors[0].comparison || {}).map((f) => (
                              <td key={f} className="p-4 text-center">
                                <Check size={18} className="text-emerald-600 mx-auto" />
                              </td>
                            ))}
                        </tr>

                        {competitors.competitors.map((comp, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-800">
                              {comp.name}
                              {comp.website && comp.website !== 'N/A' && (
                                <a 
                                  href={formatUrl(comp.website)} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="block text-[10px] text-blue-600 hover:text-blue-700 hover:underline font-medium mt-0.5"
                                >
                                  {comp.website}
                                </a>
                              )}
                            </td>
                            <td className="p-4 text-slate-500 text-xs">
                              {comp.category} • <span className="text-slate-700 font-medium">{comp.market_position}</span>
                            </td>
                            {Object.entries(comp.comparison || {}).map(([feature, val]) => (
                              <td key={feature} className="p-4 text-center">
                                {val ? (
                                  <Check size={18} className="text-emerald-600 mx-auto" />
                                ) : (
                                  <X size={18} className="text-rose-500 mx-auto" />
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
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white">
                    <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider">Market Gap Analysis</h3>
                    <p className="text-sm text-slate-650 leading-relaxed font-medium">
                      {competitors.market_gap_analysis}
                    </p>
                  </div>

                  {/* Differentiation Suggestions */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white">
                    <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider">How to Differentiate</h3>
                    <ul className="space-y-3">
                      {competitors.differentiation_suggestions.map((diff, index) => (
                        <li key={index} className="flex gap-3 text-sm text-slate-600 leading-relaxed font-medium">
                          <span className="w-5 h-5 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 text-xs shrink-0 mt-0.5 font-bold">
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
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200 bg-white">
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
                <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border border-blue-100 bg-blue-50/30">
                  <div>
                    <h4 className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Recommended Business Model</h4>
                    <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{revenue.recommended_model}</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                    <DollarSign size={24} />
                  </div>
                </div>

                {/* Pricing Tiers cards */}
                <div>
                  <h3 className="text-base font-bold text-slate-800 mb-6 uppercase tracking-wider">Suggested Pricing Tiers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {revenue.pricing_suggestions.map((tier, idx) => (
                      <div key={idx} className="glass-card p-6 rounded-2xl border border-slate-200 flex flex-col justify-between h-full relative overflow-hidden bg-white">
                        {idx === 1 && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                            Recommended
                          </div>
                        )}
                        <div>
                          <span className="text-xs text-slate-400 uppercase tracking-widest font-bold block mb-2">{tier.tier_name}</span>
                          <div className="flex items-baseline gap-1.5 mb-6">
                            <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                            <span className="text-xs text-slate-500 font-medium">{tier.frequency}</span>
                          </div>
                          
                          <ul className="space-y-3 mb-8">
                            {tier.features.map((f, i) => (
                              <li key={i} className="text-xs text-slate-650 flex items-start gap-2 leading-relaxed">
                                <Check size={12} className="text-blue-600 mt-0.5 shrink-0" />
                                <span className="text-slate-650">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rationale */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-base font-bold text-slate-800 mb-4 uppercase tracking-wider">Monetization & Pricing Rationale</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {revenue.revenue_rationale}
                  </p>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200 bg-white">
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
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl min-h-[220px] flex flex-col border border-slate-200">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Key Partners</h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line flex-1">
                    {canvas.key_partners}
                  </p>
                </div>

                {/* Column 2: Key Activities & Resources */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px] border border-slate-200">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Key Activities</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line flex-1">
                      {canvas.key_activities}
                    </p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px] border border-slate-200">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Key Resources</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line flex-1">
                      {canvas.key_resources}
                    </p>
                  </div>
                </div>

                {/* Column 3: Value Propositions */}
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl min-h-[220px] flex flex-col bg-blue-50/50 border border-blue-200">
                  <h4 className="text-xs font-extrabold text-blue-700 uppercase tracking-wider mb-3">Value Propositions</h4>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line flex-1 font-medium">
                    {canvas.value_proposition}
                  </p>
                </div>

                {/* Column 4: Relationships & Channels */}
                <div className="lg:col-span-1 flex flex-col gap-4">
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px] border border-slate-200">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Customer Relationships</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line flex-1">
                      {canvas.customer_relationships}
                    </p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl flex-1 flex flex-col min-h-[110px] border border-slate-200">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Channels</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line flex-1">
                      {canvas.channels}
                    </p>
                  </div>
                </div>

                {/* Column 5: Customer Segments */}
                <div className="lg:col-span-1 glass-panel p-5 rounded-2xl min-h-[220px] flex flex-col border border-slate-200">
                  <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Customer Segments</h4>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line flex-1">
                    {canvas.customer_segments}
                  </p>
                </div>

                {/* Cost & Revenue Bottom row */}
                <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-5 rounded-2xl min-h-[120px] border border-slate-200">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Cost Structure</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {canvas.cost_structure}
                    </p>
                  </div>
                  <div className="glass-panel p-5 rounded-2xl min-h-[120px] border border-slate-200">
                    <h4 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">Revenue Streams</h4>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                      {canvas.revenue_streams}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200">
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
                  className="bg-white border border-slate-200 rounded-2xl p-10 min-h-[380px] flex flex-col justify-between shadow-sm relative animate-scale-in"
                >
                  <div className="absolute top-4 right-6 text-xs text-slate-400 font-bold">
                    SLIDE {pitch_deck.slides[currentSlideIndex].slide_number} OF {pitch_deck.slides.length}
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6 pr-10">
                      {pitch_deck.slides[currentSlideIndex].title}
                    </h3>
                    <ul className="space-y-4">
                      {pitch_deck.slides[currentSlideIndex].bullets.map((b, idx) => (
                        <li key={idx} className="text-sm sm:text-base text-slate-650 flex items-start gap-3 leading-relaxed">
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2"></span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Design layout tip */}
                  <div className="border-t border-slate-100 pt-6 mt-8">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest block mb-1">Visual Layout Suggestion</span>
                    <p className="text-xs text-slate-500 italic">
                      {pitch_deck.slides[currentSlideIndex].visual_suggestion}
                    </p>
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex justify-between items-center mt-6">
                  <button
                    disabled={currentSlideIndex === 0}
                    onClick={() => setCurrentSlideIndex((prev) => prev - 1)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl flex items-center gap-1 text-sm disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
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
                          currentSlideIndex === i ? 'bg-blue-600 w-4' : 'bg-slate-200 hover:bg-slate-300'
                        }`}
                      ></button>
                    ))}
                  </div>

                  <button
                    disabled={currentSlideIndex === pitch_deck.slides.length - 1}
                    onClick={() => setCurrentSlideIndex((prev) => prev + 1)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl flex items-center gap-1 text-sm disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    Next Slide
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200 bg-white">
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
                <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between border border-slate-200 bg-white shadow-sm">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                        <Award size={20} />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Customer Acquisition Tactics</h3>
                    </div>
                    <ul className="space-y-4">
                      <li className="text-sm text-slate-650 leading-relaxed">
                        <span className="text-emerald-750 font-bold block mb-1 text-xs uppercase">Leverage Content Loops</span>
                        Create data-driven templates or calculators related to {idea.industry} to gather leads organically.
                      </li>
                      <li className="text-sm text-slate-650 leading-relaxed">
                        <span className="text-emerald-750 font-bold block mb-1 text-xs uppercase">Niche Community Outreach</span>
                        Engage directly in specific forums, Slack networks, or subreddits where {idea.target_audience} congregates.
                      </li>
                      <li className="text-sm text-slate-650 leading-relaxed">
                        <span className="text-emerald-750 font-bold block mb-1 text-xs uppercase">Targeted Partnerships</span>
                        Integrate or partner with non-competing softwares currently used by your customer segments to gain instant visibility.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Go-To-Market Plan */}
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                      <Briefcase size={20} />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Launch & GTM Blueprint</h3>
                  </div>
                  <div className="space-y-4">
                    <div className="border-l-2 border-blue-500 pl-4 space-y-1">
                      <span className="text-xs font-bold text-slate-450 block uppercase">Phase 1: Private Alpha (Weeks 1-4)</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Onboard 10-15 design partners from {idea.target_audience} on a manual, high-touch basis to iron out onboarding friction.
                      </p>
                    </div>

                    <div className="border-l-2 border-sky-500 pl-4 space-y-1">
                      <span className="text-xs font-bold text-slate-450 block uppercase">Phase 2: Beta Launch (Weeks 5-8)</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Introduce self-serve subscription pricing, list on directories like Product Hunt and BetaList, and launch seed email loops.
                      </p>
                    </div>

                    <div className="border-l-2 border-emerald-500 pl-4 space-y-1">
                      <span className="text-xs font-bold text-slate-450 block uppercase">Phase 3: Scale Engine (Weeks 9+)</span>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Activate referral programs and transition from organic validation to paid search ads focused on conversion funnels.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200 bg-white">
                Mentor advice is compile-linked with AI score evaluation. Generate evaluation to view.
              </div>
            )}
          </div>
        )}

        {/* Tab 8: Compare Versions */}
        {activeTab === 'compare' && (() => {
          const sortedVersions = [...(report.versions || [])].sort((a, b) => a.version - b.version);
          const verA = report.versions?.find((v) => v.id === compareVerAId) || sortedVersions[0];
          const verB = report.versions?.find((v) => v.id === compareVerBId) || sortedVersions[sortedVersions.length - 1];

          if (!verA || !verB) {
            return (
              <div className="glass-panel p-12 text-center text-slate-400 text-sm border border-slate-200 bg-white">
                No versions available for comparison.
              </div>
            );
          }

          // Calculate overall score delta
          const scoreDelta = (typeof verA.viability_score === 'number' && typeof verB.viability_score === 'number')
            ? verB.viability_score - verA.viability_score
            : null;

          // Calculate section level improvements and differences
          const metrics = [
            { name: 'Viability Score', key: 'viability_score' },
            { name: 'Market Opportunity', key: 'market_opportunity_score' },
            { name: 'Competition Safety', key: 'competition_score' },
            { name: 'Revenue Potential', key: 'revenue_potential_score' },
            { name: 'Risk Safety', key: 'risk_assessment_score' },
          ];

          const diffs = metrics.map((m) => {
            const valA = verA[m.key];
            const valB = verB[m.key];
            const diff = (typeof valA === 'number' && typeof valB === 'number') ? valB - valA : null;
            return { name: m.name, valA, valB, diff };
          });

          // Find biggest improvement
          const positiveDiffs = diffs.filter(d => d.diff !== null && d.diff > 0);
          positiveDiffs.sort((a, b) => b.diff - a.diff);
          const biggestImprovement = positiveDiffs.length > 0
            ? `${positiveDiffs[0].name} (+${positiveDiffs[0].diff})`
            : 'None';

          // Get primary strategic change
          const mainStrategicChange = verB?.iteration_note || (verB?.key_changes && verB.key_changes[0]) || 'No iteration notes provided.';

          // Recommendation
          let recommendation = 'Continue developing the concept and run further user interviews.';
          if (scoreDelta !== null) {
            if (scoreDelta > 0) {
              recommendation = `Continue with Version ${verB?.version} and double-down on the strategic changes. Focus testing on investor-focused positioning.`;
            } else if (scoreDelta < 0) {
              recommendation = `Revert to Version ${verA?.version} or address regression. Review the drop in ${diffs.find(d => d.diff < 0)?.name || 'metrics'} and iterate again.`;
            } else {
              recommendation = `Both versions show equal viability. Test Version ${verB?.version} with a small target user cohort to gather feedback.`;
            }
          }

          return (
            <div className="space-y-6">
              {/* Dropdowns to select compared versions */}
              {report.versions && report.versions.length > 1 ? (
                <div className="glass-panel p-5 rounded-2xl border border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <GitCompare className="text-blue-600 shrink-0" size={20} />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Compare Two Iterations</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-bold">Compare</span>
                      <select
                        value={compareVerAId}
                        onChange={(e) => setCompareVerAId(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {report.versions.map((v) => (
                          <option key={v.id} value={v.id} disabled={v.id === compareVerBId}>
                            Version {v.version} ({new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) {v.viability_score ? `• ${v.viability_score}%` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="text-xs text-slate-400 font-bold">VS</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={compareVerBId}
                        onChange={(e) => setCompareVerBId(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 focus:outline-none cursor-pointer"
                      >
                        {report.versions.map((v) => (
                          <option key={v.id} value={v.id} disabled={v.id === compareVerAId}>
                            Version {v.version} ({new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}) {v.viability_score ? `• ${v.viability_score}%` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Version Comparison Summary Card */}
              {verA && verB && report.versions?.length > 1 && (
                <div className="glass-panel p-6 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm space-y-4">
                  <h4 className="text-sm font-extrabold text-blue-900 uppercase tracking-wider flex items-center gap-2">
                    <Award size={18} className="text-blue-600" />
                    Version Comparison Summary
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Current Version</span>
                      <span className="text-sm font-extrabold text-slate-800">Version {verB.version}</span>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Previous Version</span>
                      <span className="text-sm font-extrabold text-slate-800">Version {verA.version}</span>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Net Viability Change</span>
                      <span className={`text-sm font-extrabold flex items-center gap-1 ${
                        scoreDelta > 0 ? 'text-emerald-600' : scoreDelta < 0 ? 'text-rose-600' : 'text-slate-600'
                      }`}>
                        {scoreDelta > 0 ? `+${scoreDelta}` : scoreDelta < 0 ? scoreDelta : '0'}
                        {scoreDelta > 0 ? <TrendingUp size={14} /> : scoreDelta < 0 ? <TrendingDown size={14} /> : null}
                      </span>
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Biggest Improvement</span>
                      <span className="text-sm font-extrabold text-emerald-600 truncate block">
                        {biggestImprovement}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-blue-100/60 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Main Strategic Change</span>
                      <p className="text-xs text-slate-650 font-medium leading-relaxed italic">
                        "{mainStrategicChange}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Recommendation</span>
                      <p className="text-xs text-slate-700 font-bold leading-relaxed">
                        {recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Side-by-Side Comparison Panel */}
              {verA && verB && report.versions?.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column: Version A Details */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
                        Version {verA.version} Configuration
                      </h4>
                      <span className="text-[11px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        {new Date(verA.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Business Model Type</span>
                        <p className="text-xs text-slate-700 font-semibold">{verA.business_type}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Target Audience</span>
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed">{verA.target_audience}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Problem Statement</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{verA.problem_statement}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Solution Description</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">{verA.solution_description}</p>
                      </div>
                      {verA.iteration_note && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Iteration Note</span>
                          <p className="text-xs text-slate-600 italic leading-relaxed font-medium">"{verA.iteration_note}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Version B Details */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                      <h4 className="font-extrabold text-blue-900 text-sm uppercase tracking-wider flex items-center gap-1.5">
                        Version {verB.version} Configuration
                        {verB.id === idea.id && (
                          <span className="bg-blue-600 text-white text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded-full">Viewing</span>
                        )}
                      </h4>
                      <span className="text-[11px] text-blue-800 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
                        {new Date(verB.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Business Model Type</span>
                        <p className="text-xs text-slate-700 font-semibold flex items-center gap-1.5">
                          {verB.business_type}
                          {verA.business_type !== verB.business_type && (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded border border-emerald-100">Changed</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Target Audience</span>
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                          {verB.target_audience}
                          {verA.target_audience !== verB.target_audience && (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded border border-emerald-100 ml-2">Changed</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Problem Statement</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {verB.problem_statement}
                          {verA.problem_statement !== verB.problem_statement && (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded border border-emerald-100 ml-2">Changed</span>
                          )}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block mb-1">Solution Description</span>
                        <p className="text-xs text-slate-700 leading-relaxed font-medium">
                          {verB.solution_description}
                          {verA.solution_description !== verB.solution_description && (
                            <span className="bg-emerald-50 text-emerald-700 text-[8px] font-extrabold uppercase tracking-widest px-1 py-0.5 rounded border border-emerald-100 ml-2">Changed</span>
                          )}
                        </p>
                      </div>
                      {verB.iteration_note && (
                        <div className="bg-blue-50/20 p-3 rounded-lg border border-blue-100/60">
                          <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wider block mb-1">Iteration Note</span>
                          <p className="text-xs text-slate-600 italic leading-relaxed font-medium">"{verB.iteration_note}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Section-Level Comparison Table */}
              {verA && verB && report.versions?.length > 1 && (
                <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100">
                    Section-Level Score Comparison
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                          <th className="p-3.5 font-bold">Metric / Section</th>
                          <th className="p-3.5 font-bold text-center">Version {verA.version}</th>
                          <th className="p-3.5 font-bold text-center">Version {verB.version}</th>
                          <th className="p-3.5 font-bold text-center">Change</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {diffs.map((d, index) => {
                          const hasChange = d.diff !== null;
                          const isPos = d.diff > 0;
                          const isNeg = d.diff < 0;

                          return (
                            <tr key={index} className="hover:bg-slate-50/40 text-slate-700">
                              <td className="p-3.5 text-xs font-bold text-slate-850">{d.name}</td>
                              <td className="p-3.5 text-center text-xs font-bold">
                                {d.valA !== null ? `${d.valA}%` : <span className="text-slate-400 italic text-[11px]">Not Evaluated</span>}
                              </td>
                              <td className="p-3.5 text-center text-xs font-bold">
                                {d.valB !== null ? `${d.valB}%` : <span className="text-slate-400 italic text-[11px]">Not Evaluated</span>}
                              </td>
                              <td className="p-3.5 text-center text-xs font-bold">
                                {hasChange ? (
                                  <span className={`flex items-center justify-center gap-1 ${
                                    isPos ? 'text-emerald-600' : isNeg ? 'text-rose-600' : 'text-slate-500'
                                  }`}>
                                    {isPos ? `+${d.diff}` : d.diff === 0 ? '0' : d.diff}
                                    {isPos ? <TrendingUp size={12} /> : isNeg ? <TrendingDown size={12} /> : null}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Concept Evolution History list */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                  <History className="text-blue-600" size={22} />
                  <div>
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-wider">Concept Evolution History</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Full archive of all versions submitted and evaluated for this concept.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <th className="p-4 font-semibold w-[120px]">Version</th>
                        <th className="p-4 font-semibold w-[120px]">Date</th>
                        <th className="p-4 font-semibold w-[140px] text-center">Viability Score</th>
                        <th className="p-4 font-semibold w-[140px]">Business Type</th>
                        <th className="p-4 font-semibold w-[140px]">Target Region</th>
                        <th className="p-4 font-semibold min-w-[220px]">Key Changes</th>
                        <th className="p-4 font-semibold">Iteration Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      {report.versions && [...report.versions].sort((a, b) => b.version - a.version).map((v, idx, arr) => {
                        const isActive = v.id === idea.id;
                        const formattedDate = new Date(v.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        });

                        // Calculate score delta from previous version (which is at index idx + 1 because of descending sort)
                        const prevVer = arr[idx + 1];
                        const delta = (typeof v.viability_score === 'number' && typeof prevVer?.viability_score === 'number')
                          ? v.viability_score - prevVer.viability_score
                          : null;
                        
                        let scoreCell = null;
                        if (v.viability_score !== null) {
                          const val = v.viability_score;
                          scoreCell = (
                            <div className="flex flex-col items-center justify-center gap-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs border shadow-sm ${
                                val >= 80 ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50' :
                                val >= 60 ? 'border-amber-500 text-amber-700 bg-amber-50/50' :
                                'border-rose-500 text-rose-700 bg-rose-50/50'
                              }`}>
                                {val}%
                              </div>
                              {delta !== null && (
                                <span className={`text-[10px] font-bold ${
                                  delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-500'
                                }`}>
                                  ({delta > 0 ? `+${delta}` : delta})
                                </span>
                              )}
                            </div>
                          );
                        } else {
                          scoreCell = <span className="text-slate-400 text-xs italic">N/A</span>;
                        }

                        return (
                          <tr 
                            key={v.id} 
                            className={`transition-colors cursor-pointer group text-slate-700 ${
                              isActive ? 'bg-blue-50/30 hover:bg-blue-50/50 border-l-4 border-l-blue-600 font-medium' : 'hover:bg-slate-50'
                            }`}
                            onClick={() => navigate(`/report/${v.id}`)}
                          >
                            <td className="p-4 font-bold text-slate-800">
                              <span className="flex items-center gap-1.5">
                                Version {v.version}
                                {isActive && (
                                  <span className="bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full">
                                    Viewing
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="p-4 text-slate-500 font-medium whitespace-nowrap">
                              {formattedDate}
                            </td>
                            <td className="p-4 text-center">
                              {scoreCell}
                            </td>
                            <td className="p-4 text-xs font-semibold">
                              {v.business_type}
                            </td>
                            <td className="p-4 text-xs font-semibold">
                              {v.country_region}
                            </td>
                            <td className="p-4 text-xs text-slate-600 font-medium">
                              {v.key_changes && v.key_changes.length > 0 ? (
                                <ul className="list-disc pl-4 space-y-1">
                                  {v.key_changes.map((change, i) => (
                                    <li key={i}>{change}</li>
                                  ))}
                                </ul>
                              ) : (
                                <span className="text-slate-400 italic">Initial version evaluation</span>
                              )}
                            </td>
                            <td className="p-4 text-xs text-slate-550 max-w-[220px] truncate" title={v.iteration_note || ''}>
                              {v.iteration_note || <span className="text-slate-400 italic">N/A</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default IdeaDetail;
