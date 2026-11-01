const fs = require('fs');
const path = require('path');

const animDir = path.join(__dirname, '..', 'assets', 'animations');
if (!fs.existsSync(animDir)) {
  fs.mkdirSync(animDir, { recursive: true });
}

// Helper to create basic transform
function createTransform(options = {}) {
  const {
    anchor = [0, 0],
    position = [150, 150],
    scale = [100, 100],
    rotation = 0,
    opacity = 100,
  } = options;

  return {
    a: { a: 0, k: [...anchor, 0] },
    p: Array.isArray(position) && position[0] && typeof position[0] === 'object'
      ? { a: 1, k: position }
      : { a: 0, k: [...position, 0] },
    s: Array.isArray(scale) && scale[0] && typeof scale[0] === 'object'
      ? { a: 1, k: scale }
      : { a: 0, k: [...scale, 100] },
    r: Array.isArray(rotation) && rotation[0] && typeof rotation[0] === 'object'
      ? { a: 1, k: rotation }
      : { a: 0, k: rotation },
    o: Array.isArray(opacity) && opacity[0] && typeof opacity[0] === 'object'
      ? { a: 1, k: opacity }
      : { a: 0, k: opacity },
  };
}

// Helper to create bezier shape
function createBezierPath(v, inTangents = [], outTangents = [], closed = true) {
  return {
    ty: 'sh',
    ks: {
      a: 0,
      k: {
        c: closed,
        i: inTangents.length ? inTangents : v.map(() => [0, 0]),
        o: outTangents.length ? outTangents : v.map(() => [0, 0]),
        v: v,
      },
    },
  };
}

// Helper to create ellipse
function createEllipse(size, position = [0, 0]) {
  return {
    ty: 'el',
    p: { a: 0, k: position },
    s: { a: 0, k: size },
  };
}

// Helper for solid fill
function createFill(rgba = [0, 0.482, 0.655, 1]) {
  return {
    ty: 'fl',
    c: { a: 0, k: rgba },
    o: { a: 0, k: rgba[3] !== undefined ? rgba[3] * 100 : 100 },
    r: 1,
    bm: 0,
  };
}

// Helper for stroke
function createStroke(rgba = [0, 0.482, 0.655, 1], width = 3) {
  return {
    ty: 'st',
    c: { a: 0, k: rgba },
    o: { a: 0, k: rgba[3] !== undefined ? rgba[3] * 100 : 100 },
    w: { a: 0, k: width },
    lc: 2, // round
    lj: 2, // round
  };
}

