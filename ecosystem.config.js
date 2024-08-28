module.exports = {
    apps: [
        {
            name: "main[ service",
            script: "./app.js",
            cwd: "E:\\Stusy\\api",
            interpreter: "node",
            interpreter_args: "--import tsx",
            watch: true,
            ignore_watch: ["node_modules"],
            env: {
                NODE_ENV: "development"
            },
            env_production: {
                NODE_ENV: "production"
            },
            max_memory_restart: '512M'
        },
        {
            name: "notification service",
            script: "./index.js",
            cwd: "E:\\Stusy\\Notification",
            watch: true,
            ignore_watch: ["node_modules"],
            max_memory_restart: '256M'
        },
        {
            name: "web-app development",
            script: "./node_modules/nuxt/bin/nuxt.mjs",
            args: "dev",
            cwd: "E:\\Stusy\\web-client",
            env_development: {
                NODE_ENV: "development"
            },
            max_memory_restart: '1024M'
        },
        {
            name: "web-app production",
            port: '3000', // default: 3000
            script: './.output/server/index.mjs',
            // script: "./node_modules/nuxt/bin/nuxt.mjs",
            // args: "preview",
            cwd: "E:\\Stusy\\web-client",
            time: true,
            env_production: {
                NODE_ENV: "production"
            },
            max_memory_restart: '512M'
        }
    ]
};
