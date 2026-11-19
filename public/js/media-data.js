// LOTTA Rich Emoji, Sticker & Animated GIF Catalog

const RECENT_EMOJIS_KEY = 'lotta_recent_emojis';

export const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🔥', '👍'];

export const EMOJI_CATEGORIES = [
  { id: 'recent', icon: '🕒', label: 'Recently Used' },
  { id: 'smileys', icon: '😀', label: 'Smileys & Emotion' },
  { id: 'gestures', icon: '👋', label: 'People & Gestures' },
  { id: 'hearts', icon: '💜', label: 'Hearts & Love' },
  { id: 'nature', icon: '🌸', label: 'Nature & Weather' },
  { id: 'food', icon: '🍕', label: 'Food & Drink' },
  { id: 'activities', icon: '🎉', label: 'Activities & Fun' },
  { id: 'objects', icon: '🚀', label: 'Objects & Tech' }
];

// Each entry: [emoji, category, searchable keywords]
export const EMOJI_LIST = [
  // Smileys
  ['😀', 'smileys', 'grin smile happy face'],
  ['😃', 'smileys', 'smiley happy joy'],
  ['😄', 'smileys', 'laugh smile happy'],
  ['😁', 'smileys', 'beam grin teeth'],
  ['😆', 'smileys', 'laughing xd funny'],
  ['😅', 'smileys', 'sweat smile nervous relief'],
  ['🤣', 'smileys', 'rofl laugh rolling floor'],
  ['😂', 'smileys', 'joy tears laugh crying funny'],
  ['🙂', 'smileys', 'slightly smiling'],
  ['🙃', 'smileys', 'upside down silly'],
  ['😉', 'smileys', 'wink flirt'],
  ['😊', 'smileys', 'blush happy warm'],
  ['😇', 'smileys', 'angel innocent halo'],
  ['🥰', 'smileys', 'love hearts adore'],
  ['😍', 'smileys', 'heart eyes love crush'],
  ['🤩', 'smileys', 'star struck wow amazed'],
  ['😘', 'smileys', 'kiss love blow'],
  ['😗', 'smileys', 'kissing'],
  ['😋', 'smileys', 'yum delicious tongue'],
  ['😛', 'smileys', 'tongue silly playful'],
  ['😜', 'smileys', 'wink tongue crazy'],
  ['🤪', 'smileys', 'zany goofy wild'],
  ['😝', 'smileys', 'squint tongue'],
  ['🤑', 'smileys', 'money rich dollar'],
  ['🤗', 'smileys', 'hug warm welcome'],
  ['🤭', 'smileys', 'oops giggle secret'],
  ['🤫', 'smileys', 'shh quiet secret'],
  ['🤔', 'smileys', 'thinking hmm wonder'],
  ['🤐', 'smileys', 'zipper mouth quiet'],
  ['🤨', 'smileys', 'raised eyebrow skeptical'],
  ['😐', 'smileys', 'neutral poker'],
  ['😑', 'smileys', 'expressionless blank'],
  ['😶', 'smileys', 'speechless'],
  ['😏', 'smileys', 'smirk sly'],
  ['😒', 'smileys', 'unamused annoyed'],
  ['🙄', 'smileys', 'eye roll whatever'],
  ['😬', 'smileys', 'grimace awkward'],
  ['😌', 'smileys', 'relieved calm'],
  ['😔', 'smileys', 'pensive sad'],
  ['😪', 'smileys', 'sleepy tired'],
  ['😴', 'smileys', 'sleeping zzz'],
  ['😷', 'smileys', 'mask sick'],
  ['🤒', 'smileys', 'fever sick'],
  ['🤕', 'smileys', 'bandage hurt'],
  ['🤢', 'smileys', 'nauseated gross'],
  ['🤧', 'smileys', 'sneeze cold'],
  ['🥵', 'smileys', 'hot heat'],
  ['🥶', 'smileys', 'cold freezing'],
  ['🤯', 'smileys', 'mind blown exploding'],
  ['🤠', 'smileys', 'cowboy'],
  ['🥳', 'smileys', 'party celebrate birthday'],
  ['😎', 'smileys', 'cool sunglasses'],
  ['🤓', 'smileys', 'nerd glasses geek'],
  ['🧐', 'smileys', 'monocle inspect'],
  ['😕', 'smileys', 'confused'],
  ['😟', 'smileys', 'worried'],
  ['😮', 'smileys', 'open mouth wow surprised'],
  ['😯', 'smileys', 'hushed surprised'],
  ['😲', 'smileys', 'astonished shocked'],
  ['😳', 'smileys', 'flushed embarrassed'],
  ['🥺', 'smileys', 'pleading puppy eyes'],
  ['😢', 'smileys', 'cry sad tear'],
  ['😭', 'smileys', 'sob crying loud'],
  ['😱', 'smileys', 'scream scared omg'],
  ['😖', 'smileys', 'confounded'],
  ['😤', 'smileys', 'triumph huff angry'],
  ['😡', 'smileys', 'angry mad rage'],
  ['🤬', 'smileys', 'cursing furious'],
  ['😈', 'smileys', 'devil purple mischievous'],
  ['💀', 'smileys', 'skull dead lmao'],
  ['👻', 'smileys', 'ghost boo halloween'],
  ['👽', 'smileys', 'alien ufo'],
  ['🤖', 'smileys', 'robot bot ai'],

  // Gestures
  ['👋', 'gestures', 'wave hello hi bye'],
  ['🤚', 'gestures', 'raised back hand'],
  ['🖐️', 'gestures', 'hand five'],
  ['✋', 'gestures', 'stop high five'],
  ['👌', 'gestures', 'ok nice perfect'],
  ['🤌', 'gestures', 'chef kiss pinched'],
  ['✌️', 'gestures', 'peace victory'],
  ['🤞', 'gestures', 'crossed fingers luck'],
  ['🤟', 'gestures', 'love you rock'],
  ['🤘', 'gestures', 'rock on metal'],
  ['🤙', 'gestures', 'call me shaka'],
  ['👈', 'gestures', 'point left'],
  ['👉', 'gestures', 'point right'],
  ['👆', 'gestures', 'point up'],
  ['👇', 'gestures', 'point down'],
  ['👍', 'gestures', 'thumbs up yes good like'],
  ['👎', 'gestures', 'thumbs down no bad'],
  ['✊', 'gestures', 'fist power'],
  ['👊', 'gestures', 'fist bump punch'],
  ['👏', 'gestures', 'clap applause bravo'],
  ['🙌', 'gestures', 'raise hands yay celebrate'],
  ['🫶', 'gestures', 'heart hands love'],
  ['🤝', 'gestures', 'handshake deal agree'],
  ['🙏', 'gestures', 'pray please thanks namaste'],
  ['💪', 'gestures', 'muscle strong gym flex'],
  ['👀', 'gestures', 'eyes look watch'],
  ['🧠', 'gestures', 'brain smart'],
  ['💃', 'gestures', 'dance woman party'],
  ['🕺', 'gestures', 'dance man disco'],
  ['🤦', 'gestures', 'facepalm'],
  ['🤷', 'gestures', 'shrug dunno'],

  // Hearts
  ['❤️', 'hearts', 'red heart love'],
  ['🧡', 'hearts', 'orange heart'],
  ['💛', 'hearts', 'yellow heart'],
  ['💚', 'hearts', 'green heart'],
  ['💙', 'hearts', 'blue heart'],
  ['💜', 'hearts', 'purple heart lotta'],
  ['🖤', 'hearts', 'black heart'],
  ['🤍', 'hearts', 'white heart'],
  ['🩷', 'hearts', 'pink heart'],
  ['💔', 'hearts', 'broken heart'],
  ['❤️‍🔥', 'hearts', 'heart on fire passion'],
  ['💕', 'hearts', 'two hearts love'],
  ['💞', 'hearts', 'revolving hearts'],
  ['💓', 'hearts', 'beating heart'],
  ['💗', 'hearts', 'growing heart'],
  ['💖', 'hearts', 'sparkling heart'],
  ['💘', 'hearts', 'cupid arrow heart'],
  ['💝', 'hearts', 'gift heart ribbon'],
  ['💋', 'hearts', 'kiss lips'],
  ['💯', 'hearts', '100 hundred perfect'],
  ['✨', 'hearts', 'sparkles shine magic'],
  ['💫', 'hearts', 'dizzy star'],
  ['💥', 'hearts', 'boom explosion'],
  ['🔥', 'hearts', 'fire lit hot flame'],

  // Nature
  ['🌸', 'nature', 'cherry blossom flower'],
  ['🌹', 'nature', 'rose flower'],
  ['🌻', 'nature', 'sunflower'],
  ['🌺', 'nature', 'hibiscus'],
  ['🍀', 'nature', 'clover luck'],
  ['🌿', 'nature', 'leaf herb'],
  ['🌈', 'nature', 'rainbow'],
  ['☀️', 'nature', 'sun sunny'],
  ['🌙', 'nature', 'moon night'],
  ['⭐', 'nature', 'star'],
  ['🌟', 'nature', 'glowing star'],
  ['⚡', 'nature', 'lightning bolt fast'],
  ['❄️', 'nature', 'snowflake winter'],
  ['🌊', 'nature', 'ocean wave'],
  ['🐶', 'nature', 'dog puppy'],
  ['🐱', 'nature', 'cat kitty'],
  ['🦊', 'nature', 'fox'],
  ['🐼', 'nature', 'panda'],
  ['🦋', 'nature', 'butterfly'],
  ['🦄', 'nature', 'unicorn magic'],

  // Food
  ['🍕', 'food', 'pizza'],
  ['🍔', 'food', 'burger'],
  ['🍟', 'food', 'fries'],
  ['🌮', 'food', 'taco'],
  ['🍣', 'food', 'sushi'],
  ['🍜', 'food', 'ramen noodles'],
  ['🍩', 'food', 'donut'],
  ['🍪', 'food', 'cookie'],
  ['🎂', 'food', 'cake birthday'],
  ['🍰', 'food', 'shortcake dessert'],
  ['🍫', 'food', 'chocolate'],
  ['🍦', 'food', 'ice cream'],
  ['🍓', 'food', 'strawberry'],
  ['🥑', 'food', 'avocado'],
  ['☕', 'food', 'coffee cafe morning'],
  ['🧋', 'food', 'boba bubble tea'],
  ['🍵', 'food', 'matcha tea'],
  ['🥤', 'food', 'drink soda'],
  ['🥂', 'food', 'cheers champagne toast'],
  ['🍻', 'food', 'beer cheers'],

  // Activities
  ['🎉', 'activities', 'party popper confetti'],
  ['🎊', 'activities', 'confetti ball'],
  ['🎈', 'activities', 'balloon'],
  ['🎁', 'activities', 'gift present'],
  ['🏆', 'activities', 'trophy winner'],
  ['🥇', 'activities', 'gold medal first'],
  ['⚽', 'activities', 'soccer football'],
  ['🏀', 'activities', 'basketball'],
  ['🎮', 'activities', 'gaming controller video game'],
  ['🎧', 'activities', 'headphones music'],
  ['🎵', 'activities', 'music note'],
  ['🎸', 'activities', 'guitar'],
  ['🎬', 'activities', 'movie film cinema'],
  ['🎨', 'activities', 'art paint'],
  ['📸', 'activities', 'camera photo flash'],
  ['🎯', 'activities', 'target bullseye'],

  // Objects & Tech
  ['🚀', 'objects', 'rocket launch space'],
  ['✈️', 'objects', 'airplane travel flight'],
  ['🚗', 'objects', 'car drive'],
  ['🏠', 'objects', 'home house'],
  ['💻', 'objects', 'laptop computer code'],
  ['📱', 'objects', 'phone mobile'],
  ['⌚', 'objects', 'watch time'],
  ['💡', 'objects', 'idea lightbulb'],
  ['💎', 'objects', 'gem diamond'],
  ['👑', 'objects', 'crown king queen'],
  ['🔑', 'objects', 'key'],
  ['🔒', 'objects', 'lock secure'],
  ['📌', 'objects', 'pin'],
  ['✅', 'objects', 'check done yes'],
  ['❌', 'objects', 'cross no'],
  ['⚠️', 'objects', 'warning alert']
];

