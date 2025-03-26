module.exports = {
    apps: [
      {
        name: 'email-service',
        script: 'npm',
        args: 'run dev',
        cwd: './email-service',
        watch: false,
      },
      {
        name: 'file-service',
        script: 'npm',
        args: 'run dev',
        cwd: './file-service',
        watch: false,
      },
      {
        name: 'login-service',
        script: 'npm',
        args: 'run dev',
        cwd: './login-service',
        watch: false,
      },
      {
        name: 'nodejs-service',
        script: 'npm',
        args: 'run dev',
        cwd: './nodejs-service',
        watch: false,
      },
    ],
  };
  