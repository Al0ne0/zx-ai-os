
import { Project, ProjectFile } from '../types';

export const fetchGithubProject = async (url: string): Promise<Project> => {
    // Basic URL parsing to get owner and repo
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) throw new Error("URL de GitHub inválida. Debe ser como https://github.com/usuario/repo");
    const [, owner, repo] = match;

    // 1. Get Repo Metadata (to find default branch)
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!repoRes.ok) {
        if (repoRes.status === 404) throw new Error("Repositorio no encontrado o es privado.");
        throw new Error("Error al contactar GitHub API.");
    }
    const repoData = await repoRes.json();
    const branch = repoData.default_branch;

    // 2. Get Recursive Tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
    if (!treeRes.ok) throw new Error("No se pudo obtener la estructura de archivos.");
    
    const treeData = await treeRes.json();
    if (!treeData.tree || !Array.isArray(treeData.tree)) throw new Error("El repositorio parece estar vacío.");

    // 3. Smart Search for index.html
    // Prioritize root, then public, then docs, then src, then anything else
    const allFiles = treeData.tree.filter((f: any) => f.type === 'blob');
    
    let htmlEntry = allFiles.find((f: any) => f.path === 'index.html');
    if (!htmlEntry) htmlEntry = allFiles.find((f: any) => f.path === 'public/index.html');
    if (!htmlEntry) htmlEntry = allFiles.find((f: any) => f.path === 'docs/index.html');
    if (!htmlEntry) htmlEntry = allFiles.find((f: any) => f.path === 'src/index.html');
    if (!htmlEntry) htmlEntry = allFiles.find((f: any) => f.path.endsWith('index.html'));

    if (!htmlEntry) throw new Error("No se encontró 'index.html' en el repositorio (buscado en root, public/, src/, docs/).");

    // Determine the "root" directory of the web app based on where index.html was found
    const pathParts = htmlEntry.path.split('/');
    pathParts.pop(); // remove index.html
    const basePath = pathParts.join('/'); // e.g., "public" or ""

    // Helper to find related files in the same directory or common subdirectories
    const findFile = (extensions: string[], keywords: string[]) => {
        return allFiles.find((f: any) => {
             if (!f.path.startsWith(basePath ? basePath + '/' : '')) return false;
             const relativePath = basePath ? f.path.slice(basePath.length + 1) : f.path;
             const ext = relativePath.split('.').pop()?.toLowerCase();
             const name = relativePath.split('/').pop()?.toLowerCase();
             
             if (!extensions.includes(ext || '')) return false;
             
             // High priority for exact matches like style.css or script.js
             if (keywords.some(kw => name === kw + '.' + ext)) return true;
             
             // Medium priority for containing keywords
             if (keywords.some(kw => name?.includes(kw))) return true;
             
             return false;
        });
    };

    const cssEntry = findFile(['css'], ['style', 'styles', 'main', 'app']);
    const jsEntry = findFile(['js'], ['script', 'scripts', 'main', 'app', 'index', 'game']);

    // 4. Fetch Content via Raw URL
    // Using raw.githubusercontent.com avoids API rate limits for content fetching
    const getRawUrl = (path: string) => `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
    
    const fetchText = async (path: string) => {
        const res = await fetch(getRawUrl(path));
        if (!res.ok) throw new Error(`Fallo al descargar ${path}`);
        return await res.text();
    };

    const now = Date.now();
    const projectFiles: ProjectFile[] = [];

    // Fetch HTML
    const htmlContent = await fetchText(htmlEntry.path);
    projectFiles.push({ id: `file-${now}-html`, name: 'index.html', type: 'html', content: htmlContent });

    // Fetch CSS if found
    if (cssEntry) {
        const cssContent = await fetchText(cssEntry.path);
        projectFiles.push({ id: `file-${now}-css`, name: 'style.css', type: 'css', content: cssContent });
    }

    // Fetch JS if found
    if (jsEntry) {
        const jsContent = await fetchText(jsEntry.path);
        projectFiles.push({ id: `file-${now}-js`, name: 'script.js', type: 'js', content: jsContent });
    }

    const newProject: Project = {
        id: `proj-${now}`,
        name: repo,
        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
        files: projectFiles
    };

    return newProject;
}

export const searchGithubRepositories = async (query: string): Promise<any[]> => {
    // Broader search query to include various web technologies
    const q = encodeURIComponent(`${query} (language:html OR language:javascript OR language:typescript OR language:css)`);
    const response = await fetch(`https://api.github.com/search/repositories?q=${q}&sort=stars&order=desc&per_page=12`);
    
    if (!response.ok) throw new Error("Error al buscar en GitHub API");
    
    const data = await response.json();
    
    if (!data.items) return [];

    return data.items.map((item: any) => ({
        id: String(item.id),
        name: item.name,
        description: item.description || 'Sin descripción disponible',
        owner: item.owner.login, // Explicitly capture owner login
        icon: null, 
        repoUrl: item.html_url,
        category: item.language || 'Web',
        images: [], 
        details: `⭐ ${item.stargazers_count} | 🍴 ${item.forks_count} | Updated: ${new Date(item.updated_at).toLocaleDateString()}`,
        isExternal: true,
        stars: item.stargazers_count,
        language: item.language,
        updatedAt: new Date(item.updated_at).toLocaleDateString()
    }));
};
