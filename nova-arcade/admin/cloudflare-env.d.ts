declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    NOVA_PLAYER_ORIGIN?: string;
    NOVA_PLAYER_SERVICE_TOKEN?: string;
    NOVA_BRIDGE_SECRET?: string;
    NOVA_ADMIN_EMAILS?: string;
  }
}
