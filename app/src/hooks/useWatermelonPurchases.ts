import { useEffect, useState, useMemo } from 'react'
import { database } from '../database'
import { Q } from '@nozbe/watermelondb'

export interface PurchaseWithPartner {
    id: string
    partner_name: string
    crop_name: string
    quantity: number
    rate: number
    total_amount: number
    purchase_date: string
}

export const useWatermelonPurchases = () => {
    const [purchases, setPurchases] = useState<any[]>([])
    const [partners, setPartners] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Reactive Subscription to WatermelonDB
    useEffect(() => {
        const purchasesQuery = database.get('purchases').query()
        const partnersQuery = database.get('partners').query()

        const purchasesSub = purchasesQuery.observe().subscribe(data => {
            setPurchases(data)
            setIsLoading(false)
        })

        const partnersSub = partnersQuery.observe().subscribe(data => {
            setPartners(data)
        })

        return () => {
            purchasesSub.unsubscribe()
            partnersSub.unsubscribe()
        }
    }, [])

    // Transform purchases with partner info
    const enrichedPurchases = useMemo(() => {
        return purchases.map((purchase: any) => {
            const partner = partners.find((p: any) => p.id === purchase.partnerId)

            return {
                id: purchase.id,
                partner_name: partner?.name || 'Unknown Partner',
                crop_name: purchase.cropName,
                quantity: purchase.quantity,
                rate: purchase.rate,
                total_amount: purchase.totalAmount,
                purchase_date: purchase.purchaseDate
            } as PurchaseWithPartner
        })
    }, [purchases, partners])

    // Filter by crop name
    const getPurchasesByCrop = (cropName: string): PurchaseWithPartner[] => {
        return enrichedPurchases.filter(p => p.crop_name === cropName)
    }

    // Get single purchase
    const getPurchase = (purchaseId: string): PurchaseWithPartner | undefined => {
        return enrichedPurchases.find(p => p.id === purchaseId)
    }

    // Create Buy Transaction (Batch: Invoice + Purchases + Stock Update)
    const createBuyTransaction = async (
        partnerId: string,
        items: { stockItemId: string; cropName: string; quantity: number; rate: number; total: number }[],
        paymentDetails: { totalValue: number; paidAmount: number; paymentStatus: string }
    ) => {
        try {
            await database.write(async () => {
                const batchOperations = []
                const invoiceCollection = database.get('invoices')
                const purchaseCollection = database.get('purchases')
                const stockCollection = database.get('stock_items')

                // 1. Create Invoice
                const newInvoice = invoiceCollection.prepareCreate((inv: any) => {
                    inv.partnerId = partnerId
                    inv.totalValue = paymentDetails.totalValue
                    inv.paidAmount = paymentDetails.paidAmount
                    inv.remainingAmount = paymentDetails.totalValue - paymentDetails.paidAmount
                    inv.paymentStatus = paymentDetails.paymentStatus
                })
                batchOperations.push(newInvoice)

                // 2. Create Purchases and Update Stock
                for (const item of items) {
                    // Create Purchase Record
                    const newPurchase = purchaseCollection.prepareCreate((p: any) => {
                        p.partnerId = partnerId
                        p.cropName = item.cropName
                        p.quantity = item.quantity
                        p.rate = item.rate
                        p.totalAmount = item.total
                        p.purchaseDate = new Date().toISOString()
                    })
                    batchOperations.push(newPurchase)

                    // Update Stock Item Quantity
                    try {
                        const stockItem = await stockCollection.find(item.stockItemId)
                        if (stockItem) {
                            const updatedStock = stockItem.prepareUpdate((s: any) => {
                                s.quantity = (s.quantity || 0) + item.quantity
                            })
                            batchOperations.push(updatedStock)
                        }
                    } catch (err) {
                        console.warn(`Stock item ${item.stockItemId} not found, skipping update`)
                    }
                }

                await database.batch(...batchOperations)
            })
            return true
        } catch (error) {
            console.error('Error creating buy transaction:', error)
            throw error
        }
    }

    // Create Sell Transaction (Batch: Invoice + Stock Update)
    const createSellTransaction = async (
        partnerId: string,
        items: { stockItemId: string; quantity: number; total: number }[],
        paymentDetails: { totalValue: number; paidAmount: number; paymentStatus: string }
    ) => {
        try {
            await database.write(async () => {
                const batchOperations = []
                const invoiceCollection = database.get('invoices')
                const stockCollection = database.get('stock_items')

                // 1. Create Invoice
                const newInvoice = invoiceCollection.prepareCreate((inv: any) => {
                    inv.partnerId = partnerId
                    inv.totalValue = paymentDetails.totalValue
                    inv.paidAmount = paymentDetails.paidAmount
                    inv.remainingAmount = paymentDetails.totalValue - paymentDetails.paidAmount
                    inv.paymentStatus = paymentDetails.paymentStatus
                })
                batchOperations.push(newInvoice)

                // 2. Update Stock Items (Decrement)
                for (const item of items) {
                    try {
                        const stockItem = await stockCollection.find(item.stockItemId)
                        if (stockItem) {
                            const updatedStock = stockItem.prepareUpdate((s: any) => {
                                s.quantity = Math.max(0, (s.quantity || 0) - item.quantity)
                            })
                            batchOperations.push(updatedStock)
                        }
                    } catch (err) {
                        console.warn(`Stock item ${item.stockItemId} not found, skipping update`)
                    }
                }

                await database.batch(...batchOperations)
            })
            return true
        } catch (error) {
            console.error('Error creating sell transaction:', error)
            throw error
        }
    }

    return {
        purchases: enrichedPurchases,
        getPurchasesByCrop,
        getPurchase,
        createBuyTransaction,
        createSellTransaction,
        isLoading,
        error: null
    }
}
