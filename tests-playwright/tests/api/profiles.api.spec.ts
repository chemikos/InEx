import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL; // dostosuj do backendu

test.describe("Profiles API", () => {
  test("GET /profiles - powinno zwrócić listę profili", async ({ request }) => {
    const res = await request.get(`${BASE_URL}/profiles`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  //   test('POST /profiles - powinno dodać nowy profil', async ({ request }) => {
  //     const newProfile = { name: 'Profil testowy' };
  //     const res = await request.post(`${BASE_URL}/profiles`, { data: newProfile });
  //     expect(res.status()).toBe(201);
  //   });
});
