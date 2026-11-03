/* eslint-disable react-hooks/rules-of-hooks -- `use` di sini adalah callback fixture Playwright, bukan React Hook */
import { test as base, createBdd } from "playwright-bdd";

/** Data yang dibagikan antar step dalam satu skenario. */
export type SkenarioData = {
  kode?: string;
  nama?: string;
  noTransaksi?: string;
};

export const test = base.extend<{ skenario: SkenarioData }>({
  skenario: async ({}, use) => {
    await use({});
  },
});

export const { Given, When, Then, After, BeforeAll } = createBdd(test);
