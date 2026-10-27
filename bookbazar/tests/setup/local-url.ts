// Hard stop if the integration suite is ever pointed at a non-local
// database/Redis. The tests TRUNCATE every table between cases.
export function assertLocalUrl(name: string, value: string | undefined) {
  if (!value) throw new Error(`${name} is not set for the test run`)
  const host = new URL(value).hostname
  const allowed = ["localhost", "127.0.0.1", "postgres-test", "redis-test", "host.docker.internal"]
  if (!allowed.includes(host)) {
    throw new Error(`Refusing to run tests: ${name} points at "${host}", not a local test container.`)
  }
}
