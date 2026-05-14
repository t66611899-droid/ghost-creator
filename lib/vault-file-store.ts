// In-memory map of clip ID → File object.
// We cannot persist File references — this lives only for the current session.

const fileMap = new Map<string, File>();

export function rememberFile(id: string, file: File) {
  fileMap.set(id, file);
}

export function getFile(id: string): File | undefined {
  return fileMap.get(id);
}

export function forgetFile(id: string) {
  fileMap.delete(id);
}

export function listKnownIds(): string[] {
  return Array.from(fileMap.keys());
}
