/**
 * AI For Business — How To Use AI Tools: Knowledge Check
 *
 * Run setupQuiz() once. It creates:
 *   1. A Google Form quiz with 20 multiple-choice questions (auto-graded).
 *   2. A Google Sheet with a Dashboard and a Trainee Results tab.
 *   3. A trigger that refreshes the Dashboard every time a trainee submits.
 * The trainee link is printed in the Execution log and on the Dashboard.
 */

const BRAND = 'AI For Business';
const QUIZ_TITLE = 'How To Use AI Tools — Knowledge Check';
const TIME_ZONE = 'Asia/Phnom_Penh';

const GREEN = '#1B7A3D';
const ORANGE = '#E8731A';
const LIGHT_GREEN = '#EEF6F0';
const LOW_SCORE_RED = '#FCE8E6';

const BANDS = [
  { label: '0% – 10%',   max: 0.10, level: 'Very Low' },
  { label: '11% – 30%',  max: 0.30, level: 'Low' },
  { label: '31% – 50%',  max: 0.50, level: 'Basic' },
  { label: '51% – 70%',  max: 0.70, level: 'Good' },
  { label: '71% – 90%',  max: 0.90, level: 'Very Good' },
  { label: '91% – 100%', max: 1.00, level: 'Excellent' },
];

