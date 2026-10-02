/**
 * ============================================================
 *  PROMO VIDEO CONFIG — edit this file only.
 * ============================================================
 *  All text, prices, dates, contact details, scene timings and
 *  caption timings live here. The animation code reads from this
 *  file, so you never need to touch the scene files.
 *
 *  Text tips
 *  - Wrap a key word in [[double brackets]] to give it the
 *    animated lime-green highlight bar, e.g. "Build your [[Tools]]".
 *  - In captions, "|" is an invisible word break (Khmer has no
 *    spaces between words). A normal space shows as a space.
 *  - Caption tokens: {price}, {durationKh}, {telegram} are filled
 *    in from the offer / close sections below.
 *
 *  Asset files go in the /public folder (see README.md).
 *  Missing files are handled automatically:
 *  - logo.png missing   -> a built-in "AI For Business" wordmark
 *  - hook.jpg missing   -> a built-in illustration
 *  - qr.png missing     -> a QR code generated from close.qrFallbackUrl
 *  - voiceover.mp3 / music.mp3 missing -> video renders silent
 * ============================================================
 */

export type Seconds = number;

export type CaptionLine = {
  /** Start and end time of this caption line, in seconds. */
  start: Seconds;
  end: Seconds;
  /** Khmer caption. Use "|" for invisible word breaks. */
  text: string;
  /**
   * Optional exact start time (in seconds) for each word, in order.
   * Use this after you add voiceover.mp3 for perfect karaoke sync.
   * If left out, word timing is spread evenly across the line.
   */
  wordStarts?: Seconds[];
};

