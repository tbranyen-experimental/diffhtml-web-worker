try {
  global.Blob = (await import('node:buffer')).Blob;
} catch {}

export const getUUID = () => URL.createObjectURL(new Blob([])).substring(31);
