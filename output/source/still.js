const {chromium}=require('/opt/node-tools/node_modules/playwright');
const fs=require('fs');
(async()=>{
 const TIM=JSON.parse(fs.readFileSync('timing.json','utf8'));
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1080,height:1920}});
 p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>console.log('LOG',m.text()));
 await p.addInitScript(t=>{window.TIM=t},TIM);
 await p.goto('file://'+process.cwd()+'/index.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
 fs.mkdirSync('stills',{recursive:true});
 for(const t of process.argv.slice(2).map(Number)){await p.evaluate(t=>render(t),t);await p.screenshot({path:`stills/t${t}.jpg`,type:'jpeg',quality:80});}
 fs.writeFileSync('sfx.json',JSON.stringify(await p.evaluate(()=>SFX)));
 await b.close();})();
