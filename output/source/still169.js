const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const TIM=JSON.parse(fs.readFileSync('timing.json','utf8'));
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>console.log('LOG',m.text()));
 await p.addInitScript(t=>{window.TIM=t},TIM);
 await p.goto('file://'+process.cwd()+'/index169.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 fs.mkdirSync('stills169',{recursive:true});
 for(const t of process.argv.slice(2).map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:`stills169/t${t}.jpg`,type:'jpeg',quality:80});}
 fs.writeFileSync('sfx169.json',JSON.stringify(await p.evaluate(()=>SFX)));
 await b.close();})();
