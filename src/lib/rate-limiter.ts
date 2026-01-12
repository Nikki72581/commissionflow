interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
}

/**
 * Simple in-memory rate limiter with sliding window
 */
class RateLimiter {
  private requests: Map<
    string,
    { timestamps: number[]; limit: number }
  > = new Map()

  async checkLimit(apiKeyId: string, limit: number): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - 3600000 // 1 hour window

    const key = `ratelimit:${apiKeyId}`
    let data = this.requests.get(key)

    if (!data) {
      data = { timestamps: [], limit }
      this.requests.set(key, data)
    }

    // Remove old timestamps outside window
    data.timestamps = data.timestamps.filter((t) => t > windowStart)

    const allowed = data.timestamps.length < limit

    if (allowed) {
      data.timestamps.push(now)
    }

    return {
      allowed,
      remaining: Math.max(0, limit - data.timestamps.length),
      resetAt: new Date(now + 3600000),
    }
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now()
    const windowStart = now - 3600000

    for (const [key, data] of this.requests.entries()) {
      data.timestamps = data.timestamps.filter((t) => t > windowStart)
      if (data.timestamps.length === 0) {
        this.requests.delete(key)
      }
    }
  }
}

export const rateLimiter = new RateLimiter()

// Cleanup every 5 minutes
if (typeof window === 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 300000)
}
