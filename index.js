const core = require('@actions/core')
const github = require('@actions/github')
const fetch = require('node-fetch')

async function getContext () {
  const context = github.context
  const payload = context.payload

  const content = {
    body: payload.release.body.length < 1500
      ? payload.release.body
      : payload.release.body.substring(0, 1500) + ` ([...](${payload.release.html_url}))`,
    version: payload.release.tag_name,
    html_url: payload.release.html_url
  }

  return content
}

function fixGithubHeadings(content) {
  return content.replace(/#/g, '')
}

async function run () {
  try {
    const webhookId = core.getInput('webhook_id')
    const webhookToken = core.getInput('webhook_token')

    if (!webhookId || !webhookToken) {
      return core.setFailed('webhook ID or TOKEN are not configured correctly. Verify config file.')
    }

    const content = await getContext()

    const embedTitle = process.env.INPUT_PROJECT_NAME == "undefined" ? `Release ${content.version}` : `${process.env.INPUT_PROJECT_NAME} Release ${content.version}`

    const embedMsg = {
      color: process.env.INPUT_EMBED_COLOUR,
      title: embedTitle,
      description: fixGithubHeadings(content.body),
      url: content.html_url
    }

    const body = { embeds: [embedMsg] }

    const url = `https://discord.com/api/webhooks/${core.getInput('webhook_id')}/${core.getInput('webhook_token')}?wait=true`

    fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => core.info(JSON.stringify(data)))
      .catch(err => core.info(err))
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