// ==========================================
// 1. PLANT GROWTH ANIMATION (0 to 120 frames)
// ==========================================
function buildPlantGrowthLottie() {
  const totalFrames = 120;

  // Keyframe helpers
  // Frame 0..20: Seed in soil
  // Frame 20..50: Sprout & Lower leaves
  // Frame 50..80: Upper foliage
  // Frame 80..110: Blooming petals
  // Frame 110..120: Golden core & vitality pulse

  const layers = [
    // Layer 1: Vitality Halo Aura (Visible when mature >= frame 90)
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Bloom Vitality Aura',
      sr: 1,
      ks: createTransform({
        position: [150, 68],
        scale: [
          { t: 0, s: [0, 0, 100] },
          { t: 90, s: [0, 0, 100] },
          { t: 110, s: [100, 100, 100] },
          { t: 120, s: [115, 115, 100] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 90, s: [0] },
          { t: 105, s: [80] },
          { t: 120, s: [50] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Aura Ring',
          it: [
            createEllipse([90, 90]),
            createStroke([0, 0.482, 0.655, 0.6], 3),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Layer 2: Flower Center (Golden core, blooms at frame 85..110)
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Flower Golden Core',
      sr: 1,
      ks: createTransform({
        position: [150, 68],
        scale: [
          { t: 0, s: [0, 0, 100] },
          { t: 85, s: [0, 0, 100] },
          { t: 105, s: [120, 120, 100] },
          { t: 120, s: [100, 100, 100] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 85, s: [0] },
          { t: 100, s: [100] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Golden Disc',
          it: [
            createEllipse([26, 26]),
            createFill([0.96, 0.62, 0.07, 1]), // #F59E0B Golden
            createStroke([1, 0.84, 0, 0.8], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Layer 3: Flower Petals (6 petals, expanding frame 80..105)
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Flower Petals Group',
      sr: 1,
      ks: createTransform({
        position: [150, 68],
        scale: [
          { t: 0, s: [0, 0, 100] },
          { t: 78, s: [0, 0, 100] },
          { t: 100, s: [110, 110, 100] },
          { t: 120, s: [100, 100, 100] },
        ],
        rotation: [
          { t: 78, s: [-30] },
          { t: 120, s: [0] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 78, s: [0] },
          { t: 95, s: [100] },
        ],
      }),
      shapes: [
        // Petal 1 (North)
        {
          ty: 'gr',
          nm: 'Petal N',
          it: [
            createEllipse([18, 38], [0, -22]),
            createFill([0, 0.482, 0.655, 0.95]), // Cerulean Blue
            createStroke([0.22, 0.74, 0.97, 1], 1.5),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Petal 2 (North East)
        {
          ty: 'gr',
          nm: 'Petal NE',
          it: [
            createEllipse([18, 38], [19, -11]),
            createFill([1, 0.176, 0.584, 0.9]), // Neon Red/Pink accent
            createStroke([1, 0.4, 0.7, 1], 1.5),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 60 }, o: { a: 0, k: 100 } },
          ],
        },
        // Petal 3 (South East)
        {
          ty: 'gr',
          nm: 'Petal SE',
          it: [
            createEllipse([18, 38], [19, 11]),
            createFill([0, 0.482, 0.655, 0.95]),
            createStroke([0.22, 0.74, 0.97, 1], 1.5),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 120 }, o: { a: 0, k: 100 } },
          ],
        },
        // Petal 4 (South)
        {
          ty: 'gr',
          nm: 'Petal S',
          it: [
            createEllipse([18, 38], [0, 22]),
            createFill([1, 0.176, 0.584, 0.9]),
            createStroke([1, 0.4, 0.7, 1], 1.5),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 180 }, o: { a: 0, k: 100 } },
          ],
        },
        // Petal 5 (South West)
        {
          ty: 'gr',
          nm: 'Petal SW',
          it: [
            createEllipse([18, 38], [-19, 11]),
            createFill([0, 0.482, 0.655, 0.95]),
            createStroke([0.22, 0.74, 0.97, 1], 1.5),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 240 }, o: { a: 0, k: 100 } },
          ],
        },
        // Petal 6 (North West)
        {
          ty: 'gr',
          nm: 'Petal NW',
          it: [
            createEllipse([18, 38], [-19, -11]),
            createFill([1, 0.176, 0.584, 0.9]),
            createStroke([1, 0.4, 0.7, 1], 1.5),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 300 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Layer 4: Upper Leaves (Unfurls frame 50..80)
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Upper Foliage',
      sr: 1,
      ks: createTransform({
        anchor: [0, 0],
        position: [150, 115],
        scale: [
          { t: 0, s: [0, 0, 100] },
          { t: 50, s: [0, 0, 100] },
          { t: 75, s: [105, 105, 100] },
          { t: 120, s: [100, 100, 100] },
        ],
        rotation: [
          { t: 50, s: [10] },
          { t: 85, s: [0] },
          { t: 120, s: [-3] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 50, s: [0] },
          { t: 65, s: [100] },
        ],
      }),
      shapes: [
        // Left upper leaf
        {
          ty: 'gr',
          nm: 'Left Upper Leaf',
          it: [
            createBezierPath(
              [[0, 0], [-35, -12], [-45, -30], [-20, -22], [0, 0]],
              [[0, 0], [10, 5], [0, 12], [8, 5], [0, 0]],
              [[0, 0], [-10, -5], [10, -10], [-8, -5], [0, 0]]
            ),
            createFill([0.06, 0.58, 0.74, 0.9]), // Cerulean
            createStroke([0.22, 0.74, 0.97, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Right upper leaf
        {
          ty: 'gr',
          nm: 'Right Upper Leaf',
          it: [
            createBezierPath(
              [[0, 0], [35, -12], [45, -30], [20, -22], [0, 0]],
              [[0, 0], [-10, 5], [0, 12], [-8, 5], [0, 0]],
              [[0, 0], [10, -5], [-10, -10], [8, -5], [0, 0]]
            ),
            createFill([0.06, 0.58, 0.74, 0.9]),
            createStroke([0.22, 0.74, 0.97, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Layer 5: Lower Leaves (Unfurls frame 20..50)
    {
      ddd: 0,
      ind: 5,
      ty: 4,
      nm: 'Lower Foliage',
      sr: 1,
      ks: createTransform({
        anchor: [0, 0],
        position: [150, 155],
        scale: [
          { t: 0, s: [0, 0, 100] },
          { t: 20, s: [0, 0, 100] },
          { t: 45, s: [110, 110, 100] },
          { t: 120, s: [100, 100, 100] },
        ],
        rotation: [
          { t: 20, s: [-8] },
          { t: 55, s: [0] },
          { t: 120, s: [4] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 20, s: [0] },
          { t: 35, s: [100] },
        ],
      }),
      shapes: [
        // Left lower leaf
        {
          ty: 'gr',
          nm: 'Left Lower Leaf',
          it: [
            createBezierPath(
              [[0, 0], [-42, -5], [-55, -20], [-26, -18], [0, 0]],
              [[0, 0], [12, 4], [0, 10], [8, 4], [0, 0]],
              [[0, 0], [-12, -4], [10, -8], [-8, -4], [0, 0]]
            ),
            createFill([0.02, 0.44, 0.60, 0.95]),
            createStroke([0.15, 0.65, 0.85, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Right lower leaf
        {
          ty: 'gr',
          nm: 'Right Lower Leaf',
          it: [
            createBezierPath(
              [[0, 0], [42, -5], [55, -20], [26, -18], [0, 0]],
              [[0, 0], [-12, 4], [0, 10], [-8, 4], [0, 0]],
              [[0, 0], [12, -4], [-10, -8], [8, -4], [0, 0]]
            ),
            createFill([0.02, 0.44, 0.60, 0.95]),
            createStroke([0.15, 0.65, 0.85, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Layer 6: Main Stem (Grows from frame 10 to 90)
    {
      ddd: 0,
      ind: 6,
      ty: 4,
      nm: 'Main Stem',
      sr: 1,
      ks: createTransform({
        anchor: [0, 100],
        position: [150, 200],
        scale: [
          { t: 0, s: [100, 0, 100] },
          { t: 10, s: [100, 5, 100] },
          { t: 50, s: [100, 50, 100] },
          { t: 85, s: [100, 100, 100] },
          { t: 120, s: [100, 100, 100] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 10, s: [100] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Stem Spine',
          it: [
            createBezierPath([[0, 100], [-3, 50], [2, 0]], [[0, 0], [0, 15], [0, 10]], [[0, 0], [0, -15], [0, 0]], false),
            createStroke([0.00, 0.482, 0.655, 1], 6), // #007BA7
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Layer 7: Planter Pot & Base Soil (Always visible)
    {
      ddd: 0,
      ind: 7,
      ty: 4,
      nm: 'Planter Pot & Soil',
      sr: 1,
      ks: createTransform({
        position: [150, 225],
        scale: [100, 100],
      }),
      shapes: [
        // Ceramic Pot Body
        {
          ty: 'gr',
          nm: 'Pot Body',
          it: [
            createBezierPath([[-45, -15], [45, -15], [32, 28], [-32, 28], [-45, -15]]),
            createFill([0.08, 0.12, 0.18, 1]), // Sleek dark slate
            createStroke([0, 0.482, 0.655, 0.5], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Pot Rim
        {
          ty: 'gr',
          nm: 'Pot Rim',
          it: [
            createEllipse([104, 20], [0, -15]),
            createFill([0.12, 0.18, 0.26, 1]),
            createStroke([0.22, 0.74, 0.97, 0.8], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Soil Mound
        {
          ty: 'gr',
          nm: 'Soil Mound',
          it: [
            createEllipse([86, 14], [0, -15]),
            createFill([0.20, 0.14, 0.10, 1]), // Rich soil
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },
  ];

  return {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: totalFrames,
    w: 300,
    h: 300,
    nm: 'MediAlert Plant Growth & Bloom',
    ddd: 0,
    assets: [],
    layers,
  };
}

// ==========================================
// 2. WATER DROPLET & SPLASH ANIMATION (0 to 60 frames)
// ==========================================
function buildWaterSplashLottie() {
  const totalFrames = 60;

  const layers = [
    // Expanding Ripple 1
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Ripple Ring 1',
      sr: 1,
      ks: createTransform({
        position: [150, 200],
        scale: [
          { t: 18, s: [0, 0, 100] },
          { t: 45, s: [180, 70, 100] },
          { t: 60, s: [220, 85, 100] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 18, s: [100] },
          { t: 55, s: [0] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Ripple Ring Shape',
          it: [
            createEllipse([80, 80]),
            createStroke([0.22, 0.74, 0.97, 0.9], 3),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Splash Droplets Arcs (Left droplet)
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Splash Drop Left',
      sr: 1,
      ks: createTransform({
        position: [
          { t: 18, s: [150, 195, 0] },
          { t: 32, s: [115, 150, 0] },
          { t: 48, s: [95, 190, 0] },
        ],
        scale: [
          { t: 18, s: [0, 0, 100] },
          { t: 26, s: [100, 100, 100] },
          { t: 48, s: [40, 40, 100] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 18, s: [100] },
          { t: 45, s: [0] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Left Drop Shape',
          it: [
            createEllipse([12, 12]),
            createFill([0.22, 0.74, 0.97, 1]),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Splash Droplets Arcs (Right droplet)
    {
      ddd: 0,
      ind: 3,
      ty: 4,
      nm: 'Splash Drop Right',
      sr: 1,
      ks: createTransform({
        position: [
          { t: 18, s: [150, 195, 0] },
          { t: 32, s: [185, 150, 0] },
          { t: 48, s: [205, 190, 0] },
        ],
        scale: [
          { t: 18, s: [0, 0, 100] },
          { t: 26, s: [100, 100, 100] },
          { t: 48, s: [40, 40, 100] },
        ],
        opacity: [
          { t: 0, s: [0] },
          { t: 18, s: [100] },
          { t: 45, s: [0] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Right Drop Shape',
          it: [
            createEllipse([12, 12]),
            createFill([0.22, 0.74, 0.97, 1]),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Falling Main Droplet
    {
      ddd: 0,
      ind: 4,
      ty: 4,
      nm: 'Main Falling Drop',
      sr: 1,
      ks: createTransform({
        position: [
          { t: 0, s: [150, 40, 0] },
          { t: 18, s: [150, 200, 0] },
        ],
        scale: [
          { t: 0, s: [90, 120, 100] },
          { t: 16, s: [80, 140, 100] },
          { t: 19, s: [0, 0, 100] },
        ],
        opacity: [
          { t: 0, s: [100] },
          { t: 18, s: [100] },
          { t: 19, s: [0] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Droplet Shape',
          it: [
            createBezierPath(
              [[0, -18], [12, 12], [0, 18], [-12, 12], [0, -18]],
              [[0, 0], [-6, -6], [6, 0], [-6, 6], [0, 0]],
              [[0, 0], [6, 6], [-6, 0], [6, -6], [0, 0]]
            ),
            createFill([0, 0.482, 0.655, 1]), // Cerulean Blue
            createStroke([0.22, 0.74, 0.97, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },
  ];

  return {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: totalFrames,
    w: 300,
    h: 300,
    nm: 'MediAlert Water Splash & Nourish',
    ddd: 0,
    assets: [],
    layers,
  };
}

// ==========================================
// 3. MEDICAL PULSE & PILL CAPSULE (0 to 60 frames)
// ==========================================
function buildHeartbeatPulseLottie() {
  const totalFrames = 60;

  const layers = [
    // Outer Pulse Wave 1
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Pulse Ring Outer',
      sr: 1,
      ks: createTransform({
        position: [150, 150],
        scale: [
          { t: 0, s: [80, 80, 100] },
          { t: 12, s: [120, 120, 100] },
          { t: 24, s: [100, 100, 100] },
          { t: 36, s: [135, 135, 100] },
          { t: 60, s: [80, 80, 100] },
        ],
        opacity: [
          { t: 0, s: [30] },
          { t: 12, s: [70] },
          { t: 24, s: [30] },
          { t: 36, s: [80] },
          { t: 60, s: [30] },
        ],
      }),
      shapes: [
        {
          ty: 'gr',
          nm: 'Pulse Ring Shape',
          it: [
            createEllipse([180, 180]),
            createStroke([1, 0.176, 0.584, 0.5], 2), // Neon Red pulse
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },

    // Capsule Body (Left half: Cerulean Blue, Right half: Neon Pink)
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: 'Medical Pill Capsule',
      sr: 1,
      ks: createTransform({
        position: [150, 150],
        rotation: [
          { t: 0, s: [-25] },
          { t: 30, s: [-20] },
          { t: 60, s: [-25] },
        ],
        scale: [
          { t: 0, s: [100, 100, 100] },
          { t: 12, s: [110, 110, 100] },
          { t: 24, s: [100, 100, 100] },
          { t: 36, s: [115, 115, 100] },
          { t: 60, s: [100, 100, 100] },
        ],
      }),
      shapes: [
        // Left Blue Shell
        {
          ty: 'gr',
          nm: 'Blue Half Capsule',
          it: [
            createBezierPath(
              [[-45, -22], [0, -22], [0, 22], [-45, 22], [-65, 0], [-45, -22]],
              [[0, 0], [0, 0], [0, 0], [0, 0], [0, 12], [0, 0]],
              [[0, 0], [0, 0], [0, 0], [-12, 0], [0, -12], [0, 0]]
            ),
            createFill([0, 0.482, 0.655, 1]), // Cerulean Blue
            createStroke([0.22, 0.74, 0.97, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Right Neon Pink Shell
        {
          ty: 'gr',
          nm: 'Neon Half Capsule',
          it: [
            createBezierPath(
              [[0, -22], [45, -22], [65, 0], [45, 22], [0, 22], [0, -22]],
              [[0, 0], [0, 0], [0, -12], [12, 0], [0, 0], [0, 0]],
              [[0, 0], [12, 0], [0, 12], [0, 0], [0, 0], [0, 0]]
            ),
            createFill([1, 0.176, 0.584, 1]), // Neon Red/Pink
            createStroke([1, 0.45, 0.75, 1], 2),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        // Center Medical Cross
        {
          ty: 'gr',
          nm: 'Cross Vert',
          it: [
            createBezierPath([[-3, -12], [3, -12], [3, 12], [-3, 12], [-3, -12]]),
            createFill([1, 1, 1, 0.9]),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
        {
          ty: 'gr',
          nm: 'Cross Horiz',
          it: [
            createBezierPath([[-12, -3], [12, -3], [12, 3], [-12, 3], [-12, -3]]),
            createFill([1, 1, 1, 0.9]),
            { ty: 'tr', p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } },
          ],
        },
      ],
      ip: 0,
      op: totalFrames,
      st: 0,
      bm: 0,
    },
  ];

  return {
    v: '5.7.4',
    fr: 60,
    ip: 0,
    op: totalFrames,
    w: 300,
    h: 300,
    nm: 'MediAlert Pulse & Pill Capsule',
    ddd: 0,
    assets: [],
    layers,
  };
}

// Generate files
const plantJson = buildPlantGrowthLottie();
fs.writeFileSync(path.join(animDir, 'plant_growth.json'), JSON.stringify(plantJson, null, 2), 'utf8');
console.log('✓ Created plant_growth.json (Size:', fs.statSync(path.join(animDir, 'plant_growth.json')).size, 'bytes)');

const waterJson = buildWaterSplashLottie();
fs.writeFileSync(path.join(animDir, 'water_splash.json'), JSON.stringify(waterJson, null, 2), 'utf8');
console.log('✓ Created water_splash.json (Size:', fs.statSync(path.join(animDir, 'water_splash.json')).size, 'bytes)');

const pulseJson = buildHeartbeatPulseLottie();
fs.writeFileSync(path.join(animDir, 'heartbeat_pulse.json'), JSON.stringify(pulseJson, null, 2), 'utf8');
console.log('✓ Created heartbeat_pulse.json (Size:', fs.statSync(path.join(animDir, 'heartbeat_pulse.json')).size, 'bytes)');

