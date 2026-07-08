import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import http from 'http';

const OUTDIR = 'dist';
const PORT = 3001;
const isDev = process.argv.includes('--dev');

const SSE_CLIENTS = new Set();

function notifyReload() {
  const data = `data: reload\n\n`;
  for (const res of SSE_CLIENTS) {
    res.write(data);
  }
}

function cssModulesPlugin() {
  return {
    name: 'css-modules',
    setup(build) {
      build.onEnd(() => {
        if (isDev) notifyReload();
      });

      build.onResolve({ filter: /\.module\.css$/ }, (args) => ({
        path: path.join(args.resolveDir, args.path),
        namespace: 'css-module',
      }));

      build.onLoad({ filter: /.*/, namespace: 'css-module' }, (args) => {
        const source = fs.readFileSync(args.path, 'utf8');
        const basename = path
          .basename(args.path, '.module.css')
          .replace(/[^a-zA-Z0-9]/g, '_');

        const classNameMap = {};
        let cssOutput = source;

        cssOutput = cssOutput.replace(
          /\.([a-zA-Z_][\w-]*)(?=\s*[{,.\[>:+~])/g,
          (_, name) => {
            if (!classNameMap[name]) {
              const hash = crypto
                .createHash('md5')
                .update(`${args.path}:${name}`)
                .digest('hex')
                .slice(0, 6);
              classNameMap[name] = `${basename}_${name}_${hash}`;
            }
            return `.${classNameMap[name]}`;
          }
        );

        const exports = Object.entries(classNameMap)
          .map(([orig, hashed]) => `    "${orig}": "${hashed}"`)
          .join(',\n');

        return {
          contents: [
            `var style = document.createElement('style');`,
            `style.setAttribute('data-module', '${basename}');`,
            `style.textContent = ${JSON.stringify(cssOutput)};`,
            `document.head.appendChild(style);`,
            `export default {`,
            exports,
            `};`,
          ].join('\n'),
          loader: 'js',
        };
      });
    },
  };
}

const buildConfig = {
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outdir: OUTDIR,
  platform: 'browser',
  target: ['es2022', 'chrome100', 'firefox100', 'safari16'],
  format: 'iife',
  sourcemap: isDev,
  plugins: [cssModulesPlugin()],
  loader: {
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file',
    '.svg': 'file',
  },
  minify: !isDev,
  define: {
    'process.env.NODE_ENV': JSON.stringify(
      isDev ? 'development' : 'production'
    ),
  },
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const LIVE_RELOAD_SNIPPET =
  '<script>new EventSource("/__reload").onmessage=()=>location.reload()</script>';

function serveFile(req, res) {
  const urlPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const filePath = path.join(OUTDIR, urlPath);

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) return notFound(res);
    const ext = path.extname(filePath);
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': stat.size });

    if (ext === '.html' && isDev) {
      const html = fs.readFileSync(filePath, 'utf8');
      res.end(html.replace('</body>', `${LIVE_RELOAD_SNIPPET}</body>`));
    } else {
      fs.createReadStream(filePath).pipe(res);
    }
  } catch {
    if (isDev) {
      try {
        const html = fs.readFileSync(path.join(OUTDIR, 'index.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html.replace('</body>', `${LIVE_RELOAD_SNIPPET}</body>`));
        return;
      } catch {}
    }
    notFound(res);
  }
}

function notFound(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404 Not Found');
}

fs.mkdirSync(OUTDIR, { recursive: true });
fs.copyFileSync('src/index.html', path.join(OUTDIR, 'index.html'));

if (isDev) {
  const ctx = await esbuild.context(buildConfig);
  await ctx.watch();

  const server = http.createServer((req, res) => {
    if (req.url === '/__reload') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write('data: connected\n\n');
      SSE_CLIENTS.add(res);
      req.on('close', () => SSE_CLIENTS.delete(res));
      return;
    }
    serveFile(req, res);
  });

  server.listen(PORT, () => {
    console.log(`\n  Dev server: http://localhost:${PORT}\n`);
  });
} else {
  await esbuild.build(buildConfig);
  console.log('\n  Production build complete → dist/\n');
}
