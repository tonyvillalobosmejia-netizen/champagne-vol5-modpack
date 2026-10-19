'use strict';
function createAccess(auth){let user=null;return {user:()=>user,async verify(){user=null;if(!auth.status().user)throw Error('Inicia sesión con Discord: necesitas Administrador u Owner de VillaWolf.');await auth.catalog();user=auth.status().user;return user;},async login(){const r=await auth.loginDiscord();if(!r.ok)throw Error(r.message);return this.verify();},async logout(){user=null;await auth.logout();}};}
module.exports={createAccess};
