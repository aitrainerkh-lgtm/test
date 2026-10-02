/**
 * ============================================================
 *  AI For Business — Promo Video: EDITABLE CONTENT
 * ============================================================
 *  Change any text, price, date or timing here. You do not need
 *  to touch the animation code.
 *
 *  Text tips
 *  - Wrap a word in *stars* to give it the lime-green highlight bar.
 *    Example: "បង្កើត *Tools* ខ្លួនឯង?"
 *  - Card titles (Stock & Sales, Billing ...) highlight their last
 *    word automatically.
 *  - Use "\n" to force a line break in big headings.
 *  - ✓  ✦  →  are drawn as clean icons automatically.
 *  - Voiceover lines: Khmer words are split automatically for the
 *    karaoke captions. If a split looks wrong, put "|" where you
 *    want the word breaks, e.g. "អាជីវកម្ម|ខ្លួនឯង".
 * ============================================================
 */

export const config = {
  brand: {
    name: 'AI For Business',
    telegram: '@AIForBusiness_KH',
    // Used only when public/qr.png is missing (a fallback QR is generated).
    fallbackQrUrl: 'https://t.me/AIForBusiness_KH',
  },

  colors: {
    background: '#F4F6F9',
    grid: 'rgba(20, 36, 107, 0.055)',
    navy: '#14246B',
    lime: '#8BE03C',
    limeDark: '#5FB31C',
    white: '#FFFFFF',
    grey: '#7A849C',
    lightGrey: '#B9C0CF',
    successGreen: '#22A45D',
  },

  /**
   * Scene lengths in seconds (used when there is no voiceover, or
   * before you run `npm run sync`). Total = 40 s.
   */
  timing: {
    fps: 60,
    scenes: {
      hook: 4,
      title: 3,
      useAI: 5,
      stock: 4,
      billing: 4,
      leave: 4,
      agent: 4,
      moreTools: 3,
      offer: 5,
      close: 4,
    },
    // Soft fade/blur overlap between scenes (seconds).
    transition: 0.25,
    // Music level under the voice, in dB (-20 dB ≈ 10% volume).
    musicDb: -20,
    // Extra seconds of music after the last voice line when a voiceover is used.
    endTail: 1.5,
  },

  // 1. HOOK ------------------------------------------------------
  hook: {
    headline: ['ចង់ប្រើ AI និងបង្កើត', '*Tools* ខ្លួនឯង?'],
    subline: 'តែមិនដឹងចាប់ផ្តើមពីណា?',
  },

  // 2. TITLE -----------------------------------------------------
  title: {
    livePill: 'LIVE TRAINING',
    big: 'AI',
    second: 'For *Business*',
    noCodePill: '100% No-Code · មិនចាំបាច់ចេះសរសេរកូដ',
  },

  // 3. 01 USE AI -------------------------------------------------
  useAI: {
    labelNumber: '01',
    label: 'USE AI',
    title: 'រៀនប្រើ AI ឱ្យស្ទាត់ជំនាញ',
    tools: [
      {id: 'chatgpt', name: 'ChatGPT', chips: ['Prompting', 'Custom GPTs', 'Projects']},
      {id: 'claude', name: 'Claude', chips: ['Projects', 'Skills', 'File Analysis']},
      {id: 'gemini', name: 'Gemini', chips: ['Gems', 'Deep Research', 'Google Workspace']},
      {id: 'copilot', name: 'Copilot', chips: ['Word', 'Excel', 'Outlook']},
    ],
    endLine: '✦ AI Tools ទាំង ៤ សម្រាប់ការងារប្រចាំថ្ងៃ',
  },

  // 4. 02 BUILD WITH AI ------------------------------------------
  build: {
    labelNumber: '02',
    label: 'BUILD WITH AI',

    stock: {
      title: 'Stock & Sales',
      subtitle: 'គ្រប់គ្រងស្តុក និងការលក់',
      cardTitle: 'Sophea Mart · Daily Stock',
      badge: 'Google Sheets',
      salesLabel: "Today's Sales",
      salesFrom: 480,
      salesTo: 554,
      stockLabel: 'Stock Value',
      stockFrom: 3240,
      stockTo: 3166,
      // The row with `soldTo` flashes green and its stock drops.
      items: [
        {name: 'Rice 25kg', left: 18, soldTo: 17},
        {name: 'Cooking Oil 1L', left: 42},
        {name: 'Sugar 1kg', left: 9},
      ],
      leftSuffix: 'left',
      toast: '✓ Sale recorded',
    },

    billing: {
      title: 'Billing',
      subtitle: 'ចេញវិក្កយបត្រភ្លាមៗ',
      shop: 'SOPHEA MART',
      receiptLabel: 'OFFICIAL RECEIPT',
      invoiceNo: 'INV-2026-0001',
      lines: [
        {item: 'Rice 25kg', qty: 2, price: 25},
        {item: 'Cooking Oil 1L', qty: 3, price: 15},
        {item: 'Sugar 1kg', qty: 5, price: 5},
      ],
      totalLabel: 'TOTAL PAID',
    },

    leave: {
      title: 'Leave Tracker',
      subtitle: 'អនុម័តច្បាប់ឈប់សម្រាក',
      initials: 'SD',
      name: 'Sok Dara',
      detail: 'Annual leave · 2 days · Oct 15-16',
      approve: 'Approve',
      reject: 'Reject',
      approved: '✓ Approved',
      weekLabel: 'October 2026',
      week: [
        {day: 'MON', date: 12},
        {day: 'TUE', date: 13},
        {day: 'WED', date: 14},
        {day: 'THU', date: 15, leave: true},
        {day: 'FRI', date: 16, leave: true},
        {day: 'SAT', date: 17},
        {day: 'SUN', date: 18},
      ],
    },

    agent: {
      title: 'AI Sales Agent',
      subtitle: 'ភ្នាក់ងារលក់ AI',
      chatName: 'Sophea Mart · Messenger',
      chatStatus: 'Replies instantly',
      customerAsk: 'ប្រេងឆា 1L តម្លៃប៉ុន្មាន?',
      productName: 'Cooking Oil 1L',
      productPrice: '$15.00',
      customerOrder: 'យក ២ ដប',
      khqrTotal: 'Total $30.00',
      orderNo: 'Order #1024',
      notifyApp: 'Telegram',
      notifyTitle: 'Staff Group',
      notifyText: '✓ Order #1024 confirmed',
      sticker: 'រៀនបង្កើត Workflow នេះក្នុងវគ្គ!',
    },
  },

  // 5. MORE TOOLS ------------------------------------------------
  moreTools: {
    headline: 'បង្កើត *Tools* បន្ថែម\nតាមតម្រូវការ',
    subline: 'សម្រាប់អាជីវកម្ម និងការងាររបស់អ្នក',
    // icon ids: attendance, stock, purchasing, agent, billing, suppliers,
    //           leave, reports, expenses, booking, crm, more
    tiles: [
      {icon: 'attendance', label: 'Attendance', dot: false},
      {icon: 'stock', label: 'Stock & Sales', dot: true},
      {icon: 'purchasing', label: 'Purchasing', dot: false},
      {icon: 'agent', label: 'Sales Agent', dot: true},
      {icon: 'billing', label: 'Billing', dot: true},
      {icon: 'suppliers', label: 'Suppliers', dot: false},
      {icon: 'leave', label: 'Leave', dot: true},
      {icon: 'reports', label: 'Reports', dot: false},
      {icon: 'expenses', label: 'Expenses', dot: false},
      {icon: 'booking', label: 'Booking', dot: false},
      {icon: 'crm', label: 'Customer CRM', dot: false},
      {icon: 'more', label: '+ more', dot: false},
    ],
  },

  // 6. OFFER -----------------------------------------------------
  offer: {
    dateLine: '១ ថ្ងៃ · ថ្ងៃសៅរ៍ ទី ២៤ តុលា ២០២៦',
    timeLine: 'ម៉ោង 8:30 AM - 4:30 PM · ភ្នំពេញ · សិក្សាផ្ទាល់',
    priceLabel: 'តម្លៃពិសេស Early Bird',
    price: '$49',
    oldPrice: '$69',
    bonusTop: 'BONUS',
    bonusMain: 'FREE',
    bonusBottom: 'Business Prompts Library',
    proofLine: '✓ មានអ្នកចូលរួមវគ្គបណ្តុះបណ្តាលរបស់យើងជាង 1,498 នាក់',
    button: 'ចុះឈ្មោះឥឡូវនេះ →',
  },

  // 7. CLOSE -----------------------------------------------------
  close: {
    heading: 'ស្កេនដើម្បីចុះឈ្មោះ',
  },

  /**
   * VOICEOVER SCRIPT — also used for the karaoke captions.
   * One line per scene, in the same order as `timing.scenes`.
   */
  voiceover: {
    hook: 'ចង់ប្រើ AI និងបង្កើត Tools សម្រាប់អាជីវកម្មខ្លួនឯង តែមិនដឹងចាប់ផ្តើមពីណា?',
    title: 'វគ្គ AI For Business នាំអ្នកពីមូលដ្ឋាន ដល់ការបង្កើត Tools ដោយមិនចាំបាច់ចេះសរសេរកូដ។',
    useAI: 'អ្នកនឹងរៀនប្រើ ChatGPT, Claude, Gemini និង Copilot ឱ្យបានស្ទាត់ជំនាញ។',
    stock: 'បន្ទាប់មក បង្កើត Tools គ្រប់គ្រងស្តុក និងការលក់ កត់ត្រាដោយស្វ័យប្រវត្តិ។',
    billing: 'ចេញវិក្កយបត្របានភ្លាមៗ ចុចតែម្តងរួចរាល់។',
    leave: 'អនុម័តច្បាប់ឈប់សម្រាករបស់បុគ្គលិក ងាយស្រួល និងរហ័ស។',
    agent: 'ថែមទាំង AI Sales Agent ជួយឆ្លើយអតិថិជន និងទទួលការកុម្ម៉ង់ ២៤ ម៉ោង។',
    moreTools: 'និងបង្កើត Tools ផ្សេងៗទៀត តាមតម្រូវការអាជីវកម្មរបស់អ្នក។',
    offer: 'រៀនផ្ទាល់ ១ ថ្ងៃ តម្លៃ Early Bird ត្រឹមតែ ៤៩ ដុល្លារ ថែមទាំងទទួលបាន Business Prompts Library ដោយឥតគិតថ្លៃ។',
    close: 'ស្កេន QR ឬផ្ញើសារតាម Telegram ដើម្បីចុះឈ្មោះឥឡូវនេះ!',
  },
} as const;

export type SceneKey = keyof typeof config.timing.scenes;

export const SCENE_ORDER: SceneKey[] = [
  'hook',
  'title',
  'useAI',
  'stock',
  'billing',
  'leave',
  'agent',
  'moreTools',
  'offer',
  'close',
];
