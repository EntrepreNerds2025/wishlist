export const SELECTORS = {
  emailInput: [
    'input[type="email"]',
    'input[name="email"]',
    'input[placeholder*="Email" i]'
  ],
  passwordInput: ['input[type="password"]', 'input[name="password"]'],
  signInButton: [
    'button[type="submit"]',
    'button:has-text("Sign In")',
    'button:has-text("Continue")'
  ],
  wishlistTitle: ['text=Wishlist'],
  productAnchors: ['a[href*="/products/"]'],
  nextPage: [
    'a[rel="next"]',
    'a:has-text("Next")',
    'button:has-text("Next")',
    'a:has-text(">")',
    'button:has-text(">")',
    'a:has-text("→")',
    'button:has-text("→")'
  ],
  addToWishlistButtons: [
    'button[aria-label*="wishlist" i]',
    'button[aria-label*="favorite" i]',
    'button[aria-label*="favourite" i]'
  ],
  addToBagButtons: ['button:has-text("Add to Bag")']
};

export async function firstVisible(page, selectors) {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      return locator;
    }
  }
  return null;
}
