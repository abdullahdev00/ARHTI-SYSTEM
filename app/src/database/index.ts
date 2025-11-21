import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import { schema } from './schema'
import { Invoice, Partner, StockItem, Charge, Category, Purchase, Role } from './models'
import { migrations } from './migrations'

// ✅ Expo-compatible SQLite adapter configuration
const adapter = new SQLiteAdapter({
    schema,
    migrations,
    dbName: 'arthisystem',
    jsi: false,
    onSetUpError: error => {
        console.error('❌ Database setup error:', error)
    }
})

export const database = new Database({
    adapter,
    modelClasses: [Invoice, Partner, StockItem, Charge, Category, Purchase, Role]
})

console.log('✅ WatermelonDB initialized (Expo mode)')

// 🔍 Debug function - data check karne ke liye
export const debugWatermelonData = async () => {
    try {
        const partners: any[] = await database.get('partners').query().fetch()
        const invoices: any[] = await database.get('invoices').query().fetch()
        const stockItems: any[] = await database.get('stock_items').query().fetch()

        console.log('📊 === WATERMELON DB DATA ===')
        console.log(`✅ Partners (${partners?.length || 0}):`,
            partners?.map((p: any) => ({
                id: p.id,
                name: p.name || 'N/A'
            })) || []
        )
        console.log(`✅ Invoices (${invoices?.length || 0}):`,
            invoices?.map((i: any) => ({
                id: i.id,
                total: i.total || 0
            })) || []
        )
        console.log(`✅ Stock Items (${stockItems?.length || 0}):`,
            stockItems?.map((s: any) => ({
                id: s.id,
                name: s.name || 'N/A'
            })) || []
        )
        console.log('📊 === END ===')
    } catch (error) {
        console.error('❌ Debug error:', error)
    }
}
