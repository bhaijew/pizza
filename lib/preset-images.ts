export interface PresetFoodImage {
  category: "Pizza" | "Burger" | "Fries & Sides" | "Drinks" | "Dessert";
  name: string;
  url: string;
}

export const PRESET_FOOD_IMAGES: PresetFoodImage[] = [
  // ─── Pizzas ──────────────────────────────────────────
  {
    category: "Pizza",
    name: "Margherita Classica",
    url: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Pizza",
    name: "Pepperoni Passion",
    url: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Pizza",
    name: "BBQ Chicken & Bacon",
    url: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Pizza",
    name: "Wild Mushroom & Truffle",
    url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Pizza",
    name: "Four Cheese Deluxe",
    url: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",
  },

  // ─── Burgers ─────────────────────────────────────────
  {
    category: "Burger",
    name: "Classic Smash Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Burger",
    name: "Bacon Cheeseburger",
    url: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Burger",
    name: "Crispy Zinger Chicken",
    url: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Burger",
    name: "Double Patty Monster",
    url: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=600&auto=format&fit=crop&q=80",
  },

  // ─── Fries & Sides ───────────────────────────────────
  {
    category: "Fries & Sides",
    name: "Golden Crispy Fries",
    url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Fries & Sides",
    name: "Loaded Cheese Fries",
    url: "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Fries & Sides",
    name: "Crispy Onion Rings",
    url: "https://images.unsplash.com/photo-1639024471287-032f664b3ef8?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Fries & Sides",
    name: "Spicy Buffalo Wings",
    url: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Fries & Sides",
    name: "Cheesy Garlic Bread",
    url: "https://images.unsplash.com/photo-1619895092538-128341789043?w=600&auto=format&fit=crop&q=80",
  },

  // ─── Drinks ──────────────────────────────────────────
  {
    category: "Drinks",
    name: "Chilled Cola Can",
    url: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Drinks",
    name: "Fresh Lemon Mint Cooler",
    url: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Drinks",
    name: "Thick Chocolate Shake",
    url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Drinks",
    name: "Iced Cold Brew Coffee",
    url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80",
  },

  // ─── Desserts ────────────────────────────────────────
  {
    category: "Dessert",
    name: "Warm Molten Lava Cake",
    url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
  },
  {
    category: "Dessert",
    name: "Classic Italian Tiramisu",
    url: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
  },
];
