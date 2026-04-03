import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';

const app = createApp();

app.listen(config.port, () => {
  logger.info(`bugreport-api listening on port ${config.port} [${config.nodeEnv}]`);
});
