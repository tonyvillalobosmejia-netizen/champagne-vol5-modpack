"use strict";
const crypto = require('node:crypto');
const REPO = 'tonyvillalobosmejia-netizen/champagne-vol5-modpack';
async function verifiedRelease(event, fetcher = fetch) {
 const tag = (event.kind === 'admin' ? 'admin-v' : 'v') + event.version;
 if (!['launcher','admin'].includes(event.kind) || !/^\d+\.\d+\.\d+$/.test(event.version)) throw Error('Versión oficial inválida.');
 const response = await fetcher('https://api.github.com/repos/'+REPO+'/releases/tags/'+tag, {redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json','User-Agent':'VillaWolf-Bot'}});
 if (!response.ok) throw Error('Release oficial no disponible.');
 const release = await response.json();
 if (release.draft !== false || release.prerelease !== false || release.tag_name !== tag || !Number.isFinite(Date.parse(release.published_at)) || Date.parse(release.published_at)>Date.now()) throw Error('Release no oficial o todavía no publicada.');
 const name = 'VillaWolf.'+(event.kind === 'admin'?'Administrador':'Launcher')+'.Setup.'+event.version+'.exe';
 const asset = release.assets?.find(a=>a.name===name);
 const publicUrl = 'https://github.com/'+REPO+'/releases/download/'+tag+'/'+name;
 if (!asset || asset.state !== 'uploaded' || asset.browser_download_url !== publicUrl || !Number.isSafeInteger(asset.size) || asset.size<=0 || asset.size>1024*1024*1024 || !/^sha256:[a-f0-9]{64}$/i.test(asset.digest||'')) throw Error('Instalador oficial incompleto o sin SHA-256 verificable.');
 const downloadSignal=AbortSignal.timeout(75000);
 let url=publicUrl,download;
 for(let i=0;i<4;i++) {
  download=await fetcher(url,{redirect:'manual',signal:downloadSignal});
  if(![301,302,303,307,308].includes(download.status))break;
  const next=new URL(download.headers.get('location'),url);
  await download.body?.cancel();
  if(next.protocol!=='https:' || next.username || next.password || !['release-assets.githubusercontent.com','objects.githubusercontent.com'].includes(next.hostname))throw Error('Redirección del instalador no autorizada.');
  url=next.href;
 }
 if(download.status!==200 || !download.body)throw Error('Descarga pública del instalador no disponible.');
 const hash=crypto.createHash('sha256');let size=0;
 for await(const bytes of download.body){size+=bytes.length;if(size>asset.size){await download.body.cancel().catch(()=>{});throw Error('Tamaño del instalador incorrecto.');}hash.update(bytes);}
 if(size!==asset.size || hash.digest('hex')!==asset.digest.slice(7).toLowerCase())throw Error('Integridad del instalador oficial no confirmada.');
 const notes=String(release.body||'Consulta las novedades en la descarga oficial.').replace(/(?:github_pat_|ghp_|access_token|client_secret)\S*/gi,'[dato omitido]').split('\n').filter(Boolean).slice(0,5).join('\n').slice(0,1500);
 return {...event,notes,publishedAt:release.published_at,downloadUrl:publicUrl};
}
module.exports={verifiedRelease};
