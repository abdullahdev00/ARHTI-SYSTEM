import { useEffect, useState } from 'react'
import { database } from '../database'

export interface Charge {
    id: string
    name: string
    amount: number
    created_at?: string
    updated_at?: string
}

export const useWatermelonCharges = () => {
    const [charges, setCharges] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // ✅ Reactive Subscription to WatermelonDB
    useEffect(() => {
        const chargesQuery = database.get('charges').query()

        const chargesSub = chargesQuery.observe().subscribe(data => {
            setCharges(data)
            setIsLoading(false)
        })

        return () => {
            chargesSub.unsubscribe()
        }
    }, [])

    // Create charge
    const createCharge = async (name: string, amount: number) => {
        try {
            await database.write(async () => {
                const chargesCollection = database.get('charges')
                await chargesCollection.create((charge: any) => {
                    charge.name = name
                    charge.amount = amount
                })
            })
            return true
        } catch (error) {
            console.error('Error creating charge:', error)
            throw error
        }
    }

    // Update charge
    const updateCharge = async (chargeId: string, name: string, amount: number) => {
        try {
            await database.write(async () => {
                const charge = await database.get('charges').find(chargeId)
                await charge.update((c: any) => {
                    c.name = name
                    c.amount = amount
                })
            })
            return true
        } catch (error) {
            console.error('Error updating charge:', error)
            throw error
        }
    }

    // Delete charge
    const deleteCharge = async (chargeId: string) => {
        try {
            await database.write(async () => {
                const charge = await database.get('charges').find(chargeId)
                await charge.markAsDeleted()
            })
            return true
        } catch (error) {
            console.error('Error deleting charge:', error)
            throw error
        }
    }

    return {
        charges: charges as Charge[],
        createCharge,
        updateCharge,
        deleteCharge,
        isLoading,
        error: null
    }
}
