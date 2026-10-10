export type MenuCategory =
  | 'Hot Coffee'
  | 'Cold Coffee'
  | 'Tea & Hot Beverages'
  | 'Refreshers & Cold Drinks'
  | 'Breakfast & Light Meals'
  | 'Main Food'
  | 'Snacks & Sides'
  | 'Bakery & Desserts'

export type MenuOption = {
  name: string
  price: number
  available: boolean
}

export type MenuOptionGroup = {
  label: string
  required?: boolean
  options: MenuOption[]
}

export type MenuItem = {
  id: string
  name: string
  description: string
  category: MenuCategory
  image: string
  price: number
  available: boolean
  dietary: 'Vegetarian' | 'Non-vegetarian'
  prepMinutes: number
  allergens: string[]
  optionGroups: MenuOptionGroup[]
}

const photos: Record<MenuCategory, string[]> = {
  'Hot Coffee': ['photo-1461023058943-07fcbe16d735', 'photo-1509042239860-f550ce710b93', 'photo-1495474472287-4d71bcdd2085', 'photo-1442512595331-e89e73853f31'],
  'Cold Coffee': ['photo-1461023058943-07fcbe16d735', 'photo-1517701604599-bb29b565090c', 'photo-1498804103079-a6351b050096'],
  'Tea & Hot Beverages': ['photo-1544787219-7f47ccb76574', 'photo-1576092768241-dec231879fc3', 'photo-1597318181409-cf64d0b5d8a2'],
  'Refreshers & Cold Drinks': ['photo-1513558161293-cdaf765edfd7', 'photo-1517701604599-bb29b565090c', 'photo-1544145945-f90425340c7e'],
  'Breakfast & Light Meals': ['photo-1525351484163-7529414344d8', 'photo-1533089860892-a7c6f0a88666', 'photo-1528735602780-2552fd46c7af'],
  'Main Food': ['photo-1547592180-85f173990554', 'photo-1565299624946-b28f40a0ae38', 'photo-1473093295043-cdd812d0e601', 'photo-1546069901-ba9599a7e63c'],
  'Snacks & Sides': ['photo-1573080496219-bb080dd4f877', 'photo-1576107232684-1279f390859f', 'photo-1513104890138-7c749659a591'],
  'Bakery & Desserts': ['photo-1509440159596-0249088772ff', 'photo-1606313564200-e75d5e30476c', 'photo-1488477181946-6428a0291777', 'photo-1551024506-0bccd828d307'],
}

