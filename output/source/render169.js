const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs'),{spawn}=require('child_process');
const FPS=30,W=+process.argv[2],NW=+process.argv[3];
(async()=>{
 const TIM=JSON.parse(fs.readFileSync('timing.json','utf8'));
 const NF=Math.ceil(TIM.total*FPS);const per=Math.ceil(NF/NW);const f0=W*per,f1=Math.min(NF,f0+per);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.addInitScript(t=>{window.TIM=t},TIM);
 await p.goto('file://'+process.cwd()+'/index169.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
 const ff=spawn('ffmpeg',['-y','-v','error','-f','image2pipe','-framerate',''+FPS,'-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','18','-pix_fmt','yuv420p',`seg169/seg${W}.mp4`]);
 for(let f=f0;f<f1;f++){await p.evaluate(t=>render(t),f/FPS);const buf=await p.screenshot({type:'jpeg',quality:93});
   if(!ff.stdin.write(buf)) await new Promise(r=>ff.stdin.once('drain',r));
   if(f%300===0)console.log(W,f,'/',f1);}
 ff.stdin.end();await new Promise(r=>ff.on('close',r));await b.close();console.log('done',W);
})();
