import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/prisma';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// Menu data — grouped by category. Image URLs point at real dish photos on
// TheMealDB's public CDN (every URL was verified to return HTTP 200 / image).
// NOTE: the MenuItem image column is spelled `imge_url` in the Prisma schema.
// ---------------------------------------------------------------------------
type SeedItem = {
  name: string;
  description: string;
  price: number;
  imge_url: string;
  is_recommended?: boolean;
};

type SeedCategory = {
  name: string;
  sort_order: number;
  items: SeedItem[];
};

const MENU: SeedCategory[] = [
  {
    name: 'Lao & Thai',
    sort_order: 1,
    items: [
      {
        name: 'Pad Thai',
        description: 'Stir-fried rice noodles with prawns, egg, bean sprouts and crushed peanuts.',
        price: 8.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/rg9ze01763479093.jpg',
        is_recommended: true,
      },
      {
        name: 'Thai Green Curry',
        description: 'Creamy coconut green curry with chicken, bamboo shoots and Thai basil.',
        price: 9.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/sstssx1487349585.jpg',
        is_recommended: true,
      },
      {
        name: 'Massaman Beef Curry',
        description: 'Slow-braised beef in a rich peanut-and-potato massaman curry.',
        price: 10.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/tvttqv1504640475.jpg',
      },
      {
        name: 'Tom Yum Goong',
        description: 'Hot-and-sour prawn soup with lemongrass, galangal and lime leaf.',
        price: 7.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/l50vz41763422681.jpg',
        is_recommended: true,
      },
      {
        name: 'Tom Kha Gai',
        description: 'Coconut chicken soup with mushrooms, lemongrass and a citrus kick.',
        price: 7.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/ol2xxt1763582263.jpg',
      },
      {
        name: 'Pad See Ew',
        description: 'Wide rice noodles stir-fried with egg, Chinese broccoli and dark soy.',
        price: 8.2,
        imge_url: 'https://www.themealdb.com/images/media/meals/uuuspp1468263334.jpg',
      },
      {
        name: 'Drunken Noodles (Pad Kee Mao)',
        description: 'Spicy stir-fried flat noodles with holy basil, chilli and vegetables.',
        price: 8.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/2wx8cm1763373419.jpg',
      },
      {
        name: 'Thai Prawn Fried Rice',
        description: 'Wok-fried jasmine rice with prawns, peas, egg and spring onion.',
        price: 8.0,
        imge_url: 'https://www.themealdb.com/images/media/meals/hblwvg1763478203.jpg',
      },
    ],
  },
  {
    name: 'Chinese',
    sort_order: 2,
    items: [
      {
        name: 'Kung Pao Chicken',
        description: 'Diced chicken stir-fried with peanuts, dried chillies and Sichuan pepper.',
        price: 9.2,
        imge_url: 'https://www.themealdb.com/images/media/meals/1525872624.jpg',
        is_recommended: true,
      },
      {
        name: 'Sweet and Sour Pork',
        description: 'Crispy pork tossed with pineapple, peppers and a tangy sweet-sour glaze.',
        price: 9.0,
        imge_url: 'https://www.themealdb.com/images/media/meals/1529442316.jpg',
      },
      {
        name: 'Beef and Broccoli Stir-Fry',
        description: 'Tender beef and broccoli in a glossy garlic-ginger soy sauce.',
        price: 9.8,
        imge_url: 'https://www.themealdb.com/images/media/meals/m0p0j81765568742.jpg',
        is_recommended: true,
      },
      {
        name: "General Tso's Chicken",
        description: 'Crispy chicken in a sweet, slightly spicy sticky sauce.',
        price: 9.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/1529444113.jpg',
      },
      {
        name: 'Beef Lo Mein',
        description: 'Soft egg noodles tossed with beef and crisp mixed vegetables.',
        price: 8.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/1529444830.jpg',
      },
      {
        name: 'Ma Po Tofu',
        description: 'Silken tofu and minced pork in a numbing-spicy Sichuan bean sauce.',
        price: 8.4,
        imge_url: 'https://www.themealdb.com/images/media/meals/1525874812.jpg',
      },
      {
        name: 'Hot and Sour Soup',
        description: 'Classic peppery-tangy soup with tofu, mushroom and bamboo shoots.',
        price: 5.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/1529445893.jpg',
      },
      {
        name: 'Pork Wontons',
        description: 'Hand-folded pork wontons served in a light savoury broth.',
        price: 6.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/1525876468.jpg',
      },
    ],
  },
  {
    name: 'Japanese',
    sort_order: 3,
    items: [
      {
        name: 'Sushi Platter',
        description: 'Chef-selected nigiri and maki rolls with wasabi and pickled ginger.',
        price: 12.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/g046bb1663960946.jpg',
        is_recommended: true,
      },
      {
        name: 'Chicken Karaage',
        description: 'Japanese-style crispy fried chicken with a squeeze of lemon.',
        price: 8.0,
        imge_url: 'https://www.themealdb.com/images/media/meals/tyywsw1505930373.jpg',
        is_recommended: true,
      },
      {
        name: 'Katsudon',
        description: 'Breaded pork cutlet simmered with egg and onion over steamed rice.',
        price: 10.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/d8f6qx1604182128.jpg',
      },
      {
        name: 'Chicken Katsu Curry',
        description: 'Crispy chicken cutlet with Japanese curry sauce and rice.',
        price: 10.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/vwrpps1503068729.jpg',
        is_recommended: true,
      },
      {
        name: 'Honey Teriyaki Salmon',
        description: 'Pan-seared salmon glazed in a sweet honey-teriyaki sauce.',
        price: 13.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/xxyupu1468262513.jpg',
      },
      {
        name: 'Tonkatsu Pork',
        description: 'Golden panko-crusted pork cutlet with tonkatsu sauce.',
        price: 10.2,
        imge_url: 'https://www.themealdb.com/images/media/meals/lwsnkl1604181187.jpg',
      },
      {
        name: 'Yaki Udon',
        description: 'Thick udon noodles stir-fried with pork and vegetables.',
        price: 9.0,
        imge_url: 'https://www.themealdb.com/images/media/meals/wrustq1511475474.jpg',
      },
      {
        name: 'Teriyaki Chicken',
        description: 'Grilled chicken in glossy teriyaki sauce over rice.',
        price: 9.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
      },
    ],
  },
  {
    name: 'Euro',
    sort_order: 4,
    items: [
      {
        name: 'Spaghetti Bolognese',
        description: 'Slow-cooked beef ragù over al dente spaghetti with parmesan.',
        price: 9.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/sutysw1468247559.jpg',
        is_recommended: true,
      },
      {
        name: 'Beef Lasagne',
        description: 'Layers of pasta, rich meat sauce and creamy béchamel, oven-baked.',
        price: 10.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg',
        is_recommended: true,
      },
      {
        name: 'Spaghetti Carbonara',
        description: 'Roman classic with egg, pecorino, black pepper and guanciale.',
        price: 10.2,
        imge_url: 'https://www.themealdb.com/images/media/meals/llcbn01574260722.jpg',
      },
      {
        name: 'Margherita Pizza',
        description: 'Wood-fired pizza with tomato, fresh mozzarella and basil.',
        price: 9.0,
        imge_url: 'https://www.themealdb.com/images/media/meals/x0lk931587671540.jpg',
        is_recommended: true,
      },
      {
        name: 'Penne Arrabbiata',
        description: 'Penne in a spicy garlic-chilli tomato sauce.',
        price: 8.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/ustsqw1468250014.jpg',
      },
      {
        name: 'Fettuccine Alfredo',
        description: 'Silky fettuccine tossed in a buttery parmesan cream sauce.',
        price: 9.4,
        imge_url: 'https://www.themealdb.com/images/media/meals/0jv5gx1661040802.jpg',
      },
      {
        name: 'Beef Wellington',
        description: 'Tender beef fillet wrapped in mushroom duxelles and golden pastry.',
        price: 18.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/vvpprx1487325699.jpg',
      },
      {
        name: 'Osso Buco alla Milanese',
        description: 'Braised veal shanks in white wine, served with gremolata.',
        price: 16.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/wwuqvt1487345467.jpg',
      },
    ],
  },
  {
    name: 'USA',
    sort_order: 5,
    items: [
      {
        name: 'BBQ Pulled Pork Sloppy Joes',
        description: 'Smoky pulled pork piled on a toasted bun with tangy BBQ sauce.',
        price: 9.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/atd5sh1583188467.jpg',
        is_recommended: true,
      },
      {
        name: 'Southern Fried Chicken',
        description: 'Buttermilk-marinated, crispy deep-fried chicken.',
        price: 10.0,
        imge_url: 'https://www.themealdb.com/images/media/meals/40r49m1763197022.jpg',
        is_recommended: true,
      },
      {
        name: 'New England Clam Chowder',
        description: 'Creamy chowder loaded with clams, potato and bacon.',
        price: 7.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/rvtvuw1511190488.jpg',
      },
      {
        name: 'Grilled Mac & Cheese Sandwich',
        description: 'Griddled sandwich stuffed with gooey three-cheese mac.',
        price: 8.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/xutquv1505330523.jpg',
      },
      {
        name: 'Chicken Fajita Mac & Cheese',
        description: 'Creamy mac & cheese loaded with fajita-spiced chicken and peppers.',
        price: 9.2,
        imge_url: 'https://www.themealdb.com/images/media/meals/qrqywr1503066605.jpg',
      },
      {
        name: 'Buttermilk Pancakes',
        description: 'Stack of fluffy pancakes with butter and maple syrup.',
        price: 6.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/rwuyqx1511383174.jpg',
      },
      {
        name: 'Key Lime Pie',
        description: 'Zesty Florida key lime custard in a buttery graham crust.',
        price: 5.9,
        imge_url: 'https://www.themealdb.com/images/media/meals/qpqtuu1511386216.jpg',
      },
      {
        name: 'Chocolate Raspberry Brownies',
        description: 'Fudgy chocolate brownies swirled with fresh raspberry.',
        price: 5.5,
        imge_url: 'https://www.themealdb.com/images/media/meals/yypvst1511386427.jpg',
        is_recommended: true,
      },
    ],
  },
];

