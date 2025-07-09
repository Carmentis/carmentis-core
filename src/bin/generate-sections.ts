import { Project } from 'ts-morph';

const project = new Project();
project.addSourceFilesAtPaths('src/common/entities/*.ts');
const sourceFile = project.getSourceFileOrThrow('Section.ts');
for (const c of sourceFile.getClasses()) {
    console.log(c.getName())
}
