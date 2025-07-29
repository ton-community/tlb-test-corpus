import { execSync } from 'child_process';
import { join } from 'node:path';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';

import { groupCorpusFlat, TLBDataTyped, TLBGroup } from './tlb-corpus';
const args = process.argv.slice(2);
const isValidate = args.includes('-v') || args.includes('--validate');

function cmd(cmd: string, outFile?: string, silent = true): string {
    try {
        if (outFile) {
            execSync(`${cmd} > ${outFile} 2>&1`, { stdio: 'ignore' });
            return ''; // команда выполнена, вывод в файл, всё ок
        } else {
            return execSync(cmd, {
                stdio: silent ? 'pipe' : 'inherit',
                encoding: 'utf-8',
            }).trim();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error(`❌ Failed to run: ${cmd}`);
        if (outFile && existsSync(outFile)) {
            console.error(`📄 Log output (${outFile}):\n${readFileSync(outFile, 'utf8')}`);
        }
        throw error;
    }
}

let failedCount = 0;
let caseCount = 0;

function testCase(groupName: TLBGroup) {
    for (const index in groupCorpusFlat[groupName]) {
        const [tlb, data, boc] = groupCorpusFlat[groupName][index];
        const log: string[] = [];
        const baseName = `case-${(caseCount + 1).toString().padStart(3, '0')}`;
        const schemaDir = 'data';
        if (!existsSync(schemaDir)) mkdirSync(schemaDir);
        const tlbFile = join(schemaDir, `${baseName}.tlb`);
        const codegenName = `${baseName}-auto`;
        const codegenFile = join(schemaDir, `${codegenName}.ts`);
        const scriptFile = join(schemaDir, `${baseName}.ts`);
        const tlbTextFile = join(schemaDir, `${baseName}.txt`);
        const kind = (data as TLBDataTyped).kind;
        const typeName = kind.split('_')[0];
        writeFileSync(tlbFile, tlb);
        if (isValidate) {
            cmd(`tlbc -qv ${tlbFile}`, tlbTextFile);
        }
        cmd(`npx tlb -o ${codegenFile} ${tlbFile} > /dev/null 2>&1`);
        if (!existsSync(scriptFile)) {
            const template = `import { Builder } from '@ton/core';
import { store${typeName} } from './${codegenName}';
import { groupCorpusFlat } from '../tlb-corpus';
const b = new Builder();
// @ts-ignore
store${typeName}(groupCorpusFlat[${JSON.stringify(groupName)}][${index}][1])(b);
console.log(b.endCell().toBoc().toString('base64'));
`;
            writeFileSync(scriptFile, template);
        }
        const result = cmd(`npx ts-node ${scriptFile}`);
        const caseName = `#${(+index + 1).toString().padStart(2, '0')} ${baseName} ${kind}`;
        if (result !== boc) {
            log.push('MISMATCH', caseName);
            log.push(`expected=${boc}`);
            log.push(`actual=${result}`);
            failedCount += 1;
        } else {
            log.push('OK', caseName);
        }
        console.log(` ${log.join(' ')}`);
        caseCount += 1;
    }
}

async function main() {
    for (const groupName of Object.keys(groupCorpusFlat)) {
        console.log(groupName);
        if (groupName.includes('skip')) continue;
        testCase(groupName);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});

console.log(`Cases: ${failedCount} failed, ${caseCount - failedCount} passed, ${caseCount} total`);
process.exit(failedCount === 0 ? 0 : 1);
