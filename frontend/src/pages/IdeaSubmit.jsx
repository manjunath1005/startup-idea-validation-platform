import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startupService } from '../services/api';
import { Lightbulb, ArrowLeft, Send, Sparkles, Loader2 } from 'lucide-react';

const IdeaSubmit = () => {
  const [searchParams] = useSearchParams();
  const parentId = searchParams.get('parent_id');

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [businessType, setBusinessType] = useState('SaaS');
  const [countryRegion, setCountryRegion] = useState('Global');
  const [iterationNote, setIterationNote] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (parentId) {
      const loadParentIdea = async () => {
        setLoading(true);
        setError('');
        try {
          const parentData = await startupService.getIdea(parentId);
          setName(parentData.name);
          setIndustry(parentData.industry);
          setProblemStatement(parentData.problem_statement);
          setSolutionDescription(parentData.solution_description);
          setTargetAudience(parentData.target_audience);
          setBusinessType(parentData.business_type);
          setCountryRegion(parentData.country_region);
        } catch (err) {
          console.error('Failed to load parent idea details', err);
          setError('Failed to load base idea details for iteration.');
        } finally {
          setLoading(false);
        }
      };
      loadParentIdea();
    }
  }, [parentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await startupService.submitIdea({
        name,
        industry,
        problem_statement: problemStatement,
        solution_description: solutionDescription,
        target_audience: targetAudience,
        business_type: businessType,
        country_region: countryRegion,
        parent_id: parentId || null,
        iteration_note: parentId ? iterationNote : null,
      });
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.detail || 'Failed to submit startup idea. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    'Artificial Intelligence / ML',
    'SaaS & B2B Software',
    'Fintech',
    'Healthcare & Biotech',
    'E-commerce & Retail',
    'Edtech',
    'Clean Energy / Climatetech',
    'Web3 / Blockchain',
    'Proptech / Real Estate',
    'Logistics & Mobility',
    'Hardware & IoT',
    'Other'
  ];

  const businessTypes = [
    'SaaS (Software as a Service)',
    'Transactional / E-commerce',
    'Marketplace (Two-sided platform)',
    'Freemium / Ad-supported',
    'Enterprise / Licensing',
    'Hardware Sales',
    'Hybrid / B2B2C'
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Back link */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors text-sm font-semibold cursor-pointer"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      <div className="glass-panel p-8 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100">
          <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <Sparkles size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Startup Concept Details</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Enter key business details to enable the AI engine to test viability.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-100 text-red-750 p-4 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-75">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Startup / Project Name</label>
              <input
                type="text"
                required
                className="glass-input"
                placeholder="e.g. FitPulse"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Primary Industry</label>
              <select
                className="glass-input appearance-none bg-white"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                required
              >
                <option value="">Select industry...</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up delay-150">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Primary Business Model Type</label>
              <select
                className="glass-input appearance-none bg-white"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                required
              >
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-slate-700 mb-2">Target Region / Country</label>
              <input
                type="text"
                required
                className="glass-input"
                placeholder="e.g. North America, India, Global"
                value={countryRegion}
                onChange={(e) => setCountryRegion(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col animate-fade-in-up delay-200">
            <label className="text-sm font-semibold text-slate-700 mb-2">Problem Statement</label>
            <textarea
              required
              rows={3}
              className="glass-input resize-none"
              placeholder="What specific paint point or problem does your target audience experience? Detail the severity and current workarounds..."
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
            />
          </div>

          <div className="flex flex-col animate-fade-in-up delay-300">
            <label className="text-sm font-semibold text-slate-700 mb-2">Solution Description</label>
            <textarea
              required
              rows={3}
              className="glass-input resize-none"
              placeholder="How does your product solve this problem? Explain key capabilities, technology, and value propositions..."
              value={solutionDescription}
              onChange={(e) => setSolutionDescription(e.target.value)}
            />
          </div>

          <div className="flex flex-col animate-fade-in-up delay-400">
            <label className="text-sm font-semibold text-slate-700 mb-2">Target Customer Segment</label>
            <textarea
              required
              rows={2}
              className="glass-input resize-none"
              placeholder="Who are the primary buyers and users? e.g. Independent gym owners with 1-5 employees..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
            />
          </div>

          {parentId && (
            <div className="flex flex-col animate-fade-in-up delay-[450ms]">
              <label className="text-sm font-semibold text-slate-750 mb-2 flex items-center gap-2">
                Iteration Notes / Why I changed this
                <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Required for V2+</span>
              </label>
              <textarea
                required
                rows={3}
                className="glass-input resize-none"
                placeholder="why I’m changing this concept, what assumption I’m testing, and what feedback led to this update (e.g. Narrowed PropertyAI from a search platform to an investor platform...)"
                value={iterationNote}
                onChange={(e) => setIterationNote(e.target.value)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/10 disabled:opacity-50 disabled:pointer-events-none mt-8 animate-fade-in-up delay-500 cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Saving Startup Concept...
              </>
            ) : (
              <>
                <Send size={18} />
                Submit and Proceed
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default IdeaSubmit;
