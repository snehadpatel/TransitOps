import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface SearchResult {
  type: 'vehicle' | 'driver' | 'trip';
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeClass?: string;
  link: string;
}

interface SearchResponse {
  vehicles: { id: string; registration_number: string; name_model: string; status: string }[];
  drivers: { id: string; name: string; license_number: string; status: string }[];
  trips: { id: string; trip_code: string; source: string; destination: string; status: string }[];
}

const RECENT_SEARCHES_KEY = 'transitops-recent-searches';

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) setRecentSearches(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const data = await api.get<SearchResponse>(`/search?q=${encodeURIComponent(q)}`);
      const combined: SearchResult[] = [
        ...(data.vehicles || []).map(v => ({
          type: 'vehicle' as const,
          id: v.id,
          title: v.registration_number,
          subtitle: v.name_model,
          badge: v.status,
          badgeClass: v.status === 'AVAILABLE' ? 'badge-available' : v.status === 'ON_TRIP' ? 'badge-on_trip' : 'badge-in_shop',
          link: '/fleet',
        })),
        ...(data.drivers || []).map(d => ({
          type: 'driver' as const,
          id: d.id,
          title: d.name,
          subtitle: d.license_number,
          badge: d.status,
          badgeClass: d.status === 'AVAILABLE' ? 'badge-available' : 'badge-off_duty',
          link: '/drivers',
        })),
        ...(data.trips || []).map(t => ({
          type: 'trip' as const,
          id: t.id,
          title: t.trip_code,
          subtitle: `${t.source} → ${t.destination}`,
          badge: t.status,
          badgeClass: t.status === 'COMPLETED' ? 'badge-completed' : t.status === 'DISPATCHED' ? 'badge-on_trip' : 'badge-draft',
          link: '/trips',
        })),
      ];
      setResults(combined);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(val), 300);
    } else {
      setResults([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : [];
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(prev => Math.min(prev + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      handleSelect(items[activeIdx]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setResults([]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    const updated = [query, ...recentSearches.filter(r => r !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    navigate(result.link);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  const typeIcon = (type: SearchResult['type']) => {
    if (type === 'vehicle') return 'fa-truck';
    if (type === 'driver') return 'fa-id-card';
    return 'fa-route';
  };

  const typeLabel = (type: SearchResult['type']) => {
    if (type === 'vehicle') return 'Vehicle';
    if (type === 'driver') return 'Driver';
    return 'Trip';
  };

  const showDropdown = isOpen && (query.length >= 2 || recentSearches.length > 0);

  return (
    <div ref={dropdownRef} className="navbar-search" style={{ maxWidth: '440px' }}>
      <i className="fas fa-magnifying-glass"></i>
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Search vehicles, drivers, trips…"
        autoComplete="off"
      />
      {loading && (
        <i className="fas fa-spinner fa-spin" style={{ position: 'absolute', right: '12px', color: 'var(--tx-text-muted)', fontSize: '0.85rem' }}></i>
      )}

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--tx-surface-solid)',
            border: '1px solid var(--tx-border)',
            borderRadius: 'var(--tx-radius-sm)',
            boxShadow: 'var(--tx-shadow-lg)',
            zIndex: 1040,
            overflow: 'hidden',
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {query.length < 2 && recentSearches.length > 0 && (
            <>
              <div style={{ padding: '8px 14px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-text-muted)' }}>
                Recent Searches
              </div>
              {recentSearches.map((s, i) => (
                <div
                  key={i}
                  onClick={() => { setQuery(s); doSearch(s); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--tx-text)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tx-primary-light)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <i className="fas fa-clock-rotate-left" style={{ color: 'var(--tx-text-muted)', fontSize: '0.85rem' }}></i>
                  {s}
                </div>
              ))}
            </>
          )}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="empty-state" style={{ padding: '30px' }}>
              <i className="fas fa-magnifying-glass"></i>
              <div>No results for "{query}"</div>
            </div>
          )}

          {results.length > 0 && (
            <>
              {['vehicle', 'driver', 'trip'].map(type => {
                const group = results.filter(r => r.type === type);
                if (group.length === 0) return null;
                return (
                  <React.Fragment key={type}>
                    <div style={{ padding: '8px 14px 4px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--tx-text-muted)', background: 'var(--tx-bg-alt)' }}>
                      <i className={`fas ${typeIcon(type as SearchResult['type'])}`} style={{ marginRight: '6px' }}></i>
                      {typeLabel(type as SearchResult['type'])}s
                    </div>
                    {group.map((r, i) => {
                      const globalIdx = results.indexOf(r);
                      return (
                        <div
                          key={r.id}
                          onClick={() => handleSelect(r)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            cursor: 'pointer',
                            background: globalIdx === activeIdx ? 'var(--tx-primary-light)' : 'transparent',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tx-primary-light)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = globalIdx === activeIdx ? 'var(--tx-primary-light)' : 'transparent')}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--tx-text)' }}>{r.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--tx-text-muted)' }}>{r.subtitle}</div>
                          </div>
                          {r.badge && <span className={`badge ${r.badgeClass}`}>{r.badge}</span>}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