export const config = {
  video: {
    fps: 60,
    width: 1080,
    height: 1920,
    durationSec: 40,
  },

  brand: {
    name: 'AI For Business',
    colors: {
      bg: '#F4F6F9',
      grid: 'rgba(20, 36, 107, 0.055)',
      navy: '#14246B',
      navySoft: '#3A4A8C',
      lime: '#8BE03C',
      limeSoft: '#E9F9D9',
      white: '#FFFFFF',
      muted: '#6B7594',
      upcoming: '#B9C0D0',
      line: '#E6E9F0',
      success: '#2FB344',
      danger: '#E5484D',
    },
  },

  /** File names inside /public. */
  assets: {
    logo: 'logo.png',
    hookPhoto: 'hook.jpg',
    qr: 'qr.png',
    voiceover: 'voiceover.mp3',
    music: 'music.mp3',
    /** Optional local Khmer OS fonts. Google Fonts Moul / Battambang are used if missing. */
    khmerHeadingFont: 'fonts/KhmerOSMuolLight.ttf',
    khmerBodyFont: 'fonts/KhmerOSBattambang.ttf',
    /** Optional official tool icons (PNG, square). Built-in 3D-style icons are used if missing. */
    toolIcons: {
      chatgpt: 'icons/chatgpt.png',
      claude: 'icons/claude.png',
      gemini: 'icons/gemini.png',
      copilot: 'icons/copilot.png',
    },
  },

  audio: {
    voiceoverVolume: 1,
    musicVolume: 0.18,
    musicFadeInSec: 0.5,
    musicFadeOutSec: 1.5,
  },

  /** Scene timings in seconds. Adjust these to match your voiceover. */
  scenes: {
    hook: {start: 0, end: 4},
    title: {start: 4, end: 7},
    useAI: {start: 7, end: 12},
    build: {start: 12, end: 28},
    moreTools: {start: 28, end: 31},
    offer: {start: 31, end: 36},
    close: {start: 36, end: 40},
  },

  // ---------------------------------------------------------- 1. HOOK
  hook: {
    headlineKh: 'ចង់ប្រើ AI ហើយបង្កើត [[Tools]] ផ្ទាល់ខ្លួន តែមិនដឹងចាប់ផ្តើមពីណា?',
    /** When typing starts and how long it takes (seconds, inside the scene). */
    typeStartSec: 0.25,
    typeDurationSec: 2.3,
  },

  // ---------------------------------------------------------- 2. TITLE
  title: {
    livePill: 'LIVE ONLINE TRAINING',
    bigWord: 'AI',
    courseTitle: 'Build Your Own Business [[Tools]]',
    courseTitleKh: 'បង្កើត Tools សម្រាប់អាជីវកម្ម ដោយប្រើ AI',
    noCodePill: '100% No-Code',
  },

  // ---------------------------------------------------------- 3. USE AI
  useAI: {
    labelNumber: '01',
    labelText: 'USE AI',
    title: 'Use AI like a [[pro]]',
    titleKh: 'ប្រើ AI ឲ្យបានស្ទាត់ជំនាញ',
    tools: [
      {id: 'chatgpt', name: 'ChatGPT', chips: ['Prompting', 'Custom GPTs', 'File Analysis']},
      {id: 'claude', name: 'Claude', chips: ['Projects', 'Artifacts', 'Long Documents']},
      {id: 'gemini', name: 'Gemini', chips: ['Gems', 'Deep Research', 'Google Workspace']},
      {id: 'copilot', name: 'Copilot', chips: ['Word & Excel', 'Outlook', 'Teams']},
    ],
    closingLine: '4 AI tools you will [[master]]',
    closingLineKh: 'AI Tools ទាំង ៤ ដែលអ្នកនឹងប្រើបានស្ទាត់',
  },

  // ---------------------------------------------------------- 4. BUILD WITH AI
  build: {
    labelNumber: '02',
    labelText: 'BUILD WITH AI',
    /** Fictional shop used inside all four mockups. */
    shopName: 'Mekong Fresh Mart',

    stock: {
      titleEn: 'Stock & Sales [[Tracker]]',
      titleKh: 'កត់ត្រាការលក់ និង Stock ក្នុង Google Sheets',
      salesBefore: 480,
      salesAfter: 554,
      stockBefore: 3240,
      stockAfter: 3180,
      /** Earlier sales today (they add up to salesBefore). */
      rows: [
        {time: '08:15', item: 'Rice 25kg', qty: 5, amount: 160},
        {time: '09:40', item: 'Coffee Beans 1kg', qty: 6, amount: 108},
        {time: '10:05', item: 'Fresh Milk 1L', qty: 24, amount: 60},
        {time: '11:30', item: 'Sugar 1kg', qty: 40, amount: 152},
      ],
      /** The new sale that animates in (salesAfter - salesBefore). */
      newRow: {time: '12:10', item: 'Cooking Oil 5L', qty: 4, amount: 74},
      toast: 'Sale recorded',
    },

    billing: {
      titleEn: 'Billing & [[Receipts]]',
      titleKh: 'ចេញវិក្កយបត្រឲ្យអតិថិជន ភ្លាមៗ',
      receiptNo: 'INV-0458',
      date: '02 Oct 2026',
      items: [
        {name: 'Coffee Beans 1kg', qty: 2, price: 18},
        {name: 'Fresh Milk 1L', qty: 6, price: 2.5},
        {name: 'Paper Cups (100)', qty: 3, price: 8},
        {name: 'Syrup Bottle', qty: 3, price: 15},
      ],
      discount: 0,
      totalLabel: 'TOTAL PAID',
      paymentNote: 'Paid by KHQR',
      thanks: 'Thank you!',
    },

    leave: {
      titleEn: 'Leave [[Tracker]]',
      titleKh: 'អនុម័តការសុំច្បាប់ ដោយចុចតែម្តង',
      staffId: 'Staff ID: EMP-014',
      team: 'Sales Team',
      leaveType: 'Annual Leave',
      datesText: 'Thu 15 – Fri 16 Oct 2026',
      days: 2,
      calendarTitle: 'October 2026 · Week 42',
      /** Week shown on the calendar, Monday first. */
      week: [
        {day: 'Mon', date: 12},
        {day: 'Tue', date: 13},
        {day: 'Wed', date: 14},
        {day: 'Thu', date: 15},
        {day: 'Fri', date: 16},
        {day: 'Sat', date: 17},
        {day: 'Sun', date: 18},
      ],
      /** Which dates turn green after approval. */
      leaveDates: [15, 16],
    },

    agent: {
      titleEn: 'AI Sales [[Agent]]',
      titleKh: 'ឆ្លើយតបអតិថិជន និងទទួល Order ២៤/៧',
      channelStatus: 'AI Agent · Active now',
      customerMessage: 'Coffee Beans 1kg ២ ថង់ តម្លៃប៉ុន្មាន?',
      aiReply: 'សួស្តី! Coffee Beans 1kg តម្លៃ $18.00 ក្នុងមួយថង់ ។ ២ ថង់ សរុប $36.00',
      product: {name: 'Coffee Beans 1kg', price: 18, qty: 2},
      paymentTitle: 'Scan to pay with KHQR',
      orderNo: '#1024',
      telegramGroup: 'Staff group',
      telegramMessage: 'Order #1024 confirmed',
    },
  },

  // ---------------------------------------------------------- 5. MORE TOOLS
  moreTools: {
    headline: 'Build more [[Tools]] for your business',
    headlineKh: 'បង្កើត Tools ជាច្រើនទៀត សម្រាប់អាជីវកម្មរបស់អ្នក',
    /** 12 tiles, 3 columns x 4 rows. Icon names: see src/components/ToolTileIcon.tsx */
    tiles: [
      {label: 'Attendance', icon: 'attendance'},
      {label: 'Stock & Sales', icon: 'stock'},
      {label: 'Purchasing', icon: 'purchasing'},
      {label: 'Sales Agent', icon: 'agent'},
      {label: 'Billing', icon: 'billing'},
      {label: 'Suppliers', icon: 'suppliers'},
      {label: 'Leave', icon: 'leave'},
      {label: 'Reports', icon: 'reports'},
      {label: 'Expenses', icon: 'expenses'},
      {label: 'Booking', icon: 'booking'},
      {label: 'Customer CRM', icon: 'crm'},
      {label: '+ more', icon: 'more'},
    ],
  },

  // ---------------------------------------------------------- 6. OFFER
  offer: {
    duration: '3 Days',
    durationKh: '៣ថ្ងៃ',
    dates: 'Mon 19 – Wed 21 Oct 2026',
    time: '7:00 PM – 9:00 PM',
    delivery: 'Live on Google Meet',
    priceLabel: 'Course Fee',
    /** Number only. Currency is always USD ($). */
    price: '99',
    /** Round lime badge. Set to null to hide it. */
    bonus: null as string | null,
    cta: 'Register now →',
  },

  // ---------------------------------------------------------- 7. CLOSE
  close: {
    headline: 'Scan to [[register]]',
    headlineKh: 'ស្កេន QR ដើម្បីចុះឈ្មោះ',
    telegramLabel: 'Or message us on Telegram',
    telegramHandle: '@YourTelegram',
    /** Used only when public/qr.png is missing. */
    qrFallbackUrl: 'https://t.me/YourTelegram',
  },

  // ---------------------------------------------------------- KARAOKE CAPTIONS
  captions: {
    enabled: true,
    lines: [
      {start: 0.2, end: 3.9, text: 'ចង់|ប្រើ AI ហើយ|បង្កើត Tools ផ្ទាល់|ខ្លួន តែ|មិន|ដឹង|ចាប់|ផ្តើម|ពី|ណា?'},
      {start: 4.1, end: 6.9, text: 'វគ្គ Live Online ថ្មី៖ បង្កើត Tools ដោយ AI ១០០% No-Code'},
      {start: 7.1, end: 9.6, text: 'រៀន|ប្រើ ChatGPT, Claude, Gemini និង Copilot'},
      {start: 9.6, end: 11.9, text: 'ចាប់|ពី Prompt រហូត|ដល់ File Analysis ឲ្យ|បាន|ស្ទាត់'},
      {start: 12.1, end: 15.9, text: 'បង្កើត|ប្រព័ន្ធ Stock និង|ការ|លក់ ក្នុង Google Sheets'},
      {start: 16.1, end: 19.9, text: 'ចេញ|វិក្កយបត្រ|ឲ្យ|អតិថិជន ភ្លាមៗ'},
      {start: 20.1, end: 23.9, text: 'អនុម័ត|ការ|សុំ|ច្បាប់|បុគ្គលិក ដោយ|ចុច|តែ|ម្តង'},
      {start: 24.1, end: 27.9, text: 'AI Sales Agent ឆ្លើយ|តប|អតិថិជន និង|ទទួល Order ២៤/៧'},
      {start: 28.1, end: 30.9, text: 'និង|បង្កើត Tools ជា|ច្រើន|ទៀត សម្រាប់|អាជីវកម្ម|របស់|អ្នក'},
      {start: 31.1, end: 33.5, text: 'រៀន {durationKh} Live តាម Google Meet'},
      {start: 33.5, end: 35.9, text: 'តម្លៃ|ត្រឹម|តែ {price} ប៉ុណ្ណោះ'},
      {start: 36.1, end: 39.6, text: 'ស្កេន QR ឬ|ផ្ញើ|សារ|មក Telegram ដើម្បី|ចុះ|ឈ្មោះ|ថ្ងៃ|នេះ!'},
    ] as CaptionLine[],
  },
};

export type Config = typeof config;
