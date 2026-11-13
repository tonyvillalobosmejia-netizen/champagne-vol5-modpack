'use strict';
const crypto=require('node:crypto');
function validatePresentation(value) {
  if(value===undefined || value===null)return null;
  if(typeof value!=='object'||Array.isArray(value))throw Error('Presentación del modpack inválida.');
  const result={};
  if(value.background){
    const b=value.background;
    if(!['image/png','image/jpeg'].includes(b.mime)||typeof b.base64!=='string'||b.base64.length>6*1024*1024||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(b.base64))throw Error('El fondo debe ser PNG o JPG de hasta 4 MB.');
    const bytes=Buffer.from(b.base64,'base64');
    const magic=b.mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
    if(!magic||bytes.length>4*1024*1024||crypto.createHash('sha256').update(bytes).digest('hex')!==b.sha256)throw Error('La imagen de fondo no coincide con su formato o SHA-256.');
    result.background={mime:b.mime,sha256:b.sha256,base64:b.base64};
  }
  if(value.notes){const n=value.notes;
    if(typeof n.title!=='string'||!n.title.trim()||n.title.length>100||typeof n.text!=='string'||n.text.length>4000||typeof n.publishedAt!=='string'||!Number.isFinite(Date.parse(n.publishedAt)))throw Error('Notas de actualización inválidas.');
    result.notes={title:n.title.trim(),text:n.text,publishedAt:n.publishedAt};
  }
  for(const key of ['news','updates']) if(value[key]) { const n=value[key]; if(typeof n.title!=='string'||!n.title.trim()||n.title.length>100||typeof n.text!=='string'||n.text.length>4000) throw Error('Título o descripción inválidos.'); result[key]={title:n.title.trim(),text:n.text}; }
  return result;
}
function viewPresentation(presentation){const p=validatePresentation(presentation);return p?{background:p.background?`data:${p.background.mime};base64,${p.background.base64}`:null,notes:p.notes||null,news:p.news||null,updates:p.updates||null}:null;}
module.exports={validatePresentation,viewPresentation};
