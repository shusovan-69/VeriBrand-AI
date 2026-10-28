import React, { useState, useEffect } from 'react';
import {
  BookOpenCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Tag
} from 'lucide-react';
import { guidelinesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function GuidelinesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  const [activeTab, setActiveTab] = useState('rules'); // 'rules' | 'facts'
  const [guidelines, setGuidelines] = useState([]);
  const [facts, setFacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modals state
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [showFactModal, setShowFactModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Rule Form State
  const [ruleCategory, setRuleCategory] = useState('prohibited_term');
  const [ruleTerm, setRuleTerm] = useState('');
  const [ruleReplacement, setRuleReplacement] = useState('');
  const [ruleReason, setRuleReason] = useState('');
  const [ruleSeverity, setRuleSeverity] = useState('high');

  // Fact Form State
  const [factProduct, setFactProduct] = useState('');
  const [factAttr, setFactAttr] = useState('battery_life');
  const [factStatement, setFactStatement] = useState('');
  const [factVal, setFactVal] = useState('');
  const [factUnit, setFactUnit] = useState('hours');
  const [factComparator, setFactComparator] = useState('up_to');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gRes, fRes] = await Promise.all([
        guidelinesApi.getGuidelines(),
        guidelinesApi.getFacts()
      ]);
      setGuidelines(gRes.data);
      setFacts(fRes.data);
    } catch (err) {
      console.error('Error fetching guidelines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveRule = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await guidelinesApi.updateGuideline(editingItem.guideline_id, {
          category: ruleCategory,
          term_or_pattern: ruleTerm,
          replacement: ruleReplacement,
          reason: ruleReason,
          severity: ruleSeverity
        });
      } else {
        await guidelinesApi.createGuideline({
          category: ruleCategory,
          term_or_pattern: ruleTerm,
          replacement: ruleReplacement,
          reason: ruleReason,
          severity: ruleSeverity
        });
      }
      setShowRuleModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save rule.');
    }
  };

  const handleSaveFact = async (e) => {
    e.preventDefault();
    try {
      const numVal = factVal ? parseFloat(factVal) : null;
      if (editingItem) {
        await guidelinesApi.updateFact(editingItem.fact_id, {
          product_name: factProduct,
          attribute: factAttr,
          statement: factStatement,
          numerical_value: numVal,
          numerical_unit: factUnit,
          numerical_comparator: factComparator
        });
      } else {
        await guidelinesApi.createFact({
          product_name: factProduct,
          attribute: factAttr,
          statement: factStatement,
          numerical_value: numVal,
          numerical_unit: factUnit,
          numerical_comparator: factComparator
        });
      }
      setShowFactModal(false);
      setEditingItem(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to save product specification.');
    }
  };

  const openEditRule = (rule) => {
    setEditingItem(rule);
    setRuleCategory(rule.category);
    setRuleTerm(rule.term_or_pattern);
    setRuleReplacement(rule.replacement || '');
    setRuleReason(rule.reason);
    setRuleSeverity(rule.severity || 'high');
    setShowRuleModal(true);
  };

  const openEditFact = (fact) => {
    setEditingItem(fact);
    setFactProduct(fact.product_name);
    setFactAttr(fact.attribute);
    setFactStatement(fact.statement);
    setFactVal(fact.numerical_value !== null ? String(fact.numerical_value) : '');
    setFactUnit(fact.numerical_unit || 'hours');
    setFactComparator(fact.numerical_comparator || 'up_to');
    setShowFactModal(true);
  };

  const filteredRules = guidelines.filter((r) =>
    r.term_or_pattern.toLowerCase().includes(search.toLowerCase()) ||
    r.reason.toLowerCase().includes(search.toLowerCase()) ||
    r.rule_id.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFacts = facts.filter((f) =>
    f.product_name.toLowerCase().includes(search.toLowerCase()) ||
    f.statement.toLowerCase().includes(search.toLowerCase()) ||
    f.source_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <BookOpenCheck size={24} color="#FF6500" />
            Approved Brand Guidelines & Verified Facts
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255, 255, 255, 0.45)', marginTop: '4px' }}>
            Ground truth sources cited by the verification engine. Every edit preserves version numbers (v1.0, v1.1).
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeTab === 'rules' ? (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setRuleTerm('');
                  setRuleReplacement('');
                  setRuleReason('');
                  setShowRuleModal(true);
                }}
                className="btn-orange"
              >
                <Plus size={15} />
                Add Guideline Rule
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setFactProduct('Example Wireless Headphones');
                  setFactStatement('');
                  setFactVal('');
                  setShowFactModal(true);
                }}
                className="btn-orange"
              >
                <Plus size={15} />
                Add Approved Product Fact
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs & Search Filter */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
        <div style={{
          display: 'flex',
          background: '#111',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '12px',
          padding: '4px',
          gap: '4px'
        }}>
          <button
            onClick={() => setActiveTab('rules')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'rules' ? '1px solid rgba(255, 101, 0, 0.3)' : '1px solid transparent',
              background: activeTab === 'rules' ? 'rgba(255, 101, 0, 0.15)' : 'transparent',
              color: activeTab === 'rules' ? '#FF8533' : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.2s',
            }}
          >
            Brand Terminology & Tone Rules ({guidelines.length})
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            style={{
              padding: '8px 16px',
              borderRadius: '9px',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeTab === 'facts' ? '1px solid rgba(255, 101, 0, 0.3)' : '1px solid transparent',
              background: activeTab === 'facts' ? 'rgba(255, 101, 0, 0.15)' : 'transparent',
              color: activeTab === 'facts' ? '#FF8533' : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.2s',
            }}
          >
            Approved Product Facts ({facts.length})
          </button>
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === 'rules' ? 'rules' : 'facts'}...`}
            className="input-dark"
            style={{ paddingLeft: '36px', fontSize: '0.78rem', padding: '8px 12px 8px 36px' }}
          />
        </div>
      </div>

      {/* Tab 1: Rules Table */}
      {activeTab === 'rules' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              Loading rules...
            </div>
          ) : filteredRules.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              No brand rules match search query.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}>
                    <th style={{ padding: '14px 18px' }}>Rule ID & Version</th>
                    <th style={{ padding: '14px 18px' }}>Category</th>
                    <th style={{ padding: '14px 18px' }}>Target Term / Phrase</th>
                    <th style={{ padding: '14px 18px' }}>Preferred Replacement</th>
                    <th style={{ padding: '14px 18px' }}>Reason / Standard</th>
                    {isAdmin && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule, idx) => (
                    <tr
                      key={rule.guideline_id}
                      style={{
                        borderBottom: idx < filteredRules.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{rule.rule_id}</div>
                        <span style={{ fontSize: '0.7rem', color: '#FF8533', fontWeight: 600 }}>{rule.version_id}</span>
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: rule.category === 'prohibited_term' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 101, 0, 0.12)',
                          border: rule.category === 'prohibited_term' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 101, 0, 0.3)',
                          color: rule.category === 'prohibited_term' ? '#f87171' : '#FF8533',
                        }}>
                          {rule.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: 700, color: '#f87171' }}>
                        "{rule.term_or_pattern}"
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#34d399' }}>
                        {rule.replacement ? `"${rule.replacement}"` : '— (Omit)'}
                      </td>
                      <td style={{ padding: '14px 18px', color: 'rgba(255, 255, 255, 0.65)', maxWidth: '320px', lineHeight: '1.4' }}>
                        {rule.reason}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => openEditRule(rule)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.6)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,101,0,0.4)'; e.currentTarget.style.color = '#FF8533'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
                            title="Edit rule (bumps version)"
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Facts Table */}
      {activeTab === 'facts' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              Loading approved specifications...
            </div>
          ) : filteredFacts.length === 0 ? (
            <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.4)' }}>
              No approved specifications match search query.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    background: 'rgba(0, 0, 0, 0.25)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}>
                    <th style={{ padding: '14px 18px' }}>Source ID & Version</th>
                    <th style={{ padding: '14px 18px' }}>Product Name</th>
                    <th style={{ padding: '14px 18px' }}>Attribute</th>
                    <th style={{ padding: '14px 18px' }}>Verified Specification Statement</th>
                    <th style={{ padding: '14px 18px' }}>Numerical Bound</th>
                    {isAdmin && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredFacts.map((fact, idx) => (
                    <tr
                      key={fact.fact_id}
                      style={{
                        borderBottom: idx < filteredFacts.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                        transition: 'background 0.2s',
                      }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace' }}>
                        <div style={{ fontWeight: 700, color: '#FF8533' }}>{fact.source_id}</div>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.4)', fontWeight: 600 }}>{fact.version_id}</span>
                      </td>
                      <td style={{ padding: '14px 18px', fontWeight: 600, color: '#fff' }}>
                        {fact.product_name}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          color: 'rgba(255, 255, 255, 0.75)',
                          fontFamily: 'monospace',
                          fontSize: '0.72rem',
                        }}>
                          {fact.attribute}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'rgba(255, 255, 255, 0.8)', maxWidth: '340px', lineHeight: '1.4' }}>
                        "{fact.statement}"
                      </td>
                      <td style={{ padding: '14px 18px', fontFamily: 'monospace', color: '#34d399' }}>
                        {fact.numerical_value !== null ? (
                          <span>{fact.numerical_comparator} {fact.numerical_value} {fact.numerical_unit}</span>
                        ) : (
                          <span style={{ color: 'rgba(255, 255, 255, 0.4)' }}>Qualitative</span>
                        )}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <button
                            onClick={() => openEditFact(fact)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '8px',
                              background: 'rgba(255, 255, 255, 0.04)',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: 'rgba(255, 255, 255, 0.6)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,101,0,0.4)'; e.currentTarget.style.color = '#FF8533'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'; }}
                            title="Edit specification (bumps version and triggers source-change alerts)"
                          >
                            <Edit2 size={13} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add / Edit Rule */}
      {showRuleModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid rgba(255, 101, 0, 0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {editingItem ? `Edit Brand Rule (${editingItem.rule_id})` : 'Create Brand Guideline Rule'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)', margin: '6px 0 20px 0' }}>
              {editingItem ? 'Saving modifications will bump the version (e.g. v1.1) and alert historical citations.' : 'Define terminology and brand tone principles enforced by the verification engine.'}
            </p>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Category</label>
                <select
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value)}
                  className="input-dark"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="prohibited_term" style={{ background: '#161616', color: '#fff' }}>Prohibited Term (Breach)</option>
                  <option value="preferred_term" style={{ background: '#161616', color: '#fff' }}>Preferred Terminology (Recommendation)</option>
                  <option value="prohibited_claim" style={{ background: '#161616', color: '#fff' }}>Prohibited Promotional Claim</option>
                  <option value="tone_principle" style={{ background: '#161616', color: '#fff' }}>Tone Principle</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Target Term / Phrase</label>
                <input
                  type="text"
                  required
                  value={ruleTerm}
                  onChange={(e) => setRuleTerm(e.target.value)}
                  placeholder="e.g. AI proof, revolutionary miracle"
                  className="input-dark"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Preferred Replacement (Optional)</label>
                <input
                  type="text"
                  value={ruleReplacement}
                  onChange={(e) => setRuleReplacement(e.target.value)}
                  placeholder="e.g. evidence-first brand governance"
                  className="input-dark"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Reason / Standard</label>
                <textarea
                  required
                  rows={3}
                  value={ruleReason}
                  onChange={(e) => setRuleReason(e.target.value)}
                  placeholder="Why this rule exists (e.g. FTC substantiation guidance forbids absolute guarantee claims)."
                  className="input-dark"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Severity</label>
                <select
                  value={ruleSeverity}
                  onChange={(e) => setRuleSeverity(e.target.value)}
                  className="input-dark"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="critical" style={{ background: '#161616', color: '#fff' }}>Critical (Blocks approval without override)</option>
                  <option value="high" style={{ background: '#161616', color: '#fff' }}>High</option>
                  <option value="medium" style={{ background: '#161616', color: '#fff' }}>Medium</option>
                  <option value="low" style={{ background: '#161616', color: '#fff' }}>Low</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-orange"
                >
                  {editingItem ? 'Update Rule & Bump Version' : 'Save Brand Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Product Fact */}
      {showFactModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px', border: '1px solid rgba(255, 101, 0, 0.3)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {editingItem ? `Edit Product Fact (${editingItem.source_id})` : 'Add Verified Product Specification'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.45)', margin: '6px 0 20px 0' }}>
              Ground truth specification for factual verification and numerical claims comparison.
            </p>

            <form onSubmit={handleSaveFact} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem' }}>
              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Product Name</label>
                <input
                  type="text"
                  required
                  value={factProduct}
                  onChange={(e) => setFactProduct(e.target.value)}
                  placeholder="e.g. Example Wireless Headphones"
                  className="input-dark"
                />
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Attribute</label>
                <select
                  value={factAttr}
                  onChange={(e) => setFactAttr(e.target.value)}
                  className="input-dark"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="battery_life" style={{ background: '#161616', color: '#fff' }}>battery_life</option>
                  <option value="water_resistance" style={{ background: '#161616', color: '#fff' }}>water_resistance</option>
                  <option value="warranty" style={{ background: '#161616', color: '#fff' }}>warranty</option>
                  <option value="storage" style={{ background: '#161616', color: '#fff' }}>storage</option>
                  <option value="general_specification" style={{ background: '#161616', color: '#fff' }}>general_specification</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Verified Statement</label>
                <textarea
                  required
                  rows={2}
                  value={factStatement}
                  onChange={(e) => setFactStatement(e.target.value)}
                  placeholder="e.g. Battery life: up to 12 hours under standard testing conditions."
                  className="input-dark"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Comparator</label>
                  <select
                    value={factComparator}
                    onChange={(e) => setFactComparator(e.target.value)}
                    className="input-dark"
                    style={{ cursor: 'pointer' }}
                  >
                    <option value="up_to" style={{ background: '#161616', color: '#fff' }}>Up to (Max bound)</option>
                    <option value="exact" style={{ background: '#161616', color: '#fff' }}>Exact match</option>
                    <option value="min" style={{ background: '#161616', color: '#fff' }}>Minimum bound</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Numerical Value</label>
                  <input
                    type="number"
                    step="any"
                    value={factVal}
                    onChange={(e) => setFactVal(e.target.value)}
                    placeholder="e.g. 12"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'rgba(255, 255, 255, 0.6)', fontWeight: 600, marginBottom: '6px' }}>Unit</label>
                  <input
                    type="text"
                    value={factUnit}
                    onChange={(e) => setFactUnit(e.target.value)}
                    placeholder="e.g. hours"
                    className="input-dark"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <button
                  type="button"
                  onClick={() => setShowFactModal(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-orange"
                >
                  {editingItem ? 'Update Fact & Alert Citations' : 'Save Approved Fact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
