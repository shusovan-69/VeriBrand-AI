import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Upload,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { draftsApi, filesApi, guidelinesApi, verificationApi } from '../services/api';

export default function ContentSubmissionPage() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [targetProduct, setTargetProduct] = useState('Example Wireless Headphones');
  const [targetAudience, setTargetAudience] = useState('General Consumer');
  const [contentText, setContentText] = useState('');
  const [approvedProducts, setApprovedProducts] = useState([]);

  // PDF Extraction State
  const [pdfFile, setPdfFile] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [pdfResult, setPdfResult] = useState(null);
  const [pdfError, setPdfError] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch approved products list
    guidelinesApi.getFacts().then((res) => {
      const prods = Array.from(new Set(res.data.map((f) => f.product_name))).filter(Boolean);
      setApprovedProducts(prods.length ? prods : ['Example Wireless Headphones']);
    }).catch(console.error);
  }, []);

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setPdfError('Only text-extractable PDF files are supported.');
      return;
    }

    setPdfFile(file);
    setPdfError('');
    setExtracting(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await filesApi.extractPdf(formData);
      setPdfResult(res.data);
    } catch (err) {
      setPdfError(err.response?.data?.detail || 'Failed to extract text from PDF.');
    } finally {
      setExtracting(false);
    }
  };

  const handleApplyExtractedText = () => {
    if (pdfResult?.extracted_text) {
      setContentText(pdfResult.extracted_text);
      if (!title) {
        setTitle(`Campaign Draft - ${pdfResult.filename.replace('.pdf', '')}`);
      }
      setPdfResult(null);
    }
  };

  // Demo Presets
  const loadPreset = (type) => {
    setError('');
    if (type === 'section7') {
      setTitle('Holiday Launch Copy — Headphones Battery Promo');
      setTargetProduct('Example Wireless Headphones');
      setContentText('Our headphones deliver guaranteed 24-hour battery life.');
    } else if (type === 'compliant') {
      setTitle('Verified Spring Headphones Launch');
      setTargetProduct('Example Wireless Headphones');
      setContentText('Our Example Wireless Headphones feature Active Noise Cancellation (ANC) with up to 12 hours of battery life.');
    } else if (type === 'insufficient') {
      setTitle('Aggressive Competitive Billboard');
      setTargetProduct('Example Wireless Headphones');
      setContentText("Ranked the world's best audio headset with guaranteed acoustic superiority and 100 meters underwater depth.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contentText.trim()) {
      setError('Marketing copy cannot be empty.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // 1. Create Draft & Revision 1
      const draftRes = await draftsApi.createDraft({
        title: title || 'Marketing Copy Submission',
        target_product: targetProduct,
        target_audience: targetAudience,
        content_text: contentText,
        submission_type: pdfFile ? 'pdf' : 'text',
        original_filename: pdfFile?.name
      });

      const draftId = draftRes.data.draft_id;

      // 2. Trigger Verification Engine
      await verificationApi.verifyDraft(draftId);

      // 3. Navigate directly to draft verification results
      navigate(`/drafts/${draftId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit and verify draft.');
      setSubmitting(false);
    }
  };

  const charCount = contentText.length;
  const isOverLimit = charCount > 10000;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <FileText className="h-6 w-6 text-cyan-400" />
          Submit Content for Brand Verification
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Paste marketing copy or extract text from a campaign PDF. Our hybrid engine will check against approved specifications.
        </p>
      </div>

      {/* Preset Quick Load Bar for Hackathon Evaluation */}
      <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Load Evaluation Draft Scenarios:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadPreset('section7')}
              className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 border border-rose-800/60 text-rose-200 text-xs font-mono font-medium transition-all"
            >
              Section 7 Demo (24-hr Contradiction)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('compliant')}
              className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-800/60 text-emerald-200 text-xs font-mono font-medium transition-all"
            >
              Compliant Draft (12-hr Fact Match)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('insufficient')}
              className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900/80 border border-amber-800/60 text-amber-200 text-xs font-mono font-medium transition-all"
            >
              Insufficient Evidence Test
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-rose-950/60 border border-rose-800 p-4 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Submission Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Draft Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Wireless Headphones Campaign Copy"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Product</label>
            <select
              value={targetProduct}
              onChange={(e) => setTargetProduct(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {approvedProducts.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="General Brand Copy">General Brand Copy</option>
            </select>
          </div>
        </div>

        {/* PDF Extraction Upload Zone */}
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-colors">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400 shrink-0">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Extract from Text-Extractable PDF</h4>
                <p className="text-[11px] text-slate-400">
                  PyMuPDF extractor · Max 10 MB / 20 pages · Text confirmation required
                </p>
              </div>
            </div>

            <div>
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors">
                <span>{extracting ? 'Extracting Text...' : 'Select PDF Document'}</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  disabled={extracting}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {pdfError && (
            <div className="mt-3 text-xs text-rose-400 bg-rose-950/40 p-2.5 rounded-lg border border-rose-900/50">
              {pdfError}
            </div>
          )}

          {/* Extracted Text Preview Confirmation (Round 1 Requirement) */}
          {pdfResult && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-900/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4" />
                  PDF Text Extracted ({pdfResult.character_count} chars, {pdfResult.page_count} pages)
                </span>
                <button
                  type="button"
                  onClick={handleApplyExtractedText}
                  className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  Confirm & Insert into Editor
                </button>
              </div>
              <div className="max-h-36 overflow-y-auto text-xs text-slate-300 font-mono bg-slate-900/80 p-2.5 rounded border border-slate-800">
                {pdfResult.extracted_text}
              </div>
            </div>
          )}
        </div>

        {/* Marketing Text Editor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Marketing Copy / Content Body
            </label>
            <div className={`text-xs font-mono ${isOverLimit ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
              {charCount.toLocaleString()} / 10,000 characters
            </div>
          </div>

          <textarea
            required
            rows={8}
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Type or paste your marketing content here... e.g. 'Our headphones deliver guaranteed 24-hour battery life.'"
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          {isOverLimit && (
            <p className="mt-1 text-xs text-rose-400">
              Operating limit exceeded: Maximum 10,000 characters permitted per analysis.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-800">
          <button
            type="submit"
            disabled={submitting || isOverLimit}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Verification Engine...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
