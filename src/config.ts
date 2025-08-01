import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath:
    process.env.NODE_ENV === 'production'
      ? ['.env.production.local', '.env.production', '.env']
      : ['.env.development.local', '.env.development', '.env'],
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().default('file:../database.db'),

    CKB_NETWORK_TYPE: Joi.string()
      .valid('mainnet', 'testnet')
      .default('testnet'),
    CKB_HTTP_RPC_URL: Joi.string().uri().default('https://testnet.ckb.dev/'),
    CKB_WS_RPC_URL: Joi.string().uri().default('wss://testnet.ckb.dev/ws'),
  }),
  validationOptions: {
    abortEarly: true,
  },
});

export default configModule;