const catalog: { category: MenuCategory; entries: [string, number, boolean, number, string[]][] }[] = [
  {
    category: 'Hot Coffee',
    entries: [
      ['Espresso', 110, true, 3, ['Coffee']],
      ['Double Espresso', 150, true, 4, ['Coffee']],
      ['Americano', 140, true, 4, ['Coffee']],
      ['Cappuccino', 170, true, 5, ['Milk']],
      ['Café Latte', 180, true, 6, ['Milk']],
      ['Flat White', 180, true, 5, ['Milk']],
      ['Café Mocha', 210, true, 7, ['Milk', 'Soy']],
      ['Caramel Latte', 220, true, 7, ['Milk']],
      ['Vanilla Latte', 220, true, 7, ['Milk']],
      ['Filter Coffee', 120, true, 5, ['Milk']],
    ],
  },
  {
    category: 'Cold Coffee',
    entries: [
      ['Iced Americano', 160, true, 5, ['Coffee']],
      ['Iced Latte', 190, true, 6, ['Milk']],
      ['Iced Mocha', 220, true, 7, ['Milk']],
      ['Classic Cold Coffee', 200, true, 7, ['Milk']],
      ['Cold Coffee with Ice Cream', 260, true, 8, ['Milk']],
      ['Caramel Frappe', 250, true, 8, ['Milk']],
      ['Mocha Frappe', 250, true, 8, ['Milk']],
      ['Vanilla Frappe', 240, true, 8, ['Milk']],
      ['Vietnamese Iced Coffee', 220, true, 7, ['Milk']],
    ],
  },
  {
    category: 'Tea & Hot Beverages',
    entries: [
      ['Masala Chai', 100, true, 5, ['Milk']],
      ['Ginger Tea', 90, true, 5, ['Milk']],
      ['Green Tea', 110, true, 4, []],
      ['Lemon Tea', 100, true, 4, []],
      ['Hot Chocolate', 190, true, 7, ['Milk']],
      ['Matcha Latte', 220, true, 7, ['Milk']],
      ['Turmeric Latte', 190, true, 6, ['Milk']],
    ],
  },
  {
    category: 'Refreshers & Cold Drinks',
    entries: [
      ['Fresh Lemonade', 130, true, 4, []],
      ['Mint Lemonade', 150, true, 5, []],
      ['Peach Iced Tea', 170, true, 5, []],
      ['Mango Cooler', 190, true, 5, []],
      ['Strawberry Cooler', 190, true, 5, []],
      ['Chocolate Milkshake', 220, true, 7, ['Milk']],
      ['Vanilla Milkshake', 210, true, 7, ['Milk']],
      ['Mango Smoothie', 230, true, 6, ['Milk']],
      ['Strawberry Smoothie', 230, true, 6, ['Milk']],
    ],
  },
  {
    category: 'Breakfast & Light Meals',
    entries: [
      ['Veg Sandwich', 190, true, 9, ['Gluten']],
      ['Grilled Cheese Sandwich', 210, true, 9, ['Gluten', 'Milk']],
      ['Paneer Sandwich', 230, true, 10, ['Gluten', 'Milk']],
      ['Egg Sandwich', 220, false, 10, ['Gluten', 'Egg']],
      ['Avocado Toast', 260, true, 8, ['Gluten']],
      ['Veggie Wrap', 210, true, 9, ['Gluten']],
      ['Paneer Wrap', 240, true, 10, ['Gluten', 'Milk']],
      ['Egg Wrap', 230, false, 10, ['Gluten', 'Egg']],
      ['Masala Omelette', 190, false, 8, ['Egg']],
      ['Croissant Sandwich', 250, true, 9, ['Gluten', 'Milk']],
    ],
  },
  {
    category: 'Main Food',
    entries: [
      ['Classic Veg Burger', 250, true, 12, ['Gluten']],
      ['Paneer Burger', 280, true, 13, ['Gluten', 'Milk']],
      ['Crispy Chicken Burger', 320, false, 14, ['Gluten', 'Egg']],
      ['Grilled Chicken Sandwich', 330, false, 14, ['Gluten']],
      ['Margherita Pizza', 320, true, 16, ['Gluten', 'Milk']],
      ['Farmhouse Veg Pizza', 390, true, 18, ['Gluten', 'Milk']],
      ['Paneer Tikka Pizza', 420, true, 18, ['Gluten', 'Milk']],
      ['White Sauce Pasta', 320, true, 15, ['Gluten', 'Milk']],
      ['Red Sauce Pasta', 290, true, 14, ['Gluten']],
      ['Creamy Mushroom Pasta', 350, true, 16, ['Gluten', 'Milk']],
      ['Veg Fried Rice', 260, true, 12, ['Soy']],
      ['Chicken Rice Bowl', 360, false, 15, ['Soy']],
    ],
  },
  {
    category: 'Snacks & Sides',
    entries: [
      ['French Fries', 150, true, 7, []],
      ['Peri-Peri Fries', 180, true, 7, []],
      ['Potato Wedges', 170, true, 8, []],
      ['Garlic Bread', 160, true, 8, ['Gluten']],
      ['Cheese Garlic Bread', 210, true, 9, ['Gluten', 'Milk']],
      ['Nachos with Cheese', 220, true, 8, ['Milk']],
      ['Onion Rings', 170, true, 8, ['Gluten']],
      ['Chicken Nuggets', 240, false, 9, ['Gluten']],
      ['Veg Momos', 190, true, 10, ['Gluten']],
      ['Paneer Momos', 220, true, 11, ['Gluten', 'Milk']],
    ],
  },
  {
    category: 'Bakery & Desserts',
    entries: [
      ['Butter Croissant', 140, true, 3, ['Gluten', 'Milk']],
      ['Chocolate Croissant', 170, true, 3, ['Gluten', 'Milk']],
      ['Chocolate Brownie', 160, true, 4, ['Gluten', 'Egg']],
      ['Chocolate Lava Cake', 220, true, 8, ['Gluten', 'Milk', 'Egg']],
      ['Blueberry Muffin', 150, true, 3, ['Gluten', 'Egg']],
      ['Chocolate Muffin', 150, true, 3, ['Gluten', 'Egg']],
      ['Cheesecake', 240, true, 4, ['Milk', 'Egg']],
      ['Chocolate Chip Cookie', 100, true, 3, ['Gluten', 'Milk']],
      ['Red Velvet Pastry', 210, true, 4, ['Gluten', 'Milk', 'Egg']],
      ['Tiramisu', 260, true, 5, ['Gluten', 'Milk', 'Egg']],
    ],
  },
]

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function descriptionFor(name: string, category: MenuCategory) {
  const phrase: Record<MenuCategory, string> = {
    'Hot Coffee': 'Freshly brewed with our signature espresso blend.',
    'Cold Coffee': 'Chilled to order and finished for a smooth, refreshing sip.',
    'Tea & Hot Beverages': 'A comforting cup, prepared fresh when you order.',
    'Refreshers & Cold Drinks': 'A bright, refreshing drink made fresh to order.',
    'Breakfast & Light Meals': 'A freshly prepared café favourite, made to order.',
    'Main Food': 'A satisfying BR Café kitchen favourite, prepared fresh.',
    'Snacks & Sides': 'A freshly prepared side, perfect for sharing.',
    'Bakery & Desserts': 'A delightful café treat, baked or finished with care.',
  }
  return `${name}. ${phrase[category]}`
}

