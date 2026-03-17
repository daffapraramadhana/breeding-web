'use server';

import {setUserLocale} from '@/lib/locale';

export async function changeLocale(locale: string) {
  await setUserLocale(locale);
}
