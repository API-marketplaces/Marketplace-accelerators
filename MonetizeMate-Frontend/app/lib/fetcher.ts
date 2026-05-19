export class ApiError extends Error {
    status: number
    info: unknown

    constructor(message: string, status: number, info: unknown) {
        super(message)
        this.status = status
        this.info = info
    }
}

export async function apiFetch<T>(
    input: RequestInfo,
    init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
    const { timeoutMs = 30_000, ...rest } = init  // 30s — matches maxDuration on route handlers

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(new DOMException('Request timed out', 'AbortError')), timeoutMs)

    try {
        const res = await fetch(input, {
            ...rest,
            signal: controller.signal,
            credentials: 'include', // Send cookies for auth
            headers: {
                'Content-Type': 'application/json',
                ...(rest.headers ?? {}),
            },
        })

        // Read the body *before* clearing the timeout so the abort signal
        // stays alive for the full response stream.
        const isJson = (res.headers.get('content-type') || '').includes('application/json')
        const body = isJson ? await res.json() : await res.text()

        if (!res.ok) {
            const message = (typeof body === 'object' && body?.message) || res.statusText || 'Request failed'
            throw new ApiError(message, res.status, body)
        }

        return body as T
    } catch (err: any) {
        // Re-throw AbortError as-is so SWR's onErrorRetry can identify it
        // and retry instead of treating it as a permanent failure.
        if (err?.name === 'AbortError') throw err
        throw err
    } finally {
        clearTimeout(timeout)
    }
}