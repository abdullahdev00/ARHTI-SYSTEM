/**
 * Stock Items with Variants Schema
 * Stores stock items with variants (different weights) as JSON
 */

export interface StockVariant {
    id: string;                 // UUID for variant
    weight_kg: number;          // Weight per bag (e.g., 40, 50)
    rate_per_bag: number;       // Price per bag (e.g., 7200)
    quantity: number;           // Number of bags of this type (e.g., 3)
    total_value: number;        // Total value = rate_per_bag * quantity
}

export interface StockItem {
    id: string;                 // UUID
    item_name: string;          // e.g., "Basmati Rice"
    category_id?: string;       // UUID reference to category
    variants: StockVariant[];   // Array of variants (different weights/prices)
    total_quantity: number;     // Total weight in kg (sum of all variants)
    total_bags: number;         // Total number of bags (sum of quantities)
    total_value: number;        // Total value in currency (sum of all variant values)
    user_id: string;            // UUID of owner
    created_at: string;         // ISO timestamp
    updated_at: string;         // ISO timestamp
    sync_status?: 'pending' | 'synced' | 'error';
    local_id?: number;          // Local SQLite ID for offline support
}

/**
 * Example Data Structure:
 * 
 * StockItem (Wheat) with Variants stored as JSON:
 * {
 *   id: "uuid-1",
 *   item_name: "Wheat",
 *   category_id: "uuid-cat-1",
 *   variants: [
 *     {
 *       id: "uuid-var-1",
 *       weight_kg: 40,
 *       rate_per_bag: 7200,
 *       quantity: 3,
 *       total_value: 21600       // 7200 * 3
 *     },
 *     {
 *       id: "uuid-var-2",
 *       weight_kg: 50,
 *       rate_per_bag: 9000,
 *       quantity: 2,
 *       total_value: 18000       // 9000 * 2
 *     }
 *   ],
 *   total_quantity: 90,        // 40 + 50 (sum of all variant weights)
 *   total_bags: 5,             // 3 + 2 (sum of all quantities)
 *   total_value: 39600,        // 21600 + 18000 (sum of all variant values)
 *   user_id: "uuid-user-1"
 * }
 */
