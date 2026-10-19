const http = require('node:http');
// Escucha solo mientras el jugador autoriza Discord. Nunca recibe contraseñas.
function receiveDiscordCode({ state, openBrowser, authorizationUrl, callbackUri, timeoutMs = 300000, signal }) {
  const callback = new URL(callbackUri);
  if (callback.href !== 'http://127.0.0.1:32146/discord/callback') throw Error('Retorno de Discord inválido.');
  const url = new URL(authorizationUrl);
  if (url.origin !== 'https://discord.com' || url.pathname !== '/oauth2/authorize' || url.searchParams.get('state') !== state || url.searchParams.get('redirect_uri') !== callback.href) throw Error('Dirección de autorización inválida.');
  return new Promise((resolve,reject)=>{
    let settled=false,timer;
    const server=http.createServer((req,res)=>{
      const target=new URL(req.url,'http://127.0.0.1:32146');
      if(req.method!=='GET'||req.headers.host!=='127.0.0.1:32146'||target.pathname!==callback.pathname||target.searchParams.get('state')!==state){res.writeHead(400,{'Content-Type':'text/plain'});res.end('Solicitud no valida.');return;}
      const denied=target.searchParams.has('error'),code=target.searchParams.get('code');
      res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'",'Referrer-Policy':'no-referrer'});
      res.end(denied?'Cancelaste el inicio de sesion. Puedes volver al launcher.':'Autorizacion recibida. Vuelve al launcher para comprobar tu acceso.');
      res.once('finish',()=>{if(denied||!code||code.length>4096)finish(Error('No se autorizó el inicio de sesión con Discord.'));else finish(null,code);});
    });
    const cancel=()=>finish(Error('Inicio de sesión cancelado.'));
    function finish(error,code){if(settled)return;settled=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);server.close();server.closeAllConnections();if(error)reject(error);else resolve(code);}
    server.on('error',()=>finish(Error('No se pudo abrir el retorno de Discord. Cierra otra solicitud de inicio de sesión y reintenta.')));
    server.requestTimeout=10000;server.headersTimeout=10000;server.maxConnections=8;
    timer=setTimeout(()=>finish(Error('El inicio de sesión venció. Intenta nuevamente.')),timeoutMs);
    if(signal?.aborted){finish(Error('Inicio de sesión cancelado.'));return;}
    signal?.addEventListener('abort',cancel,{once:true});
    server.listen(32146,'127.0.0.1',()=>{Promise.resolve().then(()=>openBrowser(authorizationUrl)).catch(()=>finish(Error('No se pudo abrir el navegador para iniciar sesión.')));});
  });
}
module.exports={receiveDiscordCode};
