// Lightweight abstraction layer for Linux/Termux interactions.
// This is a safe stub implementation for the web app so it doesn't break.
// Native/Android wrappers should implement the real bridge and expose the same API.

export const isTermuxAvailable = async (): Promise<boolean> => {
  // In the web build we can't access Termux; native wrapper should override this.
  return false;
};

export const execCommand = async (cmd: string, opts?: { cwd?: string }): Promise<{ code: number; stdout: string; stderr: string }> => {
  // Stubbed response for UI development. Native implementation should run the command
  // inside Termux / proot and return real output.
  console.warn('[linuxBridge] execCommand called in web stub:', cmd);
  return { code: 0, stdout: `Mocked: command executed: ${cmd}\n(Install Termux/native bridge to run real commands)`, stderr: '' };
};

export const installPackage = async (pkgName: string): Promise<{ success: boolean; message: string }> => {
  console.warn('[linuxBridge] installPackage called in web stub:', pkgName);
  return { success: false, message: 'Not available in web mode. Use Termux/native bridge.' };
};

export const startDesktopSession = async (session: 'xfce' | 'lxde' | 'cli') => {
  console.warn('[linuxBridge] startDesktopSession requested (web stub):', session);
  throw new Error('Desktop sessions are not available in web-only mode. Implement via native Termux bridge.');
};

export default {
  isTermuxAvailable,
  execCommand,
  installPackage,
  startDesktopSession,
};
