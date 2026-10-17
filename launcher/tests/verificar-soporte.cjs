const {test}=require('node:test');const assert=require('node:assert/strict');
const {memoryProfiles,redact,explainError,createRepair}=require('../src/champagne-support');
test('perfiles reservan memoria para Windows y se ajustan a equipos modestos',()=>{
 for(const size of [3,4,8,16]){const h=memoryProfiles(size*1073741824);for(const p of h.profiles){assert.ok(p.ramMB>=1024);assert.ok(p.ramMB<=h.maxMB);}}
 assert.equal(memoryProfiles(4*1073741824).profiles[2].ramMB,2048);
 assert.equal(memoryProfiles(16*1073741824).profiles[2].ramMB,6144);
});
test('explica errores de red e integridad y oculta credenciales del registro',()=>{
 assert.match(explainError('HTTP 503').hint,/conexión/);assert.match(explainError('SHA-256 incorrecto').hint,/Reparar/);
 const clean=redact('Bearer secreto access_token=valor password=clave https://example.com/file?signature=privada');
 for(const value of ['secreto','valor','clave','privada'])assert.ok(!clean.includes(value));
});
test('reparación comparte bloqueos y verifica motor antes de instalar y restaurar contenido',async()=>{
 const events=[];let release;const gate=new Promise(r=>release=r);
 const repair=createRepair({isBusy:()=>false,manifest:async()=>{await gate;return {version:'1'};},java:async()=>events.push('java'),game:async()=>{events.push('game');return {ok:true};},forgeNeeded:()=>true,forge:async()=>events.push('forge'),natives:async()=>({ok:true}),pack:async()=>{events.push('pack');return {ok:true};},content:async()=>events.push('content'),status:()=>{},progress:()=>{}});
 const pending=repair.run();assert.equal(repair.busy,true);assert.equal((await repair.run()).ok,false);release();assert.equal((await pending).ok,true);assert.deepEqual(events,['java','game','forge','pack','content']);assert.equal(repair.busy,false);
});
test('un fallo del motor o mods pendientes no modifica contenido ni deja reparación bloqueada',async()=>{
 let content=0;let gameOk=false;
 const repair=createRepair({isBusy:()=>false,manifest:async()=>({}),java:async()=>{},game:async()=>({ok:gameOk,message:'motor incompleto'}),forgeNeeded:()=>false,forge:async()=>{},natives:async()=>({ok:true}),pack:async()=>({ok:false,needsManual:true}),content:async()=>content++,status:()=>{},progress:()=>{}});
 await assert.rejects(repair.run(),/motor incompleto/);assert.equal(repair.busy,false);gameOk=true;assert.equal((await repair.run()).needsManual,true);assert.equal(content,0);
});

test('Una pausa de Discord no solicita volver a iniciar sesión',()=>{const value=explainError('Discord necesita una pausa. Reintenta en 250 segundos.');assert.match(value.title,/pausa/);assert.match(value.hint,/no necesitas iniciar sesión/);assert.match(explainError('No se pudo conectar al servicio de cuentas.').title,/comprobar tu acceso/);});
