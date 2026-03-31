import { chromium } from 'playwright';

const baseUrl = process.env.SHOPLY_BASE_URL || 'http://127.0.0.1:5173';
const testPassword = process.env.SHOPLY_TEST_USER_PASSWORD;
if (!testPassword) {
  throw new Error('Missing SHOPLY_TEST_USER_PASSWORD environment variable.');
}
const suffix = Date.now();

const userA = {
  name: `User A ${suffix}`,
  email: `auth_a_${suffix}@demo.com`,
  password: testPassword
};

const userB = {
  name: `User B ${suffix}`,
  email: `auth_b_${suffix}@demo.com`,
  password: testPassword
};

const registerUser = async (page, user) => {
  await page.goto(`${baseUrl}/register`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="name"]', user.name);
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.fill('input[name="confirmPassword"]', user.password);

  await page.click('button[type="submit"]');
  const reachedLogin = await page
    .waitForURL('**/login', { timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  if (!reachedLogin) {
    const errorText = await page.locator('.ui-notice__message').first().textContent().catch(() => null);
    throw new Error(`Registration failed for ${user.email}. UI message: ${errorText || 'none shown'}`);
  }
};

const loginUser = async (page, user) => {
  await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  const homeReached = await page
    .waitForURL('**/home', { timeout: 8000 })
    .then(() => true)
    .catch(() => false);

  if (!homeReached) {
    const errorText = await page.locator('.ui-notice__message').first().textContent().catch(() => null);
    throw new Error(`Login failed for ${user.email}. UI error: ${errorText || 'none shown'}`);
  }
};

const logoutUser = async (page) => {
  await page.click('button.nav__btn');
  await page.waitForURL('**/login', { timeout: 8000 });
};

const addHomeItemToCart = async (page, cardIndex) => {
  await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.card');
  const card = cards.nth(cardIndex);
  await card.waitFor({ state: 'visible', timeout: 8000 });
  const itemName = (await card.locator('.card__name').textContent())?.trim() || '';

  await card.locator('.card__link').click();
  await page.waitForURL('**/product/*', { timeout: 8000 });

  await page.locator('button.addToCartBtn').first().click();

  const toast = page.locator('.ui-notice__message').filter({ hasText: 'added to your cart' }).first();
  const toastVisible = await toast.waitFor({ state: 'visible', timeout: 5000 }).then(() => true).catch(() => false);
  if (!toastVisible) {
    throw new Error('Add-to-cart confirmation notice did not appear.');
  }

  return itemName;
};

const readCheckoutItemNames = async (page) => {
  await page.goto(`${baseUrl}/checkout`, { waitUntil: 'domcontentloaded' });

  await page
    .waitForResponse(
      (response) => response.url().includes('/api/cart') && response.request().method() === 'GET',
      { timeout: 8000 }
    )
    .catch(() => null);

  const cardVisible = await page
    .locator('.checkout__card__name')
    .first()
    .isVisible()
    .catch(() => false);

  if (cardVisible) {
    const names = await page.locator('.checkout__card__name').allTextContents();
    return names.map((name) => name.trim());
  }

  const emptyVisible = await page
    .locator('.checkout__emptyCart')
    .isVisible()
    .catch(() => false);
  if (emptyVisible) {
    return [];
  }

  throw new Error('Checkout state did not stabilize for cart verification.');
};

const assertContains = (items, expected, contextLabel) => {
  if (!items.includes(expected)) {
    throw new Error(`${contextLabel}: expected cart to include "${expected}", got: ${JSON.stringify(items)}`);
  }
};

const assertNotContains = (items, blocked, contextLabel) => {
  if (items.includes(blocked)) {
    throw new Error(`${contextLabel}: expected cart NOT to include "${blocked}", got: ${JSON.stringify(items)}`);
  }
};

const main = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const result = {
    userA,
    userB,
    userAItem: null,
    userBItem: null,
    userAAfterSwitch: [],
    userBAfterSwitch: []
  };

  try {
    await registerUser(page, userA);
    await registerUser(page, userB);

    await loginUser(page, userA);
    result.userAItem = await addHomeItemToCart(page, 0);
    await logoutUser(page);

    await loginUser(page, userB);
    const userBInitialCart = await readCheckoutItemNames(page);
    if (userBInitialCart.length !== 0) {
      throw new Error(`User B should start with empty cart, got: ${JSON.stringify(userBInitialCart)}`);
    }
    result.userBItem = await addHomeItemToCart(page, 1);
    await logoutUser(page);

    await loginUser(page, userA);
    result.userAAfterSwitch = await readCheckoutItemNames(page);
    assertContains(result.userAAfterSwitch, result.userAItem, 'User A verification');
    assertNotContains(result.userAAfterSwitch, result.userBItem, 'User A verification');
    await logoutUser(page);

    await loginUser(page, userB);
    result.userBAfterSwitch = await readCheckoutItemNames(page);
    assertContains(result.userBAfterSwitch, result.userBItem, 'User B verification');
    assertNotContains(result.userBAfterSwitch, result.userAItem, 'User B verification');

    console.log('UI_AUTH_ISOLATION_TEST:PASS');
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
};

main().catch((error) => {
  console.error('UI_AUTH_ISOLATION_TEST:FAIL');
  console.error(error.stack || error.message || String(error));
  process.exit(1);
});
