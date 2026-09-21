const vscode = require('vscode');
const fs = require('fs');
const os = require('os');


const ENABLED = process.env.AICHOR_AUDIT_ENABLED !== '0';

const PROMPT = process.env.AICHOR_AUDIT_PROMPT === '1';

let log;


function emitToExperimentLog(line) {
  try {
    fs.appendFileSync('/proc/1/fd/1', `${line}\n`);
  } catch (err) {
    log?.warn(`experiment log write failed: ${err.message}`);
  }
}

function record(event, detail) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    pod: os.hostname(),
    experiment: process.env.AICHOR_EXPERIMENT_NAME || null,
    event,
    ...detail,
  });

  log?.info(line);
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
  if (!ENABLED) {
    return;
  }

  log = vscode.window.createOutputChannel('AIchor Session Audit', { log: true });
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
  if (!ENABLED) {
    return;
  }

  record('client_detached', {});
}

module.exports = { activate, deactivate };
