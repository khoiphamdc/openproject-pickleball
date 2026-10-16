import 'dotenv/config'

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  openprojectUrl: required('OPENPROJECT_URL'),
  openprojectToken: required('OPENPROJECT_SERVICE_TOKEN'),
  openprojectInstanceId: required('OPENPROJECT_INSTANCE_ID'),
  dbPath: process.env.DB_PATH ?? './runtime/app.db',
  nodeEnv: process.env.DB_PATH ?? 'development',
};