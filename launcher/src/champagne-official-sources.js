'use strict';
const sources=require('./champagne-official-sources.json');
function officialSource(entry){return sources.find(s=>s.path===entry.path&&s.sha256===entry.sha256.toLowerCase())||null;}
function knownGithubUrl(url){return sources.some(s=>s.url===String(url));}
function officialRedirect(previous,next){
 previous=new URL(previous);next=new URL(next);
 if(next.username||next.password||next.hash||next.protocol!=='https:')return false;
 const cf=['https://edge.forgecdn.net','https://mediafilez.forgecdn.net'];
 if(cf.includes(previous.origin)&&cf.includes(next.origin))return previous.pathname===next.pathname&&!next.search;
 return knownGithubUrl(previous.href)&&next.origin==='https://release-assets.githubusercontent.com'&&/^\/github-production-release-asset\/[0-9]+\/[a-f0-9-]+$/i.test(next.pathname);
}
module.exports={officialSource,knownGithubUrl,officialRedirect};
