const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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'

interface SlackNotificationProps {
  message: string
  error?: any
}

export async function sendSlackNotification({ message, error }: SlackNotificationProps) {
  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `🚨 ${message}${error ? `\nError: ${JSON.stringify(error, null, 2)}` : ''}`,
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }

    return response
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
    throw error
  }
} 