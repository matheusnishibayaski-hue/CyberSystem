const fs = require('fs');
const path = require('path');

function parseZap(filePath) {
  const fullPath = path.resolve(process.cwd(), filePath);
  const json = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  const alerts = [];

  const sites = Array.isArray(json.site) ? json.site : [];
  sites.forEach((site) => {
    const siteAlerts = Array.isArray(site.alerts) ? site.alerts : [];
    siteAlerts.forEach((a) => {
      alerts.push({
        title: a.alert,
        risk: a.riskdesc,
        url: a.instances?.[0]?.uri || '',
        description: a.desc,
        solution: a.solution
      });
    });
  });

  return alerts;
}

module.exports = { parseZap };