// answer = index of the correct option (0 = A, 1 = B, 2 = C, 3 = D)
const QUESTIONS = [
  {
    topic: 'AI tools: ChatGPT',
    q: 'Which company develops ChatGPT?',
    options: ['Google', 'OpenAI', 'Microsoft', 'Anthropic'],
    answer: 1,
    explain: 'ChatGPT is developed by OpenAI.',
  },
  {
    topic: 'AI tools: Claude',
    q: 'Which company develops Claude?',
    options: ['Anthropic', 'OpenAI', 'Google', 'Microsoft'],
    answer: 0,
    explain: 'Claude is developed by Anthropic.',
  },
  {
    topic: 'AI tools: Copilot',
    q: 'Which AI tool is built into Microsoft 365 apps such as Word, Excel, Outlook and Teams?',
    options: ['Gemini', 'Claude', 'Copilot', 'ChatGPT'],
    answer: 2,
    explain: 'Microsoft Copilot works inside Microsoft 365 apps such as Word, Excel, Outlook and Teams.',
  },
  {
    topic: 'AI tools: Gemini',
    q: 'Which AI tool is built into Google Workspace apps such as Gmail, Docs and Sheets?',
    options: ['Copilot', 'ChatGPT', 'Claude', 'Gemini'],
    answer: 3,
    explain: 'Google Gemini works inside Google Workspace apps such as Gmail, Docs and Sheets.',
  },
  {
    topic: 'Prompt basics',
    q: 'In AI tools, what is a "Prompt"?',
    options: [
      'A software update for the AI tool',
      'The instruction or question you give to the AI tool',
      'The monthly subscription fee',
      'A security password',
    ],
    answer: 1,
    explain: 'A Prompt is the instruction or question you type to tell the AI tool what you need.',
  },
  {
    topic: 'Clear and specific Prompts',
    q: 'Which Prompt will most likely give the best result?',
    options: [
      '"Write an email."',
      '"Email to a client about delivery."',
      '"Write a short, polite email to a client. Explain that the delivery is delayed by 3 days and offer a 5% discount. Keep it under 120 words."',
      '"Help me with my client."',
    ],
    answer: 2,
    explain: 'Clear and specific Prompts (who, what, tone, length) give much better results.',
  },
  {
    topic: 'Prompt structure',
    q: 'A strong Prompt usually includes which elements?',
    options: [
      'Role, task, context and the output format you want',
      'Only one keyword',
      'As many unrelated words as possible',
      'Your login password for better access',
    ],
    answer: 0,
    explain: 'A strong Prompt gives the AI a role, a clear task, the context and the output format.',
  },
  {
    topic: 'AI hallucination',
    q: 'What does "AI hallucination" mean?',
    options: [
      'The AI tool stops working',
      'The AI tool takes too long to answer',
      'The AI tool refuses to answer',
      'The AI tool gives false or made-up information that sounds correct',
    ],
    answer: 3,
    explain: 'A hallucination is when AI gives false or made-up information that looks correct. Always check.',
  },
  {
    topic: 'Checking AI output',
    q: 'Before you use numbers, facts or law references from an AI answer in a report, what should you do?',
    options: [
      'Copy them directly, because AI is always correct',
      'Check them against reliable sources',
      'Ask the AI if it is sure and accept its answer',
      'Remove all numbers from the report',
    ],
    answer: 1,
    explain: 'AI can make mistakes. Check numbers, facts and law references against reliable sources.',
  },
  {
    topic: 'Data privacy',
    q: 'Which information should you NOT enter into an AI tool unless your company has approved it?',
    options: [
      'General ideas for a marketing post',
      'A question about English grammar',
      'Customer personal data, passwords and confidential financial data',
      'A summary of a public news article',
    ],
    answer: 2,
    explain: 'Protect personal, confidential and financial data. Follow your company AI and data policy.',
  },
  {
    topic: 'Improving the answer',
    q: 'The first AI answer is not good enough. What is the best next step?',
    options: [
      'Give feedback and improve the Prompt with more details',
      'Stop using AI for this task',
      'Type the same Prompt again in capital letters',
      'Close the chat and wait one day',
    ],
    answer: 0,
    explain: 'Working with AI is a conversation. Give feedback and add details to improve the answer.',
  },
  {
    topic: 'Giving AI a role',
    q: 'The Prompt "Act as an experienced HR manager…" is an example of:',
    options: [
      'Hacking the AI tool',
      'Training a new AI model',
      'Data entry',
      'Giving the AI tool a role',
    ],
    answer: 3,
    explain: 'Giving the AI a role helps it answer with the right knowledge, tone and point of view.',
  },
  {
    topic: 'Output format',
    q: 'You want the AI answer as a table. What is the best way?',
    options: [
      'Hope the AI chooses a table',
      'Ask clearly, for example: "Present the answer in a table with columns: Task, Owner, Deadline"',
      'Always upload an Excel file first',
      'Switch to a different AI tool',
    ],
    answer: 1,
    explain: 'Tell the AI exactly which format you want: table, bullet points, email, columns, length.',
  },
  {
    topic: 'What AI does well',
    q: 'Which tasks are AI tools like ChatGPT, Claude, Gemini and Copilot generally good at?',
    options: [
      'Drafting emails, summarizing documents and brainstorming ideas',
      'Making final legal decisions without human review',
      'Guaranteeing 100% accurate facts',
      'Replacing all human judgment at work',
    ],
    answer: 0,
    explain: 'AI is strong at drafting, summarizing and brainstorming. People still review and decide.',
  },
  {
    topic: 'Responsibility',
    q: 'When you use AI at work, who is responsible for the final output?',
    options: [
      'The AI tool',
      'The company that built the AI tool',
      'You, the user who checks and uses it',
      'Nobody',
    ],
    answer: 2,
    explain: 'You are responsible for any work you submit, even when AI helped you create it.',
  },
  {
    topic: 'How AI answers',
    q: 'You ask an AI tool the same question twice and get two slightly different answers. Why?',
    options: [
      'The AI tool is broken',
      'Your internet connection is slow',
      'Your account has been blocked',
      'AI tools create a new answer each time, so the wording can change',
    ],
    answer: 3,
    explain: 'AI tools generate a new answer each time, so the wording can be different.',
  },
  {
    topic: 'Using examples',
    q: 'Why should you include an example of the output you want in your Prompt?',
    options: [
      'It helps the AI match the style and format you want',
      'It makes the AI tool slower',
      'It is required by law',
      'It deletes your previous chats',
    ],
    answer: 0,
    explain: 'An example shows the AI exactly what good output looks like, so results match your style.',
  },
  {
    topic: 'AI and Khmer language',
    q: 'You use an AI tool to write or translate text in Khmer. What is the best practice?',
    options: [
      'Use the Khmer output without checking',
      'Review and edit the Khmer output carefully before you use it',
      'Never use AI for Khmer',
      'Ask the AI tool to answer faster',
    ],
    answer: 1,
    explain: 'AI can help with Khmer, but quality can vary. Always review and edit before you use it.',
  },
  {
    topic: 'Breaking down tasks',
    q: 'You need AI help with a large task, such as a full training plan. What is the best approach?',
    options: [
      'Ask for everything in one very short Prompt',
      'Avoid giving any context',
      'Accept the first draft without review',
      'Break the task into steps, for example: outline first, then each section',
    ],
    answer: 3,
    explain: 'Breaking big tasks into steps gives better quality and more control over the result.',
  },
  {
    topic: 'Managing chats',
    q: 'You start a new task that is not related to your current chat. What is a good practice?',
    options: [
      'Continue in the same long chat',
      'Delete your AI account',
      'Start a new chat so old information does not confuse the AI',
      'Copy the whole old chat into the new Prompt',
    ],
    answer: 2,
    explain: 'A new chat for a new topic keeps the AI focused and avoids mixing old information.',
  },
];

