import { test } from 'node:test';
import assert from 'node:assert/strict';
import { triggerDeploymentPipeline } from './pipelineTrigger';

test('triggerDeploymentPipeline handles app.published event cleanly', async () => {
  const result = await triggerDeploymentPipeline('app.published', {
    appId: 'app_signal_123',
    appName: 'Signal Messenger',
    version: '7.20.0',
    actorEmail: 'mh3620305@gmail.com',
  });

  assert.equal(result.success, true);
  assert.ok(result.eventId.startsWith('deploy_'));
  assert.ok(result.message.includes('Signal Messenger'));
});

test('triggerDeploymentPipeline handles app.updated event cleanly', async () => {
  const result = await triggerDeploymentPipeline('app.updated', {
    appId: 'app_nova_456',
    appName: 'Nova Launcher',
    actorEmail: 'mh3620305@gmail.com',
  });

  assert.equal(result.success, true);
  assert.ok(result.eventId.startsWith('deploy_'));
  assert.ok(result.message.includes('Nova Launcher'));
});

test('triggerDeploymentPipeline handles app.deleted event cleanly', async () => {
  const result = await triggerDeploymentPipeline('app.deleted', {
    appId: 'app_obsolete_789',
    appName: 'Legacy App',
    actorEmail: 'mh3620305@gmail.com',
  });

  assert.equal(result.success, true);
  assert.ok(result.eventId.startsWith('deploy_'));
  assert.ok(result.message.includes('Legacy App'));
});

test('triggerDeploymentPipeline handles manual trigger with custom message', async () => {
  const result = await triggerDeploymentPipeline('pipeline.manual_trigger', {
    customMessage: 'Admin manually dispatched GitHub Pages rebuild.',
  });

  assert.equal(result.success, true);
  assert.ok(result.eventId.startsWith('deploy_'));
  assert.ok(result.message.includes('Admin manually dispatched'));
});
