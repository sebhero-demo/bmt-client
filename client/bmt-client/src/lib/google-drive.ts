// Google Drive Service for BMT
// Link Drive files to tasks

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

// Search Drive files
export const searchFiles = async (tokens: GoogleTokens, query: string): Promise<DriveFile[]> => {
  const params = new URLSearchParams({
    q: `name contains '${query}' and mimeType != 'application/vnd.google-apps.folder'`,
    fields: 'files(id,name,mimeType,webViewLink)',
    pageSize: '10',
  });
  
  const res = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  });
  const data = await res.json();
  return data.files || [];
};

// Get file metadata
export const getFile = async (tokens: GoogleTokens, fileId: string): Promise<DriveFile> => {
  const res = await fetch(`${DRIVE_API}/files/${fileId}?fields=id,name,mimeType,webViewLink,iconLink`, {
    headers: { 'Authorization': `Bearer ${tokens.access_token}` },
  });
  return res.json();
};

// Open file in browser
export const openFile = (file: DriveFile) => {
  if (file.webViewLink) {
    window.open(file.webViewLink, '_blank');
  }
};

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  iconLink?: string;
}