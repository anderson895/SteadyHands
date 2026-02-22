export const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const NUMBERS = '0123456789'.split('');

export const SHAPES = [
  { id: 'circle',   name: 'Circle',   emoji: '⭕', color: '#FF6B6B' },
  { id: 'square',   name: 'Square',   emoji: '🟦', color: '#4A90D9' },
  { id: 'triangle', name: 'Triangle', emoji: '🔺', color: '#4CAF50' },
  { id: 'star',     name: 'Star',     emoji: '⭐', color: '#FFD600' },
  { id: 'heart',    name: 'Heart',    emoji: '❤️',  color: '#E91E63' },
  { id: 'diamond',  name: 'Diamond',  emoji: '💎', color: '#7C4DFF' },
] as const;

export type Shape = typeof SHAPES[number];

export const DOT_PATTERNS = [
  {
    id: 'dog',
    name: 'Dog',
    emoji: '🐕',
    dots: [
      { x: 150, y: 80 }, { x: 220, y: 55 }, { x: 295, y: 80 },
      { x: 325, y: 155 }, { x: 295, y: 225 }, { x: 220, y: 250 },
      { x: 150, y: 225 }, { x: 120, y: 155 },
    ],
  },
  {
    id: 'house',
    name: 'House',
    emoji: '🏠',
    dots: [
      { x: 210, y: 55 }, { x: 310, y: 130 }, { x: 310, y: 255 },
      { x: 110, y: 255 }, { x: 110, y: 130 },
    ],
  },
  {
    id: 'star',
    name: 'Star',
    emoji: '⭐',
    dots: [
      { x: 210, y: 45 },  { x: 240, y: 150 }, { x: 345, y: 150 },
      { x: 262, y: 212 }, { x: 292, y: 315 }, { x: 210, y: 252 },
      { x: 128, y: 315 }, { x: 158, y: 212 }, { x: 75,  y: 150 },
      { x: 180, y: 150 },
    ],
  },
  {
    id: 'fish',
    name: 'Fish',
    emoji: '🐟',
    dots: [
      { x: 75,  y: 155 }, { x: 125, y: 105 }, { x: 200, y: 80 },
      { x: 280, y: 105 }, { x: 325, y: 155 }, { x: 280, y: 205 },
      { x: 200, y: 230 }, { x: 125, y: 205 },
    ],
  },
] as const;

export type DotPattern = typeof DOT_PATTERNS[number];

const LETTER_COLORS = [
  '#FF6B6B', '#FF9800', '#FFD600', '#4CAF50',
  '#4A90D9', '#7C4DFF', '#E91E63', '#00BCD4',
];
export const getLetterColor = (i: number) => LETTER_COLORS[i % LETTER_COLORS.length];
