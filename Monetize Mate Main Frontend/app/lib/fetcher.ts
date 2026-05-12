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
    // const { timeoutMs = 15000, ...rest } = init
    const { timeoutMs = 60000, ...rest } = init  // 60s instead of 15s

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

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

        const isJson = (res.headers.get('content-type') || '').includes('application/json')
        const body = isJson ? await res.json() : await res.text()

        if (!res.ok) {
            const message = (typeof body === 'object' && body?.message) || res.statusText || 'Request failed'
            throw new ApiError(message, res.status, body)
        }

        return body as T
    } finally {
        clearTimeout(timeout)
    }
}
