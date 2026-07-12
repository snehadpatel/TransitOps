import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalRecords,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords);

  return (
    <div className="pagination-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* Records Info */}
        <div style={{ fontSize: '0.85rem', color: 'var(--tx-text-muted)' }}>
          Showing {startRecord}–{endRecord} of {totalRecords} records
        </div>

        {/* Page Size Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--tx-text-muted)' }}>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', padding: '4px 24px 4px 8px', fontSize: '0.85rem' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Pagination Controls */}
        <div className="pagination" style={{ display: 'flex', gap: '4px', margin: 0 }}>
          {/* Previous Button */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="page-link"
            style={{ 
              padding: '6px 12px', 
              border: '1px solid var(--tx-border)', 
              borderRadius: '8px',
              background: 'var(--tx-surface-solid)',
              color: 'var(--tx-text)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              opacity: currentPage === 1 ? 0.4 : 1,
            }}
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          {/* Page Numbers */}
          {getPageNumbers().map((page, idx) => (
            <React.Fragment key={idx}>
              {page === '...' ? (
                <span style={{ padding: '6px 8px', color: 'var(--tx-text-muted)' }}>…</span>
              ) : (
                <button
                  onClick={() => onPageChange(page as number)}
                  className="page-link"
                  style={{
                    padding: '6px 12px',
                    border: '1px solid var(--tx-border)',
                    borderRadius: '8px',
                    background: page === currentPage ? 'var(--tx-primary)' : 'var(--tx-surface-solid)',
                    color: page === currentPage ? '#fff' : 'var(--tx-text)',
                    fontWeight: page === currentPage ? 600 : 400,
                    cursor: 'pointer',
                    minWidth: '36px',
                  }}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}

          {/* Next Button */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="page-link"
            style={{
              padding: '6px 12px',
              border: '1px solid var(--tx-border)',
              borderRadius: '8px',
              background: 'var(--tx-surface-solid)',
              color: 'var(--tx-text)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              opacity: currentPage === totalPages ? 0.4 : 1,
            }}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
