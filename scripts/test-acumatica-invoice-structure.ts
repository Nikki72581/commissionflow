/**
 * Test script to inspect the actual structure of invoice data from Acumatica
 *
 * Usage: npx tsx scripts/test-acumatica-invoice-structure.ts
 *
 * This will fetch a single invoice and show you the complete structure,
 * particularly focusing on the Commissions field and how salesperson data is nested.
 */

import { createAcumaticaClient } from '../src/lib/acumatica/client'

async function testInvoiceStructure() {
  // Hardcoded from your .env.local - update if credentials change
  const instanceUrl = 'https://islandparts.acumatica.com/'
  const apiVersion = '24.200.001'
  const companyId = 'Production'
  const username = 'NicoleRonchetti'
  const password = 'Nicole@01'

  console.log('Configuration:')
  console.log('Instance URL:', instanceUrl)
  console.log('API Version:', apiVersion)
  console.log('Company ID:', companyId)
  console.log('Username:', username)
  console.log()

  const client = createAcumaticaClient({
    instanceUrl,
    apiVersion,
    companyId,
    credentials: {
      type: 'password',
      username,
      password,
    },
  })

  try {
    console.log('Authenticating...')
    await client.authenticate()
    console.log('✓ Authenticated successfully\n')

    // Fetch just one invoice
    console.log('Fetching a single invoice...')
    const invoices = await client.fetchInvoices({
      startDate: new Date('2024-01-01'),
      endDate: new Date(),
      includeInvoices: true,
      includeCreditMemos: false,
      includeDebitMemos: false,
    })

    if (invoices.length === 0) {
      console.log('No invoices found in the date range')
      return
    }

    const invoice = invoices[0]
    console.log('\n=== INVOICE STRUCTURE ===')
    console.log('Reference Number:', invoice.ReferenceNbr?.value)
    console.log('\n--- Full Invoice JSON ---')
    console.log(JSON.stringify(invoice, null, 2))

    console.log('\n--- Commissions Field ---')
    console.log(JSON.stringify(invoice.Commissions, null, 2))

    console.log('\n--- SalesPersons Array ---')
    console.log(JSON.stringify(invoice.Commissions?.SalesPersons, null, 2))

    if (invoice.Commissions?.SalesPersons && invoice.Commissions.SalesPersons.length > 0) {
      console.log('\n✓ Found', invoice.Commissions.SalesPersons.length, 'salesperson(s)')
      console.log('First salesperson:', JSON.stringify(invoice.Commissions.SalesPersons[0], null, 2))
    } else {
      console.log('\n✗ No salespersons found in Commissions.SalesPersons')
      console.log('\nChecking if salesperson data might be elsewhere...')
      console.log('Keys in invoice:', Object.keys(invoice))
      if (invoice.Commissions) {
        console.log('Keys in Commissions:', Object.keys(invoice.Commissions))
      }
    }

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await client.logout()
  }
}

testInvoiceStructure()
