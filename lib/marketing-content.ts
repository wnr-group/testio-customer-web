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
  heading: 'Strength you can taste.',
  title: 'International gold medalist in powerlifting',
  body: "Champions don't leave their fuel to chance. Our ambassador — an international gold medalist proudly lifting for India — backs food that's honest: home-cooked, fresh, made with care.",
  medalsCaption: 'Medals earned on real, home-cooked food.',
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
