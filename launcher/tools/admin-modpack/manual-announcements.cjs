'use strict';
const crypto=require('node:crypto'),model=require('../../src/champagne-manual-announcement.cjs');
function register({handle,getPack,auth,store,chooseImage,confirm}){
 const images=new Map();
 function pack(input){const p=getPack();if(!p||input?.packId!==p.id)throw Error('El lanzador cambió. Recarga el anuncio.');return p;}
 handle('admin-announcement-load',async input=>{const p=pack(input),saved=store.read(p.id)||{id:crypto.randomUUID(),packId:p.id,channelId:'',title:'',text:'',downloadUrl:'',mentionEveryone:false,mentionRole:false,image:null};images.set(p.id,saved.image);return{draft:saved,packName:p.name,guildId:p.guildId||'1007732653035880589',roleId:p.roleId,published:p.published===true};});
 handle('admin-announcement-options',async input=>{const p=pack(input);return auth.manualAnnouncement('options',{packId:p.id});});
 handle('admin-announcement-save',async input=>{const p=pack(input);store.write(p.id,{...input,image:images.get(p.id)||null});return{message:'Borrador guardado en esta PC. No se envió a Discord.'};});
 handle('admin-announcement-image',async input=>{const p=pack(input),image=input.remove?null:await chooseImage();if(image===undefined)return{cancelled:true};images.set(p.id,image);return{image};});
 handle('admin-announcement-send',async input=>{
  const p=pack(input);
  const v=model.validate({...input,image:images.get(p.id)||null});
  const options=await auth.manualAnnouncement('options',{packId:p.id});const channel=options.channels.find(c=>c.id===v.channelId);if(!channel)throw Error('Selecciona un canal de este servidor.');
  const accepted=await confirm({title:'Enviar anuncio a Discord',message:'¿Enviar este anuncio de '+p.name+'?',detail:'Servidor: '+options.guildId+'\nCanal: '+v.channelId+'\nMenciones: '+[v.mentionEveryone?'@everyone':'',v.mentionRole?'Rol '+options.roleId:''].filter(Boolean).join(', ')+'\nImagen: '+(v.image?'Sí':'No')+'\n\n'+v.title+'\n\n'+v.text+'\n\n'+v.downloadUrl,buttons:['Cancelar','Confirmar envío']});
  if(accepted.response!==1)return{cancelled:true};pack(input);store.write(p.id,v);
  return auth.manualAnnouncement('send',{...v,confirmed:true});
 });
 handle('admin-announcement-history',async input=>{const p=pack(input);return auth.manualAnnouncement('history',{packId:p.id});});
}
module.exports={register};
