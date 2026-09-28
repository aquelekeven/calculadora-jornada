const { test } = require('node:test');
const assert = require('node:assert/strict');
const OCR = require('../point-ocr.js');
const good = {date:'2026-09-01',kind:'work',entry:'09:31',lunchOut:'12:29',lunchBack:'14:08',realExit:'18:41',noLunch:false};
test('period must come from the screenshot, never current month',()=>{
 assert.equal(OCR.period('Período: Setembro/2026'),'2026-09');
 assert.equal(OCR.period('Março / 2025'),'2025-03');
 assert.equal(OCR.period('01 09:31 - 12:29'),'');
});
test('invalid, future and duplicate dates cannot be imported',()=>{
 assert.equal(OCR.validate(good,'2026-09-28',new Set()),'');
 for(const date of ['2026-02-30','2026-13-01','2026-09-29',''])assert.ok(OCR.validate({...good,date},'2026-09-28',new Set()));
 assert.match(OCR.validate(good,'2026-09-28',new Set([good.date])),/preservado/);
 assert.match(OCR.validate(good,'2026-09-28',new Set(),new Set([good.date])),/repetida/);
});
test('partial, empty, impossible and out-of-order times are rejected',()=>{
 for(const change of [{realExit:''},{entry:'29:31'},{lunchBack:'10:00'},{entry:'00:00',lunchOut:'00:00',lunchBack:'00:00',realExit:'00:00'}])assert.ok(OCR.validate({...good,...change},'2026-09-28',new Set()));
 assert.equal(OCR.validate({...good,noLunch:true,lunchOut:'',lunchBack:''},'2026-09-28',new Set()),'');
});
test('portal pending times and totals require explicit review',()=>{
 assert.match(OCR.warnings({...good,pending:true,portalTotal:'01:01'}),/Pendente.*Total diferente/);
 assert.equal(OCR.warnings({...good,portalTotal:'07:31'}),'');
 assert.match(OCR.warnings({...good,uncertain:true}),/duvidosa/);
 assert.match(OCR.warnings({kind:'absence'}),/Confirme/);
});
test('empty weekends are skipped, holidays do not need fake times',()=>{
 assert.ok(OCR.validate({...good,kind:'skip'},'2026-09-28',new Set()));
 assert.equal(OCR.validate({date:'2026-09-07',kind:'holiday'},'2026-09-28',new Set()),'');
});
test('table parser separates clocks from portal totals and never shifts partial clocks',()=>{
 const w=(text,x,y,width=45)=>({text,confidence:95,bbox:{x0:x,y0:y,x1:x+width,y1:y+12}});
 const data={blocks:[{paragraphs:[{lines:[{words:[
  w('Dia',20,0,20),w('Ent/Saída',90,0,60),w('Ent/Saída',210,0,60),w('Justificativa',350,0,80),w('H.Real',500,0),w('Saldo',580,0),
  w('01',20,30,20),w('09:31 - 12:29',70,30,110),w('14:08 - 18:41',200,30,100),w('HORAS NEGATIVAS',340,30,130),w('07:31',500,30),w('00:29',580,30),
  w('02',20,60,20),w('ilegível',70,60,70),w('19:31',250,60,45),w('HORAS NEGATIVAS',340,60,130),w('07:05',500,60)
 ]}]}]}]};
 const rows=OCR.parse(data,'2026-09');
 assert.equal(rows.length,2);
 assert.deepEqual([rows[0].entry,rows[0].lunchOut,rows[0].lunchBack,rows[0].realExit],['09:31','12:29','14:08','18:41']);
 assert.equal(rows[0].portalTotal,'07:31');
 assert.deepEqual([rows[1].entry,rows[1].lunchOut,rows[1].lunchBack,rows[1].realExit],['','','','']);
 assert.equal(OCR.parse(data,'')[0].date,'');
});
