module.exports = {
  apps: [
    {
      name: "pharma-stock",
      script: "npm",
      args: "run start", // The npm script to run
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};

//for pm2
