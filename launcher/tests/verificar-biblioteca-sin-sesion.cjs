'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('biblioteca sin sesión es estado esperado, borra selección y no produce diagnóstico',async()=>{
 const source=fs.readFileSync(path.join(__dirname,'../src/main.js'),'utf8'),start=source.indexOf('async function refreshCatalogNow(){'),end=source.indexOf('\nfunction selectGame(',start);
 let cancel=0,published=0,calls=0,handler;const reports=[];
 const context={config:{catalogEnabled:true},authClient:{status:()=>({user:null}),catalog:async()=>{calls++;throw Error('No debe consultar');}},libraryHydrator:{cancel:()=>cancel++},authorizedCatalog:[{id:'anterior'}],selectedPack:{id:'anterior'},catalogUserId:'anterior',openingVerifiedUserId:'anterior',publishCatalog:()=>published++};
 vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 require('../src/champagne-problem-monitor').reportingHandler({handle:(_name,fn)=>handler=fn},{capture:error=>reports.push(error)})('pack-catalog',context.refreshCatalogNow);
 const result=await handler();assert.equal(result.ok,true);assert.equal(result.needsAuthentication,true);assert.equal(result.packs.length,0);assert.equal(result.selectedId,null);assert.equal(cancel,1);assert.equal(published,1);assert.equal(calls,0);assert.equal(reports.length,0);assert.equal(context.authorizedCatalog.length,0);assert.equal(context.selectedPack,null);assert.equal(context.openingVerifiedUserId,null);
});
