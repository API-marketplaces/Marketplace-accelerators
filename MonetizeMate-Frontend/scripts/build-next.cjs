const { spawnSync } = require('node:child_process')
const nextBin = require.resolve('next/dist/bin/next')

const env = {
  ...process.env,
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=1536'].filter(Boolean).join(' '),
}

const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack', '--debug'], {
  stdio: 'inherit',
  env,
})

if (result.error) {
  console.error(result.error)
  process.exit(1)
}

process.exit(result.status ?? 1)
