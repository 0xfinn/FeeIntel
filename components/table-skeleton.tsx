type TableSkeletonProps = {
  columns: number
  variant: 'dashboard' | 'portfolio'
}

export function TableSkeleton({ columns, variant }: TableSkeletonProps) {
  return (
    <tr>
      <td colSpan={columns} className="table-loading-cell">
        <div className={`table-skeleton table-skeleton-${variant}`} role="status" aria-label="Loading token data">
          <span className="sr-only">Loading live token data…</span>
          {Array.from({ length: 4 }, (_, row) => (
            <div className="table-skeleton-row" key={row} aria-hidden="true">
              <div className="skeleton-token-cell"><i /><span><i /><i /></span></div>
              {Array.from({ length: columns - 1 }, (_, column) => (
                <i className={`skeleton-line skeleton-line-${column % 3}`} key={column} />
              ))}
            </div>
          ))}
        </div>
      </td>
    </tr>
  )
}
