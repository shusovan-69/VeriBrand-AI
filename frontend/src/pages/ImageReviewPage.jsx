import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Upload,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Eye,
  Sliders,
  Palette,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { insightsApi } from '../services/api';

export default function ImageReviewPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [sampledHex, setSampledHex] = useState('#4F46E5');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.toLowerCase().split('.').pop();
    if (!['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
      setError('Please select a PNG, JPEG, or WebP image.');
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError('');
    setResult(null);
  };

  const handleRunReview = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file first.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (sampledHex) {
        formData.append('sampled_hex', sampledHex);
      }
      const res = await insightsApi.reviewImage(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze brand visual asset.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          Round 3 Improvement: Limited Image Review
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <ImageIcon className="h-6 w-6 text-cyan-400" />
          Visual Brand Asset & Color Palette Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload promotional graphics, evaluate brand color fidelity against approved swatches, and calculate WCAG 2.2 AA contrast ratios.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-950/60 border border-rose-800 p-4 text-xs text-rose-300">
          {error}
        </div>
      )}

      {/* Upload & Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Upload Zone */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Campaign Graphic Upload</h3>

          <div className="border-2 border-dashed border-slate-800 rounded-xl p-6 text-center hover:border-slate-700 transition-colors">
            {previewUrl ? (
              <div className="space-y-3">
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  className="max-h-56 mx-auto rounded-lg object-contain border border-slate-800"
                />
                <p className="text-xs text-slate-400 font-mono">{file?.name}</p>
                <label className="cursor-pointer text-xs text-cyan-400 hover:text-cyan-300 underline block">
                  Change image
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              </div>
            ) : (
              <label className="cursor-pointer block space-y-2">
                <Upload className="h-8 w-8 text-slate-500 mx-auto" />
                <div className="text-xs font-semibold text-slate-200">Click to upload visual banner</div>
                <div className="text-[11px] text-slate-500">PNG, JPEG, WebP up to 10 MB</div>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Sampled Color Hex Input & Preset Swatches */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold text-slate-300">
              Sampled Brand Color Area (Hex Code)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={sampledHex}
                onChange={(e) => setSampledHex(e.target.value)}
                className="h-9 w-12 rounded-lg bg-slate-950 border border-slate-700 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={sampledHex}
                onChange={(e) => setSampledHex(e.target.value)}
                placeholder="#4F46E5"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick Palette Swatches */}
            <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
              <span>Quick Test:</span>
              <button
                type="button"
                onClick={() => setSampledHex('#4F46E5')}
                className="px-2 py-0.5 rounded bg-[#4F46E5] text-white font-mono text-[10px]"
              >
                Indigo (#4F46E5)
              </button>
              <button
                type="button"
                onClick={() => setSampledHex('#06B6D4')}
                className="px-2 py-0.5 rounded bg-[#06B6D4] text-slate-950 font-mono text-[10px]"
              >
                Cyan (#06B6D4)
              </button>
              <button
                type="button"
                onClick={() => setSampledHex('#EF4444')}
                className="px-2 py-0.5 rounded bg-[#EF4444] text-white font-mono text-[10px]"
              >
                Non-Compliant Red (#EF4444)
              </button>
            </div>
          </div>

          <button
            onClick={handleRunReview}
            disabled={analyzing || !file}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {analyzing ? 'Analyzing Color Distance & Contrast...' : 'Verify Visual Compliance'}
          </button>
        </div>

        {/* Right: Analysis Results */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Palette & Accessibility Analysis</h3>

          {!result ? (
            <div className="py-20 text-center text-xs text-slate-500">
              Upload an image and run verification to inspect color fidelity and WCAG contrast.
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              {/* Compliance Header */}
              <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
                result.is_palette_compliant
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-semibold">
                  {result.is_palette_compliant ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <AlertOctagon className="h-5 w-5 text-rose-400" />
                  )}
                  <span>
                    {result.is_palette_compliant ? 'Brand Color Palette Compliant' : 'Color Variance Beyond Brand Tolerance'}
                  </span>
                </div>
                <span className="font-mono text-xs">
                  Delta: {result.difference_score}%
                </span>
              </div>

              {/* Matched Approved Color */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 block font-medium">Closest Approved Brand Asset:</span>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-white font-bold">{result.closest_approved_color}</span>
                  <span className="text-cyan-400">{result.closest_approved_hex}</span>
                </div>
              </div>

              {/* WCAG 2.2 AA Contrast */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[11px] text-slate-400 block font-medium">
                  WCAG 2.2 Accessibility Contrast Ratios:
                </span>
                <div className="grid grid-cols-2 gap-2 text-center font-mono">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-sm font-bold text-slate-200">{result.wcag_contrast?.against_white}:1</div>
                    <span className="text-[10px] text-slate-400">vs. White Surface</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <div className="text-sm font-bold text-slate-200">{result.wcag_contrast?.against_dark}:1</div>
                    <span className="text-[10px] text-slate-400">vs. Navy Surface</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">
                  {result.wcag_contrast?.passes_aa_normal_text
                    ? '✓ Passes WCAG 2.2 Level AA requirement (≥ 4.5:1) for body text.'
                    : '⚠ Requires high-contrast background to pass WCAG 2.2 Level AA.'}
                </p>
              </div>

              {/* Manual Review Prompts (Round 1 boundary requirement) */}
              <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-900/40 space-y-1.5">
                <span className="text-[11px] font-semibold text-cyan-300 block">
                  Manual Review Prompts (Round 1 & 2 boundary):
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                  {result.manual_review_prompts?.map((prompt, i) => (
                    <li key={i}>{prompt}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
