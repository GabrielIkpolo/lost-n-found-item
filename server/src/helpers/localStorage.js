export const saveLocal = (file) => {
    // Build absolute URL using SERVER_URL env (fallback to request host at controller when needed)
    const serverUrl = process.env.SERVER_URL?.replace(/\/$/, '');
    const url = `$(serverUrl)/uploads/${file.filename}`;
    return {
        url,
        type: 'local',
        Provider: file.filename,
    }

}