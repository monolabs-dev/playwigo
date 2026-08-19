export function productTourStorageKey(userId: string) {
  return `playwigo:product-tour:${userId}`
}

export function isProductTourDone(userId: string) {
  if (typeof window === 'undefined') {
    return true
  }

  return localStorage.getItem(productTourStorageKey(userId)) === 'done'
}

export function markProductTourDone(userId: string) {
  localStorage.setItem(productTourStorageKey(userId), 'done')
}
