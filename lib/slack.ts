interface SlackNotificationProps {
  message: string
  error?: any
}

export async function sendSlackNotification({ message, error }: SlackNotificationProps) {
  if (!process.env.SLACK_WEBHOOK_URL) {
    console.error('SLACK_WEBHOOK_URL is not set in environment variables')
    return
  }

  try {
    const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `🚨 ${message}`,
        ...(error && {
          attachments: [
            {
              color: 'danger',
              text: `Error details: ${JSON.stringify(error, null, 2)}`,
            },
          ],
        }),
      }),
    })

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`)
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
} 