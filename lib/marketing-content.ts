// ALL editable marketing copy for the landing page lives here — components
// only render what this file exports. When the brand ambassador's name and
// achievements are confirmed, update `ambassador` below and nothing else.

export const hero = {
  headline: ['Homemade.', 'Hyperlocal.', 'Made by your neighbours.'],
  underlineWord: 'Homemade.',
  sub: 'Real home cooks. Real recipes. Cooked fresh the day you order — never before.',
  ctaPrimary: { label: 'Explore kitchens near you', href: '/explore' },
  ctaSecondary: { label: 'Order now', href: '/login' },
}

export const heroDishes = [
  { src: '/marketing/dish-1.jpg', alt: 'Homestyle biryani' },
  { src: '/marketing/dish-2.jpg', alt: 'Crispy dosa with chutney' },
  { src: '/marketing/dish-3.jpg', alt: 'South Indian thali' },
  { src: '/marketing/dish-4.jpg', alt: 'Gulab jamun' },
]

// Hero showcase cards. TODO: replace `dish` and `cook` with real approved
// cooks before public launch — these four are illustrative placeholders.
export const heroFeatured = [
  { src: '/marketing/dish-3.jpg', alt: '', dish: 'Curd Rice', cook: 'Lakshmi' },
  { src: '/marketing/dish-1.jpg', alt: '', dish: 'Chicken Biryani', cook: 'Farida' },
  { src: '/marketing/dish-2.jpg', alt: '', dish: 'Sambar & Rice', cook: 'Revathi' },
  { src: '/marketing/dish-4.jpg', alt: '', dish: 'Chapati & Curry', cook: 'Meena' },
]

// `alt` is intentionally empty on the cards above and on `garnish` below:
// the dish and cook names sit directly beneath each image, so a filled alt
// would make screen readers announce the same thing twice.

// TODO: same placeholder caveat as heroFeatured.
export const heroSpecial = {
  eyebrow: "Today's Special",
  dish: 'Prawn Biryani',
  cook: 'Shanti',
  image: { src: '/marketing/dish-1.jpg', alt: 'A bowl of freshly cooked prawn biryani' },
  garnish: { src: '/marketing/dish-4.jpg', alt: '' },
}

export const trustRibbon = [
  { title: 'No Restaurants', sub: 'Just homes', icon: 'home' as const },
  { title: 'Safe & Hygienic', sub: 'Prepared with care', icon: 'shield' as const },
  { title: 'On-time Delivery', sub: 'Right to your door', icon: 'truck' as const },
  { title: 'Fresh Daily', sub: 'Cooked the day you order', icon: 'sprout' as const },
]

export type PackagingIconName =
  | 'leaf'
  | 'recycle'
  | 'flask'
  | 'utensils'
  | 'sprout'
  | 'globe'
  | 'refresh'

// Ordered to read problem → solution → benefits, which is also the DOM and
// mobile stacking order in PackagingShowcase.
export const packaging = {
  problem: 'Most food travels in plastic',
  heading: 'Eco-friendly packaging',
  sub: 'Designed for freshness. Better for nature.',
  benefits:
    'Every TESTIO order travels in areca-leaf and moulded-fibre containers — sturdy enough for gravy, warm enough to arrive fresh, and gentle enough to return to the soil they came from.',
  features: [
    { label: '100% Natural', icon: 'leaf' as const },
    { label: 'Biodegradable', icon: 'recycle' as const },
    { label: 'Chemical Free', icon: 'flask' as const },
    { label: 'Food Safe', icon: 'utensils' as const },
    { label: 'Leaf Based', icon: 'sprout' as const },
    { label: 'Sustainable', icon: 'globe' as const },
    { label: 'Reusable', icon: 'refresh' as const },
  ],
  cta: { label: 'Order in eco packaging', href: '/explore' },
}

export const marquee = ['Fresh daily', 'Home kitchens', 'Taste of native', 'Made with love', 'Hyperlocal']

export const howItWorks = {
  heading: 'From their kitchen to your table',
  steps: [
    {
      title: 'Find a home cook',
      body: "Browse real kitchens near you — today's menu, ratings and distance, all upfront.",
      screen: '/marketing/screen-explore.jpg',
    },
    {
      title: 'Order & pay online',
      body: 'Pick your dishes and pay securely. Your cook starts cooking fresh, just for you.',
      screen: '/marketing/screen-menu.jpg',
    },
    {
      title: 'Fresh at your door',
      body: 'Pick it up hot or get it delivered — made today, never reheated.',
      screen: '/marketing/screen-kitchen.jpg',
    },
  ],
}

export const kitchensTeaser = {
  heading: 'Cooking near you right now',
  sub: 'These are real TESTIO kitchens — live menus, live ratings.',
  seeAll: { label: 'See all kitchens', href: '/explore' },
}

export const ambassador = {
  // Set to the ambassador's name once confirmed — the section renders
  // gracefully without it.
  name: null as string | null,
  eyebrow: 'Our brand ambassador',
  heading: 'Strength you can taste.',
  title: 'International gold medalist in powerlifting',
  body: "Champions don't leave their fuel to chance. Our ambassador — an international gold medalist proudly lifting for India — backs food that's honest: home-cooked, fresh, made with care.",
  // Derived ONLY from `title` and `body` above. Do not add achievement
  // claims here that aren't already confirmed copy.
  stats: [
    { value: 'Gold', label: 'International medalist' },
    { value: 'India', label: 'Proudly represents' },
    { value: '100%', label: 'Home-cooked fuel' },
  ],
  // Null until a real, attributable quote is confirmed. Attributing an
  // invented quote to a real athlete is not acceptable. The section omits
  // the blockquote entirely while this is null.
  quote: null as string | null,
  medalsCaption: 'Medals earned on real, home-cooked food.',
  cta: { label: 'Eat like a champion', href: '/explore' },
  images: {
    cutout: '/marketing/ambassador-cutout.png',
    medals: '/marketing/ambassador-medals.jpg',
  },
}

export const becomeCook = {
  heading: 'Cook from home. Earn well.',
  sub: 'Turn your kitchen into a business with TESTIO.',
  points: [
    'Set your own menu, prices and hours',
    'Orders are prepaid — no chasing payments',
    'We bring you customers nearby',
  ],
  cta: 'Become a Cook — get the TESTIO Cook app',
}

export const footer = {
  tagline: 'Taste of Native',
  trust: 'Every TESTIO cook is verified and admin-approved.',
  columns: [
    {
      heading: 'Explore',
      links: [
        { label: 'Kitchens near you', href: '/explore' },
        { label: 'Login', href: '/login' },
        { label: 'Become a Cook', href: '/#become-a-cook' },
      ],
    },
    {
      heading: 'Company',
      links: [{ label: 'Terms & agreement', href: '/agreement' }],
    },
  ],
  legal: `© ${new Date().getFullYear()} Testio Hospitality Service. All rights reserved.`,
}
