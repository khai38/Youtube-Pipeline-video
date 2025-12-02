import type { YouTubeUser } from '../types';

export const getUserInfo = async (accessToken: string): Promise<YouTubeUser> => {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch user info');
    }

    const data = await response.json();
    return {
        name: data.name,
        email: data.email,
        avatarUrl: data.picture
    };
};

export const uploadVideoToYouTube = async (
    accessToken: string, 
    blob: Blob, 
    metadata: { title: string; description: string; privacy: string },
    onProgress: (percent: number) => void
): Promise<any> => {
    const metadataDetails = {
        snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: ['AI Generated', 'Gemini'],
            categoryId: 22 // People & Blogs
        },
        status: {
            privacyStatus: metadata.privacy,
            selfDeclaredMadeForKids: false
        }
    };

    const formData = new FormData();
    // Part 1: Metadata
    formData.append('snippet', new Blob([JSON.stringify(metadataDetails)], { type: 'application/json' }));
    // Part 2: Video Content
    formData.append('file', blob);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart');
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                onProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(JSON.parse(xhr.responseText));
            } else {
                reject(new Error(`Upload failed: ${xhr.responseText}`));
            }
        };

        xhr.onerror = () => reject(new Error('Network error during upload'));
        
        xhr.send(formData);
    });
};