export function getRecentEmojis() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(0, 24) : [];
  } catch {
    return [];
  }
}

export function addRecentEmoji(emoji) {
  const list = getRecentEmojis().filter((e) => e !== emoji);
  list.unshift(emoji);
  localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(list.slice(0, 24)));
}

// Custom High-Craft Vector Stickers
export const STICKERS = [
  {
    id: 'lotta-vibe',
    label: 'Lotta Vibes',
    keywords: 'lotta vibe wave hi hello',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="url(#st1)"/><circle cx="43" cy="50" r="6" fill="#0b1124"/><circle cx="77" cy="50" r="6" fill="#0b1124"/><path d="M38 68 Q60 88 82 68" stroke="#0b1124" stroke-width="6" stroke-linecap="round" fill="none"/><text x="60" y="106" text-anchor="middle" fill="#fff" font-size="13" font-weight="800" font-family="sans-serif">HEY THERE!</text></svg>`
  },
  {
    id: 'love-spark',
    label: 'Love Spark',
    keywords: 'love heart kiss crush',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f43f5e"/><stop offset="100%" stop-color="#a855f7"/></linearGradient></defs><path d="M60 100 C25 76 14 55 14 38 C14 23 26 14 40 14 C49 14 56 19 60 27 C64 19 71 14 80 14 C94 14 106 23 106 38 C106 55 95 76 60 100Z" fill="url(#st2)"/><text x="60" y="61" text-anchor="middle" fill="#fff" font-size="16" font-weight="900" font-family="sans-serif">LOVE IT</text><circle cx="28" cy="24" r="4" fill="#fde047"/><circle cx="96" cy="22" r="5" fill="#38bdf8"/></svg>`
  },
  {
    id: 'fire-lit',
    label: 'On Fire',
    keywords: 'fire lit awesome hot',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st3" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#ef4444"/><stop offset="55%" stop-color="#f97316"/><stop offset="100%" stop-color="#fde047"/></linearGradient></defs><path d="M60 12 C78 34 94 48 94 72 C94 94 78 108 60 108 C42 108 26 94 26 72 C26 54 38 42 46 32 C46 44 52 46 56 38 C59 31 58 21 60 12Z" fill="url(#st3)"/><text x="60" y="84" text-anchor="middle" fill="#0b1124" font-size="18" font-weight="900" font-family="sans-serif">LIT!</text></svg>`
  },
  {
    id: 'cool-shades',
    label: 'Too Cool',
    keywords: 'cool sunglasses boss chill',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fbbf24"/><stop offset="100%" stop-color="#f97316"/></linearGradient></defs><circle cx="60" cy="60" r="48" fill="url(#st4)"/><rect x="24" y="42" width="32" height="18" rx="6" fill="#0f172a"/><rect x="64" y="42" width="32" height="18" rx="6" fill="#0f172a"/><rect x="54" y="47" width="12" height="5" fill="#0f172a"/><path d="M44 76 Q60 88 78 74" stroke="#0f172a" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`
  },
  {
    id: 'gg-trophy',
    label: 'GG Win',
    keywords: 'gg win game trophy champion',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><rect x="10" y="18" width="100" height="84" rx="24" fill="url(#st5)"/><text x="60" y="68" text-anchor="middle" fill="#fff" font-size="38" font-weight="900" font-family="sans-serif">GG!</text><text x="60" y="88" text-anchor="middle" fill="#e0f2fe" font-size="11" font-weight="700" font-family="sans-serif">WELL PLAYED</text></svg>`
  },
  {
    id: 'rocket-go',
    label: 'Let\'s Go',
    keywords: 'rocket go launch hype',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="#131d3b" stroke="url(#st6)" stroke-width="5"/><text x="60" y="64" text-anchor="middle" font-size="44">🚀</text><text x="60" y="94" text-anchor="middle" fill="#38bdf8" font-size="13" font-weight="900" font-family="sans-serif">LET'S GO!</text></svg>`
  },
  {
    id: 'party-boom',
    label: 'Party Time',
    keywords: 'party celebrate birthday woo',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st7" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#ec4899"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs><rect x="12" y="14" width="96" height="92" rx="26" fill="url(#st7)"/><text x="60" y="64" text-anchor="middle" font-size="44">🥳</text><text x="60" y="92" text-anchor="middle" fill="#fff" font-size="13" font-weight="900" font-family="sans-serif">PARTY TIME!</text></svg>`
  },
  {
    id: 'mind-blown',
    label: 'Mind Blown',
    keywords: 'wow mind blown crazy omg',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st8" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#06b6d4"/><stop offset="100%" stop-color="#3b82f6"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="url(#st8)"/><text x="60" y="65" text-anchor="middle" font-size="44">🤯</text><text x="60" y="95" text-anchor="middle" fill="#fff" font-size="12" font-weight="900" font-family="sans-serif">MIND BLOWN</text></svg>`
  },
  {
    id: 'coffee-break',
    label: 'Coffee Time',
    keywords: 'coffee morning chill cafe',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="16" width="96" height="88" rx="24" fill="#1e293b" stroke="#f59e0b" stroke-width="4"/><text x="60" y="64" text-anchor="middle" font-size="44">☕</text><text x="60" y="92" text-anchor="middle" fill="#fde68a" font-size="12" font-weight="800" font-family="sans-serif">COFFEE BREAK</text></svg>`
  },
  {
    id: 'laugh-lol',
    label: 'LOL',
    keywords: 'lol laugh funny haha',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st10" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#22c55e"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs><circle cx="60" cy="60" r="50" fill="url(#st10)"/><text x="60" y="64" text-anchor="middle" font-size="44">😂</text><text x="60" y="94" text-anchor="middle" fill="#06201a" font-size="16" font-weight="900" font-family="sans-serif">HAHAHA!</text></svg>`
  },
  {
    id: 'thank-you',
    label: 'Thank You',
    keywords: 'thanks thank you appreciate',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="st11" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#ec4899"/></linearGradient></defs><rect x="10" y="20" width="100" height="80" rx="24" fill="url(#st11)"/><text x="60" y="60" text-anchor="middle" font-size="36">🙏</text><text x="60" y="88" text-anchor="middle" fill="#fff" font-size="13" font-weight="900" font-family="sans-serif">THANK YOU!</text></svg>`
  },
  {
    id: 'crown-king',
    label: 'Legend',
    keywords: 'crown king queen legend goat',
    svg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"><rect x="12" y="16" width="96" height="88" rx="24" fill="#172247" stroke="#fbbf24" stroke-width="4"/><text x="60" y="63" text-anchor="middle" font-size="44">👑</text><text x="60" y="92" text-anchor="middle" fill="#fde047" font-size="14" font-weight="900" font-family="sans-serif">LEGEND</text></svg>`
  }
];

