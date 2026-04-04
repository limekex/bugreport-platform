module.exports = {
  apps: [
    {
      name: 'bugreport-api',
      cwd: './apps/bugreport-api',
      script: 'node',
      args: 'dist/server.js',
      instances: 1,
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
      autorestart: true,
      watch: false,
    },
  ],
};
