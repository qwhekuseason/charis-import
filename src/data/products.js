export const CATEGORIES = [
  {
    id: 'appliances',
    name: 'Appliances',
    slug: 'appliances',
    description: 'Smart home electronics, fans, heaters, and home appliances.',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    itemCount: 24
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
    image: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600&auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=600&auto=format&fit=crop&q=80',
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
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
    itemCount: 29
  },
  {
    id: 'underwear',
    name: 'Underwear',
    slug: 'underwear',
    description: 'Bras, seamless panties, boxers, and shapewear.',
    image: 'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=600&auto=format&fit=crop&q=80',
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
      'https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=80',
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
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
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
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80'
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
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80'
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

export const SAMPLE_TRACKING_ORDERS = {
  'CHR-SEA-8821': {
    orderId: 'CHR-SEA-8821',
    customerName: 'Kofi Mensah Boateng',
    phone: '0244987654',
    date: '2026-09-12',
    status: 'on_high_seas',
    freightType: 'SEA_FREIGHT',
    containerNumber: 'MSKU-882419-7',
    containerType: '40ft High Cube (FCL Consolidated)',
    vesselName: 'MSC Tema Voyager V.2604',
    portOfOrigin: 'Guangzhou International Sea Port, China',
    portOfDestination: 'Port of Tema (MPS Terminal 3), Ghana',
    etaDate: '2026-10-18',
    volumetricWeight: { cbm: 1.45, actualKg: 185 },
    fxLock: { usdRate: 15.65, rmbRate: 2.18, lockedAt: '2026-09-12 11:24 GMT' },
    idempotencyKey: 'idemp_sea_8821_991823',
    items: [
      { name: 'Commercial Ergonomic Office Mesh Chairs (Batch of 4)', qty: 4, price: 480.00 },
      { name: 'Dual Motor Height Adjustable Standing Desk Frame', qty: 2, price: 950.00 }
    ],
    total: 3820.00,
    shippingMethod: 'Sea Freight Direct Container Pre-Order',
    destination: 'Direct Doorstep Delivery, Airport Hills, Accra',
    waybillNumber: 'BL-MSK-GH2609-8821',
    steps: [
      { title: 'Order Confirmed & FX Locked', time: '12 Sep, 11:24 AM', location: 'Accra FX Treasury Hub', done: true, note: 'USD/GHS rate locked at 15.65. Supplier PO #GH-9920 released.' },
      { title: 'Factory Batching & QC Inspection', time: '17 Sep, 04:30 PM', location: 'Guangzhou Consolidation Warehouse', done: true, note: 'Passed 100% factory stress inspection. 40ft container stuffed & sealed.' },
      { title: 'On High Seas / International Transit', time: '22 Sep, 08:00 AM', location: 'Atlantic South Transit Corridor (ETA 18 Oct)', done: true, current: true, note: 'Vessel MSC Tema Voyager underway at 18.4 knots. Container seal #77291-C.' },
      { title: 'Local Customs Clearance (Tema Port)', time: 'Expected 19 Oct', location: 'Tema MPS Terminal 3 (GRA/ICUMS)', done: false, note: 'Single Window pre-manifest declared. Duty assessment pending arrival.' },
      { title: 'Arrived at Accra Central Distribution Hub', time: 'Expected 21 Oct', location: 'Spintex Rd Fulfillment Hub, Accra', done: false, note: 'Sorting, deconsolidation, and final quality control pass.' },
      { title: 'Out for Delivery / Collection', time: 'Expected 22 Oct', location: 'Direct Courier Dispatch, Greater Accra', done: false, note: 'Designated courier assigned with GPS real-time route.' }
    ]
  },
  'CHR-AIR-9402': {
    orderId: 'CHR-AIR-9402',
    customerName: 'Dr. Evelyn Asare-Bediako',
    phone: '0501234567',
    date: '2026-09-24',
    status: 'customs_clearance',
    freightType: 'AIR_FREIGHT',
    flightNumber: 'EK-9821 Cargo Express',
    airWaybill: 'AWB-176-90412850',
    portOfOrigin: 'Yiwu International Cargo Airport, China',
    portOfDestination: 'Kotoka International Airport (Cargo Terminal), Accra',
    etaDate: '2026-10-02',
    volumetricWeight: { cbm: 0.22, actualKg: 28.5 },
    fxLock: { usdRate: 15.65, rmbRate: 2.18, lockedAt: '2026-09-24 09:12 GMT' },
    idempotencyKey: 'idemp_air_9402_771890',
    items: [
      { name: '4K Cinema Smart Projector (Ultra Bright)', qty: 2, price: 850.00 },
      { name: 'Wireless Lavalier Dual Microphone Pods', qty: 3, price: 180.00 }
    ],
    total: 2240.00,
    shippingMethod: 'Express Air Cargo Direct Pre-Order',
    destination: 'East Legon Ambassadorial Enclave, Accra',
    waybillNumber: 'AWB-176-90412850',
    steps: [
      { title: 'Order Confirmed & FX Locked', time: '24 Sep, 09:12 AM', location: 'Accra FX Treasury Hub', done: true, note: 'FX rate locked. Direct Air Cargo allocation slot secured.' },
      { title: 'Factory Batching & QC Inspection', time: '26 Sep, 02:00 PM', location: 'Yiwu Direct Fulfillment Center', done: true, note: 'Electronic serials verified & barcoded for air dispatch.' },
      { title: 'On High Seas / International Flight', time: '28 Sep, 11:45 PM', location: 'Flight EK-9821 Touchdown at KIA', done: true, note: 'Flight landed safely at Kotoka International Airport Cargo Ramp.' },
      { title: 'Local Customs Clearance (KIA Cargo)', time: '30 Sep, 10:30 AM', location: 'Aviance Cargo Village, Accra', done: true, current: true, note: 'ICUMS duty processed. Single Window GRA inspection in final clearance.' },
      { title: 'Arrived at Accra Central Distribution Hub', time: 'Expected 01 Oct', location: 'Spintex Rd Sorting Facility', done: false, note: 'Terminal release and transfer to domestic sorting conveyor.' },
      { title: 'Out for Delivery / Collection', time: 'Expected 02 Oct', location: 'Express Doorstep Delivery, Accra', done: false, note: 'Priority morning delivery scheduled.' }
    ]
  },
  'CHR-10024': {
    orderId: 'CHR-10024',
    customerName: 'Kwame Mensah',
    phone: '0244123456',
    date: '2026-09-18',
    status: 'dispatched',
    freightType: 'LOCAL_DISPATCH',
    items: [
      { name: 'Kids Jeans & Top Set', qty: 2, price: 65.00 },
      { name: 'Short Joggers', qty: 1, price: 65.00 }
    ],
    total: 195.00,
    shippingMethod: 'Nationwide Bus Station Delivery',
    destination: 'VIP Bus Station, Kumasi Adum',
    waybillNumber: 'VIP-KMS-883492',
    steps: [
      { title: 'Order Confirmed & FX Locked', time: '18 Sep, 09:15 AM', location: 'Spintex Rd HQ', done: true, note: 'MoMo transaction verified.' },
      { title: 'Factory Batching & QC Inspection', time: '18 Sep, 11:30 AM', location: 'Accra Central Warehouse', done: true, note: 'Inventory verified and securely bagged.' },
      { title: 'On High Seas / Regional Transit', time: '18 Sep, 02:45 PM', location: 'Accra Logistics Hub', done: true, note: 'Manifest logged with transport coordinator.' },
      { title: 'Local Customs Clearance', time: '19 Sep, 06:00 AM', location: 'Local Waybill Office', done: true, note: 'Station fees and dispatch manifest cleared.' },
      { title: 'Arrived at Accra Central Distribution Hub', time: '19 Sep, 07:20 AM', location: 'VIP Parcel Terminal, Circle', done: true, current: true, note: 'Boarded VIP bus to Kumasi Adum terminal.' },
      { title: 'Out for Delivery / Ready for Collection', time: 'Expected 19 Sep, 04:00 PM', location: 'VIP Station, Kumasi', done: false, note: 'Customer SMS notification queued with collection code.' }
    ]
  },
  'CHR-10088': {
    orderId: 'CHR-10088',
    customerName: 'Abena Serwaa',
    phone: '0555987654',
    date: '2026-09-19',
    status: 'packed',
    freightType: 'LOCAL_EXPRESS',
    items: [
      { name: 'Seamless Push-Up Bra', qty: 3, price: 45.00 },
      { name: 'Trendy Shein Dress & Sets', qty: 2, price: 75.00 }
    ],
    total: 285.00,
    shippingMethod: 'Greater Accra Express Delivery',
    destination: 'East Legon, Accra',
    waybillNumber: 'EXPR-ACC-40291',
    steps: [
      { title: 'Order Confirmed & FX Locked', time: '19 Sep, 08:00 AM', location: 'Spintex Rd HQ', done: true, note: 'Payment confirmed via Hubtel MoMo.' },
      { title: 'Factory Batching & QC Inspection', time: '19 Sep, 09:30 AM', location: 'Accra Warehouse Hub', done: true, note: 'Product QC verified & gift-boxed.' },
      { title: 'On High Seas / Local Staging', time: '19 Sep, 11:30 AM', location: 'Dispatched to Dispatch Rider', done: true, current: true, note: 'Packed at Spintex Fulfillment Depot.' },
      { title: 'Local Customs Clearance', time: '19 Sep, 12:00 PM', location: 'Internal Verification', done: true, note: 'Pre-shipment verification passed.' },
      { title: 'Arrived at Accra Central Distribution Hub', time: '19 Sep, 01:15 PM', location: 'Accra Dispatch Center', done: false, note: 'Assigned to motorcycle express fleet.' },
      { title: 'Out for Delivery / Doorstep Drop', time: 'Pending', location: 'East Legon Route', done: false, note: 'ETA 2-4 hours.' }
    ]
  }
};
