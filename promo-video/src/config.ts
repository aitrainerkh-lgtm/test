/**
 * ============================================================
 *  AI For Business – promo video: ALL EDITABLE CONTENT
 * ============================================================
 *  Change text, prices, dates and timing here.
 *  You do not need to touch any animation code.
 *
 *  Text markup used in this file:
 *    [word]   -> word gets the lime-green highlight bar
 *    \n       -> line break
 *
 *  Voiceover / karaoke lines ("voice"):
 *    " " (space) -> word boundary WITH a visible space
 *    "|"         -> word boundary WITHOUT a space (Khmer has no spaces
 *                   between words, so "|" tells the caption where one
 *                   karaoke word ends and the next starts)
 *    Remove all "|" and you get the exact voiceover script.
 *
 *  Voiceover sync:
 *    By default each scene's caption words are spread across the scene.
 *    After you add voiceover.mp3, listen in the Studio and set, per scene:
 *      voiceStart / voiceEnd  -> seconds from the START OF THAT SCENE
 *      wordTimes              -> optional exact start second of every
 *                                caption word (same order, relative to
 *                                the scene start)
 *    Scene lengths are set with "durationSec".
 * ============================================================
 */

export type VoiceTiming = {
  /** Karaoke line. See markup notes above. */
  voice: string;
  /** Seconds from scene start when the voice begins (default 0.2). */
  voiceStart?: number;
  /** Seconds from scene start when the voice ends (default: scene end - 0.25). */
  voiceEnd?: number;
  /** Optional exact start time (seconds from scene start) for each karaoke word. */
  wordTimes?: number[];
};

