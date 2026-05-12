// ecosystem.config.js – PM2 cluster mode
// Usage: pm2 start ecosystem.config.js
// Docs:  https://pm2.keymetrics.io/docs/usage/application-declaration/

module.exports = {
  apps: [
    {
      name: 'scaffold-nest',
      script: 'dist/main.js',
      instances: 'max',       // one process per CPU core
      exec_mode: 'cluster',   // enable cluster mode
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      env: {
        NODE_ENV: 'production',
        PORT: 8080,
        CLUSTERING: false,    // PM2 handles clustering; disable in-process clustering
      },

      // Graceful shutdown – give workers 10 s to finish in-flight requests
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000,

      // Log files
      out_file: 'logs/pm2-out.log',
      error_file: 'logs/pm2-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
