import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Building2,
  Sparkles,
  MapPin,
  RefreshCw,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'Road Infrastructure',
  'Public Safety',
  'Civic Governance',
  'Monsoon Advisory',
  'Traffic & Transit',
  'General Civic Notice',
];

const PRIORITIES = ['Critical', 'High', 'Normal', 'Advisory'];

export default function StatementsTab({
  statements = [],
  isLoading = false,
  onRefresh,
  onCreateStatement,
  onUpdateStatement,
  onDeleteStatement,
  onTriggerToast,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [activeStatement, setActiveStatement] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: '',
    statementText: '',
    category: 'Road Infrastructure',
    priority: 'Normal',
    city: 'Pune',
    isActive: true,
  });

  const openCreateModal = () => {
    setForm({
      title: '',
      statementText: '',
      category: 'Road Infrastructure',
      priority: 'Normal',
      city: 'Pune',
      isActive: true,
    });
    setActiveStatement(null);
    setModalMode('create');
  };

  const openEditModal = (stmt) => {
    setForm({
      title: stmt.title,
      statementText: stmt.statementText || stmt.statement_text || '',
      category: stmt.category || 'Road Infrastructure',
      priority: stmt.priority || 'Normal',
      city: stmt.city || 'Pune',
      isActive: stmt.isActive !== false && stmt.is_active !== false,
    });
    setActiveStatement(stmt);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveStatement(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      onTriggerToast?.('Statement title is required.', 'error');
      return;
    }
    if (!form.statementText.trim()) {
      onTriggerToast?.('Statement message body is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await onCreateStatement(form);
      } else if (modalMode === 'edit' && activeStatement) {
        await onUpdateStatement(activeStatement.id, form);
      }
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (stmt) => {
    const currentActive = stmt.isActive !== false && stmt.is_active !== false;
    await onUpdateStatement(stmt.id, { isActive: !currentActive });
  };

  // Filtered statements
  const filteredStatements = statements.filter((stmt) => {
    const text = (stmt.statementText || stmt.statement_text || '').toLowerCase();
    const title = (stmt.title || '').toLowerCase();
    const city = (stmt.city || '').toLowerCase();
    const q = searchQuery.toLowerCase();

    const matchesSearch = !q || title.includes(q) || text.includes(q) || city.includes(q);
    const matchesCategory =
      selectedCategory === 'All' || stmt.category === selectedCategory;
    const matchesPriority =
      selectedPriority === 'All' || stmt.priority === selectedPriority;

    return matchesSearch && matchesCategory && matchesPriority;
  });

  const getPriorityBadge = (priority) => {
    const p = (priority || 'normal').toLowerCase();
    if (p === 'critical') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (p === 'high') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (p === 'advisory') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Dashboard Statements & Civic Bulletins
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Publish official municipal statements, audit summaries, and safety bulletins that persist in the database and display on civic dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publish Statement</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search statements by title, content or city..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-600/20"
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Statements List Grid */}
      {isLoading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <RefreshCw className="w-6 h-6 text-cyan-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading statements from database...</p>
        </div>
      ) : filteredStatements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 p-6">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">No Statements Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No statements match your current search or filters.'
              : 'There are no municipal statements published yet. Click "Publish Statement" to create one.'}
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Statement</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStatements.map((stmt) => {
            const isActive = stmt.isActive !== false && stmt.is_active !== false;
            const body = stmt.statementText || stmt.statement_text || '';
            const author = stmt.authorName || stmt.author_name || 'Urban Governance Board';
            const city = stmt.city || 'Pune';
            const created = stmt.createdAt || stmt.created_at;
            const dateStr = created
              ? new Date(created).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={stmt.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all duration-200 flex flex-col justify-between ${
                  isActive ? 'border-slate-200 hover:shadow-md' : 'border-slate-200/60 opacity-75 bg-slate-50/50'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                          stmt.priority
                        )}`}
                      >
                        {stmt.priority || 'Normal'}
                      </span>
                      <span className="text-[10px] font-semibold text-cyan-800 bg-cyan-50 px-2 py-0.5 rounded-full border border-cyan-200">
                        {stmt.category}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {isActive ? 'Published' : 'Archived'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {stmt.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-4">
                    {body}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-600 font-medium">
                      <Building2 className="w-3 h-3 text-cyan-700" />
                      <span>{author}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{city}</span>
                    </span>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{dateStr}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(stmt)}
                    title={isActive ? 'Archive statement' : 'Publish statement'}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer text-xs flex items-center gap-1"
                  >
                    {isActive ? <EyeOff className="w-3.5 h-3.5 text-slate-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-600" />}
                    <span className="text-[11px] font-medium">{isActive ? 'Archive' : 'Publish'}</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEditModal(stmt)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition cursor-pointer"
                      title="Edit statement"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete statement "${stmt.title}" permanently?`)) {
                          onDeleteStatement(stmt.id);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 transition cursor-pointer"
                      title="Delete statement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-cyan-50 text-cyan-700">
                  <FileText className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {modalMode === 'create' ? 'Publish Official Statement' : 'Edit Dashboard Statement'}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statement Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Monsoon Road Maintenance Protocol & SLA Notice"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    City Zone
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="e.g. Pune, Delhi"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Statement Message & Directives *
                </label>
                <textarea
                  rows={5}
                  value={form.statementText}
                  onChange={(e) => setForm({ ...form, statementText: e.target.value })}
                  placeholder="Detail the municipal directive, public notification, audit findings, or safety advisory..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600/20 focus:border-cyan-600"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Publish to Dashboard immediately (active on public citizen view)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#0c6b82] hover:bg-[#0a5c70] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : modalMode === 'create'
                      ? 'Publish Bulletin'
                      : 'Update Statement'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