// Dashboard layout (row numbers)
const ROW_LINK = 3;
const ROW_KPI_LABEL = 5;
const ROW_KPI_VALUE = 6;
const ROW_BAND_TITLE = 8;
const ROW_BAND_HEADER = 9;
const ROW_BAND_FIRST = 10;
const ROW_Q_TITLE = ROW_BAND_FIRST + BANDS.length + 1;
const ROW_Q_HEADER = ROW_Q_TITLE + 1;
const ROW_Q_FIRST = ROW_Q_HEADER + 1;

function setupQuiz() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    throw new Error('The quiz is already set up. Run showLinks() to see the links again.');
  }

  // 1. Form
  const form = FormApp.create(BRAND + ' — ' + QUIZ_TITLE);
  form
    .setTitle(BRAND + ' — ' + QUIZ_TITLE)
    .setDescription(
      'This quiz checks how well you understand how to use AI tools such as ChatGPT, Claude, ' +
      'Gemini and Copilot at work.\n\n' +
      '• 20 questions • 1 point each • About 10 minutes\n' +
      '• Choose ONE answer for each question.\n' +
      '• Answer on your own. This is not an exam. It helps us see what to focus on in training.'
    )
    .setIsQuiz(true)
    .setCollectEmail(false)
    .setProgressBar(true)
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false)
    .setConfirmationMessage('Thank you. Your answers have been submitted. Click "View score" to see your result.');

  const nameItem = form.addTextItem().setTitle('Full name').setRequired(true);
  const deptItem = form.addTextItem().setTitle('Company / Department').setRequired(false);
  form.addPageBreakItem()
    .setTitle('Quiz — 20 Questions')
    .setHelpText('Choose one answer for each question. Each correct answer = 1 point.');

  const questionItemIds = QUESTIONS.map((item, i) => {
    const mc = form.addMultipleChoiceItem();
    mc.setTitle((i + 1) + '. ' + item.q)
      .setChoices(item.options.map((opt, j) => mc.createChoice(opt, j === item.answer)))
      .setPoints(1)
      .setRequired(true)
      .setFeedbackForCorrect(FormApp.createFeedback().setText('Correct. ' + item.explain).build())
      .setFeedbackForIncorrect(FormApp.createFeedback().setText(item.explain).build());
    return mc.getId();
  });

  if (typeof form.setPublished === 'function') form.setPublished(true);
  form.setAcceptingResponses(true);

  // 2. Spreadsheet with dashboard
  const ss = SpreadsheetApp.create(BRAND + ' — ' + QUIZ_TITLE + ' (Dashboard)');
  ss.setSpreadsheetTimeZone(TIME_ZONE);
  buildDashboard_(ss, getTraineeLink_(form));
  buildResultsSheet_(ss);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  SpreadsheetApp.flush();

  props.setProperties({
    FORM_ID: form.getId(),
    SHEET_ID: ss.getId(),
    NAME_ITEM_ID: String(nameItem.getId()),
    DEPT_ITEM_ID: String(deptItem.getId()),
    QUESTION_ITEM_IDS: JSON.stringify(questionItemIds),
  });

  // 3. Auto-refresh on every submission
  ScriptApp.newTrigger('updateDashboard').forForm(form).onFormSubmit().create();

  updateDashboard();
  showLinks();
}

