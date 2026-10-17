'use strict';
const assert = require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const { syncBundledConfigs } = require('../champagne-config-sync.js');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'champagne94-test-'));
const instanceDir=path.join(root,'game'),metadataDir=path.join(root,'metadata');
const bundleDir=path.join(root,'bundle');
const source=path.join(__dirname,'../champagne-defaults');
const log=()=>{};
const run=()=>syncBundledConfigs({instanceDir,metadataDir,bundleDir,status:log});
function hash(buffer){return crypto.createHash('sha256').update(buffer).digest('hex');}
try {
  fs.cpSync(source,bundleDir,{recursive:true});
  fs.mkdirSync(path.join(instanceDir,'saves','world'),{recursive:true});
  fs.writeFileSync(path.join(instanceDir,'options.txt'),'personal settings');
  fs.writeFileSync(path.join(instanceDir,'saves','world','level.dat'),'personal world');
  const expected=JSON.parse(fs.readFileSync(path.join(bundleDir,'manifest.json'),'utf8')).files.length;
  let report=run();
  assert.equal(report.installed,expected);
  assert.equal(report.updated,0);
  assert.equal(report.keptModified,0);
  assert.equal(run().unchanged,expected);
  const manifestPath=path.join(bundleDir,'manifest.json');
  const data=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const edit=data.files[0],upgrade=data.files[1],remove=data.files[2];
  const editFile=path.join(instanceDir,...edit.path.split('/'));
  fs.writeFileSync(editFile,'mi ajuste propio, no tocar');
  data.version='0.1.1';
  // test a new version's changed official default
  const upgradedBytes=Buffer.from('cambio oficial de 0.1.1\n');
  const bundleUpgrade=path.join(bundleDir,'files',...upgrade.path.split('/'));
  fs.writeFileSync(bundleUpgrade,upgradedBytes);
  upgrade.sha256=hash(upgradedBytes);upgrade.bytes=upgradedBytes.length;
  // test removal of an obsolete managed file
  data.files=data.files.filter(e=>e.path!==remove.path);
  fs.writeFileSync(manifestPath,JSON.stringify(data));
  report=run();
  assert.equal(report.updated,1);
  assert.equal(report.removed,1);
  assert.equal(report.keptModified,1);
  assert.equal(fs.readFileSync(editFile,'utf8'),'mi ajuste propio, no tocar');
  assert.equal(fs.readFileSync(path.join(instanceDir,...upgrade.path.split('/')),'utf8'),'cambio oficial de 0.1.1\n');
  assert.equal(fs.existsSync(path.join(instanceDir,...remove.path.split('/'))),false);
  assert.equal(fs.readFileSync(path.join(instanceDir,'options.txt'),'utf8'),'personal settings');
  assert.equal(fs.readFileSync(path.join(instanceDir,'saves','world','level.dat'),'utf8'),'personal world');
  // corrupted manifest hashes block all changes
  const originalState=fs.readFileSync(path.join(metadataDir,'managed-client-config.json'));
  data.files[3].sha256='0'.repeat(64);
  fs.writeFileSync(manifestPath,JSON.stringify(data));
  assert.throws(run,/SHA-256/);
  assert.deepEqual(fs.readFileSync(path.join(metadataDir,'managed-client-config.json')),originalState);
  console.log('OK Config sync: defaults instalados, no-op, modificaciones locales preservadas, 1 actualizado, 1 retirado, options/saves intactos, rechazo de hash');
} finally { fs.rmSync(root,{recursive:true,force:true}); }
