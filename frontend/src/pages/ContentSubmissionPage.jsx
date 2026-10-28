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
      const draftRes = await draftsApi.createDraft({
        title: title || 'Marketing Copy Submission',
        target_product: targetProduct,
        target_audience: targetAudience,
        content_text: contentText,
        submission_type: pdfFile ? 'pdf' : 'text',
        original_filename: pdfFile?.name
      });

      const draftId = draftRes.data.draft_id;
      await verificationApi.verifyDraft(draftId);
      navigate(`/drafts/${draftId}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit and verify draft.');
      setSubmitting(false);
    }
  };

  const charCount = contentText.length;
  const isOverLimit = charCount > 10000;

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ paddingBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <FileText size={24} color="#FF6500" />
          Submit Content for Brand Verification
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '6px' }}>
          Paste marketing copy or extract text from a campaign PDF. Our hybrid engine will check claims against approved specifications.
        </p>
      </div>

      {/* Preset Evaluation Scenarios */}
      <div style={{
        background: 'rgba(255, 101, 0, 0.05)',
        border: '1px solid rgba(255, 101, 0, 0.2)',
        borderRadius: '16px',
        padding: '16px 20px',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FF8533', fontSize: '0.78rem', fontWeight: 700 }}>
            <Sparkles size={15} color="#FF6500" />
            <span>Load Sample Content Presets:</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              onClick={() => loadPreset('section7')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Battery Claim (Contradiction Sample)
            </button>
            <button
              type="button"
              onClick={() => loadPreset('compliant')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Compliant Campaign Copy
            </button>
            <button
              type="button"
              onClick={() => loadPreset('insufficient')}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: '0.72rem',
                fontFamily: 'monospace',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Unsubstantiated Claims Sample
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          fontSize: '0.82rem',
        }}>
          <AlertCircle size={16} color="#f87171" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              Draft Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Wireless Headphones Campaign Copy"
              className="input-dark"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px' }}>
              Target Product
            </label>
            <select
              value={targetProduct}
              onChange={(e) => setTargetProduct(e.target.value)}
              className="input-dark"
              style={{ cursor: 'pointer' }}
            >
              {approvedProducts.map((p) => (
                <option key={p} value={p} style={{ background: '#161616', color: '#fff' }}>{p}</option>
              ))}
              <option value="General Brand Copy" style={{ background: '#161616', color: '#fff' }}>General Brand Copy</option>
            </select>
          </div>
        </div>

        {/* PDF Extraction Upload Zone */}
        <div className="card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 101, 0, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Upload size={18} color="#FF6500" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  Extract from Text-Extractable PDF
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', margin: '3px 0 0 0' }}>
                  PyMuPDF extractor · Max 10 MB / 20 pages · Text confirmation required
                </p>
              </div>
            </div>

            <label style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 16px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
              <span>{extracting ? 'Extracting Text...' : 'Select PDF Document'}</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handlePdfUpload}
                disabled={extracting}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {pdfError && (
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              fontSize: '0.78rem',
            }}>
              {pdfError}
            </div>
          )}

          {pdfResult && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              borderRadius: '12px',
              background: '#0d0d0d',
              border: '1px solid rgba(255, 101, 0, 0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#FF8533', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileCheck size={16} />
                  PDF Text Extracted ({pdfResult.character_count} chars, {pdfResult.page_count} pages)
                </span>
                <button
                  type="button"
                  onClick={handleApplyExtractedText}
                  className="btn-orange"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  Confirm & Insert into Editor
                </button>
              </div>
              <div style={{
                maxHeight: '140px',
                overflowY: 'auto',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
                color: 'rgba(255, 255, 255, 0.75)',
                background: '#141414',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}>
                {pdfResult.extracted_text}
              </div>
            </div>
          )}
        </div>

        {/* Marketing Text Editor */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>
              Marketing Copy / Content Body
            </label>
            <div style={{
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              color: isOverLimit ? '#f87171' : 'rgba(255, 255, 255, 0.35)',
              fontWeight: isOverLimit ? 700 : 400
            }}>
              {charCount.toLocaleString()} / 10,000 characters
            </div>
          </div>

          <textarea
            required
            rows={8}
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Type or paste your marketing content here... e.g. 'Our headphones deliver guaranteed 24-hour battery life.'"
            className="input-dark"
            style={{
              fontFamily: 'monospace',
              lineHeight: '1.6',
              resize: 'vertical',
            }}
          />

          {isOverLimit && (
            <p style={{ marginTop: '6px', fontSize: '0.75rem', color: '#f87171' }}>
              Operating limit exceeded: Maximum 10,000 characters permitted per analysis.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <button
            type="submit"
            disabled={submitting || isOverLimit}
            className="btn-orange"
            style={{ padding: '12px 28px', fontSize: '0.9rem' }}
          >
            {submitting ? (
              <>
                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
                Running Verification Engine...
              </>
            ) : (
              <>
                <Send size={15} />
                Submit for Verification
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
