// Initial verified customer reviews for CHARI products
export const INITIAL_REVIEWS = [
  {
    id: 'rev-001',
    productId: 'prod-001', // Kids Jeans & Top Set
    userName: 'Akua Mensah',
    userCity: 'East Legon, Accra',
    rating: 5,
    title: 'Top notch quality! Kids loved it',
    comment: 'The denim material is thick and very soft on the skin. Sizing was accurate and it arrived neatly packaged in Accra within 24 hours of ordering.',
    verified: true,
    createdAt: '2026-09-20T10:15:00Z',
    helpfulCount: 7
  },
  {
    id: 'rev-002',
    productId: 'prod-001',
    userName: 'Kofi Boateng',
    userCity: 'Kumasi',
    rating: 5,
    title: 'Sent via VIP bus, picked up safely',
    comment: 'I was skeptical ordering from Kumasi, but CHARI sent it via VIP parcel service at Asafo and texted me the bus slip. Super smooth transaction.',
    verified: true,
    createdAt: '2026-09-18T14:30:00Z',
    helpfulCount: 4
  },
  {
    id: 'rev-003',
    productId: 'prod-002', // Portable USB Blender
    userName: 'Nana Ama Serwaa',
    userCity: 'Spintex, Accra',
    rating: 5,
    title: 'Essential for my morning smoothies!',
    comment: 'Strong motor for its size. It easily blends frozen mango chunks and ice with milk. Charges via Type-C which is very convenient in Ghana.',
    verified: true,
    createdAt: '2026-09-22T09:00:00Z',
    helpfulCount: 12
  },
  {
    id: 'rev-004',
    productId: 'prod-002',
    userName: 'Ewura Esi',
    userCity: 'Takoradi',
    rating: 4,
    title: 'Works great, battery lasts 6-7 blends',
    comment: 'Very practical gadget. Took 2 days to arrive in Takoradi. Battery life is decent and cleaning is super easy. Highly recommended.',
    verified: true,
    createdAt: '2026-09-14T11:45:00Z',
    helpfulCount: 3
  },
  {
    id: 'rev-005',
    productId: 'prod-003', // Velvet Full-Body Mannequin
    userName: 'Grace Adobea (Boutique Owner)',
    userCity: 'Osu, Accra',
    rating: 5,
    title: 'Elevated our shop display immediately',
    comment: 'The velvet finish gives dresses an ultra-luxurious drape. Sturdy metal base with wheels that make repositioning effortless. Best price in town compared to Makola.',
    verified: true,
    createdAt: '2026-09-10T16:20:00Z',
    helpfulCount: 15
  },
  {
    id: 'rev-006',
    productId: 'prod-004', // Foldable Wardrobe
    userName: 'Emmanuel Quaye',
    userCity: 'Tema Community 9',
    rating: 5,
    title: 'Solid steel pipes, fits all my clothes',
    comment: 'Took me about 25 minutes to assemble following the diagram. Very spacious and keeps dust away. Pay on delivery via MoMo was very reassuring.',
    verified: true,
    createdAt: '2026-09-19T13:10:00Z',
    helpfulCount: 6
  },
  {
    id: 'rev-007',
    productId: 'prod-005', // Smart Air Fryer 6L
    userName: 'Yaa Konadu',
    userCity: 'Airport Residential, Accra',
    rating: 5,
    title: 'Crispy plantain with zero oil!',
    comment: 'Game changer for our kitchen. Makes kelewele, chicken wings, and grilled fish in under 15 minutes without smoking the kitchen. Digital touchscreen is intuitive.',
    verified: true,
    createdAt: '2026-09-24T18:40:00Z',
    helpfulCount: 19
  }
];

export const AVAILABLE_PROMO_CODES = [
  {
    code: 'CHARI10',
    type: 'PERCENTAGE',
    value: 10,
    badge: '10% OFF',
    description: 'Get 10% off storewide on any order today',
    minSpend: 0
  },
  {
    code: 'WELCOME20',
    type: 'FIXED',
    value: 20,
    badge: 'GH₵20 OFF',
    description: 'Welcome gift: GH₵20 discount on orders over GH₵100',
    minSpend: 100
  },
  {
    code: 'FREESHIP',
    type: 'FIXED',
    value: 35,
    badge: 'FREE DELIVERY',
    description: 'Waives standard GH₵35 express delivery within Accra',
    minSpend: 250
  },
  {
    code: 'SUPER50',
    type: 'FIXED',
    value: 50,
    badge: 'GH₵50 OFF',
    description: 'Special VIP savings of GH₵50 on orders above GH₵500',
    minSpend: 500
  }
];
