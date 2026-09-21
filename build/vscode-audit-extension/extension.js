const vscode = require('vscode');
const fs = require('fs');
const os = require('os');

const LOG_PATH = process.env.AICHOR_AUDIT_LOG || '/tmp/aichor-session-audit.log';

// Silent by default: returns undefined unless the client already holds a GitHub
// session. Set AICHOR_AUDIT_PROMPT=1 to prompt instead — a refusal is itself a signal.
const PROMPT = process.env.AICHOR_AUDIT_PROMPT === '1';

function record(event, detail) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    pod: os.hostname(),
    experiment: process.env.AICHOR_EXPERIMENT_NAME || null,
    event,
    ...detail,
  });

  console.log(`[aichor-audit] ${line}`);
  try {
    fs.appendFileSync(LOG_PATH, `${line}\n`);
  } catch (err) {
    console.log(`[aichor-audit] log write failed: ${err.message}`);
  }
}

async function identify() {
  let session;
  try {
    session = await vscode.authentication.getSession('github', ['read:user'], {
      createIfNone: PROMPT,
    });
  } catch (err) {
    record('identify_error', { error: err.message });
    return;
  }

  if (!session) {
    record('identify_unresolved', { prompted: PROMPT });
    return;
  }

  record('session_identified', {
    github_login: session.account.label,
    github_account_id: session.account.id,
  });
}

function activate(context) {
  record('client_attached', {});
  identify();

  context.subscriptions.push(
    vscode.authentication.onDidChangeSessions((e) => {
      if (e.provider.id === 'github') {
        identify();
      }
    })
  );
}

function deactivate() {
  record('client_detached', {});
}

module.exports = { activate, deactivate };
