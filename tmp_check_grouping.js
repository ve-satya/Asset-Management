const https = require('http');
const fs = require('fs');
const http = require('http');

http.get('http://localhost:5000/api/product-types/all', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const payload = JSON.parse(data);
    const items = payload.value || payload; // support either shape
    const cat = (v) => (v && String(v).toLowerCase() === 'it' ? 'IT' : 'Non-IT');
    const map = {};
    items.forEach(i => map[i.id] = { ...i, children: [] });
    const skip = new Set();
    items.forEach(i => { if (String(i.displayName).trim().toLowerCase() === 'all assets') skip.add(i.id); });
    const itRoot = { id: -1, displayName: 'IT Assets', children: [] };
    const nonItRoot = { id: -2, displayName: 'Non-IT Assets', children: [] };
    for (const i of items) {
      if (skip.has(i.id)) { console.log('skipping node', i.id, i.displayName); continue; }
      const node = map[i.id];
      const nodeCat = cat(node.assetCategory);
      const parentId = (node.parentId != null && !skip.has(node.parentId)) ? node.parentId : null;
      if (parentId != null && map[parentId] && cat(map[parentId].assetCategory) === nodeCat) {
        map[parentId].children.push(node);
      } else {
        if (nodeCat === 'IT') { itRoot.children.push(node); console.log('attach to IT root', node.id, node.displayName); }
        else { nonItRoot.children.push(node); console.log('attach to Non-IT root', node.id, node.displayName); }
      }
    }
    console.log('IT root count:', itRoot.children.length);
    console.log('Non-IT root count:', nonItRoot.children.length);
    console.log('IT sample:', itRoot.children.slice(0,10).map(x=>({ id: x.id, name: x.displayName })));
    console.log('Non-IT sample:', nonItRoot.children.slice(0,10).map(x=>({ id: x.id, name: x.displayName })));
  });
}).on('error', (e) => console.error(e));
