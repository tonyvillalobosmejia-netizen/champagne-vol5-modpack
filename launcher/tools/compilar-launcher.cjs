'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const {NodeModulesCollector}=require('app-builder-lib/out/node-module-collector/nodeModulesCollector');
const npmCli=[path.join(path.dirname(process.execPath),'node_modules/npm/bin/npm-cli.js'),path.join(path.dirname(process.execPath),'../node_modules/npm/bin/npm-cli.js'),path.join(process.env.ProgramFiles||'C:/Program Files','nodejs/node_modules/npm/bin/npm-cli.js')].find(file=>fs.existsSync(file));
if(!npmCli)throw Error('No se encontró npm junto a Node.');
NodeModulesCollector.prototype.streamCollectorCommandToFile=async function(command,args,cwd,out){const result=cp.spawnSync(process.execPath,[npmCli,...args],{cwd,windowsHide:true,encoding:'utf8',maxBuffer:64*1024*1024});if(result.error)throw result.error;if(result.status!==0&&result.status!==1)throw Error('No se pudieron leer las dependencias.');fs.writeFileSync(out,result.stdout);};
const output=process.argv[2];
let config;
if(output){if(!/^dist(?:-[a-z0-9-]+)?$/.test(output))throw Error('Directorio de compilación no válido.');const settings=JSON.parse(fs.readFileSync(path.join(__dirname,'../package.json'),'utf8')).build;settings.directories.output=output;const configDir=path.join(__dirname,'../.champagne-admin/launcher-build');fs.mkdirSync(configDir,{recursive:true});config=path.join(configDir,'builder-'+output+'.json');fs.writeFileSync(config,JSON.stringify(settings,null,2));}
require('electron-builder').build({config,targets:require('electron-builder').Platform.WINDOWS.createTarget('nsis'),publish:'never'}).catch(error=>{console.error(error);process.exitCode=1;});
