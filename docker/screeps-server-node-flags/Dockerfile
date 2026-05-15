FROM ghcr.io/jomik/screeps-server:edge

USER root

COPY node-with-v8-flags /usr/local/bin/node-with-v8-flags

RUN chmod +x /usr/local/bin/node-with-v8-flags \
  && node - <<'EOF'
const fs = require("fs");
const sourcePath = "/screeps/bin/start";
const targetPath = "/usr/local/bin/start-with-v8-flags";
const source = fs.readFileSync(sourcePath, "utf8");
const from = "await screeps.start(options, process.stdout);";
const to = 'await screeps.start(options, process.stdout, "/usr/local/bin/node-with-v8-flags");';

if (!source.includes(from) && !source.includes(to)) {
  throw new Error(`Could not find launcher start call in ${sourcePath}`);
}

fs.writeFileSync(targetPath, source.replace(from, to), { mode: 0o755 });
EOF

USER node

ENTRYPOINT ["/usr/local/bin/node-with-v8-flags", "/usr/local/bin/start-with-v8-flags"]
