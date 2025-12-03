import { NextResponse } from 'next/server'
import { getCommissionTrends } from '@/app/actions/dashboard'

export async function GET() {
  try {
    const result = await getCommissionTrends(12) // Last 12 months
    return NextResponse.json(result)
  } catch (error) {
    console.error('Commission trends API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch commission trends' },
      { status: 500 }
    )
  }
}
