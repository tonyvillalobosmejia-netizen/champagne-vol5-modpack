'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.VillaWolfPlay=factory();})(typeof globalThis==='object'?globalThis:this,()=>({
  view(game={},options={}){
    const disabled=!!(game.running||game.preparing||options.accountBusy||options.operationBusy||options.updating||options.noPack);
    const label=game.running?'MINECRAFT EN EJECUCIÓN':game.preparing||options.operationBusy?'PREPARANDO…':options.updating?'ACTUALIZANDO…':options.noPack?'ELIGE UN MODPACK':'JUGAR';
    return {disabled,label};
  }
}));
