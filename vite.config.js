import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function gitCmsPlugin() {
  return {
    name: 'git-cms',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk.toString(); });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body);
              const data = payload.data || payload;
              const shouldPublish = payload.publish === true;
              
              fs.writeFileSync(path.resolve(__dirname, 'data.json'), JSON.stringify(data, null, 2));
              
              if (!shouldPublish) {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, message: 'Salvo localmente' }));
                  return;
              }

              // Run git commands
              exec('git add data.json && git commit -m "Update menu via Admin" && git push', (err, stdout, stderr) => {
                res.setHeader('Content-Type', 'application/json');
                if (err) {
                  // If there's no git repo or nothing to commit, it might throw an error, 
                  // but we still want to say success for the file save if local
                  if (stderr.includes('not a git repository')) {
                    res.statusCode = 200;
                    res.end(JSON.stringify({ success: true, warning: 'Saved locally, but not a git repo.' }));
                  } else if (stdout.includes('nothing to commit')) {
                     res.statusCode = 200;
                     res.end(JSON.stringify({ success: true, message: 'No changes to commit.' }));
                  } else {
                     res.statusCode = 500;
                     res.end(JSON.stringify({ success: false, error: stderr || err.message }));
                  }
                } else {
                  res.end(JSON.stringify({ success: true }));
                }
              });
            } catch (e) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 400;
              res.end(JSON.stringify({ success: false, error: e.message }));
            }
          });
        } else {
          next();
        }
      });
    }
  }
}

export default defineConfig({
  plugins: [gitCmsPlugin()]
});