function updateDashboard() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  const nameId = Number(props.getProperty('NAME_ITEM_ID'));
  const deptId = Number(props.getProperty('DEPT_ITEM_ID'));
  const questionItemIds = JSON.parse(props.getProperty('QUESTION_ITEM_IDS'));
  const total = QUESTIONS.length;

  const correctByQuestion = new Array(total).fill(0);
  const results = form.getResponses().map(resp => {
    const text = {};
    resp.getItemResponses().forEach(ir => { text[ir.getItem().getId()] = ir.getResponse(); });
    const score = {};
    resp.getGradableItemResponses().forEach(ir => { score[ir.getItem().getId()] = Number(ir.getScore()) || 0; });

    let correct = 0;
    questionItemIds.forEach((id, i) => {
      if (score[id] > 0) {
        correct++;
        correctByQuestion[i]++;
      }
    });
    const pct = correct / total;
    const band = bandFor_(pct);
    return [resp.getTimestamp(), text[nameId] || '', text[deptId] || '', correct + ' / ' + total, pct, band.label, band.level];
  });
  results.sort((a, b) => b[4] - a[4]);

  // Trainee Results tab
  const res = ss.getSheetByName('Trainee Results');
  if (res.getLastRow() > 1) res.getRange(2, 1, res.getLastRow() - 1, 7).clearContent();
  if (results.length) {
    res.getRange(2, 1, results.length, 7).setValues(results);
    res.getRange(2, 1, results.length, 1).setNumberFormat('dd mmm yyyy, hh:mm');
    res.getRange(2, 5, results.length, 1).setNumberFormat('0%');
  }

  // KPIs
  const dash = ss.getSheetByName('Dashboard');
  const n = results.length;
  const pcts = results.map(r => r[4]);
  const strong = pcts.filter(p => p > 0.70).length;
  dash.getRange(ROW_KPI_VALUE, 1, 1, 5).setValues([[
    n,
    n ? pcts.reduce((s, p) => s + p, 0) / n : '–',
    n ? Math.max.apply(null, pcts) : '–',
    n ? Math.min.apply(null, pcts) : '–',
    n ? strong / n : '–',
  ]]);

  // Score distribution
  const bandRows = BANDS.map(b => {
    const count = results.filter(r => r[5] === b.label).length;
    return [b.label, b.level, count, n ? count / n : 0];
  });
  dash.getRange(ROW_BAND_FIRST, 1, BANDS.length, 4).setValues(bandRows);

  // Correct answers by question
  const qRows = QUESTIONS.map((q, i) => [
    'Q' + (i + 1), q.topic, correctByQuestion[i], n ? correctByQuestion[i] / n : 0,
  ]);
  dash.getRange(ROW_Q_FIRST, 1, total, 4).setValues(qRows);

  dash.getRange(2, 1).setValue(
    'Last updated: ' + Utilities.formatDate(new Date(), TIME_ZONE, 'dd MMM yyyy, HH:mm')
  );
}

function showLinks() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const ss = SpreadsheetApp.openById(props.getProperty('SHEET_ID'));
  Logger.log('LINK FOR TRAINEES: ' + getTraineeLink_(form));
  Logger.log('Edit the form:     ' + form.getEditUrl());
  Logger.log('Dashboard:         ' + ss.getUrl());
}

function getTraineeLink_(form) {
  const url = form.getPublishedUrl();
  try {
    return form.shortenFormUrl(url);
  } catch (e) {
    return url;
  }
}

function bandFor_(pct) {
  const p = Math.round(pct * 100) / 100;
  return BANDS.find(b => p <= b.max) || BANDS[BANDS.length - 1];
}

