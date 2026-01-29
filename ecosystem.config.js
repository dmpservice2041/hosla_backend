module.exports = {
    apps: [{
        name: 'hosla-backend',
        script: 'dist/app.js',
        instances: 'max', // Use all available CPUs
        exec_mode: 'cluster', // Enable cluster mode for load balancing
        watch: false, // Don't watch in production
        max_memory_restart: '1G', // Restart if memory usage exceeds 1GB
        env: {
            NODE_ENV: 'production',
            PORT: 5006
        },
        env_development: {
            NODE_ENV: 'development',
            PORT: 5006,
            watch: true
        }
    }]
};
