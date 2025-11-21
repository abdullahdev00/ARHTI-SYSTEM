import { useEffect, useState } from 'react'
import { database } from '../database'
import { Q } from '@nozbe/watermelondb'

// Variant interface matching Supabase structure
export interface StockVariant {
    id: string
    weight_kg: number
    rate_per_bag: number
    quantity: number
    total_value: number
}

export const useWatermelonStockItems = () => {
    const [stockItems, setStockItems] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Reactive Subscription to WatermelonDB
    useEffect(() => {
        const stockQuery = database.get('stock_items').query()
        const categoriesQuery = database.get('categories').query()

        const stockSub = stockQuery.observe().subscribe(data => {
            setStockItems(data)
            setIsLoading(false)
        })

        const categoriesSub = categoriesQuery.observe().subscribe(data => {
            setCategories(data)
        })

        return () => {
            stockSub.unsubscribe()
            categoriesSub.unsubscribe()
        }
    }, [])

    // ✅ Create Stock Item with Variants
    const createStockItem = async (
        itemName: string,
        categoryId: string,
        variants: StockVariant[]
    ) => {
        try {
            // Calculate totals from variants
            const totalQuantity = variants.reduce((sum, v) => sum + (v.weight_kg * v.quantity), 0)
            const totalBags = variants.reduce((sum, v) => sum + v.quantity, 0)
            const totalValue = variants.reduce((sum, v) => sum + v.total_value, 0)

            await database.write(async () => {
                const stockItemsCollection = database.get('stock_items')
                await stockItemsCollection.create((stockItem: any) => {
                    stockItem.itemName = itemName
                    stockItem.categoryId = categoryId
                    stockItem.variants = JSON.stringify(variants)
                    stockItem.totalQuantity = totalQuantity
                    stockItem.totalBags = totalBags
                    stockItem.totalValue = totalValue
                })
            })
            return true
        } catch (error) {
            console.error('Error creating stock item:', error)
            throw error
        }
    }

    // ✅ Update Stock Item with Variants
    const updateStockItem = async (
        stockItemId: string,
        itemName: string,
        categoryId: string,
        variants: StockVariant[]
    ) => {
        try {
            // Calculate totals from variants
            const totalQuantity = variants.reduce((sum, v) => sum + (v.weight_kg * v.quantity), 0)
            const totalBags = variants.reduce((sum, v) => sum + v.quantity, 0)
            const totalValue = variants.reduce((sum, v) => sum + v.total_value, 0)

            await database.write(async () => {
                const stockItem = await database.get('stock_items').find(stockItemId)
                await stockItem.update((item: any) => {
                    item.itemName = itemName
                    item.categoryId = categoryId
                    item.variants = JSON.stringify(variants)
                    item.totalQuantity = totalQuantity
                    item.totalBags = totalBags
                    item.totalValue = totalValue
                })
            })
            return true
        } catch (error) {
            console.error('Error updating stock item:', error)
            throw error
        }
    }

    // ✅ Update Stock Quantity (for buy/sell operations)
    const updateStockQuantity = async (
        stockItemId: string,
        quantityChange: number, // Positive for buy, negative for sell
        variant?: StockVariant // Optional: specific variant to update
    ) => {
        try {
            await database.write(async () => {
                const stockItem = await database.get('stock_items').find(stockItemId)
                const currentVariants = JSON.parse((stockItem as any).variants || '[]')

                if (variant) {
                    // Update specific variant
                    const variantIndex = currentVariants.findIndex((v: StockVariant) => v.id === variant.id)
                    if (variantIndex >= 0) {
                        currentVariants[variantIndex].quantity += quantityChange
                        currentVariants[variantIndex].total_value =
                            currentVariants[variantIndex].quantity * currentVariants[variantIndex].rate_per_bag
                    } else {
                        // Add new variant
                        currentVariants.push(variant)
                    }
                } else {
                    // Simple quantity update (legacy support)
                    // Update first variant or create default one
                    if (currentVariants.length > 0) {
                        currentVariants[0].quantity += quantityChange
                        currentVariants[0].total_value =
                            currentVariants[0].quantity * currentVariants[0].rate_per_bag
                    }
                }

                // Recalculate totals
                const totalQuantity = currentVariants.reduce((sum: number, v: StockVariant) =>
                    sum + (v.weight_kg * v.quantity), 0)
                const totalBags = currentVariants.reduce((sum: number, v: StockVariant) =>
                    sum + v.quantity, 0)
                const totalValue = currentVariants.reduce((sum: number, v: StockVariant) =>
                    sum + v.total_value, 0)

                await stockItem.update((item: any) => {
                    item.variants = JSON.stringify(currentVariants)
                    item.totalQuantity = totalQuantity
                    item.totalBags = totalBags
                    item.totalValue = totalValue
                })
            })
            return true
        } catch (error) {
            console.error('Error updating stock quantity:', error)
            throw error
        }
    }

    // ✅ Delete Stock Item
    const deleteStockItem = async (stockItemId: string) => {
        try {
            await database.write(async () => {
                const stockItem = await database.get('stock_items').find(stockItemId)
                await stockItem.markAsDeleted()
            })
            return true
        } catch (error) {
            console.error('Error deleting stock item:', error)
            throw error
        }
    }

    // ✅ Create Category
    const createCategory = async (name: string) => {
        try {
            await database.write(async () => {
                const categoriesCollection = database.get('categories')
                await categoriesCollection.create((category: any) => {
                    category.name = name
                })
            })
            return true
        } catch (error) {
            console.error('Error creating category:', error)
            throw error
        }
    }

    return {
        stockItems,
        categories,
        createStockItem,
        updateStockItem,
        updateStockQuantity,
        deleteStockItem,
        createCategory,
        isLoading,
        error: null
    }
}
