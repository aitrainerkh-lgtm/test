# Team Meeting Planner

A simple app to plan team meetings. Branding: AI For Business.

## What it does

- **Week view and List view.** See the whole week at a glance, or a list of upcoming and past meetings.
- **Add a meeting.** Title, date, start time, length, type (In person, Online, Phone call), place or online link, organizer, attendees and agenda. Click an empty time in the week view to add a meeting at that time.
- **Clash check.** The app warns you when the same person or the same room is booked twice at the same time. The **Clashes** box shows how many upcoming meetings overlap.
- **Find a free time.** Enter the attendees and the length. The app suggests the next free times for everyone inside working hours.
- **Send the invitation.**
  - **Copy invitation** copies ready text for Telegram or email.
  - **Add to Google Calendar** opens the meeting in Google Calendar, with the correct Cambodia time.
  - **Download calendar file (.ics)** (only in the file version) adds the meeting to Outlook or a phone calendar.
- **Status.** Mark a meeting as Done or Cancelled, or delete it.
- **Search** by title, person, place or agenda.
- **Export CSV** saves the full meeting list for Excel.
- **Working hours** (gear button): choose the start and end of the day, working days (for example Monday to Saturday) and the default meeting length.

All times are Cambodia time (ICT, UTC+7).

## Two ways to use it

| Version | Where the meetings are saved | Best for |
|---|---|---|
| Online (Claude page) | Shared database. Everyone you share the page with sees the same meetings, live. | A team |
| File: `meeting-planner/index.html` | Only in the browser on that computer or phone | One person |

To use the file version, open `index.html` in Google Chrome. Meetings stay in that browser. If you clear the browser data, the meetings are deleted. Use **Export CSV** as a backup.

## Before you start

When the planner is empty, it shows 4 example meetings with dashed borders. They are not saved. They disappear when you add your first real meeting.
