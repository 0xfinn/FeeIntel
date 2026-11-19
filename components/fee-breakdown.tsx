type FeeBreakdownProps = {
  claimedAmount?: string
  unclaimedAmount?: string
  claimedPercent?: number
  variant?: 'table' | 'summary'
}

export function FeeBreakdown({
  claimedAmount,
  unclaimedAmount,
  claimedPercent,
  variant = 'table',
}: FeeBreakdownProps) {
  const hasPercent = typeof claimedPercent === 'number' && Number.isFinite(claimedPercent)
  const percent = hasPercent ? Math.min(100, Math.max(0, claimedPercent)) : 0
  const ariaLabel = hasPercent
    ? `${percent}% of paired-asset fees claimed. Claimed ${claimedAmount ?? 'unavailable'}; unclaimed ${unclaimedAmount ?? 'unavailable'}.`
    : 'Fee claim breakdown unavailable.'

  return (
    <div className={`fee-breakdown fee-breakdown-${variant}`}>
      <div className="fee-breakdown-labels">
        <div>
          <span className="fee-breakdown-caption"><i className="claim-dot" /> Claimed</span>
          <strong>{claimedAmount ?? '—'}</strong>
        </div>
        <div>
          <span className="fee-breakdown-caption"><i className="unclaimed-dot" /> Unclaimed</span>
          <strong>{unclaimedAmount ?? '—'}</strong>
        </div>
      </div>
      <div className="fee-bar" role="img" aria-label={ariaLabel}>
        <span style={{ width: `${percent}%` }} />
      </div>
      {variant === 'summary' && (
        <div className="fee-breakdown-meta">
          <span>{hasPercent ? `${percent}% of paired-asset fees claimed` : 'Claim percentage unavailable'}</span>
          <span>Clanker reported balances</span>
        </div>
      )}
    </div>
  )
}
