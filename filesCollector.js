import fs from 'fs/promises';
import path from 'path';
import ignore from 'ignore';
import { isBinaryFileSync } from 'isbinaryfile';

const excludedFilenames = ['package.json', 'package-lock.json', 'yarn.lock', '.jpeg', '.png', '.svg', '.bin', '.env', '.env.production'];
const excludedFolders = ['node_modules', 'build', 'dist', '.git', '.secrets'];
const binaryExtensions = /\.(png|jpe?g|gif|pdf|woff2?|ico|svg|eot|ttf|mp[34]|mov|avi|ogg|doc|docx)$/i;

async function collectFiles() {
    const outputFilePath = path.join(process.cwd(), 'project_overview.txt');
    const gitignore = ignore();

    // Read and parse .gitignore
    try {
        const gitignoreContent = await fs.readFile(path.join(process.cwd(), '.gitignore'), 'utf-8');
        gitignore.add(gitignoreContent);
    } catch (e) {
        console.log('No .gitignore found, proceeding with default exclusions');
    }

    // Collect all files (excluding node_modules and .gitignore entries)
    const files = await collectAllFiles(process.cwd(), [], gitignore);

    // Generate tree diagram
    const tree = generateTree(files);

    // Build output content
    let outputContent =
        `DIRECTORY TREE:
${tree}

FULL FILE CONTENTS:
`;
    // Add each file content with header
    for (const file of files) {
        try {
            const content = await fs.readFile(file, 'utf-8');
            outputContent += `\n\n-- FILE: ${file} --\n\n`;
            outputContent += content;
        } catch (e) {
            if (e.code !== 'EISDIR') { // Skip directories
                console.error(`Error reading ${file}:`, e.message);
            }
        }
    }

    // Write to output file
    await fs.writeFile(outputFilePath, outputContent);
    console.log(`Successfully collected ${files.length} files to ${outputFilePath}`);
}

async function collectAllFiles(currentPath, fileList = [], gitignore) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relPath = path.relative(process.cwd(), fullPath);

        // 🧹 Skip directories if needed
        if (entry.isDirectory()) {
            if (excludedFolders.includes(entry.name)) continue;
            // Skip nested ignored paths (e.g. "subfolder/node_modules/target")
            if (excludedFolders.some(folder => fullPath.includes(path.sep + folder + path.sep))) continue;
            fileList = await collectAllFiles(fullPath, fileList, gitignore);
            continue;
        }

        // 🧾 Skip files by name and binary types
        if (entry.isFile()) {
            if (excludedFilenames.includes(entry.name)) continue;
            if (gitignore.ignores(relPath)) continue;
            if (relPath === 'project_overview.txt') continue;

            // 🚫 Block binary file types early
            if (binaryExtensions.test(fullPath)) {
                console.warn(`Binary file skipped: ${fullPath}`);
                continue;
            }

            // 🔍 Final binary file detection (read first 512 bytes)
            let isBinary = false;
            try {
                const fileHandle = await fs.open(fullPath, 'r');
                const buffer = Buffer.alloc(512);
                try {
                    await fileHandle.read(buffer, 0, 512, 0);
                    isBinary = isBinaryFileSync(buffer);
                } finally {
                    await fileHandle.close();
                }

                if (isBinary) {
                    console.warn(`Binary file skipped (by content): ${fullPath}`);
                    continue;
                }
            } catch (e) {
                console.error(`Error opening file for analysis: ${fullPath}`, e.message);
                continue;
            }

            fileList.push(fullPath);
        }
    }

    return fileList;
}

function generateTree(files) {
    const tree = {};
    for (const file of files) {
        const relPath = path.relative(process.cwd(), file);
        const parts = relPath.split(path.sep);
        let currentLevel = tree;

        for (const part of parts) {
            if (!currentLevel[part]) {
                currentLevel[part] = {};
            }
            currentLevel = currentLevel[part];
        }
    }

    let treeOutput = '';
    function traverse(obj, indent = '') {
        for (const [key, value] of Object.entries(obj)) {
            if (Object.keys(value).length === 0) {
                // File
                treeOutput += `${indent}${key}\n`;
            } else {
                // Folder
                treeOutput += `${indent}${key}/\n`;
                traverse(value, indent + '  ');
            }
        }
    }

    traverse(tree);
    return treeOutput;
}

collectFiles();