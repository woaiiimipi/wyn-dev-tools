const fetch = require('node-fetch');
export const getTestSitesInfo = async () => {
  const res = await fetch("http://dashboard-test-cn-1.grapecitydev.com:8080/status");
  const json = await res.json();
  return json;
};
