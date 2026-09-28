/* Local-only point import. OCR dependencies are pinned and loaded on demand. */
(function (root) {
  'use strict';
  const RELEASE_TO_ALL = false; // Change only after the private beta is approved.
  const BETA_USER = 'b1fce5d4-9817-4795-ac91-ee731c8f149b';
  const MONTHS = ['janeiro','fevereiro','marco','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  const normal = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words = data => (data.blocks || []).flatMap(b => (b.paragraphs || []).flatMap(p => (p.lines || []).flatMap(l => l.words || [])));
  function period(text) {
    const match = normal(text).match(/(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*[/\-]\s*(20\d{2})/);
    return match ? `${match[2]}-${String(MONTHS.indexOf(match[1])+1).padStart(2,'0')}` : '';
  }
  function headers(data) {
    const list = words(data);
    const dia = list.find(w => normal(w.text) === 'dia');
    const just = list.find(w => normal(w.text).startsWith('justificativa'));
    if (!dia || !just || Math.abs(dia.bbox.y0 - just.bbox.y0) > 25) return null;
    const h = dia.bbox.y1 - dia.bbox.y0;
    const row = list.filter(w => Math.abs(w.bbox.y0-dia.bbox.y0)<h);
    const entries = row.filter(w => /ent.*saida/.test(normal(w.text))).sort((a,b)=>a.bbox.x0-b.bbox.x0);
    const real = row.find(w => /^h[.,]?rea/.test(normal(w.text)));
    const saldo = row.find(w => normal(w.text).startsWith('saldo'));
    if (entries.length < 2 || !real || !saldo) return null;
    return {dia, just, entries, real, saldo, h};
  }
  function parse(data, month) {
    const hd = headers(data);
    if (!hd) throw new Error('Não localizei as colunas. Use um print nítido com o cabeçalho Dia, Ent/Saída, Justificativa e H.Real.');
    const center = w => (w.bbox.x0+w.bbox.x1)/2;
    const dateEnd = (center(hd.dia)+center(hd.entries[0]))/2;
    const timeEnd = (center(hd.entries[1])+center(hd.just))/2;
    const timeMiddle = (center(hd.entries[0])+center(hd.entries[1]))/2;
    const realStart = hd.real.bbox.x0-hd.h;
    const saldoStart = hd.saldo.bbox.x0-hd.h;
    const list = words(data).filter(w=>w.bbox.y0>hd.dia.bbox.y1);
    const lines = [];
    for (const w of list.sort((a,b)=>a.bbox.y0-b.bbox.y0)) {
      const cy=(w.bbox.y0+w.bbox.y1)/2;
      let line=lines.find(l=>Math.abs(l.cy-cy)<hd.h*.7);
      if (!line) { line={cy,words:[]}; lines.push(line); }
      line.words.push(w);
    }
    return lines.flatMap(line=>{
      const ws=line.words.sort((a,b)=>a.bbox.x0-b.bbox.x0);
      const join=items=>items.map(w=>w.text).join(' ');
      const dayWords=ws.filter(w=>center(w)<dateEnd);
      const dayText=join(dayWords).trim();
      const timeWords=ws.filter(w=>center(w)>=dateEnd&&center(w)<timeEnd);
      const timeText=join(timeWords);
      const label=join(ws.filter(w=>center(w)>=timeEnd&&center(w)<realStart));
      if (/total/i.test(join(ws)) || (!dayText && !/\d\s*:\s*\d/.test(timeText))) return [];
      if (!dayText && !timeWords.length) return [];
      const dayClean=dayText.replace(/[oOdD]/g,'0').trim();
      const day=/^\d{1,2}$/.test(dayClean)&&+dayClean>=1&&+dayClean<=31 ? String(+dayClean).padStart(2,'0') : '';
      const extract=text=>[...text.matchAll(/(?<!\d)([0-2]\d)\s*:\s*([0-5]\d)(?!\d)/g)].map(m=>`${m[1]}:${m[2]}`);
      const firstPair=extract(join(timeWords.filter(w=>center(w)<timeMiddle)));
      const secondPair=extract(join(timeWords.filter(w=>center(w)>=timeMiddle)));
      const times=[...firstPair,...secondPair];
      const totalText=join(ws.filter(w=>center(w)>=realStart&&center(w)<saldoStart));
      const total=totalText.match(/\b([0-2]\d):([0-5]\d)\b/)?.[0] || '';
      const clean=normal(label);
      const pending=/\(\s*p\s*\)|pendente|incompleto/i.test(`${timeText} ${label}`);
      const weekend=/sabado|domingo/.test(clean);
      const empty=times.every(t=>t==='00:00');
      const kind=weekend&&empty?'skip':/feriado/.test(clean)&&empty?'holiday':/ausencia/.test(clean)&&empty?'absence':'work';
      return [{date:month&&day?`${month}-${day}`:'',day,dayText,kind,label,pending,
        entry:firstPair.length===2?firstPair[0]:'',lunchOut:firstPair.length===2?firstPair[1]:'',lunchBack:secondPair.length===2?secondPair[0]:'',realExit:secondPair.length===2?secondPair[1]:'',
        noLunch:false, portalTotal:total, source:join(ws),
        uncertain:dayText!==day || [...dayWords,...timeWords].some(w=>w.confidence<75),
        bbox:{left:Math.max(0,Math.floor((dayWords[0]?.bbox.x0||hd.dia.bbox.x0)-hd.h*.2)),top:Math.max(0,Math.floor(line.cy-hd.h*.5)),width:Math.ceil((dayWords.at(-1)?.bbox.x1||hd.dia.bbox.x1)-(dayWords[0]?.bbox.x0||hd.dia.bbox.x0)+hd.h*.4),height:Math.ceil(hd.h)},
        selected:false,reviewed:false}];
    }).slice(0,31);
  }
  function validate(row, today, existing, seen=new Set()) {
    if (row.kind==='skip') return 'Fim de semana sem marcações: não será importado.';
    const d=/^(20\d{2})-(\d{2})-(\d{2})$/.exec(row.date);
    if (!d) return 'Confira a data.';
    const date=new Date(+d[1],+d[2]-1,+d[3]);
    if (date.getFullYear()!==+d[1]||date.getMonth()!==+d[2]-1||date.getDate()!==+d[3]||row.date>today) return 'Data inválida ou futura.';
    if (existing.has(row.date)) return 'Já existe no histórico: será preservado.';
    if (seen.has(row.date)) return 'Data repetida nesta importação.';
    if (row.kind!=='work') return '';
    const values=row.noLunch?[row.entry,row.realExit]:[row.entry,row.lunchOut,row.lunchBack,row.realExit];
    if (values.some(v=>!/^([01]\d|2[0-3]):[0-5]\d$/.test(v))) return 'Complete e confira os horários.';
    const minutes=values.map(v=>+v.slice(0,2)*60 + +v.slice(3));
    if (minutes.some((v,i)=>i>0&&v<minutes[i-1])||minutes.at(-1)===minutes[0]) return 'Confira a sequência dos horários.';
    return '';
  }
  function warnings(row) {
    const result=[];
    if (row.pending) result.push('Pendente no portal; o cálculo pode divergir.');
    if (row.uncertain) result.push('Leitura duvidosa: confira no print.');
    if (row.kind==='absence') result.push('Confirme a ausência antes de salvar.');
    if (row.kind==='work'&&row.portalTotal) {
      const minutes=v=>/^\d{2}:\d{2}$/.test(v)?+v.slice(0,2)*60 + +v.slice(3):NaN;
      const total=minutes(row.realExit)-minutes(row.entry)-(row.noLunch?0:minutes(row.lunchBack)-minutes(row.lunchOut));
      if (Number.isFinite(total)&&total!==minutes(row.portalTotal)) result.push(`Total diferente do portal (${row.portalTotal}).`);
    }
    return result.join(' ');
  }
  function mount(bridge) {
    const $=id=>document.getElementById(id);
    const dialog=$('pointOcrDialog'), card=$('pointOcrCard'), list=$('pointOcrRows'), status=$('pointOcrStatus');
    let rows=[], owner=null, epoch=0, worker=null, busy=false, previewUrl=null, scriptPromise=null;
    const say=(text,error=false)=>{status.textContent=text;status.className=`status${error?' error':''}`;};
    const eligible=id=>Boolean(id)&&(RELEASE_TO_ALL||id===BETA_USER);
    const allowed=()=>eligible(bridge.userId());
    async function authorize() {
      const id=bridge.userId();
      if (!eligible(id)) throw new Error('Esta função está em teste restrito.');
      const user=await bridge.verifyUser();
      if (user?.id!==id || bridge.userId()!==id) throw new Error('Sua sessão mudou. Entre novamente.');
      return id;
    }
    function reset() {
      epoch++; owner=null;rows=[];list.replaceChildren();
      if (worker) {worker.terminate();worker=null;}
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl=null;$('pointOcrPreview').removeAttribute('src');$('pointOcrPreview').hidden=true;
      $('pointOcrFile').value='';$('pointOcrMonth').value='';$('pointOcrReview').hidden=true;
      busy=false; controls();
      if(dialog.open)dialog.close();
    }
    async function refresh() {
      reset();card.classList.add('hidden');
      if (!allowed())return;
      const token=epoch;
      try { const id=await authorize();if(token===epoch){card.classList.remove('hidden');}} catch { /* fail closed */ }
    }
    function controls() {
      $('pointOcrFile').disabled=busy;$('pointOcrMonth').disabled=busy;
      $('pointOcrSelect').disabled=busy||!rows.length;
      $('pointOcrSave').disabled=busy||!rows.some(r=>r.selected);
      list.querySelectorAll('input,select').forEach(el=>el.disabled=busy);
      const existing=new Set(bridge.history().map(r=>r.date));
      list.querySelectorAll('.point-ocr-row').forEach((el,i)=>{el.querySelector('input[type=checkbox]').disabled=busy||Boolean(validate(rows[i],bridge.today(),existing));});
    }
    function render() {
      list.replaceChildren();
      const existing=new Set(bridge.history().map(r=>r.date));
      rows.forEach((row,index)=>{
        const section=document.createElement('article');section.className='point-ocr-row';
        const head=document.createElement('div');head.className='point-ocr-row-head';
        const checkLabel=document.createElement('label');checkLabel.className='point-ocr-check';
        const check=document.createElement('input');check.type='checkbox';check.checked=row.selected;
        check.setAttribute('aria-label',`Importar linha ${index+1}`);
        check.addEventListener('change',()=>{row.selected=check.checked;controls();});
        checkLabel.append(check,document.createTextNode(`Importar dia ${row.day || '?'}`));head.append(checkLabel);
        section.append(head);
        const fields=document.createElement('div');fields.className='point-ocr-fields';
        function input(field,label,type) {
          const wrap=document.createElement('label');wrap.textContent=label;
          const el=document.createElement('input');el.type=type;el.value=row[field];el.setAttribute('aria-label',`${label} linha ${index+1}`);
          if(type==='date')el.max=bridge.today();
          el.addEventListener('change',()=>{row[field]=el.value;if(field==='date')row.day=el.value.slice(8,10);row.reviewed=false;update();});
          wrap.append(el);fields.append(wrap);
        }
        input('date','Data','date');
        const typeLabel=document.createElement('label');typeLabel.textContent='Tipo';
        const select=document.createElement('select');
        [['work','Trabalhado'],['holiday','Feriado'],['absence','Ausência'],['skip','Ignorar']].forEach(([v,label])=>{const o=document.createElement('option');o.value=v;o.textContent=label;select.append(o);});
        select.value=row.kind;select.addEventListener('change',()=>{row.kind=select.value;row.selected=false;row.reviewed=false;render();});typeLabel.append(select);fields.append(typeLabel);
        if(row.kind==='work'){
          input('entry','Entrada','time');input('lunchOut','Saída almoço','time');input('lunchBack','Retorno','time');input('realExit','Saída','time');
        }
        section.append(fields);
        if(row.kind==='work'){
          const label=document.createElement('label');label.className='point-ocr-check';
          const noLunch=document.createElement('input');noLunch.type='checkbox';noLunch.checked=row.noLunch;
          noLunch.addEventListener('change',()=>{row.noLunch=noLunch.checked;row.reviewed=false;update();});
          label.append(noLunch,document.createTextNode('Sem intervalo (somente entrada e saída)'));section.append(label);
        }
        const source=document.createElement('p');source.className='hint';source.textContent=`Lido: ${row.source}`;section.append(source);
        const notice=document.createElement('p');notice.className='status';section.append(notice);
        const reviewLabel=document.createElement('label');reviewLabel.className='point-ocr-check';
        const review=document.createElement('input');review.type='checkbox';review.checked=row.reviewed;
        review.addEventListener('change',()=>{row.reviewed=review.checked;});
        reviewLabel.append(review,document.createTextNode('Conferi a data, os horários e os avisos desta linha.'));section.append(reviewLabel);
        function update(){
          const problem=validate(row,bridge.today(),existing);
          const warning=warnings(row);
          notice.textContent=problem||warning||'Pronto para revisão.';
          notice.className=`status${problem?' error':''}`;
          check.disabled=Boolean(problem)||busy;
          if(problem){row.selected=false;check.checked=false;}
          reviewLabel.hidden=!warning||Boolean(problem);review.checked=row.reviewed;
          controls();check.disabled=Boolean(problem)||busy;
        }
        list.append(section); update();
      });
      // controls() updates common states; keep invalid rows unselectable.
      list.querySelectorAll('.point-ocr-row').forEach((el,i)=>{el.querySelector('input[type=checkbox]').disabled=busy||Boolean(validate(rows[i],bridge.today(),existing));});
      $('pointOcrReview').hidden=!rows.length;
    }
    function loadLibrary() {
      if(root.Tesseract)return Promise.resolve();
      if(scriptPromise)return scriptPromise;
      scriptPromise=new Promise((resolve,reject)=>{
        const script=document.createElement('script');script.src='https://unpkg.com/tesseract.js@7.0.0/dist/tesseract.min.js';script.crossOrigin='anonymous';
        script.onload=resolve;script.onerror=()=>{script.remove();scriptPromise=null;reject(new Error('Não foi possível carregar o leitor. Confira a conexão e tente novamente.'));};document.head.append(script);
      });return scriptPromise;
    }
    function canvasFor(image,rect,enhance=false) {
      const region=rect||{left:0,top:0,width:image.width,height:image.height};
      const small=document.createElement('canvas');small.width=Math.ceil(region.width);small.height=Math.ceil(region.height);
      const ctx=small.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#fff';ctx.fillRect(0,0,small.width,small.height);ctx.drawImage(image,region.left,region.top,region.width,region.height,0,0,small.width,small.height);
      if(enhance){
        const pixels=ctx.getImageData(0,0,small.width,small.height),p=pixels.data;
        // Undo solid blue text-selection rectangles without changing blue glyphs.
        const visited=new Uint8Array(small.width*small.height);
        const blue=k=>p[k*4]<100&&p[k*4+2]>130&&p[k*4+2]-p[k*4]>60;
        for(let start=0;start<visited.length;start++){
          if(visited[start]||!blue(start))continue;
          const stack=[start];visited[start]=1;let x0=small.width,x1=0,y0=small.height,y1=0,count=0;
          while(stack.length){const k=stack.pop(),x=k%small.width,y=Math.floor(k/small.width);count++;x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
            const near=[];if(x>0)near.push(k-1);if(x+1<small.width)near.push(k+1);if(y>0)near.push(k-small.width);if(y+1<small.height)near.push(k+small.width);
            for(const n of near)if(!visited[n]&&blue(n)){visited[n]=1;stack.push(n);}
          }
          if(count>100&&x1-x0>30&&y1-y0>6){for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=(y*small.width+x)*4,v=255-p[i];p[i]=p[i+1]=p[i+2]=v;}}
        }
        for(let i=0;i<p.length;i+=4){const v=Math.min(p[i],p[i+1],p[i+2]);const gray=v<210?Math.round(v*.65):255;p[i]=p[i+1]=p[i+2]=gray;}
        ctx.putImageData(pixels,0,0);
      }
      const scale=Math.min(enhance?3:2,4096/small.width,4096/small.height);
      const canvas=document.createElement('canvas');canvas.width=Math.round(small.width*scale);canvas.height=Math.round(small.height*scale);
      const out=canvas.getContext('2d');out.imageSmoothingQuality='high';out.drawImage(small,0,0,canvas.width,canvas.height);
      return {canvas,scale};
    }
    async function read(file) {
      if(busy)return;
      const token=++epoch;busy=true;rows=[];list.replaceChildren();$('pointOcrReview').hidden=true;controls();
      let localWorker=null,image=null,timer=null;
      try{
        owner=await authorize();if(token!==epoch)return;
        if(!file||!['image/png','image/jpeg','image/webp'].includes(file.type)||!file.size||file.size>12*1024*1024)throw new Error('Use uma imagem PNG, JPEG ou WebP de até 12 MB.');
        say('Preparando o print…');
        image=await createImageBitmap(file);if(token!==epoch)return;
        if(image.width*image.height>20000000||image.width<200||image.height<150)throw new Error('Use um print legível de até 20 megapixels.');
        if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);$('pointOcrPreview').src=previewUrl;$('pointOcrPreview').hidden=false;
        await loadLibrary();if(token!==epoch)return;
        say('Carregando o leitor local. A primeira leitura pode demorar um pouco…');
        const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('A leitura demorou demais. Recorte o print mantendo o período e o cabeçalho e tente novamente.')),120000);});
        const operation=(async()=>{
          localWorker=await root.Tesseract.createWorker('por',1,{
            workerPath:'https://unpkg.com/tesseract.js@7.0.0/dist/worker.min.js',
            corePath:'https://unpkg.com/tesseract.js-core@7.0.0',
            langPath:'https://unpkg.com/@tesseract.js-data/por@1.0.0/4.0.0',
            logger:m=>{if(token===epoch&&m.status==='recognizing text')say(`Lendo o print… ${Math.round(m.progress*100)}%`);}
          });
          if(token!==epoch){await localWorker.terminate();return;}
          worker=localWorker;
          const first=canvasFor(image);
          await localWorker.setParameters({tessedit_pageseg_mode:'11'});
          const initial=(await localWorker.recognize(first.canvas,{}, {text:true,blocks:true})).data;
          if(token!==epoch)return;
          const month=period(initial.text);$('pointOcrMonth').value=month;
          const hd=headers(initial);if(!hd)throw new Error('Não reconheci o cabeçalho da tabela. Envie um print com Dia, Ent/Saída, Justificativa e H.Real visíveis.');
          const left=Math.max(0,(hd.dia.bbox.x0-hd.h*3)/first.scale),top=Math.max(0,(hd.dia.bbox.y0-hd.h)/first.scale);
          const right=Math.min(image.width,(hd.saldo.bbox.x1+hd.h*5)/first.scale);
          const totals=words(initial).find(w=>normal(w.text)==='total'&&w.bbox.y0>hd.dia.bbox.y1);
          const bottom=totals?totals.bbox.y0/first.scale:image.height;
          const table=canvasFor(image,{left,top,width:right-left,height:bottom-top},true);
          await localWorker.setParameters({tessedit_pageseg_mode:'6'});
          const data=(await localWorker.recognize(table.canvas,{}, {text:true,blocks:true})).data;
          if(token!==epoch)return;
          const parsed=parse(data,month);
          if(!parsed.length)throw new Error('Nenhuma linha foi reconhecida. Tente um print mais nítido.');
          // Re-read ambiguous date cells separately; never infer dates by row order.
          await localWorker.setParameters({tessedit_pageseg_mode:'8',tessedit_char_whitelist:'0123456789'});
          for(const row of parsed.filter(r=>!r.day||r.dayText!==r.day)){
            if(token!==epoch)return;
            const cell=(await localWorker.recognize(table.canvas,{rectangle:row.bbox},{text:true})).data;
            const day=cell.text.trim();
            if(/^\d{1,2}$/.test(day)&&+day>0&&+day<=31){row.day=String(+day).padStart(2,'0');row.date=month?`${month}-${row.day}`:'';}
            row.uncertain=true;
          }
          if(token!==epoch||bridge.userId()!==owner)return;
          rows=parsed;render();
          say(`${rows.length} linhas reconhecidas. ${month?'Confira as datas e os horários.':'Informe o mês/ano do print.'} Apenas linhas selecionadas serão salvas.`);
        })();
        await Promise.race([operation,timeout]);
      }catch(error){if(token===epoch){say(error.message||'Não foi possível ler a imagem. Tente outro print.',true);epoch++;busy=false;render();controls();}}
      finally{clearTimeout(timer);if(localWorker)await localWorker.terminate().catch(()=>{});image?.close();if(token===epoch){worker=null;busy=false;render();controls();}}
    }
    $('pointOcrOpen').addEventListener('click',async()=>{
      try{await authorize();if(!allowed())return;owner=bridge.userId();say('Envie um print completo, incluindo o período e o cabeçalho. Você também pode colar uma imagem aqui (Ctrl+V).');dialog.showModal();$('pointOcrFile').focus();}catch(e){bridge.notify(e.message);}
    });
    $('pointOcrClose').addEventListener('click',reset);dialog.addEventListener('cancel',event=>{event.preventDefault();reset();});
    $('pointOcrFile').addEventListener('change',event=>read(event.target.files[0]));
    dialog.addEventListener('paste',event=>{const item=[...(event.clipboardData?.items||[])].find(i=>i.type.startsWith('image/'));if(item){event.preventDefault();read(item.getAsFile());}});
    $('pointOcrMonth').addEventListener('change',event=>{const month=event.target.value;rows.forEach(r=>{r.date=r.day&&month?`${month}-${r.day}`:'';r.selected=false;r.reviewed=false;});render();});
    $('pointOcrSelect').addEventListener('click',()=>{const existing=new Set(bridge.history().map(r=>r.date));const seen=new Set();rows.forEach(r=>{r.selected=!validate(r,bridge.today(),existing,seen)&&!warnings(r);if(r.selected)seen.add(r.date);});render();});
    $('pointOcrSave').addEventListener('click',async()=>{
      if(busy)return;busy=true;controls();const token=epoch;
      try{
        const id=await authorize();if(token!==epoch||owner!==id)return;
        const selected=rows.filter(r=>r.selected);if(!selected.length)throw new Error('Selecione ao menos uma linha.');
        const seen=new Set(),existing=new Set(bridge.history().map(r=>r.date));
        for(const row of selected){const problem=validate(row,bridge.today(),existing,seen);if(problem)throw new Error(`${row.date||'Data não lida'}: ${problem}`);if(warnings(row)&&!row.reviewed)throw new Error(`Confira e confirme o aviso de ${row.date}.`);seen.add(row.date);}
        await bridge.save(selected,id);
        if(token!==epoch)return;
        say(`${selected.length} dia(s) importado(s). ${bridge.pending()?'A sincronização está pendente; mantenha a conexão.':'Registros sincronizados.'}`);
        rows.forEach(r=>r.selected=false);render();
      }catch(e){if(token===epoch)say(e.message||'Não foi possível salvar.',true);}
      finally{if(token===epoch){busy=false;render();controls();}}
    });
    return {refresh,reset};
  }
  root.PointOCR={mount,parse,period,headers,validate,warnings,BETA_USER};
  if(typeof module!=='undefined')module.exports=root.PointOCR;
})(typeof window!=='undefined'?window:globalThis);
