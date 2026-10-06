import { createApp } from './app';
import { env } from './env';

createApp().listen(env.PORT, () => console.log(`Backend chạy ở cổng ${env.PORT}`));
