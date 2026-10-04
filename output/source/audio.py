import json,wave,numpy as np,subprocess
SR=48000
rng=np.random.default_rng(7)
def env(n,a,d): 
    t=np.arange(n)/SR; return np.minimum(1,t/max(a,1e-4))*np.exp(-t/d)
def lp(x,alpha):  # one-pole lowpass, alpha array or scalar
    y=np.zeros_like(x); a=np.broadcast_to(alpha,x.shape); acc=0.0
    for i in range(len(x)): acc+=a[i]*(x[i]-acc); y[i]=acc
    return y
def sweep_noise(dur,f0,f1,peak=.5):
    n=int(dur*SR); t=np.linspace(0,1,n); x=rng.standard_normal(n)
    fc=f0*(f1/f0)**t; alpha=1-np.exp(-2*np.pi*fc/SR)
    y=lp(x,alpha); y=y-lp(y,np.full(n,1-np.exp(-2*np.pi*150/SR)))
    e=np.sin(np.pi*np.clip(t/peak,0,1)*.5)**2*np.where(t<peak,1,np.exp(-(t-peak)*6))
    return y*e
def norm(x,g=1): return x/ (np.abs(x).max()+1e-9)*g
def tone(f,dur,decay,harm=((1,1),)):
    n=int(dur*SR); t=np.arange(n)/SR; y=sum(a*np.sin(2*np.pi*f*h*t)*np.exp(-t/(decay/h**.5)) for h,a in harm)
    return y*np.minimum(1,t/.004)
S={}
S['whoosh']=norm(sweep_noise(.7,300,4000,.55),.55)
S['swoosh']=norm(sweep_noise(.45,500,6000,.5),.4)
S['swipe']=norm(sweep_noise(.5,800,7000,.7),.3)
S['riser']=norm(sweep_noise(2.2,200,6000,.9),.35)
n=int(.14*SR);t=np.arange(n)/SR;f=700*np.exp(-t*18)+260
S['pop']=norm(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*30),.5)
S['tick']=norm(tone(2400,.08,.012,((1,1),(2.3,.4))),.35)
S['ding']=norm(tone(1318.5,1.4,.35,((1,1),(2,.35),(3,.18),(4.2,.1))),.38)
n=int(.6*SR);t=np.arange(n)/SR
boom=np.sin(2*np.pi*np.cumsum(110*np.exp(-t*5)+40)/SR)*np.exp(-t*5)
S['impact']=norm(boom+.3*lp(rng.standard_normal(n),.05)*np.exp(-t*12),.8)
n=int(.5*SR);t=np.arange(n)/SR
thud=np.sin(2*np.pi*np.cumsum(90*np.exp(-t*8)+45)/SR)*np.exp(-t*9)
metal=sum(np.sin(2*np.pi*fq*t)*np.exp(-t*dk) for fq,dk in ((523,14),(1247,18),(1873,22),(2911,30)))
S['clank']=norm(thud*1.2+.35*metal+.2*rng.standard_normal(n)*np.exp(-t*60),.75)
n=int(1.3*SR);t=np.arange(n)/SR
S['winch']=norm((np.sign(np.sin(2*np.pi*55*t))*.3+np.sin(2*np.pi*110*t))*lp(rng.standard_normal(n),.02)*np.sin(np.pi*t/1.3),.12)
n=int(.35*SR);t=np.arange(n)/SR
S['buzz']=norm(np.sign(np.sin(2*np.pi*140*t))*np.exp(-t*6)*(t<.3),.25)
y=np.zeros(int(2.2*SR))
for k,fq in enumerate((523.25,659.25,783.99,1046.5)):
    tt=tone(fq,2.2-k*.09,.6,((1,1),(2,.3),(3,.12))); o=int(k*.09*SR); y[o:o+len(tt)]+=tt
S['success']=norm(y,.45)

def readwav(fn):
    out=subprocess.run(["ffmpeg","-v","error","-i",fn,"-f","f32le","-ac","2","-ar",str(SR),"-"],capture_output=True,check=True).stdout
    return np.frombuffer(out,dtype=np.float32).reshape(-1,2).copy()
T=json.load(open('timing.json')); total=T['total']; N=int((total+.2)*SR)
vo=np.zeros((N,2),np.float32); fx=np.zeros((N,2),np.float32)
for s in T['scenes']:
    a=readwav(f"vo2/{s['id']}.wav"); o=int(s['vo']*SR); a=a/np.abs(a).max()*0.89
    vo[o:o+len(a)]+=a[:N-o]
for e in json.load(open('sfx.json')):
    x=S[e['type']]*e['v']; o=int(e['t']*SR)
    if o>=N: continue
    seg=x[:N-o]; fx[o:o+len(seg),0]+=seg; fx[o:o+len(seg),1]+=seg
m=readwav('music_raw.mp3'); m=m/np.abs(m).max()
mus=np.zeros((N,2),np.float32); L=min(N,len(m)); mus[:L]=m[:L]
# fade music end
fe=int(min(total,len(m)/SR)*SR); fs=fe-int(3*SR); mus[fs:fe]*=np.linspace(1,0,fe-fs)[:,None]; mus[fe:]=0
# ducking by voice envelope
ve=np.abs(vo[:,0]); k=int(.05*SR); ve=np.convolve(ve,np.ones(k)/k,'same')
duck=np.where(ve>0.02,1.0,0.0); sm=int(.25*SR); duck=np.convolve(duck,np.ones(sm)/sm,'same')
mg=10**(-17/20)*(1-duck*(1-10**(-7/20)))
mix=vo+fx*10**(-5/20)+mus*mg[:,None]
mix=mix/np.abs(mix).max()*0.93
w=wave.open('mix.wav','wb');w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
w.writeframes((np.clip(mix,-1,1)*32767).astype(np.int16).tobytes());w.close()
print("mix ok",N/SR)
