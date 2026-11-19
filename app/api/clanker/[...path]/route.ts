const CLANKER_API_BASE = 'https://www.clanker.world'

function isAllowedPath(path: string) {
  return path === 'tokens/trending'
    || path === 'tokens/fetch-deployed-by-address'
    || /^tokens\/0x[a-f\d]{40}\/(?:fees|market)$/i.test(path)
    || /^wallet\/0x[a-f\d]{40}\/creator-fees$/i.test(path)
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const endpoint = path.join('/')

  if (!isAllowedPath(endpoint)) {
    return Response.json({ error: 'Unsupported Clanker API endpoint.' }, { status: 404 })
  }

  const requestUrl = new URL(request.url)
  const upstreamUrl = new URL(`/api/${path.map(encodeURIComponent).join('/')}${requestUrl.search}`, CLANKER_API_BASE)

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 15 },
    })
    const contentType = upstream.headers.get('content-type') ?? 'application/json'

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': upstream.ok ? 'public, s-maxage=15, stale-while-revalidate=45' : 'no-store',
      },
    })
  } catch {
    return Response.json({ error: 'The Clanker API is temporarily unavailable.' }, { status: 502 })
  }
}
