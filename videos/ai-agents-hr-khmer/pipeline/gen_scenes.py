import sys,json,base64,os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from gem import call,save_image
from concurrent.futures import ThreadPoolExecutor
s=json.load(open("script.json"))
ref=lambda f:{"inlineData":{"mimeType":"image/jpeg","data":base64.b64encode(open("img/"+f,"rb").read()).decode()}}
STYLE=(
 "IMPORTANT LOOK: like a 3D CGI character composited into a hand-painted Ghibli anime film. The robots MUST be photoreal CGI 3D renders: glossy white plastic, specular highlights, reflections, ambient occlusion, soft realistic shadows, glowing LED screen faces - NOT painted, NOT flat, NOT anime. The humans and the office MUST be flat hand-painted 2D Ghibli anime watercolor style. This 3D-vs-2D contrast is the key look. "
 "Create one cinematic 16:9 illustration for an animated short film. MIXED STYLE IS ESSENTIAL: every human is drawn in hand-painted Studio Ghibli-inspired anime style "
 "exactly matching reference image 1 (same faces, hair, clothes); every AI robot is a glossy high-quality 3D render exactly matching reference image 2 (blue = Recruit Agent, green = Payroll Agent, orange = Onboard Agent). "
 "Background: bright, warm, painterly modern office in Phnom Penh with plants and soft morning light, Ghibli-style painted environment. "
 "Fill the whole frame with the scene edge to edge, no empty bands or borders. Laptops and devices have plain lids with no logos. Absolutely no text, no letters, no numbers, no logos, no brand marks anywhere, screens show only simple abstract shapes and icons.\n\nSCENE: ")
def go(i):
    out=f"img/scene{i+1}.jpg"
    if os.path.exists(out): return
    print("gen",out,flush=True)
    d=call("gemini-3-pro-image",{"contents":[{"parts":[ref("ref_humans.jpg"),ref("ref_bots.jpg"),{"text":STYLE+s['scenes'][i]['image_prompt']}]}],
        "generationConfig":{"responseModalities":["IMAGE"],"imageConfig":{"aspectRatio":"16:9","imageSize":"2K"}}})
    print("scene",i+1, d['error']['message'][:200] if 'error' in d else save_image(d,out),flush=True)
list(ThreadPoolExecutor(3).map(go,range(len(s['scenes']))))
