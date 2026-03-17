/* ═══════════════════════════════════════════════════════════
   store.js — In-memory data for shops & products only
   Users and Orders are now stored in MongoDB (see models/)
   Carts remain in-memory keyed by userId string
═══════════════════════════════════════════════════════════ */

const shops = [
  {
    id: 'tech-hub', name: 'Tech Hub',
    description: 'Cutting-edge gadgets & electronics for the digital age',
    emoji: '⚡',
    theme: { primary: '#00FFB3', accent: '#00FFB3', secondary: '#0a2040', floor: '#0d1a2e', wall: '#071020' },
    products: [
      { id: 't1', shopId: 'tech-hub', name: 'Quantum Earbuds',   price: 149,  description: 'Noise-cancelling with 40hr battery and spatial audio. Premium aluminum finish.', emoji: '🎧', category: 'Audio',        stock: 12, rating: 4.8, color: '#1a1a2e', dimensions: { w:0.5, h:0.5,  d:0.5  } },
      { id: 't2', shopId: 'tech-hub', name: 'HoloWatch Pro',     price: 299,  description: 'Holographic display smartwatch with health monitoring, GPS, and 7-day battery.', emoji: '⌚', category: 'Wearable',     stock: 8,  rating: 4.9, color: '#c0c0c0', dimensions: { w:0.4, h:0.6,  d:0.15 } },
      { id: 't3', shopId: 'tech-hub', name: 'NeuroBoard 4K',     price: 799,  description: 'AI-powered keyboard with predictive typing and biometric login.',                emoji: '⌨️', category: 'Peripherals',  stock: 5,  rating: 4.6, color: '#2a2a3e', dimensions: { w:1.0, h:0.08, d:0.35 } },
      { id: 't4', shopId: 'tech-hub', name: 'PlasmaLink Hub',    price: 89,   description: '12-port universal hub with Thunderbolt 5 and 240W charging.',                   emoji: '🔌', category: 'Connectivity', stock: 20, rating: 4.7, color: '#f0f0f0', dimensions: { w:0.6, h:0.12, d:0.12 } },
      { id: 't5', shopId: 'tech-hub', name: 'RetinalVR Headset', price: 1299, description: '8K per-eye VR headset with eye tracking and haptic feedback.',                   emoji: '🥽', category: 'VR/AR',        stock: 3,  rating: 5.0, color: '#0a0a0a', dimensions: { w:0.8, h:0.5,  d:0.4  } },
      { id: 't6', shopId: 'tech-hub', name: 'SonicDrone X1',     price: 449,  description: '4K camera drone with 35min flight time and AI follow mode.',                    emoji: '🚁', category: 'Drones',       stock: 7,  rating: 4.5, color: '#111111', dimensions: { w:0.7, h:0.25, d:0.7  } },
    ]
  },
  {
    id: 'fashion-district', name: 'Fashion District',
    description: 'Curated luxury fashion from emerging and established designers',
    emoji: '👗',
    theme: { primary: '#FF2D6B', accent: '#FF2D6B', secondary: '#2d0820', floor: '#180412', wall: '#0f0210' },
    products: [
      { id: 'f1', shopId: 'fashion-district', name: 'Silk Noir Blazer',  price: 349, description: 'Premium Italian silk blazer with structured shoulders and magnetic closure.',     emoji: '🥻', category: 'Outerwear',   stock: 6,  rating: 4.9, color: '#1a1a1a', dimensions: { w:0.6,  h:0.9,  d:0.15 } },
      { id: 'f2', shopId: 'fashion-district', name: 'Crystal Heels',     price: 189, description: 'Handcrafted crystal-embellished stilettos with cushioned insole.',              emoji: '👠', category: 'Footwear',    stock: 10, rating: 4.8, color: '#e8d5b7', dimensions: { w:0.3,  h:0.35, d:0.25 } },
      { id: 'f3', shopId: 'fashion-district', name: 'Velvet Weekender',  price: 275, description: 'Spacious velvet tote with leather handles and gold hardware.',                  emoji: '👜', category: 'Bags',        stock: 4,  rating: 4.7, color: '#4a0e6b', dimensions: { w:0.5,  h:0.45, d:0.2  } },
      { id: 'f4', shopId: 'fashion-district', name: 'Aurora Sunglasses', price: 220, description: 'UV400 polarized gradient lenses with titanium frame.',                         emoji: '🕶️', category: 'Eyewear',     stock: 15, rating: 4.6, color: '#b8860b', dimensions: { w:0.5,  h:0.18, d:0.18 } },
      { id: 'f5', shopId: 'fashion-district', name: 'Cashmere Wrap',     price: 165, description: '100% Mongolian cashmere oversized wrap. Ultra-soft.',                          emoji: '🧣', category: 'Accessories', stock: 8,  rating: 4.9, color: '#f5f5dc', dimensions: { w:0.8,  h:0.05, d:0.4  } },
      { id: 'f6', shopId: 'fashion-district', name: 'Neo Bomber Jacket', price: 395, description: 'Futuristic metallic bomber with iridescent finish and ribbed cuffs.',          emoji: '🧥', category: 'Outerwear',   stock: 9,  rating: 4.7, color: '#556b2f', dimensions: { w:0.65, h:0.75, d:0.18 } },
    ]
  },
  {
    id: 'gourmet-market', name: 'Gourmet Market',
    description: 'Artisan foods, rare spices, and premium kitchen essentials',
    emoji: '🍕',
    theme: { primary: '#FFD166', accent: '#FFD166', secondary: '#2d1800', floor: '#1a0e00', wall: '#0f0800' },
    products: [
      { id: 'g1', shopId: 'gourmet-market', name: 'Truffle Collection',  price: 89,  description: 'Black & white truffle selection from Périgord with tasting guide.',         emoji: '🫙', category: 'Delicacies',    stock: 12, rating: 4.9, color: '#8b4513', dimensions: { w:0.25, h:0.3,  d:0.25 } },
      { id: 'g2', shopId: 'gourmet-market', name: 'Saffron Reserve',     price: 45,  description: 'Grade A+ Persian saffron threads, 5g jar with COA.',                        emoji: '🌿', category: 'Spices',        stock: 20, rating: 5.0, color: '#cc5500', dimensions: { w:0.15, h:0.25, d:0.15 } },
      { id: 'g3', shopId: 'gourmet-market', name: 'Aged Balsamic 25yr',  price: 125, description: 'Traditional Modena balsamic aged 25 years. Deep and velvety smooth.',       emoji: '🫒', category: 'Condiments',    stock: 8,  rating: 4.8, color: '#2c1810', dimensions: { w:0.12, h:0.35, d:0.12 } },
      { id: 'g4', shopId: 'gourmet-market', name: 'Single Origin Cacao', price: 38,  description: '72% dark chocolate from a single Ecuador farm.',                             emoji: '🍫', category: 'Confections',   stock: 25, rating: 4.7, color: '#3d1c02', dimensions: { w:0.2,  h:0.05, d:0.12 } },
      { id: 'g5', shopId: 'gourmet-market', name: 'Wagyu A5 Gift Set',   price: 299, description: 'A5-grade Japanese Wagyu beef sampler with cooking guide.',                   emoji: '🥩', category: 'Premium Meats', stock: 5,  rating: 5.0, color: '#8b0000', dimensions: { w:0.5,  h:0.12, d:0.35 } },
      { id: 'g6', shopId: 'gourmet-market', name: 'Master Knives Set',   price: 349, description: '6-piece Damascus steel chef knife set with walnut block.',                   emoji: '🔪', category: 'Kitchen',       stock: 4,  rating: 4.9, color: '#2f4f4f', dimensions: { w:0.6,  h:0.25, d:0.12 } },
    ]
  },
  {
    id: 'sports-zone', name: 'Sports Zone',
    description: 'Performance gear and equipment for champions in every discipline',
    emoji: '⚽',
    theme: { primary: '#00FF7F', accent: '#00FF7F', secondary: '#002810', floor: '#001508', wall: '#000e05' },
    products: [
      { id: 's1', shopId: 'sports-zone', name: 'Carbon Racket Pro',    price: 265, description: 'Carbon fiber tennis racket used by top-10 pros.',                           emoji: '🎾', category: 'Tennis',   stock: 7,  rating: 4.8, color: '#1a1a1a', dimensions: { w:0.28, h:0.7,  d:0.05 } },
      { id: 's2', shopId: 'sports-zone', name: 'HyperBoost Cleats',    price: 180, description: 'Aerodynamic football cleats with reactive foam midsole.',                   emoji: '👟', category: 'Football', stock: 14, rating: 4.7, color: '#ccff00', dimensions: { w:0.32, h:0.15, d:0.28 } },
      { id: 's3', shopId: 'sports-zone', name: 'Smart Swim Goggles',   price: 129, description: 'HUD-enabled swim goggles with lap counter and HR monitor.',                 emoji: '🥽', category: 'Swimming', stock: 10, rating: 4.6, color: '#00aaff', dimensions: { w:0.35, h:0.1,  d:0.08 } },
      { id: 's4', shopId: 'sports-zone', name: 'Summit Pack 45L',      price: 195, description: 'Waterproof hiking pack with solar panel pocket.',                           emoji: '🎒', category: 'Hiking',   stock: 6,  rating: 4.9, color: '#2d5a1b', dimensions: { w:0.4,  h:0.65, d:0.25 } },
      { id: 's5', shopId: 'sports-zone', name: 'Velocity Bike Helmet', price: 149, description: 'MIPS technology cycling helmet with ANGI sensor.',                          emoji: '🪖', category: 'Cycling',  stock: 9,  rating: 4.8, color: '#ffffff', dimensions: { w:0.3,  h:0.25, d:0.35 } },
      { id: 's6', shopId: 'sports-zone', name: 'Percussion Gun',       price: 279, description: 'Deep tissue massage gun with 6 attachments and 8-hour battery.',            emoji: '💪', category: 'Recovery', stock: 11, rating: 4.9, color: '#ff6600', dimensions: { w:0.18, h:0.28, d:0.08 } },
    ]
  },
  {
    id: 'art-gallery', name: 'Art Gallery',
    description: 'Curated fine art, prints, and collectible design objects',
    emoji: '🎨',
    theme: { primary: '#7B5CFF', accent: '#7B5CFF', secondary: '#10001a', floor: '#0a0012', wall: '#07000e' },
    products: [
      { id: 'a1', shopId: 'art-gallery', name: 'Digital Genesis Print', price: 450, description: 'Giclée print on museum-quality archival paper. Edition of 50.',            emoji: '🖼️', category: 'Fine Art',       stock: 3,  rating: 5.0, color: '#2a1a4a', dimensions: { w:0.7,  h:0.9,  d:0.04 } },
      { id: 'a2', shopId: 'art-gallery', name: 'Crystal Sculpture',     price: 890, description: 'Hand-blown Murano glass sculpture with certificate of authenticity.',      emoji: '💎', category: 'Sculpture',      stock: 1,  rating: 5.0, color: '#4fc3f7', dimensions: { w:0.3,  h:0.45, d:0.3  } },
      { id: 'a3', shopId: 'art-gallery', name: 'Vinyl Art Record',      price: 120, description: 'Limited edition picture disc. Acrylic display case included.',             emoji: '🎵', category: 'Collectibles',   stock: 15, rating: 4.8, color: '#1a1a1a', dimensions: { w:0.31, h:0.31, d:0.04 } },
      { id: 'a4', shopId: 'art-gallery', name: 'Kinetic Wall Art',      price: 680, description: 'Solar-powered kinetic wall installation. Mesmerizing movement.',           emoji: '🌀', category: 'Installations',  stock: 2,  rating: 4.9, color: '#888888', dimensions: { w:0.8,  h:0.8,  d:0.1  } },
      { id: 'a5', shopId: 'art-gallery', name: 'Neo-Brutalist Poster',  price: 65,  description: 'Oversized risograph poster print 70x100cm. Bold typographic design.',     emoji: '📰', category: 'Posters',        stock: 20, rating: 4.6, color: '#ff3300', dimensions: { w:0.5,  h:0.7,  d:0.02 } },
      { id: 'a6', shopId: 'art-gallery', name: 'Designer Chess Set',    price: 325, description: 'Sculptural marble chess set with brass pieces.',                           emoji: '♟️', category: 'Design Objects', stock: 5,  rating: 4.9, color: '#f5f5f5', dimensions: { w:0.45, h:0.08, d:0.45 } },
    ]
  }
];

// Carts stay in-memory (keyed by userId string)
const carts = {};

module.exports = { shops, carts };
