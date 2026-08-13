import {prisma} from "@/lib/prisma";

export type PublicProductCategory = {
  name: string;
  products: Array<{
    name: string;
    availability: string;
  }>;
};

function publicCategoryName(category: string) {
  if (category === "Spices / herbs") return "Spices & herbs";
  if (category === "Fish / seafood") return "Fish & seafood";
  if (category === "Seasonal / other") return "Seasonal produce";
  return category;
}

export async function getPublicProductCatalogue(): Promise<PublicProductCategory[]> {
  const products = await prisma.product.findMany({
    where: {
      status: "Active",
      availability: {
        in: ["Available", "Limited", "Seasonal", "In stock", "Active"],
      },
    },
    select: {
      name: true,
      category: true,
      availability: true,
    },
    orderBy: [{category: "asc"}, {name: "asc"}],
  });

  const grouped = new Map<
    string,
    Map<string, PublicProductCategory["products"][number]>
  >();

  for (const product of products) {
    const category = publicCategoryName(product.category.trim() || "Fresh produce");
    const categoryProducts = grouped.get(category) ?? new Map();
    const productName = product.name.trim();
    const productKey = productName.toLocaleLowerCase("en-NG");

    // The admin catalogue can contain more than one row for the same product
    // (for example, after importing starter products). Public buyers only need
    // one clear entry per category, so consolidate duplicate names here.
    if (!categoryProducts.has(productKey)) {
      categoryProducts.set(productKey, {
        name: productName,
        availability: product.availability,
      });
    }

    grouped.set(category, categoryProducts);
  }

  return Array.from(grouped, ([name, categoryProducts]) => ({
    name,
    products: Array.from(categoryProducts.values()),
  }));
}
