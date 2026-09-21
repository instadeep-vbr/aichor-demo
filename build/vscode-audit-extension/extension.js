const vscode = require('vscode');
const fs = require('fs');
const os = require('os');

const log = vscode.window.createOutputChannel('AIchor Session Audit', { log: true });

// Silent by default: returns undefined unless the client already holds a GitHub
// session. Set AICHOR_AUDIT_PROMPT=1 to prompt instead — a refusal is itself a signal.
const PROMPT = process.env.AICHOR_AUDIT_PROMPT === '1';

// The extension host's own stdout is captured by VS Code's log files, so it never
// reaches the container log. PID 1's stdout is what AIchor collects.
function emitToExperimentLog(line) {
  try {
    fs.appendFileSync('/proc/1/fd/1', `${line}\n`);
  } catch (err) {
    log.warn(`experiment log write failed: ${err.message}`);
  }
}

function record(event, detail) {
  const line = JSON.stringify({
    pod: os.hostname(),
    experiment: process.env.AICHOR_EXPERIMENT_NAME || null,
    event,
    ...detail,
  });

  log.info(line);
  emitToExperimentLog(`[aichor-audit] ${line}`);
}

async function identify() {
  try {
    const accounts = await vscode.authentication.getAccounts('github');
    if (accounts.length) {
      record('accounts_seen', { accounts: accounts.map((a) => ({ login: a.label, id: a.id })) });
    }
  } catch (err) {
    record('accounts_error', { error: err.message });
  }

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
