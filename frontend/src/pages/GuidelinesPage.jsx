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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <BookOpenCheck className="h-6 w-6 text-cyan-400" />
            Approved Brand Guidelines & Verified Facts
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ground truth sources cited by the verification engine. Every edit preserves version numbers (v1.0, v1.1).
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            {activeTab === 'rules' ? (
              <button
                onClick={() => {
                  setEditingItem(null);
                  setRuleTerm('');
                  setRuleReplacement('');
                  setRuleReason('');
                  setShowRuleModal(true);
                }}
                className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                <Plus className="h-4 w-4" />
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
                className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all"
              >
                <Plus className="h-4 w-4" />
                Add Approved Product Fact
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Brand Terminology & Tone Rules ({guidelines.length})
          </button>
          <button
            onClick={() => setActiveTab('facts')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'facts'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Approved Product Facts ({facts.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === 'rules' ? 'rules' : 'facts'}...`}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Tab 1: Rules Table */}
      {activeTab === 'rules' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading rules...</div>
          ) : filteredRules.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No brand rules match search query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Rule ID & Version</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Target Term / Phrase</th>
                    <th className="py-3 px-4">Preferred Replacement</th>
                    <th className="py-3 px-4">Reason / Standard</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRules.map((rule) => (
                    <tr key={rule.guideline_id} className="hover:bg-slate-900/90 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-200">{rule.rule_id}</div>
                        <span className="text-[10px] text-cyan-400 font-semibold">{rule.version_id}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          rule.category === 'prohibited_term'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800/50'
                            : 'bg-indigo-950/60 text-indigo-300 border-indigo-800/50'
                        }`}>
                          {rule.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-rose-300 font-mono">
                        "{rule.term_or_pattern}"
                      </td>
                      <td className="py-3.5 px-4 text-emerald-300 font-mono">
                        {rule.replacement ? `"${rule.replacement}"` : '— (Omit)'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-xs leading-relaxed">
                        {rule.reason}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openEditRule(rule)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Edit rule (bumps version)"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading approved specifications...</div>
          ) : filteredFacts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No approved specifications match search query.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Source ID & Version</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Attribute</th>
                    <th className="py-3 px-4">Verified Specification Statement</th>
                    <th className="py-3 px-4">Numerical Bound</th>
                    {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredFacts.map((fact) => (
                    <tr key={fact.fact_id} className="hover:bg-slate-900/90 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-cyan-400">{fact.source_id}</div>
                        <span className="text-[10px] text-slate-400 font-semibold">{fact.version_id}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200">
                        {fact.product_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                          {fact.attribute}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium max-w-sm leading-relaxed">
                        "{fact.statement}"
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-400">
                        {fact.numerical_value !== null ? (
                          <span>{fact.numerical_comparator} {fact.numerical_value} {fact.numerical_unit}</span>
                        ) : 'Qualitative'}
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openEditFact(fact)}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                            title="Edit specification (bumps version and triggers source-change alerts)"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {editingItem ? `Edit Brand Rule (${editingItem.rule_id})` : 'Create Brand Guideline Rule'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {editingItem ? 'Saving modifications will bump the version (e.g. v1.1) and alert historical citations.' : 'Define terminology and brand tone principles enforced by the verification engine.'}
            </p>

            <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={ruleCategory}
                  onChange={(e) => setRuleCategory(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="prohibited_term">Prohibited Term (Breach)</option>
                  <option value="preferred_term">Preferred Terminology (Recommendation)</option>
                  <option value="prohibited_claim">Prohibited Promotional Claim</option>
                  <option value="tone_principle">Tone Principle</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Term / Phrase</label>
                <input
                  type="text"
                  required
                  value={ruleTerm}
                  onChange={(e) => setRuleTerm(e.target.value)}
                  placeholder="e.g. AI proof, revolutionary miracle"
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Preferred Replacement (Optional)</label>
                <input
                  type="text"
                  value={ruleReplacement}
                  onChange={(e) => setRuleReplacement(e.target.value)}
                  placeholder="e.g. evidence-first brand governance"
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason / Standard</label>
                <textarea
                  required
                  rows={3}
                  value={ruleReason}
                  onChange={(e) => setRuleReason(e.target.value)}
                  placeholder="Why this rule exists (e.g. FTC substantiation guidance forbids absolute guarantee claims)."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Severity</label>
                <select
                  value={ruleSeverity}
                  onChange={(e) => setRuleSeverity(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="critical">Critical (Blocks approval without explicit override)</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRuleModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {editingItem ? `Edit Product Fact (${editingItem.source_id})` : 'Add Verified Product Specification'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ground truth specification for factual verification and numerical claims comparison.
            </p>

            <form onSubmit={handleSaveFact} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={factProduct}
                  onChange={(e) => setFactProduct(e.target.value)}
                  placeholder="e.g. Example Wireless Headphones"
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Attribute</label>
                <select
                  value={factAttr}
                  onChange={(e) => setFactAttr(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="battery_life">battery_life</option>
                  <option value="water_resistance">water_resistance</option>
                  <option value="warranty">warranty</option>
                  <option value="storage">storage</option>
                  <option value="general_specification">general_specification</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Verified Statement</label>
                <textarea
                  required
                  rows={2}
                  value={factStatement}
                  onChange={(e) => setFactStatement(e.target.value)}
                  placeholder="e.g. Battery life: up to 12 hours under standard testing conditions."
                  className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Comparator</label>
                  <select
                    value={factComparator}
                    onChange={(e) => setFactComparator(e.target.value)}
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="up_to">Up to (Max bound)</option>
                    <option value="exact">Exact match</option>
                    <option value="min">Minimum bound</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Numerical Value</label>
                  <input
                    type="number"
                    step="any"
                    value={factVal}
                    onChange={(e) => setFactVal(e.target.value)}
                    placeholder="e.g. 12"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={factUnit}
                    onChange={(e) => setFactUnit(e.target.value)}
                    placeholder="e.g. hours"
                    className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowFactModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-md shadow-cyan-600/30"
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
