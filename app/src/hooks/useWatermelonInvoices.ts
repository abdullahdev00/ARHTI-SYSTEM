import { useEffect, useState, useMemo } from 'react'
import { database } from '../database'

export interface InvoiceWithPartner {
    id: string
    invoice_number: string
    partner_name: string
    partner_phone?: string
    total_value: number
    paid_amount: number
    remaining_amount: number
    payment_status: 'paid' | 'unpaid' | 'partial'
    created_at: string
}

export const useWatermelonInvoices = () => {
    const [invoices, setInvoices] = useState<any[]>([])
    const [partners, setPartners] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Reactive Subscription to WatermelonDB
    useEffect(() => {
        const invoicesQuery = database.get('invoices').query()
        const partnersQuery = database.get('partners').query()

        const invoicesSub = invoicesQuery.observe().subscribe(data => {
            setInvoices(data)
            setIsLoading(false)
        })

        const partnersSub = partnersQuery.observe().subscribe(data => {
            setPartners(data)
        })

        return () => {
            invoicesSub.unsubscribe()
            partnersSub.unsubscribe()
        }
    }, [])

    // Transform invoices with partner info
    const enrichedInvoices = useMemo(() => {
        return invoices.map((invoice: any) => {
            const partner = partners.find((p: any) => p.id === invoice.partnerId)
            const invoiceNumber = `INV-${new Date(invoice.createdAt).getTime()}`

            return {
                id: invoice.id,
                invoice_number: invoiceNumber,
                partner_name: partner?.name || 'Unknown Partner',
                partner_phone: partner?.phone,
                total_value: invoice.totalValue || 0,
                paid_amount: invoice.paidAmount || 0,
                remaining_amount: invoice.remainingAmount || 0,
                payment_status: invoice.paymentStatus || 'unpaid',
                created_at: invoice.createdAt?.toISOString() || new Date().toISOString(),
            } as InvoiceWithPartner
        })
    }, [invoices, partners])

    // Filter by status
    const invoicesByStatus = useMemo(() => ({
        paid: enrichedInvoices.filter(inv => inv.payment_status === 'paid'),
        unpaid: enrichedInvoices.filter(inv => inv.payment_status === 'unpaid'),
        partial: enrichedInvoices.filter(inv => inv.payment_status === 'partial')
    }), [enrichedInvoices])

    // Get single invoice
    const getInvoice = (invoiceId: string): InvoiceWithPartner | undefined => {
        return enrichedInvoices.find(inv => inv.id === invoiceId)
    }

    // Update invoice payment
    const updateInvoicePayment = async (invoiceId: string, paidAmount: number) => {
        try {
            await database.write(async () => {
                const invoice = await database.get('invoices').find(invoiceId)
                await invoice.update((inv: any) => {
                    inv.paidAmount = paidAmount
                    inv.remainingAmount = (inv.totalValue || 0) - paidAmount
                    inv.paymentStatus = paidAmount >= (inv.totalValue || 0) ? 'paid' :
                        paidAmount > 0 ? 'partial' : 'unpaid'
                })
            })
            return true
        } catch (error) {
            console.error('Error updating invoice payment:', error)
            throw error
        }
    }

    // Delete invoice
    const deleteInvoice = async (invoiceId: string) => {
        try {
            await database.write(async () => {
                const invoice = await database.get('invoices').find(invoiceId)
                await invoice.markAsDeleted()
            })
            return true
        } catch (error) {
            console.error('Error deleting invoice:', error)
            throw error
        }
    }

    return {
        invoices: enrichedInvoices,
        invoicesByStatus,
        getInvoice,
        updateInvoicePayment,
        deleteInvoice,
        isLoading,
        error: null
    }
}
