# Screeps Clockwork

## Dev Setup

Dependencies to build and run the project:

```bash
# Install Rust + Cargo via rustup
curl https://sh.rustup.rs -sSf | sh

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Add rust-src component
rustup component add rust-src --toolchain nightly-x86_64-unknown-linux-gnu

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash

# Install node
nvm install --lts
nvm use --lts
nvm alias default --lts # optional
```

To build the project:

```bash
npm run build
```

To set up the local Screeps server, you'll need to have docker installed:

```bash
cp .env.sample .env # fill this out with the path to your Screeps .nw package and Steam key
./reset-docker.sh
```

Once running, you can log in and spawn into the server with the [local screeps-steamless-client](http://localhost:8080/).

- **Username:** clockwork
- **Password:** passw0rd

To deploy the test codebase, once the server is running:

```bash
npm run watch
```
