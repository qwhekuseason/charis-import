export const CATEGORIES = [
  {
    id: 'appliances',
    name: 'Appliances',
    slug: 'appliances',
    description: 'Smart home electronics, fans, heaters, and home appliances.',
    image: 'https://images.pexels.com/photos/35285814/pexels-photo-35285814.jpeg?auto=compress&cs=tinysrgb&w=600',
    itemCount: 24
  },
  {
    id: 'food-snacks',
    name: 'Food & Snacks',
    slug: 'food-snacks',
    description: 'Imported snacks, biscuits, sweets, drinks and pantry foods.',
    image: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=600&auto=format&fit=crop&q=80',
    itemCount: 0
  },
  {
    id: 'furniture',
    name: 'Furniture',
    slug: 'furniture',
    description: 'Modern office chairs, compact dining sets, and salon furnishings.',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
    itemCount: 18
  },
  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    slug: 'health-wellness',
    description: 'Massage therapy tools, diffusers, skincare & personal care gadgets.',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&auto=format&fit=crop&q=80',
    itemCount: 32
  },
  {
    id: 'kids-wear',
    name: 'Kids Wear',
    slug: 'kids-wear',
    description: 'Baby rompers, boys two-piece sets, and trendy kids jeans.',
    image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=600&auto=format&fit=crop&q=80',
    itemCount: 54
  },
  {
    id: 'kitchen-appliances',
    name: 'Kitchen Appliances',
    slug: 'kitchen-appliances',
    description: 'Heavy duty blenders, air fryers, pressure cookers, and juicers.',
    image: 'https://images.unsplash.com/photo-1536304447766-da0ed4ce1b73?w=600&auto=format&fit=crop&q=80',
    itemCount: 28
  },
  {
    id: 'ladies-wear',
    name: 'Ladies Wear',
    slug: 'ladies-wear',
    description: 'Dresses, co-ords, tops, joggers, and summer fashion.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    itemCount: 86
  },
  {
    id: 'mannequins',
    name: 'Mannequins',
    slug: 'mannequins',
    description: 'Full body display mannequins, dress forms, and boutique hangers.',
    image: 'https://images.unsplash.com/photo-1646004812243-f071fbe69766?w=600&auto=format&fit=crop&q=80',
    itemCount: 15
  },
  {
    id: 'men-wear',
    name: 'Men Wear',
    slug: 'men-wear',
    description: 'Polo shirts, round neck tees, denim jeans & shorts.',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&auto=format&fit=crop&q=80',
    itemCount: 47
  },
  {
    id: 'perfumes',
    name: 'Perfumes',
    slug: 'perfumes',
    description: 'Long-lasting Arabian oud, French designer fragrances & oils.',
    image: 'https://images.unsplash.com/photo-1709100648536-8c2c36068eb2?w=600&auto=format&fit=crop&q=80',
    itemCount: 29
  },
  {
    id: 'underwear',
    name: 'Underwear',
    slug: 'underwear',
    description: 'Bras, seamless panties, boxers, and shapewear.',
    image: 'https://images.unsplash.com/photo-1694290340663-65804773ce7a?w=600&auto=format&fit=crop&q=80',
    itemCount: 39
  }
];

