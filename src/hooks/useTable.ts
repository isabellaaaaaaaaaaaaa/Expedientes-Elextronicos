import { useState, useCallback, useMemo } from 'react';

export type SortDir = 'asc' | 'desc';

export function useTableSelection() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  return { selectedIds, toggleOne, toggleAll, selectAll, clearSelection, isSelected, count: selectedIds.size };
}

export function useTableSort<K extends string>(defaultKey: K, defaultDir: SortDir = 'asc') {
  const [sortKey, setSortKey] = useState<K>(defaultKey);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const toggleSort = useCallback((key: K) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey]);

  return { sortKey, sortDir, toggleSort };
}

export function useTablePagination(totalItems: number, pageSize: number) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(page, totalPages - 1);

  const pageItems = useMemo(
    () => ({ start: currentPage * pageSize, end: (currentPage + 1) * pageSize }),
    [currentPage, pageSize],
  );

  const resetPage = useCallback(() => setPage(0), []);

  return { page: currentPage, setPage, totalPages, pageItems, resetPage };
}
