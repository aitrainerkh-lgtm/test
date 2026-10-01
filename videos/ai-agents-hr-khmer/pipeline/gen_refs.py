import os,sys; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from gem import call,save_image
from concurrent.futures import ThreadPoolExecutor
M="gemini-3-pro-image"
REFS={
"ref_humans.png":"Character reference sheet, hand-painted Studio Ghibli-inspired anime style, soft watercolor shading, warm light, plain cream background. Three Cambodian office workers standing side by side, full body, front view: "
 "(1) SOPHEA, HR Manager, Cambodian woman about 35, shoulder-length black hair, warm brown skin, kind confident smile, light blue blouse, navy trousers, staff ID lanyard; "
 "(2) DARA, HR Officer, Cambodian man about 27, short neat black hair, energetic smile, white shirt with rolled sleeves, grey trousers, staff ID lanyard; "
 "(3) a NEW EMPLOYEE, young Cambodian woman about 23, long black hair in a ponytail, pale yellow blouse, shy happy smile. No text, no letters, no labels.",
"ref_bots.png":"Character reference sheet of three friendly AI assistant robots, high-quality glossy 3D render, Pixar-like, soft studio lighting, plain light grey background, full body front view, side by side, similar small size (waist height of an adult): "
 "(1) RECRUIT AGENT: small round robot, glossy white body with bright BLUE accents, round dark screen face with glowing cyan eyes and smile, hovers slightly above the ground; "
 "(2) PAYROLL AGENT: compact robot, glossy white body with emerald GREEN accents, rectangular screen face with friendly glowing eyes, small antenna, rolls on one wheel; "
 "(3) ONBOARD AGENT: cheerful robot, glossy white body with warm ORANGE accents, rounded head with screen face and glowing eyes, short arms, hovers. No text, no letters, no logos, no labels."}
def go(item):
    f,p=item
    d=call(M,{"contents":[{"parts":[{"text":p}]}],"generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":"16:9","imageSize":"2K"}}})
    print(f, d['error']['message'][:200] if 'error' in d else save_image(d,"img/"+f.replace(".png",".jpg")))
list(ThreadPoolExecutor(2).map(go,REFS.items()))
