import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("product categories have a dedicated public page backed by the admin catalogue", () => {
  const homepage = read("src/app/page.tsx");
  const productsPage = read("src/app/products/page.tsx");
  const catalogue = read("src/lib/publicCatalogue.ts");

  assert.doesNotMatch(homepage, /id="what-we-supply"/);
  assert.doesNotMatch(homepage, /productCategories\.map/);
  assert.match(productsPage, /getPublicProductCatalogue/);
  assert.match(productsPage, /categories\.map/);
  assert.match(productsPage, />\s*Order online\s*</);
  assert.doesNotMatch(productsPage, /Send an order list/);
  assert.match(catalogue, /prisma\.product\.findMany/);
  assert.match(catalogue, /status:\s*"Active"/);
  assert.match(catalogue, /availability:\s*\{[\s\S]*?in:/);
  assert.match(catalogue, /productName\.toLocaleLowerCase/);
  assert.match(catalogue, /if \(!categoryProducts\.has\(productKey\)\)/);
});

test("public navigation links buyers to the dedicated products page", () => {
  const homepage = read("src/app/page.tsx");
  const mobileMenu = read("src/components/PublicMobileMenu.tsx");
  const footer = read("src/components/PublicFooter.tsx");

  assert.match(homepage, /href="\/products"/);
  assert.match(mobileMenu, /href:\s*"\/products"/);
  assert.match(footer, /\["Products", "\/products"\]/);
});