// Searchable Animated GIF Cards (100% reliable, smooth GPU animations)
export const ANIMATED_GIFS = [
  { id: 'gif-hype', title: 'LET\'S GO!', emoji: '🚀', anim: 'anim-bounce', bg: 'linear-gradient(135deg, #2563eb, #9333ea)', keywords: 'hype go rocket excited yes' },
  { id: 'gif-love', title: 'SO MUCH LOVE', emoji: '💖', anim: 'anim-pulse', bg: 'linear-gradient(135deg, #e11d48, #a855f7)', keywords: 'love heart kiss adore cute' },
  { id: 'gif-laugh', title: 'CAN\'T STOP LAUGHING', emoji: '🤣', anim: 'anim-shake', bg: 'linear-gradient(135deg, #059669, #0ea5e9)', keywords: 'laugh lol funny haha rofl' },
  { id: 'gif-party', title: 'CELEBRATE!', emoji: '🎉', anim: 'anim-spin', bg: 'linear-gradient(135deg, #db2777, #f59e0b)', keywords: 'party celebrate birthday yay' },
  { id: 'gif-fire', title: 'ABSOLUTE FIRE', emoji: '🔥', anim: 'anim-pulse', bg: 'linear-gradient(135deg, #dc2626, #f97316)', keywords: 'fire lit awesome hot cool' },
  { id: 'gif-clap', title: 'BRAVO!', emoji: '👏', anim: 'anim-bounce', bg: 'linear-gradient(135deg, #4f46e5, #06b6d4)', keywords: 'clap bravo applause congrats' },
  { id: 'gif-mindblown', title: 'NO WAY!!', emoji: '🤯', anim: 'anim-shake', bg: 'linear-gradient(135deg, #7c3aed, #2563eb)', keywords: 'wow omg mindblown shocked' },
  { id: 'gif-cool', title: 'STAY COOL', emoji: '😎', anim: 'anim-float', bg: 'linear-gradient(135deg, #0284c7, #1d4ed8)', keywords: 'cool chill shades boss' },
  { id: 'gif-dance', title: 'VIBE CHECK', emoji: '🕺', anim: 'anim-spin', bg: 'linear-gradient(135deg, #9333ea, #ec4899)', keywords: 'dance vibe music party' },
  { id: 'gif-thumbs', title: '100% APPROVED', emoji: '👍', anim: 'anim-bounce', bg: 'linear-gradient(135deg, #16a34a, #0d9488)', keywords: 'ok yes thumbs up good agree' },
  { id: 'gif-cry', title: 'AHAHA NOOO', emoji: '😭', anim: 'anim-shake', bg: 'linear-gradient(135deg, #334155, #4f46e5)', keywords: 'cry sad sob dramatic' },
  { id: 'gif-wave', title: 'HEY FRIEND!', emoji: '👋', anim: 'anim-spin', bg: 'linear-gradient(135deg, #0ea5e9, #6366f1)', keywords: 'hi hello wave hey bye' },
  { id: 'gif-sleep', title: 'GOOD NIGHT', emoji: '🌙', anim: 'anim-float', bg: 'linear-gradient(135deg, #0f172a, #4338ca)', keywords: 'night sleep tired gn moon' },
  { id: 'gif-coffee', title: 'NEED COFFEE', emoji: '☕', anim: 'anim-float', bg: 'linear-gradient(135deg, #92400e, #d97706)', keywords: 'coffee morning cafe awake' }
];

export function findSticker(id) {
  return STICKERS.find((s) => s.id === id) || null;
}

export function findGif(id) {
  return ANIMATED_GIFS.find((g) => g.id === id) || null;
}