export const config = {
  // ---------------- FILES (put them in the /public folder) ----------------
  files: {
    logo: 'logo.png',
    hookPhoto: 'hook.jpg',
    qr: 'qr.png',
    voiceover: 'voiceover.mp3',
    music: 'music.mp3',
  },

  // ---------------- AUDIO ----------------
  audio: {
    voiceVolumeDb: 0,
    /** Music level under the voice. -20 dB ≈ 10% volume. */
    musicVolumeDb: -20,
    musicFadeInSec: 0.8,
    musicFadeOutSec: 2,
  },

  // ---------------- BRAND ----------------
  brand: {
    name: 'AI For Business',
  },

  // ---------------- COURSE DETAILS ----------------
  course: {
    liveLabel: 'LIVE TRAINING',
    noCodePill: '100% No-Code · មិនចាំបាច់ចេះសរសេរកូដ',
    dateLine: '១ ថ្ងៃ · ថ្ងៃសៅរ៍ ទី ២៤ តុលា ២០២៦',
    timeVenueLine: 'ម៉ោង 8:30 AM - 4:30 PM · ភ្នំពេញ · សិក្សាផ្ទាល់',
    priceLabel: 'តម្លៃពិសេស Early Bird',
    /** USD. Shown as "$49". */
    price: 49,
    /** USD. Shown struck-through. Set to null to hide. */
    oldPrice: 69 as number | null,
    bonusTop: 'BONUS',
    bonusText: 'FREE Business Prompts Library',
    socialProof: '✓ មានអ្នកចូលរួមវគ្គបណ្តុះបណ្តាលរបស់យើងជាង 1,498 នាក់',
    ctaButton: 'ចុះឈ្មោះឥឡូវនេះ →',
    telegram: '@AIForBusiness_KH',
  },

  // ---------------- DEMO SHOP (used in scene 4 mock-ups) ----------------
  shop: {
    name: 'SOPHEA MART',
    displayName: 'Sophea Mart',
    /** Prices in USD. Receipt lines and chat totals are calculated from these. */
    products: {
      rice: {name: 'Rice 25kg', price: 25},
      oil: {name: 'Cooking Oil 1L', price: 15},
      sugar: {name: 'Sugar 1kg', price: 5},
    },
  },

  // ============================================================
  //  SCENES (in play order)
  // ============================================================
  scenes: {
    // 1 ---------------------------------------------------------
    hook: {
      durationSec: 4,
      headline: ['ចង់ប្រើ AI និងបង្កើត', '[Tools] ខ្លួនឯង?'],
      subline: 'តែមិនដឹងចាប់ផ្តើមពីណា?',
      voice:
        'ចង់|ប្រើ AI និង|បង្កើត Tools សម្រាប់|អាជីវកម្ម|ខ្លួនឯង តែ|មិន|ដឹង|ចាប់ផ្តើម|ពី|ណា?',
    },

    // 2 ---------------------------------------------------------
    title: {
      durationSec: 3,
      bigWord: 'AI',
      secondLine: 'For [Business]',
      voice:
        'វគ្គ AI For Business នាំ|អ្នក|ពី|មូលដ្ឋាន ដល់|ការ|បង្កើត Tools ដោយ|មិន|ចាំបាច់|ចេះ|សរសេរ|កូដ។',
    },

    // 3 ---------------------------------------------------------
    useAI: {
      durationSec: 5,
      labelNumber: '01',
      label: 'USE AI',
      title: 'រៀនប្រើ AI ឱ្យស្ទាត់ជំនាញ',
      /**
       * icon: optional image in /public (e.g. 'icons/chatgpt.png') to replace
       * the drawn icon. Leave as null to use the built-in drawn icon.
       */
      tools: [
        {name: 'ChatGPT', chips: ['Prompting', 'Custom GPTs', 'Projects'], icon: null as string | null},
        {name: 'Claude', chips: ['Projects', 'Skills', 'File Analysis'], icon: null as string | null},
        {name: 'Gemini', chips: ['Gems', 'Deep Research', 'Google Workspace'], icon: null as string | null},
        {name: 'Copilot', chips: ['Word', 'Excel', 'Outlook'], icon: null as string | null},
      ],
      endLine: '✦ AI Tools ទាំង ៤ សម្រាប់ការងារប្រចាំថ្ងៃ',
      voice:
        'អ្នក|នឹង|រៀន|ប្រើ ChatGPT, Claude, Gemini និង Copilot ឱ្យ|បាន|ស្ទាត់ជំនាញ។',
    },

    // 4 ---------------------------------------------------------
    build: {
      labelNumber: '02',
      label: 'BUILD WITH AI',

      stock: {
        durationSec: 4,
        title: 'Stock & [Sales]',
        subtitle: 'គ្រប់គ្រងស្តុក និងការលក់',
        sheetTitle: 'Stock & Sales Dashboard',
        badge: 'Google Sheets',
        todaySalesLabel: "Today's Sales",
        todaySalesFrom: 480,
        todaySalesTo: 554,
        stockValueLabel: 'Stock Value',
        stockValueFrom: 3240,
        stockValueTo: 3166,
        items: [
          {name: 'Rice 25kg', left: 18},
          {name: 'Cooking Oil 1L', left: 42},
          {name: 'Sugar 1kg', left: 9},
        ],
        /** Which item row is sold (0 = first row). Its stock drops by 1. */
        soldItemIndex: 0,
        leftSuffix: 'left',
        toast: '✓ Sale recorded',
        voice:
          'បន្ទាប់មក បង្កើត Tools គ្រប់គ្រង|ស្តុក និង|ការ|លក់ កត់ត្រា|ដោយ|ស្វ័យប្រវត្តិ។',
      },

      billing: {
        durationSec: 4,
        title: '[Billing]',
        subtitle: 'ចេញវិក្កយបត្រភ្លាមៗ',
        receiptLabel: 'OFFICIAL RECEIPT',
        invoiceNo: 'INV-2026-0001',
        /** product key from shop.products + quantity */
        lines: [
          {product: 'rice', qty: 2},
          {product: 'oil', qty: 3},
          {product: 'sugar', qty: 5},
        ],
        totalLabel: 'TOTAL PAID',
        voice: 'ចេញ|វិក្កយបត្រ|បាន|ភ្លាមៗ ចុច|តែ|ម្តង|រួចរាល់។',
      },

      leave: {
        durationSec: 4,
        title: 'Leave [Tracker]',
        subtitle: 'អនុម័តច្បាប់ឈប់សម្រាក',
        initials: 'SD',
        employee: 'Sok Dara',
        detail: 'Annual leave · 2 days · Oct 15-16',
        approve: 'Approve',
        reject: 'Reject',
        approved: '✓ Approved',
        calendarTitle: 'October 2026',
        week: [
          {day: 'MON', date: 12, leave: false},
          {day: 'TUE', date: 13, leave: false},
          {day: 'WED', date: 14, leave: false},
          {day: 'THU', date: 15, leave: true},
          {day: 'FRI', date: 16, leave: true},
          {day: 'SAT', date: 17, leave: false},
          {day: 'SUN', date: 18, leave: false},
        ],
        voice:
          'អនុម័ត|ច្បាប់|ឈប់|សម្រាក|របស់|បុគ្គលិក ងាយស្រួល និង|រហ័ស។',
      },

      agent: {
        durationSec: 4,
        title: 'AI Sales [Agent]',
        subtitle: 'ភ្នាក់ងារលក់ AI',
        chatHeader: 'Sophea Mart · Messenger',
        aiTag: 'AI',
        customerAsk: 'ប្រេងឆា 1L តម្លៃប៉ុន្មាន?',
        /** product key from shop.products */
        product: 'oil',
        customerOrder: 'យក ២ ដប',
        orderQty: 2,
        orderNo: '#1024',
        payBrand: 'KHQR',
        payTotalLabel: 'Total',
        payOrderLabel: 'Order',
        notifyApp: 'Telegram',
        notifyTitle: 'Staff Group',
        notifyText: '✓ Order #1024 confirmed',
        sticker: 'រៀនបង្កើត Workflow នេះក្នុងវគ្គ!',
        voice:
          'ថែមទាំង AI Sales Agent ជួយ|ឆ្លើយ|អតិថិជន និង|ទទួល|ការ|កុម្ម៉ង់ ២៤ ម៉ោង។',
      },
    },

    // 5 ---------------------------------------------------------
    moreTools: {
      durationSec: 3,
      headline: 'បង្កើត [Tools] បន្ថែម តាមតម្រូវការ',
      subline: 'សម្រាប់អាជីវកម្ម និងការងាររបស់អ្នក',
      /** icon keys: clock, box, cart, chat, receipt, truck, calendar, chart, wallet, booking, users, plus */
      tiles: [
        {label: 'Attendance', icon: 'clock', dot: true},
        {label: 'Stock & Sales', icon: 'box', dot: false},
        {label: 'Purchasing', icon: 'cart', dot: false},
        {label: 'Sales Agent', icon: 'chat', dot: true},
        {label: 'Billing', icon: 'receipt', dot: false},
        {label: 'Suppliers', icon: 'truck', dot: false},
        {label: 'Leave', icon: 'calendar', dot: false},
        {label: 'Reports', icon: 'chart', dot: true},
        {label: 'Expenses', icon: 'wallet', dot: false},
        {label: 'Booking', icon: 'booking', dot: false},
        {label: 'Customer CRM', icon: 'users', dot: true},
        {label: '+ more', icon: 'plus', dot: false},
      ],
      voice:
        'និង|បង្កើត Tools ផ្សេងៗ|ទៀត តាម|តម្រូវការ|អាជីវកម្ម|របស់|អ្នក។',
    },

    // 6 ---------------------------------------------------------
    offer: {
      durationSec: 5,
      // NOTE: if you change the price above, also change "៤៩ ដុល្លារ" here and re-record the voice.
      voice:
        'រៀន|ផ្ទាល់ ១ ថ្ងៃ តម្លៃ Early Bird ត្រឹមតែ ៤៩ ដុល្លារ ថែមទាំង|ទទួល|បាន Business Prompts Library ដោយ|ឥតគិតថ្លៃ។',
    },

    // 7 ---------------------------------------------------------
    close: {
      durationSec: 4,
      heading: 'ស្កេនដើម្បីចុះឈ្មោះ',
      voice:
        'ស្កេន QR ឬ|ផ្ញើ|សារ|តាម Telegram ដើម្បី|ចុះ|ឈ្មោះ|ឥឡូវនេះ!',
    },
  },
};

export type Config = typeof config;
