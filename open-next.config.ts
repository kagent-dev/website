// default open-next.config.ts file created by @opennextjs/cloudflare


const config = {
  default: {
    override: {
      wrapper: "cloudflare-node",
      incrementalCache: "dummy",
      converter: "edge",
      tagCache: "dummy",
      queue: "dummy",
    },
  },

  middleware: {
    external: true,
    override: {
      wrapper: "cloudflare-edge",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
};

export default config;