function optionsFor(category: MenuCategory, allergens: string[]): MenuOptionGroup[] {
  const groups: MenuOptionGroup[] = []
  if (['Hot Coffee', 'Cold Coffee', 'Tea & Hot Beverages'].includes(category)) {
    groups.push({
      label: 'Size',
      required: true,
      options: [
        { name: 'Regular', price: 0, available: true },
        { name: 'Large', price: 50, available: true },
      ],
    })
    if (allergens.includes('Milk')) {
      groups.push({
        label: 'Milk',
        options: [
          { name: 'Regular milk', price: 0, available: true },
          { name: 'Oat milk', price: 35, available: true },
          { name: 'Almond milk', price: 35, available: true },
        ],
      })
    }
    groups.push({
      label: 'Sugar',
      options: [
        { name: 'Regular', price: 0, available: true },
        { name: 'Less', price: 0, available: true },
        { name: 'No sugar', price: 0, available: true },
      ],
    })
    if (category !== 'Tea & Hot Beverages') {
      groups.push({
        label: 'Extra shot',
        options: [
          { name: 'No extra shot', price: 0, available: true },
          { name: 'Add espresso shot', price: 45, available: true },
        ],
      })
    }
  } else if (['Main Food', 'Breakfast & Light Meals'].includes(category)) {
    groups.push({
      label: 'Add-ons',
      options: [
        { name: 'No add-on', price: 0, available: true },
        { name: 'Extra cheese', price: 40, available: true },
        { name: 'Extra sauce', price: 25, available: true },
      ],
    })
  }
  return groups
}

export const menuItems: MenuItem[] = catalog.flatMap(({ category, entries }) =>
  entries.map(([name, price, vegetarian, prepMinutes, allergens], index) => ({
    id: slugify(name),
    name,
    description: descriptionFor(name, category),
    category,
    image: `https://images.unsplash.com/${photos[category][index % photos[category].length]}?auto=format&fit=crop&w=900&q=80`,
    price,
    available: !['Mango Cooler', 'Paneer Tikka Pizza'].includes(name),
    dietary: vegetarian ? 'Vegetarian' : 'Non-vegetarian',
    prepMinutes,
    allergens,
    optionGroups: optionsFor(category, allergens),
  })),
)

export const menuCategories = catalog.map(({ category }) => category)

export const menuPriceDisclaimer =
  'Demo prices in INR for preview only. Final pricing and availability must be confirmed by BR CAFÉ ordering services.'
