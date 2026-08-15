import { env } from 'cloudflare:workers'

export function testRunScreenshotKey(
  testRunId: string,
  testCaseStepId: string,
) {
  return `test-runs/${testRunId}/${testCaseStepId}.jpg`
}

export function testRunScreenshotApiPath(
  testRunId: string,
  testCaseStepId: string,
) {
  return `/api/screenshots/test-runs/${testRunId}/${testCaseStepId}`
}

function getScreenshotsBucket() {
  if (!('SCREENSHOTS' in env) || !env.SCREENSHOTS) {
    throw new Error(
      'Screenshots R2 bucket is not configured. Add an r2_buckets binding to wrangler.jsonc.',
    )
  }

  return env.SCREENSHOTS
}

export async function putTestRunScreenshot(
  testRunId: string,
  testCaseStepId: string,
  bytes: Uint8Array,
) {
  const bucket = getScreenshotsBucket()
  const key = testRunScreenshotKey(testRunId, testCaseStepId)

  await bucket.put(key, bytes, {
    httpMetadata: {
      contentType: 'image/jpeg',
    },
  })

  return testRunScreenshotApiPath(testRunId, testCaseStepId)
}

export async function getTestRunScreenshotObject(
  testRunId: string,
  testCaseStepId: string,
) {
  const bucket = getScreenshotsBucket()
  const key = testRunScreenshotKey(testRunId, testCaseStepId)

  return bucket.get(key)
}
