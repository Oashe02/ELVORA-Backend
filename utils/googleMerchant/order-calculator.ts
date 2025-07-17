export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  tax?: number
}

export interface ShippingMethod {
  id: string
  name: string
  cost: number
  freeShippingThreshold?: number
}

export interface OrderCalculation {
  subtotal: number
  tax: number
  shipping: number
  discount: number
  total: number
}

export const calculateOrderTotal = (
  items: OrderItem[],
  shippingMethod?: ShippingMethod,
  discountAmount = 0,
  taxRate = 0,
): OrderCalculation => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const tax = subtotal * (taxRate / 100)

  let shipping = 0
  if (shippingMethod) {
    const freeThreshold = shippingMethod.freeShippingThreshold || 0
    shipping = subtotal >= freeThreshold ? 0 : shippingMethod.cost
  }

  const total = subtotal + tax + shipping - discountAmount

  return {
    subtotal,
    tax,
    shipping,
    discount: discountAmount,
    total: Math.max(0, total),
  }
}

export const calculateItemTotal = (price: number, quantity: number): number => {
  return price * quantity
}

export const calculateTaxAmount = (amount: number, taxRate: number): number => {
  return amount * (taxRate / 100)
}
