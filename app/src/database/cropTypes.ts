export interface Crop {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BagVariant {
  id: number;
  crop_id: number;
  weight_kg: number;
  price_per_bag: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  crop_id: number;
  bag_variant_id: number;
  quantity_bags: number;
  total_weight_kg: number;
  cost_per_bag: number;
  total_cost: number;
  last_updated: string;
}

export interface CropInput {
  name: string;
  description?: string;
}

export interface BagVariantInput {
  crop_id: number;
  weight_kg: number;
  price_per_bag: number;
  is_default?: boolean;
}

export interface StockInput {
  crop_id: number;
  bag_variant_id: number;
  quantity_bags: number;
  cost_per_bag: number;
}

export interface CropWithVariants extends Crop {
  bagVariants: BagVariant[];
}

export interface StockWithDetails extends Stock {
  crop_name: string;
  bag_weight_kg: number;
  price_per_bag: number;
}
