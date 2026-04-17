import axios from 'axios';

const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const OWNER = import.meta.env.VITE_GITHUB_OWNER;
const REPO = import.meta.env.VITE_GITHUB_REPO;
const BRANCH = import.meta.env.VITE_GITHUB_BRANCH;

export const uploadMedia = async (file: File | Blob, pathPrefix: string = 'media'): Promise<string> => {
  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve, reject) => {
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
    });

    reader.readAsDataURL(file);
    const content = await base64Promise;

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const extension = file.type.split('/')[1] || 'bin';
    const filePath = `${pathPrefix}/${fileName}.${extension}`;

    const response = await axios.put(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
      {
        message: `Upload ${filePath}`,
        content,
        branch: BRANCH,
      },
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    // Get raw URL
    return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${filePath}`;
  } catch (error) {
    console.error('GitHub Upload Error:', error);
    throw new Error('Failed to upload media to GitHub');
  }
};

export const deleteMedia = async (url: string): Promise<void> => {
  try {
    const filePath = url.split(`/${BRANCH}/`)[1];
    if (!filePath) return;

    // Get file SHA first
    const getResponse = await axios.get(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );

    const sha = getResponse.data.sha;

    await axios.delete(
      `https://api.github.com/repos/${OWNER}/${REPO}/contents/${filePath}`,
      {
        data: {
          message: `Delete ${filePath}`,
          sha,
          branch: BRANCH,
        },
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );
  } catch (error) {
    console.error('GitHub Delete Error:', error);
  }
};
