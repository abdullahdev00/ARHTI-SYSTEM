import { Model } from '@nozbe/watermelondb'
import { field, date } from '@nozbe/watermelondb/decorators'

export class Invoice extends Model {
    static table = 'invoices'

    @field('partner_id') partnerId!: string
    @field('total_value') totalValue!: number
    @field('payment_status') paymentStatus!: string
    @field('paid_amount') paidAmount!: number
    @field('remaining_amount') remainingAmount!: number
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}

export class Partner extends Model {
    static table = 'partners'

    @field('name') name!: string
    @field('phone') phone!: string
    @field('address') address!: string
    @field('role') role!: string
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}

export class StockItem extends Model {
    static table = 'stock_items'

    @field('item_name') itemName!: string // Changed from 'name' to match Supabase
    @field('category_id') categoryId!: string
    @field('variants') variants!: string // JSON string containing array of variants
    @field('total_quantity') totalQuantity!: number // Total weight in kg
    @field('total_bags') totalBags!: number // Total number of bags
    @field('total_value') totalValue!: number // Total value in currency
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date

    // Helper method to parse variants
    get parsedVariants() {
        try {
            return JSON.parse(this.variants || '[]')
        } catch {
            return []
        }
    }

    // Helper method to set variants
    setVariants(variants: any[]) {
        this.variants = JSON.stringify(variants)
    }
}

export class Charge extends Model {
    static table = 'charges'

    @field('name') name!: string
    @field('amount') amount!: number
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}

export class Category extends Model {
    static table = 'categories'

    @field('name') name!: string
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}

export class Purchase extends Model {
    static table = 'purchases'

    @field('partner_id') partnerId!: string
    @field('crop_name') cropName!: string
    @field('quantity') quantity!: number
    @field('rate') rate!: number
    @field('total_amount') totalAmount!: number
    @field('purchase_date') purchaseDate!: string
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}

export class Role extends Model {
    static table = 'roles'

    @field('name') name!: string
    @field('icon') icon!: string
    @field('color') color!: string
    @date('created_at') createdAt!: Date
    @date('updated_at') updatedAt!: Date
}
