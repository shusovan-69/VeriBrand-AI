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
  const [sampledHex, setSampledHex] = useState('#FF6500');
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
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ paddingBottom: '18px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#FF8533', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
          <Sparkles size={13} color="#FF6500" />
          Brand Asset Studio: Visual & Palette Verification
        </div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
          <ImageIcon size={24} color="#FF6500" />
          Visual Brand Asset & Color Palette Verification
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '6px' }}>
          Upload promotional graphics, evaluate brand color fidelity against approved swatches, and calculate WCAG 2.2 AA contrast ratios.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          fontSize: '0.82rem',
        }}>
          {error}
        </div>
      )}

      {/* Main 2-Column Bento Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Left Column: Upload & Color Sampling */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>
            Campaign Graphic Upload
          </h3>

          <div style={{
            border: '2px dashed rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.01)',
          }}>
            {previewUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <img
                  src={previewUrl}
                  alt="Upload preview"
                  style={{
                    maxHeight: '220px',
                    maxWidth: '100%',
                    borderRadius: '12px',
                    objectFit: 'contain',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                  }}
                />
                <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                  {file?.name}
                </p>
                <label style={{ fontSize: '0.78rem', color: '#FF8533', cursor: 'pointer', fontWeight: 600 }}>
                  Change image
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255, 101, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Upload size={22} color="#FF6500" />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>Click to upload visual banner</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '4px' }}>PNG, JPEG, WebP up to 10 MB</div>
                </div>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Color Sampling */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)' }}>
              Sampled Brand Color Area (Hex Code)
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="color"
                value={sampledHex}
                onChange={(e) => setSampledHex(e.target.value)}
                style={{
                  width: '42px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#161616',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              />
              <input
                type="text"
                value={sampledHex}
                onChange={(e) => setSampledHex(e.target.value)}
                placeholder="#FF6500"
                className="input-dark"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            {/* Quick Test Swatches */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.4)' }}>Quick Test:</span>
              <button
                type="button"
                onClick={() => setSampledHex('#FF6500')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#FF6500',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Orange (#FF6500)
              </button>
              <button
                type="button"
                onClick={() => setSampledHex('#4F46E5')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#4F46E5',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Indigo (#4F46E5)
              </button>
              <button
                type="button"
                onClick={() => setSampledHex('#EF4444')}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: '#EF4444',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.68rem',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Red Breach (#EF4444)
              </button>
            </div>
          </div>

          <button
            onClick={handleRunReview}
            disabled={analyzing || !file}
            className="btn-orange"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '6px' }}
          >
            {analyzing ? (
              <>
                <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block' }} className="animate-spin" />
                Analyzing Color Distance & Contrast...
              </>
            ) : (
              'Verify Visual Compliance'
            )}
          </button>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.4)', margin: 0 }}>
            Palette & Accessibility Analysis
          </h3>

          {!result ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.35)' }}>
              Upload an image and run verification to inspect color fidelity and WCAG contrast.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
              {/* Compliance Header */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: result.is_palette_compliant ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: result.is_palette_compliant ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: result.is_palette_compliant ? '#34d399' : '#f87171',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  {result.is_palette_compliant ? (
                    <CheckCircle2 size={18} color="#34d399" />
                  ) : (
                    <AlertOctagon size={18} color="#f87171" />
                  )}
                  <span>
                    {result.is_palette_compliant ? 'Brand Color Palette Compliant' : 'Color Variance Beyond Tolerance'}
                  </span>
                </div>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  Delta: {result.difference_score}%
                </span>
              </div>

              {/* Matched Approved Color */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.5)' }}>Closest Approved Brand Asset:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}>
                  <strong style={{ color: '#fff' }}>{result.closest_approved_color}</strong>
                  <span style={{ color: '#FF8533' }}>{result.closest_approved_hex}</span>
                </div>
              </div>

              {/* WCAG 2.2 AA Contrast */}
              <div style={{
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255, 255, 255, 0.5)' }}>
                  WCAG 2.2 Accessibility Contrast Ratios:
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', textAlign: 'center', fontFamily: 'monospace' }}>
                  <div style={{ padding: '10px', borderRadius: '8px', background: '#111', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{result.wcag_contrast?.against_white}:1</div>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.4)' }}>vs. White Surface</span>
                  </div>
                  <div style={{ padding: '10px', borderRadius: '8px', background: '#111', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{result.wcag_contrast?.against_dark}:1</div>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.4)' }}>vs. Dark Surface</span>
                  </div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', margin: 0, lineHeight: '1.4' }}>
                  {result.wcag_contrast?.passes_aa_normal_text
                    ? '✓ Passes WCAG 2.2 Level AA requirement (≥ 4.5:1) for standard text.'
                    : '⚠ Requires high-contrast background to pass WCAG 2.2 Level AA.'}
                </p>
              </div>

              {/* Manual Review Prompts */}
              {result.manual_review_prompts?.length > 0 && (
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 101, 0, 0.05)',
                  border: '1px solid rgba(255, 101, 0, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FF8533' }}>
                    Brand Guidelines Compliance Prompts:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.78rem', lineHeight: '1.5' }}>
                    {result.manual_review_prompts.map((prompt, i) => (
                      <li key={i}>{prompt}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