// Cashier account (an Admin row with role CASHIER).
const CASHIER = {
  name: 'Front Cashier',
  email: 'cashier@worldflavors.la',
  password: 'Cashier@123',
};

async function main() {
  console.log('🌱 Starting database seeding...');

  // Delete existing data (FK-safe order). Harmless after a `migrate reset`,
  // and keeps the seed re-runnable on its own via `npm run prisma:seed`.
  console.log('🗑️  Cleaning up existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.table.deleteMany();
  await prisma.category.deleteMany();
  await prisma.restaurant.deleteMany();

  // Create restaurant
  console.log('🏪 Creating restaurant...');
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'World Flavors Bistro',
      address: 'Setthathirath Road, Chanthabouly, Vientiane, Laos',
      latitude: 17.9757,
      longitude: 102.6331,
      radius_meters: 2000,
      vat_rate: 7,
      service_charge_rate: 10,
      theme_color: '#E23744',
    },
  });
  console.log(`✅ Created restaurant: ${restaurant.name}`);

  // Create categories + menu items
  console.log('📁 Creating categories & menu items...');
  let categoryCount = 0;
  let itemCount = 0;
  for (const cat of MENU) {
    const category = await prisma.category.create({
      data: {
        restaurant_id: restaurant.id,
        name: cat.name,
        sort_order: cat.sort_order,
      },
    });
    categoryCount++;

    for (const item of cat.items) {
      await prisma.menuItem.create({
        data: {
          restaurant_id: restaurant.id,
          category_id: category.id,
          name: item.name,
          description: item.description,
          price: item.price,
          imge_url: item.imge_url,
          is_available: true,
          is_recommended: item.is_recommended ?? false,
        },
      });
      itemCount++;
    }
    console.log(`   • ${cat.name}: ${cat.items.length} items`);
  }
  console.log(`✅ Created ${categoryCount} categories / ${itemCount} menu items`);

  // Create 10 tables
  console.log('🪑 Creating tables...');
  const capacities = [2, 2, 4, 4, 4, 6, 6, 8, 2, 10];
  for (let i = 0; i < 10; i++) {
    const tableNumber = `T${String(i + 1).padStart(2, '0')}`;
    await prisma.table.create({
      data: {
        restaurant_id: restaurant.id,
        table_number: tableNumber,
        qr_code_token: `qr_${tableNumber}_${restaurant.id.slice(0, 8)}`,
        capacity: capacities[i],
        is_active: true,
        status: 'AVAILABLE',
      },
    });
  }
  console.log('✅ Created 10 tables (T01–T10)');

  // Create cashier account
  console.log('🧑‍💼 Creating cashier account...');
  const hashedPassword = await bcrypt.hash(CASHIER.password, 10);
  const cashier = await prisma.admin.create({
    data: {
      name: CASHIER.name,
      email: CASHIER.email,
      password: hashedPassword,
      role: 'CASHIER',
      restaurant_id: restaurant.id,
    },
  });
  console.log(`✅ Created cashier: ${cashier.email}`);

  console.log('');
  console.log('✨ Database seeding completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - 1 Restaurant  (${restaurant.name})`);
  console.log(`   - ${categoryCount} Categories (Lao & Thai, Chinese, Japanese, Euro, USA)`);
  console.log(`   - ${itemCount} Menu Items (with image URLs)`);
  console.log('   - 10 Tables (T01–T10)');
  console.log('   - 1 Cashier account');
  console.log('');
  console.log('🔐 Cashier login:');
  console.log(`   email:    ${CASHIER.email}`);
  console.log(`   password: ${CASHIER.password}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
