import sys, json, glob, os, soundfile as sf, numpy as np
d=sys.argv[1]; tot=0; out={}
for f in sorted(glob.glob(d+'/s*.wav')):
    if f.endswith('_t.wav'): continue
    a,sr=sf.read(f)
    env=np.abs(a); thr=10**(-45/20)*max(env.max(),1e-9)
    idx=np.where(env>thr)[0]; s=max(idx[0]-int(.02*sr),0); e=min(idx[-1]+int(.06*sr),len(a))
    t=a[s:e]
    # short fades
    n=int(.008*sr); t[:n]*=np.linspace(0,1,n); t[-n:]*=np.linspace(1,0,n)
    sf.write(f[:-4]+'_t.wav', t, sr)
    k=os.path.basename(f)[:-4]; out[k]=round(len(t)/sr,3); tot+=len(t)/sr
    print(k, round(len(a)/sr,2),'->',out[k], 'lead',round(s/sr,2))
json.dump(out,open(d+'/trimmed.json','w'),indent=1); print('total',round(tot,2))
