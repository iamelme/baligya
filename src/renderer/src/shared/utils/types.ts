export type Direction = 'prev' | 'next'

export type UserType = {
  id: number
  user_name: string
  password: string
}

export type CustomResponseType = {
  success: boolean
  error: ErrorType
}

export type CategoryType = {
  id: number
  name: string
}

export type ProductType = {
  id: number
  name: string
  sku: string
  description?: string
  price: number
  cost: number
  code: number
  quantity: number
  user_id: number | null
  updated_by: number | null
  category_id: number | null
  inventory_id: number | null
}

export const movementType = {
  0: 'In',
  1: 'Out',
  3: 'Adjustment'
} as const

// movement 0 = in, 1 = out, 2 = adjustment
export type InventoryType = {
  id: number
  quantity: number
  product_id: number
  user_id: number
  movement_type?: number,
  reference_type?: 'purchase' | 'sale' | 'return' | 'transfer' | 'adjustment' | 'void' | 'initial_stock'
}

export type CartType = {
  id: number
  user_id: number
}

export type CartItemType = {
  id: number
  quantity: number
  product_id: number
  product_quantity: number
  name: string
  sku: string
  code: number
  price: number
  cost: number
  cart_id: number
  user_id: number
}

export type ReturnCartType = {
  id: number
  items: CartItemType[]
  sub_total: number
  discount: number
  vatable_sales: number
  vat_amount: number
  tax: number
  total: number
}

export type ErrorType = Error | string

export type SaleType = {
  id: number
  created_at: Date
  invoice_number: string
  sub_total: number
  tax: number
  discount: number
  total: number
  status: 'complete' | 'return' | 'void'
  user_id: number
}
export type SaleItemType = {
  id: number
  quantity: number
  product_id: number
  product_quantity: number
  name: string
  sku: string
  code: number
  price: number
  unit_price: number
  unit_cost: number
  line_total: number
  inventory_id: number
  inventory_qty: number
  return_qty: number
  available_qty: number
  sale_id: number
  user_id: number
}

export type ReturnSaleType = {
  id: number
  created_at: Date
  invoice_number: string
  status: string
  items: SaleItemType[]
  sub_total: number
  discount: number
  total: number
  amount: number
  method: string
  customer_name?: string
}

export type PlaceOrderType = {
  cart: Omit<ReturnCartType, 'id'>
  amount: number
  reference_number: string
  method: string
  sale_id: number
  customer_name?: string
  user_id: number
}

export type PaymentMethod = 'cash' | 'card' | 'e-wallet'

export type ReturnType = {
  id: number
  created_at: string
  refund_amount: number
  items: ReturnItemType[]
  sale_id: number
  user_id: number
}

export type ReturnItemType = {
  id: number
  created_at: string
  refund_price: number
  quantity: number
  old_quantity: number
  available_qty: number
  return_id: number
  inventory_id: number
  user_id: number
  sale_id: number
  sale_item_id: number
  product_id: number
}

export type ReturnRevenueType = {
  month: number
  gross_revenue: number
  total_return: number
  net_revenue: number
} | {
  month: number
  gross_revenue: number
  total_return: number
  net_revenue: number
}[]

export type SettingsType = {
  logo: string
  locale: string
  tax: number
  is_tax_inclusive: number
}
