'use strict';

import { cookies } from 'next/headers';

// In this example, we'll store the locale in a cookie
const COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'en';

export async function getUserLocale() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || DEFAULT_LOCALE;
}

export async function setUserLocale(locale: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, locale);
}