export const PRODUCTS = [
  {
    id: 'prod-001',
    slug: 'kids-jeans-and-top',
    name: 'Kids Jeans & Top Set',
    category: 'Kids Wear',
    categorySlug: 'kids-wear',
    price: 65.00,
    originalPrice: 95.00,
    inStock: 1123,
    images: [
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: false,
    rating: 4.8,
    reviewCount: 38,
    description: 'Adorable kids two-piece denim set with a stylish cotton printed top. Soft, breathable fabric that is gentle on children\'s skin. Available in sizes for ages 2 to 8 years.',
    specifications: [
      { label: 'Material', value: '95% Premium Cotton, 5% Spandex Denim' },
      { label: 'Sizes', value: 'Ages 2 to 8 years' },
      { label: 'Colors', value: 'Blue denim with White / Yellow / Pink tops' },
      { label: 'Packaging', value: 'Individually packaged' },
      { label: 'Origin', value: 'Quality-checked import' }
    ]
  },
  {
    id: 'prod-002',
    slug: 'everyday-bra',
    name: 'Seamless Push-Up Bra',
    category: 'Underwear',
    categorySlug: 'underwear',
    price: 45.00,
    originalPrice: 80.00,
    inStock: 4500,
    images: [
      'https://images.unsplash.com/photo-1694290340663-65804773ce7a?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584061634739-88035e420618?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: true,
    rating: 4.9,
    reviewCount: 62,
    description: 'Seamless push-up and wire-free everyday bra. Comfortable soft contour memory foam padding with a secure hook & eye closure. Great for all-day wear.',
    specifications: [
      { label: 'Sizes', value: '34B to 42D' },
      { label: 'Padding', value: 'Soft contour memory foam' },
      { label: 'Closure', value: '3-row hook & eye closure' }
    ]
  },
  {
    id: 'prod-003',
    slug: 'shein-dress',
    name: 'Trendy Shein Dress & Sets',
    category: 'Ladies Wear',
    categorySlug: 'ladies-wear',
    price: 75.00,
    originalPrice: 120.00,
    inStock: 890,
    images: [
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: true,
    rating: 4.7,
    reviewCount: 45,
    description: 'Trendy bodycon dresses, floral midi dresses, casual co-ords and crop sets. Brand new with original tags. Perfect for any occasion.',
    specifications: [
      { label: 'Condition', value: 'Brand new with tags' },
      { label: 'Sizes', value: 'XS, S, M, L, XL' },
      { label: 'Styles', value: 'Assorted seasonal trending designs' }
    ]
  },
  {
    id: 'prod-004',
    slug: 'tank-shirts',
    name: 'Men\'s Tank Shirt',
    category: 'Men Wear',
    categorySlug: 'men-wear',
    price: 50.00,
    originalPrice: null,
    inStock: 640,
    images: [
      'https://images.unsplash.com/photo-1767392060739-8ae29223816c?w=800&auto=format&fit=crop&q=80'
    ],
    featured: false,
    trending: false,
    justLanded: true,
    rating: 4.6,
    reviewCount: 19,
    description: 'Ribbed heavyweight cotton tank vest for men and gym enthusiasts. Anti-shrink, sweat-absorbing, with reinforced stitching along armholes and neckline.',
    specifications: [
      { label: 'Material', value: '100% Ring-spun Combed Cotton' },
      { label: 'Weight', value: '220 GSM heavyweight' },
      { label: 'Colors', value: 'Black, White, Heather Grey, Olive, Navy' }
    ]
  },
  {
    id: 'prod-005',
    slug: 'short-joggers',
    name: 'Short Joggers',
    category: 'Men Wear',
    categorySlug: 'men-wear',
    price: 65.00,
    originalPrice: 95.00,
    inStock: 1450,
    images: [
      'https://images.unsplash.com/photo-1566392722006-b3ccec017bec?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: true,
    rating: 4.9,
    reviewCount: 51,
    description: 'Fleece sweatshorts with deep zipper pockets, elastic waistband, and durable drawstrings. Very popular for everyday streetwear.',
    specifications: [
      { label: 'Fabric', value: 'French Terry Cotton Fleece 280 GSM' },
      { label: 'Pockets', value: '2 Side zipper pockets + 1 back patch pocket' },
      { label: 'Fit', value: 'Relaxed above-knee fit' }
    ]
  },
  {
    id: 'prod-006',
    slug: 'mens-round-neck-tee',
    name: 'Men\'s Round Neck T-Shirt',
    category: 'Men Wear',
    categorySlug: 'men-wear',
    price: 55.00,
    originalPrice: 80.00,
    inStock: 3200,
    images: [
      'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: true,
    rating: 4.8,
    reviewCount: 40,
    description: 'Plain oversized and crewneck cotton t-shirts. Great for casual wear, branding, or screen printing.',
    specifications: [
      { label: 'Weight', value: '230 GSM Heavy Cotton' },
      { label: 'Colors', value: '8 solid colours available' }
    ]
  },
  {
    id: 'prod-007',
    slug: 'polo-lacoste',
    name: 'Polo Shirt',
    category: 'Men Wear',
    categorySlug: 'men-wear',
    price: 55.00,
    originalPrice: 85.00,
    inStock: 940,
    images: [
      'https://images.unsplash.com/photo-1671438118097-479e63198629?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1720514496161-914011a9ee02?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: true,
    rating: 4.8,
    reviewCount: 33,
    description: 'Classic piqué cotton collar polo shirt. Durable rib knit collar and pearlized buttons. Smart casual fit for any occasion.',
    specifications: [
      { label: 'Material', value: '100% Piqué Petit Cotton' },
      { label: 'Fit', value: 'Classic regular fit' },
      { label: 'Sizes', value: 'M, L, XL, XXL' }
    ]
  },
  {
    id: 'prod-008',
    slug: 'patpat-children-wear',
    name: 'Patpat Children\'s Wear',
    category: 'Kids Wear',
    categorySlug: 'kids-wear',
    price: 70.00,
    originalPrice: 110.00,
    inStock: 1200,
    images: [
      'https://images.unsplash.com/photo-1622290319146-7b63df48a635?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=800&auto=format&fit=crop&q=80'
    ],
    featured: false,
    trending: true,
    justLanded: true,
    rating: 4.9,
    reviewCount: 29,
    description: 'Cute sets for babies and toddlers. Soft stretch knits with adorable animal prints and baby-safe snaps. Safe and comfortable for your little ones.',
    specifications: [
      { label: 'Ages', value: '0-3m, 3-6m, 6-12m, 12-24m, 2-5yrs' },
      { label: 'Condition', value: 'Brand new in sealed bag' }
    ]
  },
  {
    id: 'prod-009',
    slug: 'mixed-stock-jeans',
    name: 'Stretch Denim Jeans',
    category: 'Men Wear',
    categorySlug: 'men-wear',
    price: 85.00,
    originalPrice: 130.00,
    inStock: 780,
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=80'
    ],
    featured: false,
    trending: true,
    justLanded: true,
    rating: 4.7,
    reviewCount: 26,
    description: 'Stretch denim jeans in slim, straight, and relaxed cuts. Heavy brass zips, copper rivets, and stone washed shades for a premium look.',
    specifications: [
      { label: 'Waist Sizes', value: '30, 32, 34, 36, 38, 40' },
      { label: 'Wash', value: 'Dark blue, vintage blue, black stone wash' }
    ]
  },
  {
    id: 'prod-010',
    slug: 'cloud-slides',
    name: 'Cloud Slides & Slippers',
    category: 'Ladies Wear',
    categorySlug: 'ladies-wear',
    price: 45.00,
    originalPrice: 70.00,
    inStock: 1890,
    images: [
      'https://images.unsplash.com/photo-1620288091141-71640b6cd6f4?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: false,
    justLanded: true,
    rating: 4.6,
    reviewCount: 42,
    description: 'Ultra-light EVA cloud slides and comfort slippers. Waterproof, anti-slip soles in beautiful pastel shades. Perfect for home or outdoor casual wear.',
    specifications: [
      { label: 'Material', value: 'High Density EVA foam' },
      { label: 'Sizes', value: '36/37, 38/39, 40/41' }
    ]
  },
  {
    id: 'prod-011',
    slug: 'display-mannequin-female',
    name: 'Full Body Female Display Mannequin',
    category: 'Mannequins',
    categorySlug: 'mannequins',
    price: 450.00,
    originalPrice: 650.00,
    inStock: 160,
    images: [
      'https://images.unsplash.com/photo-1646004812243-f071fbe69766?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: false,
    rating: 4.9,
    reviewCount: 18,
    description: 'Premium fiberglass boutique display mannequin with tempered glass base. Detachable arms and torso for easy dressing. Ideal for shops and boutiques.',
    specifications: [
      { label: 'Height', value: '178 cm' },
      { label: 'Base', value: 'Square Tempered Glass Base' },
      { label: 'Finish', value: 'Matte Eggshell White' }
    ]
  },
  {
    id: 'prod-012',
    slug: 'heavy-duty-blender',
    name: 'Heavy-Duty Commercial Blender 2.5L',
    category: 'Kitchen Appliances',
    categorySlug: 'kitchen-appliances',
    price: 320.00,
    originalPrice: 480.00,
    inStock: 240,
    images: [
      'https://images.unsplash.com/photo-1536304447766-da0ed4ce1b73?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1566304088305-44f227da240e?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: false,
    rating: 5.0,
    reviewCount: 31,
    description: '3000W ultra-crush motor with 6 stainless steel blades. Effortlessly crushes ice, beans, smoothies and dry spices. Perfect for home and commercial kitchens.',
    specifications: [
      { label: 'Power', value: '3000 Watts' },
      { label: 'Capacity', value: '2.5 Liters BPA-free Tritan jug' },
      { label: 'Speed Controls', value: '15 speed knob + Pulse lever' }
    ]
  },
  {
    id: 'prod-013',
    slug: 'arabian-oud-perfume',
    name: 'Luxury Arabian Oud Perfume 100ml',
    category: 'Perfumes',
    categorySlug: 'perfumes',
    price: 90.00,
    originalPrice: 150.00,
    inStock: 540,
    images: [
      'https://images.unsplash.com/photo-1709100648536-8c2c36068eb2?w=800&auto=format&fit=crop&q=80'
    ],
    featured: true,
    trending: true,
    justLanded: false,
    rating: 4.9,
    reviewCount: 27,
    description: '100ml Eau De Parfum with 48-hour longevity. Scents include Sweet Amber, Rich Rose Oud, Vanilla Wood, and White Musk. Direct Dubai import.',
    specifications: [
      { label: 'Concentration', value: 'Eau de Parfum (EDP)' },
      { label: 'Volume', value: '100ml spray bottle with magnetic cap' },
      { label: 'Origin', value: 'Dubai, UAE' }
    ]
  },
  {
    id: 'prod-014',
    slug: 'smart-air-fryer-7l',
    name: 'Smart Visual Air Fryer 7.5L',
    category: 'Kitchen Appliances',
    categorySlug: 'kitchen-appliances',
    price: 420.00,
    originalPrice: 600.00,
    inStock: 180,
    images: [
      'https://images.pexels.com/photos/32928224/pexels-photo-32928224.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/35285814/pexels-photo-35285814.jpeg?auto=compress&cs=tinysrgb&w=800'
    ],
    featured: false,
    trending: true,
    justLanded: true,
    rating: 4.8,
    reviewCount: 23,
    description: 'Large family-size air fryer with a glass viewing window. 8 preset touch modes for chicken, chips, fish, cakes, and dehydration.',
    specifications: [
      { label: 'Capacity', value: '7.5 Liters' },
      { label: 'Power', value: '1800W rapid 360° air circulation' },
      { label: 'Window', value: 'Tempered glass with internal LED' }
    ]
  }
];

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Central',
  'Eastern',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Oti',
  'Savannah',
  'North East',
  'Western North'
];

export const SHIPPING_METHODS = [
  {
    id: 'pickup',
    name: 'Free Store Pickup (Accra)',
    cost: 0,
    time: 'Ready within 2 hours',
    description: 'Pick up free at our store: CHARI, Spintex Road, Accra.'
  },
  {
    id: 'accra_courier',
    name: 'Greater Accra Express Delivery',
    cost: 35,
    time: 'Same day or next day',
    description: 'Doorstep delivery anywhere in Greater Accra.'
  },
  {
    id: 'vip_bus',
    name: 'Nationwide Bus Station Delivery',
    cost: 50,
    time: '24 - 48 hours',
    description: 'Delivery via VIP, STC, or OA parcel station to Kumasi, Takoradi, Tamale, Sunyani, and more.'
  }
];

export const SAMPLE_TRACKING_ORDERS = {};
