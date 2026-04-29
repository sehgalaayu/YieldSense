import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Lock, LogOut, Pencil, Save, X, Trash2, Download, Plus, ChevronDown, ChevronUp, Loader2, Database, BarChart3, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { seedDemoAccount } from '../lib/seedDemoData';

interface FDRate {
  id: string; bank_name: string; bank_type: string; tenor_months: number;
  gross_rate: number; senior_rate?: number; dicgc_insured: boolean;
  rating?: string; min_amount?: number; max_amount?: number;
  is_active?: boolean; last_updated?: string; [key: string]: any;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Data
  const [rates, setRates] = useState<FDRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRate, setEditRate] = useState(0);
  const [editSeniorRate, setEditSeniorRate] = useState(0);
  const [toast, setToast] = useState('');

  // Add bank
  const [showAdd, setShowAdd] = useState(false);
  const [newBank, setNewBank] = useState({ bank_name: '', bank_type: 'Private', tenor_months: 12, gross_rate: 7.0, senior_rate: 7.5, dicgc_insured: true, rating: 'A', min_amount: 5000, max_amount: 1000000000 });

  // Bulk update
  const [showBulk, setShowBulk] = useState(false);
  const [bulkBank, setBulkBank] = useState('');
  const [basisPoints, setBasisPoints] = useState(0.25);

  // Demo
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('ws_admin') === 'true') setAuthenticated(true);
  }, []);

  const handleLogin = () => {
    if (password === (import.meta.env.VITE_ADMIN_PASSWORD || 'wealthsense2026')) {
      setAuthenticated(true);
      sessionStorage.setItem('ws_admin', 'true');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
    sessionStorage.removeItem('ws_admin');
  };

  // Load rates
  useEffect(() => {
    if (!authenticated) return;
    setLoading(true);
    supabase.from('fd_rates').select('*').order('bank_name').order('tenor_months')
      .then(({ data }) => { if (data) setRates(data as FDRate[]); setLoading(false); });
  }, [authenticated]);

  const uniqueBanks = useMemo(() => [...new Set(rates.map(r => r.bank_name))], [rates]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleSaveRate = async (row: FDRate) => {
    const { error } = await supabase.from('fd_rates')
      .update({ gross_rate: editRate, senior_rate: editSeniorRate, last_updated: new Date().toISOString().split('T')[0] })
      .eq('id', row.id);
    if (!error) {
      setRates(prev => prev.map(r => r.id === row.id ? { ...r, gross_rate: editRate, senior_rate: editSeniorRate } : r));
      showToast('Rate updated ✓');
    }
    setEditingId(null);
  };

  const handleToggleActive = async (row: FDRate) => {
    const newActive = !(row.is_active ?? true);
    await supabase.from('fd_rates').update({ is_active: newActive }).eq('id', row.id);
    setRates(prev => prev.map(r => r.id === row.id ? { ...r, is_active: newActive } : r));
    showToast(newActive ? 'Bank activated ✓' : 'Bank deactivated');
  };

  const handleDeleteRate = async (id: string) => {
    await supabase.from('fd_rates').delete().eq('id', id);
    setRates(prev => prev.filter(r => r.id !== id));
    showToast('Rate deleted');
  };

  const handleAddBank = async () => {
    const { data, error } = await supabase.from('fd_rates')
      .insert({ ...newBank, last_updated: new Date().toISOString().split('T')[0], is_active: true })
      .select();
    if (data) { setRates(prev => [...prev, ...data as FDRate[]]); showToast('Bank added ✓'); setShowAdd(false); }
    if (error) showToast('Error: ' + error.message);
  };

  const handleBulkUpdate = async () => {
    const bankFDs = rates.filter(r => r.bank_name === bulkBank);
    await Promise.all(bankFDs.map(fd =>
      supabase.from('fd_rates').update({
        gross_rate: parseFloat((fd.gross_rate + basisPoints).toFixed(2)),
        last_updated: new Date().toISOString().split('T')[0],
      }).eq('id', fd.id)
    ));
    // Reload
    const { data } = await supabase.from('fd_rates').select('*').order('bank_name').order('tenor_months');
    if (data) setRates(data as FDRate[]);
    showToast(`Updated ${bankFDs.length} rates for ${bulkBank} by ${basisPoints > 0 ? '+' : ''}${basisPoints}%`);
    setShowBulk(false);
  };

  const exportCSV = () => {
    const headers = ['Bank Name', 'Type', 'Tenor (Months)', 'Gross Rate', 'Senior Rate', 'DICGC', 'Active'];
    const csv = [headers.join(','), ...rates.map(r =>
      [r.bank_name, r.bank_type, r.tenor_months, r.gross_rate, r.senior_rate ?? '', r.dicgc_insured ? 'Yes' : 'No', (r.is_active ?? true) ? 'Active' : 'Inactive'].join(',')
    )].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `wealthsense_fd_rates_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F1E] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-[#112240] rounded-2xl p-8 border border-[#1E3A5F] w-full max-w-sm">
          <div className="flex items-center justify-center w-14 h-14 bg-[#1A56DB]/20 rounded-xl mx-auto mb-5">
            <Lock size={28} className="text-[#1A56DB]" />
          </div>
          <h1 className="text-xl font-syne font-bold text-white text-center mb-1">WealthSense Admin</h1>
          <p className="text-[#64748B] text-sm text-center mb-6">Enter admin password to continue</p>
          <input type="password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Password" className="w-full bg-[#0A0F1E] border border-[#1E3A5F] rounded-xl py-3 px-4 text-white focus:border-[#1A56DB] outline-none mb-4" />
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button onClick={handleLogin}
            className="w-full py-3 bg-[#1A56DB] text-white font-bold rounded-xl hover:bg-[#1A56DB]/80 transition-all">
            Login
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-[#10B981] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-xl animate-fade-in-up">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">WealthSense Admin</h1>
          <p className="text-[#64748B] text-sm">FD Rate Management</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-4 py-2 bg-[#112240] border border-[#1E3A5F] text-[#94A3B8] rounded-lg text-sm hover:text-white transition-colors">
            <Download size={14} /> Export CSV
          </button>
          <button onClick={handleLogout} className="flex items-center gap-1.5 px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-colors">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { icon: <Database size={20} className="text-[#1A56DB]" />, label: 'Total Banks', value: uniqueBanks.length },
          { icon: <BarChart3 size={20} className="text-[#F59E0B]" />, label: 'Total FD Slabs', value: rates.length },
          { icon: <Clock size={20} className="text-[#10B981]" />, label: 'Last Updated', value: rates[0]?.last_updated || 'N/A' },
        ].map((s, i) => (
          <div key={i} className="bg-[#112240] rounded-xl p-5 border border-[#1E3A5F] flex items-center gap-4">
            <div className="p-2.5 bg-[#0A0F1E] rounded-lg">{s.icon}</div>
            <div>
              <div className="text-xs text-[#64748B] font-bold uppercase">{s.label}</div>
              <div className="text-lg text-white font-mono font-bold">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#1A56DB] text-white rounded-lg text-sm font-bold hover:bg-[#1A56DB]/80 transition-all">
          <Plus size={14} /> Add Bank
        </button>
        <button onClick={() => setShowBulk(!showBulk)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#112240] border border-[#1E3A5F] text-[#94A3B8] rounded-lg text-sm hover:text-white transition-colors">
          Bulk Update
        </button>
      </div>

      {/* Add Bank Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#112240] rounded-xl p-5 border border-[#1A56DB]/30 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input placeholder="Bank Name" value={newBank.bank_name} onChange={e => setNewBank({ ...newBank, bank_name: e.target.value })}
            className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none" />
          <select value={newBank.bank_type} onChange={e => setNewBank({ ...newBank, bank_type: e.target.value })}
            className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none">
            <option value="Private">Private</option>
            <option value="PSU">PSU</option>
            <option value="SmallFinance">Small Finance</option>
            <option value="NBFC">NBFC</option>
          </select>
          <input type="number" placeholder="Tenor (Months)" value={newBank.tenor_months} onChange={e => setNewBank({ ...newBank, tenor_months: Number(e.target.value) })}
            className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none" />
          <input type="number" step={0.25} placeholder="Gross Rate %" value={newBank.gross_rate} onChange={e => setNewBank({ ...newBank, gross_rate: Number(e.target.value) })}
            className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none" />
          <input type="number" step={0.25} placeholder="Senior Rate %" value={newBank.senior_rate} onChange={e => setNewBank({ ...newBank, senior_rate: Number(e.target.value) })}
            className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none" />
          <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
            <input type="checkbox" checked={newBank.dicgc_insured} onChange={e => setNewBank({ ...newBank, dicgc_insured: e.target.checked })} /> DICGC Insured
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button onClick={handleAddBank} className="px-4 py-2 bg-[#10B981] text-white font-bold rounded-lg text-sm">Add Bank</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-[#64748B] text-sm">Cancel</button>
          </div>
        </motion.div>
      )}

      {/* Bulk Update Form */}
      {showBulk && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-[#112240] rounded-xl p-5 border border-[#F59E0B]/30 mb-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs text-[#64748B] block mb-1">Bank</label>
            <select value={bulkBank} onChange={e => setBulkBank(e.target.value)}
              className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none min-w-[200px]">
              <option value="">Select bank...</option>
              {uniqueBanks.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#64748B] block mb-1">Change (%)</label>
            <input type="number" step={0.05} value={basisPoints} onChange={e => setBasisPoints(Number(e.target.value))}
              className="bg-[#0A0F1E] border border-[#1E3A5F] rounded-lg py-2 px-3 text-white text-sm outline-none w-24" />
          </div>
          <button onClick={handleBulkUpdate} disabled={!bulkBank}
            className="px-4 py-2 bg-[#F59E0B] text-black font-bold rounded-lg text-sm disabled:opacity-50">
            Apply {basisPoints > 0 ? '+' : ''}{basisPoints}%
          </button>
          <button onClick={() => setShowBulk(false)} className="px-4 py-2 text-[#64748B] text-sm">Cancel</button>
        </motion.div>
      )}

      {/* FD Rates Table */}
      <div className="bg-[#112240] rounded-xl border border-[#1E3A5F] overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#0D1A2E]">
              <tr className="text-[#64748B] text-xs uppercase tracking-wider">
                <th className="p-3 text-left">Bank Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-center">Tenor</th>
                <th className="p-3 text-center">Gross Rate</th>
                <th className="p-3 text-center">Senior Rate</th>
                <th className="p-3 text-center">DICGC</th>
                <th className="p-3 text-center">Active</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="p-8 text-center text-[#64748B]"><Loader2 className="animate-spin mx-auto" /></td></tr>
              ) : rates.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-[#64748B]">No rates found. Add banks above.</td></tr>
              ) : rates.map(r => (
                <tr key={r.id} className="border-t border-[#1E3A5F]/50 hover:bg-[#0D1A2E] transition-colors">
                  <td className="p-3 text-white font-bold">{r.bank_name}</td>
                  <td className="p-3 text-[#94A3B8]">{r.bank_type}</td>
                  <td className="p-3 text-center text-white font-mono">{r.tenor_months}m</td>
                  <td className="p-3 text-center">
                    {editingId === r.id ? (
                      <input type="number" step={0.05} value={editRate} onChange={e => setEditRate(Number(e.target.value))}
                        className="w-20 bg-[#0A0F1E] border border-[#1A56DB] rounded px-2 py-1 text-white text-center text-sm outline-none" />
                    ) : (
                      <span className="text-[#F59E0B] font-mono font-bold">{r.gross_rate}%</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {editingId === r.id ? (
                      <input type="number" step={0.05} value={editSeniorRate} onChange={e => setEditSeniorRate(Number(e.target.value))}
                        className="w-20 bg-[#0A0F1E] border border-[#1A56DB] rounded px-2 py-1 text-white text-center text-sm outline-none" />
                    ) : (
                      <span className="text-[#94A3B8] font-mono">{r.senior_rate ?? '-'}%</span>
                    )}
                  </td>
                  <td className="p-3 text-center">{r.dicgc_insured ? <span className="text-[#10B981]">✓</span> : <span className="text-red-400">✗</span>}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleToggleActive(r)}
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${(r.is_active ?? true) ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-red-500/20 text-red-400'}`}>
                      {(r.is_active ?? true) ? 'Active' : 'Off'}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    {editingId === r.id ? (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleSaveRate(r)} className="p-1 text-[#10B981] hover:text-white"><Save size={14} /></button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-[#64748B] hover:text-white"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => { setEditingId(r.id); setEditRate(r.gross_rate); setEditSeniorRate(r.senior_rate ?? r.gross_rate + 0.5); }}
                          className="p-1 text-[#64748B] hover:text-[#1A56DB]"><Pencil size={14} /></button>
                        <button onClick={() => handleDeleteRate(r.id)} className="p-1 text-[#64748B] hover:text-red-400"><Trash2 size={14} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demo Account Section */}
      <div className="rounded-xl border border-[#1E3A5F] bg-[#0D1A2E] p-5">
        <h3 className="text-white font-bold mb-2">🌱 Demo Account</h3>
        <p className="text-[#64748B] text-sm mb-4">
          Pre-loads demo data for presentations and testing.<br />
          Email: demo@wealthsense.in | Password: Demo@2026
        </p>
        <button onClick={async () => { setSeeding(true); await seedDemoAccount(); setSeeding(false); setSeedSuccess(true); }}
          disabled={seeding}
          className="px-4 py-2 bg-[#1A56DB] text-white font-bold rounded-lg text-sm disabled:opacity-50">
          {seeding ? 'Seeding...' : '🌱 Seed Demo Account'}
        </button>
        {seedSuccess && <p className="text-[#10B981] text-sm mt-2">✓ Demo account ready! Login with demo@wealthsense.in</p>}
      </div>
    </motion.div>
  );
}
