export type BaselineProduct = {
  name: string;
  category: string;
  unit: string;
  grade: string;
  basePrice: number;
  availability: string;
  status: string;
};

export const baselineProducts: BaselineProduct[] = [
  // Vegetables
  {name: "Tomatoes", category: "Vegetables", unit: "basket", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Bell peppers", category: "Vegetables", unit: "basket", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Scotch bonnet peppers", category: "Vegetables", unit: "basket", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Onions", category: "Vegetables", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Carrots", category: "Vegetables", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Cabbage", category: "Vegetables", unit: "piece", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Cucumber", category: "Vegetables", unit: "crate", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Lettuce", category: "Vegetables", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},
  {name: "Spinach / green leaves", category: "Vegetables", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Ugu / pumpkin leaves", category: "Vegetables", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Okra", category: "Vegetables", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Garden eggs", category: "Vegetables", unit: "basket", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},

  // Fruits
  {name: "Bananas", category: "Fruits", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Plantain", category: "Fruits", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Oranges", category: "Fruits", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Watermelon", category: "Fruits", unit: "piece", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Pineapple", category: "Fruits", unit: "piece", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Mangoes", category: "Fruits", unit: "crate", grade: "Standard", basePrice: 0, availability: "Seasonal", status: "Active"},
  {name: "Apples", category: "Fruits", unit: "carton", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},
  {name: "Pawpaw / papaya", category: "Fruits", unit: "piece", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},

  // Tubers
  {name: "Yam", category: "Tubers", unit: "tuber", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Irish potatoes", category: "Tubers", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Sweet potatoes", category: "Tubers", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Cassava", category: "Tubers", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},

  // Grains and staples
  {name: "Rice", category: "Grains", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Beans", category: "Grains", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Maize", category: "Grains", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Garri", category: "Grains", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},

  // Seeds, spices, herbs
  {name: "Melon seeds / egusi", category: "Seeds", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Groundnuts", category: "Seeds", unit: "bag", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Ginger", category: "Spices / herbs", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Garlic", category: "Spices / herbs", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Curry leaves", category: "Spices / herbs", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},
  {name: "Scent leaves", category: "Spices / herbs", unit: "bunch", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},

  // Poultry, meat, fish
  {name: "Chicken", category: "Poultry", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Eggs", category: "Poultry", unit: "crate", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Turkey", category: "Poultry", unit: "kg", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},
  {name: "Beef", category: "Meat", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Goat meat", category: "Meat", unit: "kg", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},
  {name: "Ram / mutton", category: "Meat", unit: "kg", grade: "Standard", basePrice: 0, availability: "Seasonal", status: "Active"},
  {name: "Catfish", category: "Fish / seafood", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Tilapia", category: "Fish / seafood", unit: "kg", grade: "Standard", basePrice: 0, availability: "Available", status: "Active"},
  {name: "Croaker fish", category: "Fish / seafood", unit: "kg", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},
  {name: "Stockfish", category: "Fish / seafood", unit: "kg", grade: "Standard", basePrice: 0, availability: "Limited", status: "Active"},

  // Seasonal / other
  {name: "Avocado", category: "Seasonal produce", unit: "crate", grade: "Standard", basePrice: 0, availability: "Seasonal", status: "Active"},
  {name: "Coconut", category: "Seasonal produce", unit: "piece", grade: "Standard", basePrice: 0, availability: "Seasonal", status: "Active"},
  {name: "Tiger nuts", category: "Seasonal produce", unit: "kg", grade: "Standard", basePrice: 0, availability: "Seasonal", status: "Active"},
];
