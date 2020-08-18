const { exec } = require('child_process');

const fs = require('fs').promises;
const packagePath = './package.json';
const updateVersion = async () => {
  const content = (await fs.readFile(packagePath)).toString();
  const beforeIdx = content.indexOf(`"version": "`) + 12;
  console.log(beforeIdx);
  const afterIdx = content.indexOf(`"`, beforeIdx);
  console.log(afterIdx);
  const version = content.substring(beforeIdx, afterIdx);
  console.log(version);
  const versionArr = version.split('.').map(s => parseInt(s, 10));
  const updatedVersion = versionArr.map((i, idx) => idx === 2 ? i + 1 : i).join('.');
  console.log(content.replace(version, updatedVersion));
  // const newContent = content.replace(version, version.split('.'));
  await fs.writeFile(packagePath, content.replace(version, updatedVersion));
};
updateVersion();
exec('vsce package', (err, stdout, stderr) => {
  if (err) {
    console.log(`err: ${err.message}`);
    return;
  }
  if (stderr) {
    console.log(`stderr: ${stderr}`);
    return;
  }
  console.log(stdout);
  exec('vsce package', (err2, stdout2, stderr2) => {
    if (err2) {
      console.log(`err: ${err2.message}`);
      return;
    }
    if (stderr2) {
      console.log(`stderr: ${stderr2}`);
      return;
    }
    console.log(stdout2);
  });
});

