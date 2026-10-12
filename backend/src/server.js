const { createApp } = require('./app');
const { init } = require('./db');

const port = Number(process.env.PORT) || 8080;

init()
  .then(() => {
    createApp().listen(port, () => console.log(`API listening on ${port}`));
  })
  .catch((err) => {
    console.error('Failed to start', err);
    process.exit(1);
  });
