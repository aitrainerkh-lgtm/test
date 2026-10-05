# How To Use AI Tools — Knowledge Check (Google Form + Dashboard)

One script builds everything in your Google account:

- **Google Form quiz**: 20 multiple-choice questions on ChatGPT, Claude, Gemini and Copilot. Each question has 4 options and 1 correct answer, is worth 1 point, and is graded automatically.
- **Google Sheet dashboard** (updates after every submission):
  - Trainees, Average Score, Highest, Lowest, Scored above 70%
  - Score distribution: 0–10%, 11–30%, 31–50%, 51–70%, 71–90%, 91–100% (count and % of trainees, with a chart)
  - % correct for each question, with a chart. Questions where fewer than 50% answered correctly are shown in red.
  - Trainee Results tab: name, department, score and level for each trainee

## Setup (about 3 minutes, one time)

1. Go to **https://script.google.com** and click **New project**.
2. Delete the sample code. Paste in all of `Code.gs`.
3. Click **Project Settings** (gear icon), tick **Show "appsscript.json" manifest file**, then paste in `appsscript.json` (this sets the Phnom Penh time zone).
4. Go back to the editor. Select **setupQuiz** in the function list and click **Run**.
5. Allow access when Google asks: **Review permissions → choose your account → Advanced → Go to project → Allow**.
6. Open **Execution log**. It shows:
   - `LINK FOR TRAINEES` — send this link to your trainees
   - `Edit the form` — to review or edit questions
   - `Dashboard` — to see results

The trainee link is also shown at the top of the Dashboard sheet.

## Useful functions

| Function | What it does |
|---|---|
| `setupQuiz` | Builds the form, dashboard and auto-update trigger. Run once. |
| `showLinks` | Shows the links again. |
| `updateDashboard` | Refreshes the dashboard by hand (it also runs after every submission). |

## Recommended settings (in the Form, Settings → Quizzes)

- **Release grades**: "Immediately after each submission" lets trainees see their score and the explanations straight away. To stop answers spreading during a live session, choose "Later, after manual review" and release scores after the session.
- **Limit to 1 response**: this needs trainees to sign in with a Google account. Turn it on only if every trainee has one.
