import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createSalesTransaction } from '@/app/actions/sales-transactions'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await request.json()

    // Validate required fields
    if (!data.amount || !data.transactionDate || !data.userId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, transactionDate, userId' },
        { status: 400 }
      )
    }

    // Create the sales transaction using the existing action
    const result = await createSalesTransaction({
      amount: parseFloat(data.amount),
      transactionDate: data.transactionDate,
      userId: data.userId,
      projectId: data.projectId || undefined,
      clientId: data.clientId || undefined,
      productCategoryId: data.productCategoryId || undefined,
      invoiceNumber: data.invoiceNumber || undefined,
      description: data.description || undefined,
      transactionType: data.transactionType || 'SALE',
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to create transaction' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Import API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
