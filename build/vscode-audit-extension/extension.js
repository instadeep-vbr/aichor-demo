const vscode = require('vscode');
const os = require('os');

const log = vscode.window.createOutputChannel('AIchor Session Audit', { log: true });

// Silent by default: returns undefined unless the client already holds a GitHub
// session. Set AICHOR_AUDIT_PROMPT=1 to prompt instead — a refusal is itself a signal.
const PROMPT = process.env.AICHOR_AUDIT_PROMPT === '1';

function record(event, detail) {
  log.info(
    JSON.stringify({
      pod: os.hostname(),
      experiment: process.env.AICHOR_EXPERIMENT_NAME || null,
      event,
      ...detail,
    })
  );
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
  context.subscriptions.push(log);
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
