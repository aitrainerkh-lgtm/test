"""Step 1: ask Gemini to write the Khmer video script -> script.json"""
import json
import os

from gemini_api import generate_text

MODEL = os.environ.get("SCRIPT_MODEL", "gemini-3.1-pro-preview")
HERE = os.path.dirname(os.path.abspath(__file__))

SCENES = [
    ("intro", "Opening: a modern office in Phnom Penh. The HR team starts the day with an AI Agent as a new digital teammate."),
    ("recruit", "AI Agent screens CVs and shortlists candidates that match the job requirements. HR makes the final choice."),
    ("schedule", "AI Agent arranges interview times on the calendar and sends invitations to candidates."),
    ("onboard", "AI Agent prepares the onboarding checklist and documents for a new employee's first day."),
    ("chat", "AI Agent answers common staff questions about HR policy, leave and benefits, any time of day."),
    ("leave", "AI Agent tracks leave requests and attendance, and sends them to managers for approval."),
    ("report", "AI Agent prepares HR reports and payroll data for HR to review and check."),
    ("training", "AI Agent suggests training plans for staff based on their roles and skills."),
    ("outro", "Closing: AI Agent handles repetitive work so the HR team can focus on people. Humans still decide."),
]

PROMPT = f"""You are a professional Khmer scriptwriter for short corporate motion-graphics videos in Cambodia.

Write the script for a ~60 second motion-graphics video: "AI Agent working with the HR team at the office".
There are exactly {len(SCENES)} scenes, in this order:
{chr(10).join(f'{i + 1}. [{key}] {desc}' for i, (key, desc) in enumerate(SCENES))}

Rules:
- All on-screen text and narration must be in natural, clear, modern Khmer for Cambodian business viewers.
- Keep these terms in English letters inside the Khmer text: AI Agent, HR, CV, Workflow, Email, Chat, Report.
- Narration for each scene: ONE short spoken sentence, about 5-6 seconds when read aloud
  (12-18 Khmer words, no more). The whole narration must fit in under 60 seconds.
- "title": a very short on-screen headline (2-6 words).
- "points": 2 or 3 very short on-screen labels (2-5 words each) that match the animation.
- Do not invent statistics, numbers, company names, people's names or laws.
- Do not mention any specific AI product names.
- Friendly, professional, positive tone. Make clear that people in HR stay in control.

Return ONLY JSON in this exact shape:
{{"video_title": "...", "scenes": [{{"key": "intro", "title": "...", "points": ["...", "..."], "narration": "..."}}]}}
"""


def main():
    raw = generate_text(MODEL, PROMPT, json_output=True)
    script = json.loads(raw)
    keys = [s["key"] for s in script["scenes"]]
    expected = [k for k, _ in SCENES]
    if keys != expected:
        raise SystemExit(f"Unexpected scene keys: {keys}")
    with open(os.path.join(HERE, "script.json"), "w", encoding="utf-8") as f:
        json.dump(script, f, ensure_ascii=False, indent=2)
    print(json.dumps(script, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
