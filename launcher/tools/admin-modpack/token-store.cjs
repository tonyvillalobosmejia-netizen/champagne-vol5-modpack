'use strict';
const {createSessionStore}=require('../../src/champagne-session-store');
function createAdminTokenStore({directory,safeStorage,repository,branch}){
 const store=createSessionStore({directory,safeStorage,filename:'github-token.bin',scope:'admin-github|'+repository+'|'+branch});
 function validate(value){if(typeof value!=='string'||! /^[A-Za-z0-9_]{20,255}$/.test(value))throw Error('Introduce un token de GitHub válido. No lo envíes al chat.');return value;}
 return{
  status(){const saved=store.load();return {saved:!!saved?.token};},
  save(value){store.save({token:validate(value)});return {saved:true};},
  clear(){store.clear();return {saved:false};},
  resolve(value){if(value)return validate(value);const saved=store.load();if(!saved?.token)throw Error('Conecta GitHub con un token antes de publicar.');return validate(saved.token);}
 };
}
module.exports={createAdminTokenStore};