function buildDashboard_(ss, traineeLink) {
  const dash = ss.getSheets()[0].setName('Dashboard');
  dash.setHiddenGridlines(true);

  dash.setColumnWidth(1, 150);
  dash.setColumnWidth(2, 230);
  dash.setColumnWidth(3, 130);
  dash.setColumnWidth(4, 130);
  dash.setColumnWidth(5, 170);
  dash.setColumnWidth(6, 30);

  dash.getRange(1, 1).setValue(BRAND + ' — ' + QUIZ_TITLE + ' | Dashboard')
    .setFontSize(16).setFontWeight('bold').setFontColor(GREEN);
  dash.getRange(2, 1).setFontColor('#666666').setFontStyle('italic');
  dash.getRange(ROW_LINK, 1, 1, 2).setValues([['Trainee link:', traineeLink]]);
  dash.getRange(ROW_LINK, 1).setFontWeight('bold');
  dash.getRange(ROW_LINK, 2).setFontColor(ORANGE);

  // KPI cards
  dash.getRange(ROW_KPI_LABEL, 1, 1, 5).setValues([[
    'Trainees', 'Average Score', 'Highest Score', 'Lowest Score', 'Scored above 70%',
  ]]).setBackground(GREEN).setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center').setWrap(true);
  dash.getRange(ROW_KPI_VALUE, 1, 1, 5)
    .setBackground(LIGHT_GREEN).setFontSize(18).setFontWeight('bold')
    .setFontColor(GREEN).setHorizontalAlignment('center');
  dash.getRange(ROW_KPI_VALUE, 2, 1, 4).setNumberFormat('0%');
  dash.setRowHeight(ROW_KPI_VALUE, 42);
  dash.getRange(ROW_KPI_VALUE, 1, 1, 5).setVerticalAlignment('middle');

  // Score distribution table
  dash.getRange(ROW_BAND_TITLE, 1).setValue('Score Distribution')
    .setFontSize(13).setFontWeight('bold').setFontColor(ORANGE);
  dash.getRange(ROW_BAND_HEADER, 1, 1, 4)
    .setValues([['Score Range', 'Level', 'Trainees', '% of Trainees']]);
  styleHeader_(dash.getRange(ROW_BAND_HEADER, 1, 1, 4));
  dash.getRange(ROW_BAND_FIRST, 4, BANDS.length, 1).setNumberFormat('0%');
  dash.getRange(ROW_BAND_FIRST, 3, BANDS.length, 2).setHorizontalAlignment('center');
  dash.getRange(ROW_BAND_HEADER, 1, BANDS.length + 1, 4)
    .setBorder(true, true, true, true, true, true, '#CCCCCC', SpreadsheetApp.BorderStyle.SOLID);

  // Per-question table
  dash.getRange(ROW_Q_TITLE, 1).setValue('Correct Answers by Question')
    .setFontSize(13).setFontWeight('bold').setFontColor(ORANGE);
  dash.getRange(ROW_Q_HEADER, 1, 1, 4)
    .setValues([['Question', 'Topic', 'Correct Answers', '% Correct']]);
  styleHeader_(dash.getRange(ROW_Q_HEADER, 1, 1, 4));
  const pctRange = dash.getRange(ROW_Q_FIRST, 4, QUESTIONS.length, 1);
  pctRange.setNumberFormat('0%');
  dash.getRange(ROW_Q_FIRST, 3, QUESTIONS.length, 2).setHorizontalAlignment('center');
  dash.getRange(ROW_Q_HEADER, 1, QUESTIONS.length + 1, 4)
    .setBorder(true, true, true, true, true, true, '#CCCCCC', SpreadsheetApp.BorderStyle.SOLID);
  dash.getRange(ROW_Q_FIRST + QUESTIONS.length + 1, 1)
    .setValue('Red = fewer than 50% of trainees answered correctly. Focus on these topics in training.')
    .setFontColor('#666666').setFontStyle('italic');

  dash.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND($C' + ROW_Q_FIRST + '<>"",$A$' + ROW_KPI_VALUE + '>0,$D' + ROW_Q_FIRST + '<0.5)')
      .setBackground(LOW_SCORE_RED).setFontColor('#B3261E')
      .setRanges([dash.getRange(ROW_Q_FIRST, 1, QUESTIONS.length, 4)])
      .build(),
  ]);

  // Charts
  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(dash.getRange(ROW_BAND_HEADER, 1, BANDS.length + 1, 1))
    .addRange(dash.getRange(ROW_BAND_HEADER, 4, BANDS.length + 1, 1))
    .setNumHeaders(1)
    .setPosition(ROW_KPI_LABEL, 7, 0, 0)
    .setOption('title', 'Trainees by Score Range (% of trainees)')
    .setOption('legend', { position: 'none' })
    .setOption('colors', [GREEN])
    .setOption('vAxis', { format: 'percent', viewWindow: { min: 0, max: 1 } })
    .setOption('width', 620)
    .setOption('height', 320)
    .build());

  dash.insertChart(dash.newChart()
    .setChartType(Charts.ChartType.BAR)
    .addRange(dash.getRange(ROW_Q_HEADER, 1, QUESTIONS.length + 1, 1))
    .addRange(dash.getRange(ROW_Q_HEADER, 4, QUESTIONS.length + 1, 1))
    .setNumHeaders(1)
    .setPosition(ROW_Q_TITLE, 7, 0, 0)
    .setOption('title', '% Correct by Question')
    .setOption('legend', { position: 'none' })
    .setOption('colors', [ORANGE])
    .setOption('hAxis', { format: 'percent', viewWindow: { min: 0, max: 1 } })
    .setOption('width', 620)
    .setOption('height', 520)
    .build());
}

function buildResultsSheet_(ss) {
  const res = ss.insertSheet('Trainee Results', 1);
  res.getRange(1, 1, 1, 7).setValues([[
    'Submitted', 'Full Name', 'Company / Department', 'Correct', 'Score %', 'Score Range', 'Level',
  ]]);
  styleHeader_(res.getRange(1, 1, 1, 7));
  res.setFrozenRows(1);
  [160, 200, 200, 90, 90, 120, 110].forEach((w, i) => res.setColumnWidth(i + 1, w));
  res.getRange('D:G').setHorizontalAlignment('center');
}

function styleHeader_(range) {
  range.setBackground(GREEN).setFontColor('#FFFFFF').setFontWeight('bold')
    .setHorizontalAlignment('center');
}
