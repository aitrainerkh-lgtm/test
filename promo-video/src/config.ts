/**
 * ============================================================
 *  AI For Business - Promo Video
 *  ALL EDITABLE TEXT AND SETTINGS ARE IN THIS FILE.
 * ============================================================
 *
 *  Text markup you can use in any line:
 *    *word*   -> word gets the lime-green highlight bar
 *    \n       -> forced line break
 *    ✓ ✦ →    -> drawn as clean icons (safe in any font)
 *
 *  Keep technical terms in English inside Khmer text
 *  (AI, Tools, Prompt, Workflow, AI Agent, Google Sheets ...).
 *
 *  Files go in the /public folder (all optional - the video renders without them):
 *    logo.png, hook.jpg, qr.png, voiceover.mp3, music.mp3
 *    icons/chatgpt.png, icons/claude.png, icons/gemini.png, icons/copilot.png
 *  After adding or removing files, re-run `npm run render` (it re-checks the folder).
 */

export const config = {
  brand: {
    name: 'AI For Business',
  },

  course: {
    /** Section labels */
    useAiLabel: { number: '01', text: 'USE AI' },
    buildLabel: { number: '02', text: 'BUILD WITH AI' },
    telegramHandle: '@AIForBusiness_KH',
    /** Used to draw a working QR code when public/qr.png is not provided */
    telegramLink: 'https://t.me/AIForBusiness_KH',
  },

  /* ---------------- Scene 1 - HOOK ---------------- */
  hook: {
    headline: 'ចង់ប្រើ AI និងបង្កើត\n*Tools* ខ្លួនឯង?',
    subline: 'តែមិនដឹងចាប់ផ្តើមពីណា?',
  },

  /* ---------------- Scene 2 - TITLE ---------------- */
  title: {
    liveLabel: 'LIVE TRAINING',
    big: 'AI',
    second: 'For *Business*',
    pill: '100% No-Code · មិនចាំបាច់ចេះសរសេរកូដ',
  },

  /* ---------------- Scene 3 - 01 USE AI ---------------- */
  useAi: {
    title: 'រៀនប្រើ *AI* ឱ្យស្ទាត់ជំនាញ',
    tools: [
      { id: 'chatgpt', name: 'ChatGPT', chips: ['Prompting', 'Custom GPTs', 'Projects'] },
      { id: 'claude', name: 'Claude', chips: ['Projects', 'Skills', 'File Analysis'] },
      { id: 'gemini', name: 'Gemini', chips: ['Gems', 'Deep Research', 'Google Workspace'] },
      { id: 'copilot', name: 'Copilot', chips: ['Word', 'Excel', 'Outlook'] },
    ],
    endLine: '✦ AI Tools ទាំង ៤ សម្រាប់ការងារប្រចាំថ្ងៃ',
  },

  /* ---------------- Scene 4 - 02 BUILD WITH AI ---------------- */
  shopName: 'SOPHEA MART',

  stock: {
    title: 'Stock & *Sales*',
    subtitle: 'គ្រប់គ្រងស្តុក និងការលក់',
    badge: 'Google Sheets',
    salesLabel: "Today's Sales",
    salesBefore: 480,
    saleAmount: 74, // Today's Sales goes up by this, Stock Value goes down by this
    stockLabel: 'Stock Value',
    stockBefore: 3240,
    items: [
      { name: 'Rice 25kg', left: 18 },
      { name: 'Cooking Oil 1L', left: 42 },
      { name: 'Sugar 1kg', left: 9 },
    ],
    soldItemIndex: 0, // which row flashes green and drops by 1 (0 = first row)
    toast: '✓ Sale recorded',
  },

  billing: {
    title: '*Billing*',
    subtitle: 'ចេញវិក្កយបត្រភ្លាមៗ',
    receiptLabel: 'OFFICIAL RECEIPT',
    invoiceNo: 'INV-2026-0001',
    // TOTAL is calculated automatically: qty x unitPrice
    lines: [
      { name: 'Rice 25kg', qty: 2, unitPrice: 25 },
      { name: 'Cooking Oil 1L', qty: 3, unitPrice: 15 },
      { name: 'Sugar 1kg', qty: 5, unitPrice: 5 },
    ],
    totalLabel: 'TOTAL PAID',
  },

  leave: {
    title: 'Leave *Tracker*',
    subtitle: 'អនុម័តច្បាប់ឈប់សម្រាក',
    initials: 'SD',
    employee: 'Sok Dara',
    detail: 'Annual leave · 2 days · Oct 15-16',
    approve: 'Approve',
    reject: 'Reject',
    approved: '✓ Approved',
    week: [
      { day: 'MON', date: 12 },
      { day: 'TUE', date: 13 },
      { day: 'WED', date: 14 },
      { day: 'THU', date: 15, leave: true },
      { day: 'FRI', date: 16, leave: true },
      { day: 'SAT', date: 17 },
      { day: 'SUN', date: 18 },
    ],
  },

  agent: {
    title: 'AI Sales *Agent*',
    subtitle: 'ភ្នាក់ងារលក់ AI',
    chatHeader: 'Sophea Mart · Messenger',
    aiTag: 'AI',
    customerAsk: 'ប្រេងឆា 1L តម្លៃប៉ុន្មាន?',
    product: { name: 'Cooking Oil 1L', price: 15 },
    customerOrder: 'យក ២ ដប',
    orderQty: 2, // Total = product price x orderQty
    orderNo: '#1024',
    notifyTitle: 'Staff Group',
    notifyText: '✓ Order #1024 confirmed',
    sticker: 'រៀនបង្កើត Workflow នេះក្នុងវគ្គ!',
  },

  /* ---------------- Scene 5 - MORE TOOLS ---------------- */
  moreTools: {
    headline: 'បង្កើត *Tools* បន្ថែម\nតាមតម្រូវការ',
    subline: 'សម្រាប់អាជីវកម្ម និងការងាររបស់អ្នក',
    // icon names: attendance, stock, purchasing, agent, billing, suppliers,
    //             leave, reports, expenses, booking, crm, more
    tiles: [
      { label: 'Attendance', icon: 'attendance', dot: false },
      { label: 'Stock & Sales', icon: 'stock', dot: true },
      { label: 'Purchasing', icon: 'purchasing', dot: false },
      { label: 'Sales Agent', icon: 'agent', dot: true },
      { label: 'Billing', icon: 'billing', dot: true },
      { label: 'Suppliers', icon: 'suppliers', dot: false },
      { label: 'Leave', icon: 'leave', dot: true },
      { label: 'Reports', icon: 'reports', dot: false },
      { label: 'Expenses', icon: 'expenses', dot: false },
      { label: 'Booking', icon: 'booking', dot: false },
      { label: 'Customer CRM', icon: 'crm', dot: false },
      { label: '+ more', icon: 'more', dot: false },
    ],
  },

  /* ---------------- Scene 6 - OFFER ---------------- */
  offer: {
    line1: '១ ថ្ងៃ · ថ្ងៃសៅរ៍ ទី ២៤ តុលា ២០២៦',
    line2: 'ម៉ោង 8:30 AM - 4:30 PM · ភ្នំពេញ · សិក្សាផ្ទាល់',
    priceLabel: 'តម្លៃពិសេស Early Bird',
    price: '$49',
    oldPrice: '$69',
    bonusTop: 'BONUS',
    bonusMain: 'FREE',
    bonusText: 'Business Prompts Library',
    proof: '✓ មានអ្នកចូលរួមវគ្គបណ្តុះបណ្តាលរបស់យើងជាង 1,498 នាក់',
    button: 'ចុះឈ្មោះឥឡូវនេះ →',
  },

  /* ---------------- Scene 7 - CLOSE ---------------- */
  close: {
    heading: 'ស្កេនដើម្បីចុះឈ្មោះ',
  },

  /* ---------------- TIMING & AUDIO ---------------- */
  timing: {
    fps: 60,
    /**
     * Scene lengths in seconds when there is NO voiceover.mp3 (total 40s).
     * Order: hook, title, useAi, stock, billing, leave, agent, moreTools, offer, close
     */
    sceneSeconds: [4, 3, 5, 4, 4, 4, 4, 3, 5, 4],
    /** Extra seconds the last scene holds after the voiceover ends */
    endHoldSeconds: 1.2,
  },

  voiceover: {
    file: 'voiceover.mp3',
    /**
     * One line per scene, same order as sceneSeconds. Used for the karaoke captions.
     * Words are split automatically. To force your own word split, use "|"
     * (example: 'ចង់|ប្រើ AI').
     */
    lines: [
      'ចង់ប្រើ AI និងបង្កើត Tools សម្រាប់អាជីវកម្មខ្លួនឯង តែមិនដឹងចាប់ផ្តើមពីណា?',
      'វគ្គ AI For Business នាំអ្នកពីមូលដ្ឋាន ដល់ការបង្កើត Tools ដោយមិនចាំបាច់ចេះសរសេរកូដ។',
      'អ្នកនឹងរៀនប្រើ ChatGPT, Claude, Gemini និង Copilot ឱ្យបានស្ទាត់ជំនាញ។',
      'បន្ទាប់មក បង្កើត Tools គ្រប់គ្រងស្តុក និងការលក់ កត់ត្រាដោយស្វ័យប្រវត្តិ។',
      'ចេញវិក្កយបត្របានភ្លាមៗ ចុចតែម្តងរួចរាល់។',
      'អនុម័តច្បាប់ឈប់សម្រាករបស់បុគ្គលិក ងាយស្រួល និងរហ័ស។',
      'ថែមទាំង AI Sales Agent ជួយឆ្លើយអតិថិជន និងទទួលការកុម្ម៉ង់ ២៤ ម៉ោង។',
      'និងបង្កើត Tools ផ្សេងៗទៀត តាមតម្រូវការអាជីវកម្មរបស់អ្នក។',
      'រៀនផ្ទាល់ ១ ថ្ងៃ តម្លៃ Early Bird ត្រឹមតែ ៤៩ ដុល្លារ ថែមទាំងទទួលបាន Business Prompts Library ដោយឥតគិតថ្លៃ។',
      'ស្កេន QR ឬផ្ញើសារតាម Telegram ដើម្បីចុះឈ្មោះឥឡូវនេះ!',
    ],
    /**
     * Optional manual sync. When the voiceover is added, scene timing is detected
     * automatically from the pauses between lines. If the detection is not right,
     * type the start and end second of each spoken line here, e.g.
     *   segments: [[0.2, 3.6], [4.0, 7.9], ...]   (10 pairs)
     */
    segments: null as null | Array<[number, number]>,
  },

  music: {
    file: 'music.mp3',
    /** Music level under the voice, in dB (-20 dB = 10% volume) */
    volumeDb: -20,
    fadeInSeconds: 0.6,
    fadeOutSeconds: 1.5,
  },

  captions: {
    show: true,
    /** Max characters per caption page (shorter = fewer lines on screen) */
    maxCharsPerPage: 30,
  },
};

export type Config = typeof config;
