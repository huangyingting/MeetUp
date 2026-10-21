import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';

export async function openBrowser(directory) {
  if (!process.env.CHROME_BINARY) return null;
  await access(process.env.CHROME_BINARY, constants.X_OK);
  const profile = path.join(directory, 'browser-profile');
  const processHandle = spawn(process.env.CHROME_BINARY, [
    '--headless', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', 'about:blank',
  ], { stdio: 'ignore' });
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  let socket;
  const close = async () => {
    socket?.close();
    if (processHandle.exitCode === null) {
      const stopped = once(processHandle, 'exit');
      processHandle.kill('SIGTERM');
      await stopped;
    }
  };
  try {
    let port;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { port = (await readFile(path.join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]; break; }
      catch (error) { if (error.code !== 'ENOENT') throw error; await pause(100); }
    }
    assert(port, 'Browser debugging endpoint must become ready');
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
    socket = new WebSocket(target.webSocketDebuggerUrl);
    await once(socket, 'open');
    let sequence = 0;
    const pending = new Map();
    const errors = [];
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id); clearTimeout(request.timer);
        if (message.error) request.reject(new Error(message.error.message));
        else request.resolve(message.result);
      } else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
      else if (message.method === 'Log.entryAdded' && /content security|violates.*policy/i.test(message.params.entry.text)) errors.push(message.params.entry.text);
    });
    const command = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15_000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const wait = async expression => {
      for (let attempt = 0; attempt < 150; attempt++) {
        if (await evaluate(expression)) return;
        await pause(100);
      }
      throw new Error(`Browser condition was not reached: ${expression}`);
    };
    await command('Page.enable');
    await command('Page.bringToFront');
    await command('Emulation.setFocusEmulationEnabled', { enabled: true });
    await command('Runtime.enable');
    await command('Network.enable');
    await command('Log.enable');
    await command('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: false });
    return {
      command, evaluate, wait, errors, close,
      async go(url, selector) {
        await command('Page.navigate', { url });
        await wait(`document.readyState === 'complete' && Boolean(document.querySelector(${JSON.stringify(selector)}))`);
        await pause(250);
      },
      async fill(selector, value) {
        await evaluate(`(() => {
          const input = document.querySelector(${JSON.stringify(selector)});
          const prototype = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, ${JSON.stringify(value)});
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        })()`);
      },
      async click(text) {
        await evaluate(`(() => {
          const button = [...document.querySelectorAll('button')].find(button => button.textContent.includes(${JSON.stringify(text)}));
          if (!button) throw new Error('Button not found');
          button.click();
        })()`);
      },
    };
  } catch (error) {
    await close();
    throw error;
  }
}
