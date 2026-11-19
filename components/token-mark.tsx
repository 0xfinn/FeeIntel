'use client'

import { useState } from 'react'

type TokenMarkProps = {
  symbol: string
  accent: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'large'
}

function safeImageUrl(value?: string) {
  if (!value) return undefined

  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

export function TokenMark({ symbol, accent, imageUrl, size = 'md' }: TokenMarkProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string>()
  const source = safeImageUrl(imageUrl)
  const showImage = source && failedImageUrl !== source
  const sizeClass = size === 'sm' ? 'token-mark-sm' : size === 'large' ? 'token-mark-large' : ''

  return (
    <span className={`token-mark token-${accent} ${sizeClass}${showImage ? '' : ' token-mark-fallback'}`} aria-hidden="true">
      {showImage ? (
        <img
          src={source}
          alt=""
          loading={size === 'large' ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => setFailedImageUrl(source)}
        />
      ) : (
        <span>{symbol.trim().slice(0, 1).toUpperCase() || '?'}</span>
      )}
    </span>
  )
}
