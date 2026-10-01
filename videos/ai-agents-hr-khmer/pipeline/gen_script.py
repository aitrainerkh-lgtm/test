import os,json,sys
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from gem import call,text
PROMPT = """You are a scriptwriter for a short explainer video (about 2 minutes) for Cambodian business audiences, brand "AI For Business".
Topic: AI Agents working together with the HR team in a modern office in Phnom Penh.
Visual style: the human HR team is drawn in hand-painted Studio Ghibli-inspired anime style; the AI Agents are glossy, friendly 3D-rendered robots (Pixar-like). They work side by side.

Characters (use exactly these speaker IDs):
- NARRATOR: describes the activities (calm, warm documentary voice).
- SOPHEA: HR Manager, Cambodian woman, about 35, confident and kind. Khmer name សុភា.
- DARA: HR Officer, Cambodian man, about 27, energetic. Khmer name ដារ៉ា.
- RECRUIT: "Recruit Agent", a small round blue 3D robot that screens CVs and schedules interviews.
- PAYROLL: "Payroll Agent", a green 3D robot that prepares payroll, attendance and leave reports.
- ONBOARD: "Onboard Agent", an orange 3D robot that prepares onboarding for new staff and answers staff HR policy questions.

Story (8 scenes): 1) Morning, the team arrives and greets the AI Agents. 2) Recruit Agent has screened many CVs overnight and presents a shortlist; Sophea reviews. 3) Recruit Agent schedules interviews and sends invitations; Dara confirms. 4) Payroll Agent prepares the monthly payroll and attendance report and flags items for human checking. 5) Sophea checks and approves — humans make final decisions. 6) Onboard Agent prepares the welcome pack and first-week plan for a new employee; Dara welcomes the new staff member. 7) A staff member asks a leave policy question; Onboard Agent answers quickly; complex cases go to HR. 8) Closing: the whole team together; message: AI Agents do the repetitive work, people focus on people and decisions.

Rules:
- All spoken lines in natural, spoken Cambodian Khmer (not overly formal). Keep technical terms and role names in English inside Khmer sentences: AI, AI Agent, HR, CV, Payroll, Workflow, Report, Email, Onboarding, Recruit Agent, Payroll Agent, Onboard Agent.
- Each scene: 1 NARRATOR line plus 2-3 dialogue lines. Each line short (max ~20 Khmer words) so it fits on screen.
- No real company names, no statistics presented as facts, no brand names of software. No robot emoji.
- Each scene also has "caption": a very short Khmer headline (3-7 words) shown at top of screen, and "image_prompt": a detailed ENGLISH description of the scene for an image generator (who is present, what they are doing, setting, camera framing). Do not ask for any text, letters or logos in the image.
- Also provide "title" (Khmer video title, short) and "closing" (one short Khmer slogan for the end card).
"""
schema={"type":"OBJECT","properties":{
 "title":{"type":"STRING"},"closing":{"type":"STRING"},
 "scenes":{"type":"ARRAY","items":{"type":"OBJECT","properties":{
   "caption":{"type":"STRING"},"image_prompt":{"type":"STRING"},
   "lines":{"type":"ARRAY","items":{"type":"OBJECT","properties":{
      "speaker":{"type":"STRING","enum":["NARRATOR","SOPHEA","DARA","RECRUIT","PAYROLL","ONBOARD"]},
      "khmer":{"type":"STRING"}},"required":["speaker","khmer"]}}},
   "required":["caption","image_prompt","lines"]}}},
 "required":["title","closing","scenes"]}
d=call("gemini-3.8-flash",{"contents":[{"parts":[{"text":PROMPT}]}],
  "generationConfig":{"responseMimeType":"application/json","responseSchema":schema,"temperature":0.8}})
if 'error' in d: sys.exit(d['error']['message'])
s=json.loads(text(d)); json.dump(s,open("script.json","w"),ensure_ascii=False,indent=1)
print(s['title']);
for i,sc in enumerate(s['scenes'],1):
    print(f"\n== {i}. {sc['caption']}\n   [{sc['image_prompt'][:140]}...]")
    for l in sc['lines']: print(f"   {l['speaker']}: {l['khmer']}")
print("\nEND:",s['closing'])
