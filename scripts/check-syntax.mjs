import { readdir } from "node:fs/promises";
import { join, extname } from "node:path";
import { spawnSync } from "node:child_process";

const ROOTS = ["src", "tests"];
const IGNORED_DIRECTORIES = new Set(["node_modules", ".git"]);

async function collectJsFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const absolutePath = join(directory, entry.name);

        if (entry.isDirectory()) {
            if (IGNORED_DIRECTORIES.has(entry.name)) {
                continue;
            }

            files.push(...(await collectJsFiles(absolutePath)));
            continue;
        }

        if (entry.isFile() && extname(entry.name) === ".js") {
            files.push(absolutePath);
        }
    }

    return files;
}

function checkFileSyntax(filePath) {
    const result = spawnSync(process.execPath, ["--check", filePath], {
        encoding: "utf8",
    });

    return {
        ok: result.status === 0,
        stderr: result.stderr || "",
        filePath,
    };
}

async function run() {
    const files = [];

    for (const root of ROOTS) {
        files.push(...(await collectJsFiles(root)));
    }

    if (!files.length) {
        console.log("No se encontraron archivos .js para validar.");
        return;
    }

    const failures = files
        .map(checkFileSyntax)
        .filter((result) => !result.ok);

    if (failures.length > 0) {
        console.error("Se detectaron errores de sintaxis en los siguientes archivos:\n");

        for (const failure of failures) {
            console.error(`${failure.filePath}`);
            console.error(failure.stderr.trim());
            console.error("");
        }

        process.exit(1);
    }

    console.log(`Sintaxis valida en ${files.length} archivos JavaScript.`);
}

run().catch((error) => {
    console.error("Fallo inesperado durante el chequeo de sintaxis.");
    console.error(error);
    process.exit(1);
});
