import { schemaMigrations, createTable, addColumns } from '@nozbe/watermelondb/Schema/migrations'

export const migrations = schemaMigrations({
    migrations: [
        // Migration from version 1 to 2
        {
            toVersion: 2,
            steps: [
                // Add any schema changes here if needed
            ],
        },
        // Migration from version 2 to 3
        {
            toVersion: 3,
            steps: [
                // Add any schema changes here if needed
            ],
        },
        // Migration from version 3 to 4
        {
            toVersion: 4,
            steps: [
                // Add any schema changes here if needed
            ],
        },
        // Migration from version 4 to 5 (current version)
        {
            toVersion: 5,
            steps: [
                addColumns({
                    table: 'roles',
                    columns: [
                        { name: 'icon', type: 'string', isOptional: true },
                        { name: 'color', type: 'string', isOptional: true },
                    ],
                }),
            ],
        },
        // Migration from version 5 to 6 - Stock Items with Variants
        {
            toVersion: 6,
            steps: [
                addColumns({
                    table: 'stock_items',
                    columns: [
                        { name: 'item_name', type: 'string' }, // Renamed from 'name'
                        { name: 'variants', type: 'string' }, // JSON string for variants
                        { name: 'total_quantity', type: 'number' },
                        { name: 'total_bags', type: 'number' },
                        { name: 'total_value', type: 'number' },
                    ],
                }),
            ],
        },
    ],
})
