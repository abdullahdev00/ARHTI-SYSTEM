import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
    version: 6, // ✅ Incremented for variants support
    tables: [
        tableSchema({
            name: 'invoices',
            columns: [
                { name: 'partner_id', type: 'string', isIndexed: true },
                { name: 'total_value', type: 'number' },
                { name: 'payment_status', type: 'string' },
                { name: 'paid_amount', type: 'number' },
                { name: 'remaining_amount', type: 'number' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        }),
        tableSchema({
            name: 'partners',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'phone', type: 'string' },
                { name: 'address', type: 'string' },
                { name: 'role', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        }),
        tableSchema({
            name: 'stock_items',
            columns: [
                { name: 'item_name', type: 'string' }, // Changed from 'name' to match Supabase
                { name: 'category_id', type: 'string', isIndexed: true, isOptional: true },
                { name: 'variants', type: 'string' }, // ✅ JSON string for variants array
                { name: 'total_quantity', type: 'number' }, // ✅ Total weight in kg
                { name: 'total_bags', type: 'number' }, // ✅ Total number of bags
                { name: 'total_value', type: 'number' }, // ✅ Total value
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        }),
        tableSchema({
            name: 'charges',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'amount', type: 'number' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        }),
        tableSchema({
            name: 'categories',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        }),
        tableSchema({
            name: 'purchases',
            columns: [
                { name: 'partner_id', type: 'string', isIndexed: true },
                { name: 'crop_name', type: 'string' },
                { name: 'quantity', type: 'number' },
                { name: 'rate', type: 'number' },
                { name: 'total_amount', type: 'number' },
                { name: 'purchase_date', type: 'string' },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        }),
        tableSchema({
            name: 'roles',
            columns: [
                { name: 'name', type: 'string' },
                { name: 'icon', type: 'string', isOptional: true },
                { name: 'color', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' }
            ]
        })
    ]
})
