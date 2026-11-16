import type { DeploymentEvent, DeploymentConfig } from '../types';

/**
 * Lazy loader for Firestore context to maintain compatibility in test and browser environments.
 */
async function getFirestoreContext() {
  if (typeof process !== 'undefined' && (process.env.NODE_ENV === 'test' || process.env.npm_lifecycle_event === 'test')) {
    return null;
  }
  try {
    const fireMod = await import('./firebase');
    const fsMod = await import('firebase/firestore');
    return {
      db: fireMod.db,
      doc: fsMod.doc,
      setDoc: fsMod.setDoc,
      collection: fsMod.collection,
    };
  } catch {
    return null;
  }
}

export interface PipelineTriggerPayload {
  appId?: string;
  appName?: string;
  version?: string;
  actorEmail?: string;
  customMessage?: string;
  deployHookUrl?: string;
  githubRepo?: string;
  githubToken?: string;
}

/**
 * Triggers the automated GitHub Pages deployment pipeline whenever an application
 * is published, updated, or deleted via the admin panel.
 *
 * Actions:
 * 1. Creates an immutable deployment event in Firestore (`deploymentEvents`)
 * 2. Updates `systemConfig/default` with latest pipeline execution status
 * 3. Dispatches repository_dispatch or deploy hook to GitHub Actions if configured
 * 4. Pings backend full-stack server endpoint `/api/pipeline/trigger`
 */
export async function triggerDeploymentPipeline(
  event: 'app.published' | 'app.updated' | 'app.deleted' | 'pipeline.manual_trigger',
  details: PipelineTriggerPayload = {}
): Promise<{ success: boolean; message: string; eventId: string }> {
  const eventId = `deploy_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const readableLabel =
    event === 'app.published'
      ? 'Application Published'
      : event === 'app.updated'
      ? 'Application Updated'
      : event === 'app.deleted'
      ? 'Application Deleted'
      : 'Manual Pipeline Rebuild';

  const summary =
    details.customMessage ||
    `${readableLabel}: "${details.appName || details.appId || 'Catalog update'}" triggered automatic GitHub Pages build & deployment pipeline.`;

  const deploymentRecord: DeploymentEvent = {
    id: eventId,
    event,
    appId: details.appId || '',
    appName: details.appName || '',
    version: details.version || '',
    triggeredAt: now,
    actorEmail: details.actorEmail || 'mh3620305@gmail.com',
    status: 'triggered',
    target: 'github-pages',
    details: summary,
  };

  // 1. Record deployment event in Firestore
  try {
    const fsContext = await getFirestoreContext();
    if (fsContext && fsContext.db) {
      const { db, doc, setDoc } = fsContext;

      // Save immutable deployment event
      await setDoc(doc(db, 'deploymentEvents', eventId), deploymentRecord).catch((e) => {
        console.warn('Firestore deployment event write notice:', e);
      });

      // Update systemConfig with pipeline status
      const updatedConfig: Partial<DeploymentConfig> = {
        autoDeployOnMutation: true,
        lastTriggeredAt: now,
        lastEvent: event,
        lastStatus: 'triggered',
        lastDetails: summary,
      };

      await setDoc(
        doc(db, 'systemConfig', 'default'),
        {
          deploymentConfig: updatedConfig,
          updatedAt: now,
        },
        { merge: true }
      ).catch(() => {});
    }
  } catch (err) {
    console.warn('Firestore deployment event record notice:', err);
  }

  // 2. Dispatch to custom Deploy Hook or GitHub repository_dispatch if configured
  const deployHookUrl =
    details.deployHookUrl ||
    (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_DEPLOY_HOOK_URL as string) : undefined);

  if (deployHookUrl && typeof fetch !== 'undefined') {
    try {
      await fetch(deployHookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: event.replace('.', '_'),
          client_payload: deploymentRecord,
        }),
      }).catch((e) => console.warn('Deploy hook dispatch notice:', e));
    } catch {}
  }

  // GitHub repository dispatch API
  const githubRepo =
    details.githubRepo ||
    (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GITHUB_REPO as string) : undefined);
  const githubToken =
    details.githubToken ||
    (typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_GITHUB_TOKEN as string) : undefined);

  if (githubRepo && githubToken && typeof fetch !== 'undefined') {
    try {
      await fetch(`https://api.github.com/repos/${githubRepo}/dispatches`, {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `Bearer ${githubToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: event.replace('.', '_'),
          client_payload: deploymentRecord,
        }),
      }).catch((e) => console.warn('GitHub dispatch notice:', e));
    } catch {}
  }

  // 3. Inform local Express backend server if running
  try {
    if (typeof fetch !== 'undefined') {
      const basePath =
        typeof window !== 'undefined' && window.location.pathname.startsWith('/App-drop')
          ? '/App-drop'
          : '';

      await fetch(`${basePath}/api/pipeline/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentRecord),
      }).catch(() => {});
    }
  } catch {}

  return {
    success: true,
    message: `Deployment pipeline triggered: ${summary}`,
    eventId,
  };
}
