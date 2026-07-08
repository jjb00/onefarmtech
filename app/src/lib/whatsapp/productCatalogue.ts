export type WhatsAppCatalogueProduct = {
  id?: string;
  name: string;
  category: string;
  unit: string;
  grade: string;
  basePrice: number;
  availability: string;
};

export function formatWhatsAppNaira(amount: number | null | undefined) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function isProductAvailableForWhatsApp(product: {availability: string; status?: string | null}) {
  const availability = String(product.availability || "").toLowerCase();
  const status = String(product.status || "Active").toLowerCase();

  return (
    status === "active" &&
    ["available", "in stock", "active", "limited", "seasonal"].includes(availability)
  );
}

export function buildWhatsAppProductListMessage(products: WhatsAppCatalogueProduct[]) {
  if (products.length === 0) {
    return [
      "Hello, thank you for contacting OneFarmTech 🌱",
      "",
      "Our available produce list is being updated.",
      "Please reply with what you need and the team will confirm availability shortly.",
    ].join("\\n");
  }

  const grouped = products.reduce<Record<string, WhatsAppCatalogueProduct[]>>((groups, product) => {
    const category = product.category || "Produce";
    groups[category] = groups[category] || [];
    groups[category].push(product);
    return groups;
  }, {});

  const lines: string[] = [
    "Hello, thank you for contacting OneFarmTech 🌱",
    "",
    "Today's available produce:",
  ];

  let index = 1;
  for (const [category, categoryProducts] of Object.entries(grouped)) {
    lines.push("", category);
    for (const product of categoryProducts) {
      const availability =
        product.availability && !["Available", "In stock", "Active"].includes(product.availability)
          ? ` · ${product.availability}`
          : "";

      lines.push(
        `${index}. ${product.name} (${product.grade}) — ${formatWhatsAppNaira(product.basePrice)} / ${product.unit}${availability}`,
      );
      index += 1;
    }
  }

  lines.push(
    "",
    "To order, reply with the item name or number and quantity.",
    "Example: 2 baskets tomatoes and 1 bag onions",
    "",
    "Prices and availability are confirmed before payment and delivery.",
  );

  return lines.join("\\n");
}
