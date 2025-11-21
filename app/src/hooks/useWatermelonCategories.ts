import { useEffect, useState } from 'react'
import { database } from '../database'

export interface Category {
    id: string
    name: string
}

export const useWatermelonCategories = () => {
    const [categories, setCategories] = useState<any[]>([])

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await database.get('categories').query().fetch()
                setCategories(data)
            } catch (error) {
                console.error('Error loading categories from WatermelonDB:', error)
            }
        }

        loadData()
    }, [])

    return {
        categories: categories as Category[],
        isLoading: false,
        error: null
    }
}
