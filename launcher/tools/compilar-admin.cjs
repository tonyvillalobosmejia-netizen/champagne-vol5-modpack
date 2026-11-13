'use strict';
const path=require('node:path'),fs=require('node:fs'),cp=require('node:child_process');require('./preparar-admin-instalador.cjs');
// Invoke npm's real Node entry point because PowerShell is unavailable on this PC.
const {NodeModulesCollector}=require('app-builder-lib/out/node-module-collector/nodeModulesCollector');
const npmCli=[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.join(path.dirname(process.execPath),'../node_modules/npm/bin/npm-cli.js'),path.join(process.env.ProgramFiles||'C:/Program Files','nodejs/node_modules/npm/bin/npm-cli.js')].find(file=>fs.existsSync(file));
if(!npmCli)throw Error('No se encontró npm junto a Node.');
NodeModulesCollector.prototype.streamCollectorCommandToFile=async function(command,args,cwd,out){const result=cp.spawnSync(process.execPath,[npmCli,...args],{cwd,windowsHide:true,encoding:'utf8',maxBuffer:64*1024*1024});if(result.error)throw result.error;if(result.status!==0&&result.status!==1)throw Error('No se pudieron leer las dependencias de npm.');fs.writeFileSync(out,result.stdout);};
const output=process.argv[2]||process.env.VILLAWOLF_ADMIN_BUILD_OUTPUT||'dist-admin';if(!/^dist-admin(?:-[a-z0-9-]+)?$/.test(output))throw Error('Carpeta de compilación inválida.');
let configFile=path.join(__dirname,'admin-builder.json');
if(output!=='dist-admin'){const config=JSON.parse(fs.readFileSync(configFile,'utf8'));config.directories.output=output;configFile=path.resolve(__dirname,'../.champagne-admin/admin-build/admin-builder-correccion.json');fs.writeFileSync(configFile,JSON.stringify(config,null,2));}
require('electron-builder').build({config:configFile,publish:'never'}).then(()=>{
 const yaml=require('js-yaml'),directory=path.resolve(__dirname,'..',output),file=path.join(directory,'latest.yml'),data=yaml.load(fs.readFileSync(file,'utf8'));
 const base='https://github.com/tonyvillalobosmejia-netizen/champagne-vol5-modpack/releases/download/admin-v'+data.version+'/';
 for(const entry of data.files)entry.url=base+path.basename(entry.url);data.path=base+path.basename(data.path);
 fs.writeFileSync(file,yaml.dump(data));
 console.log('Instalador listo. Para activar el canal, publica la Release admin-v'+data.version+' y el latest.yml en updates/admin/latest.yml después de probarlo.');
}).catch(error=>{console.error(error);process.exitCode=1;});
