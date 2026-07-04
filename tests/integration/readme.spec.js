import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Project Documentation (README.md)', () => {
  const rootPath = path.resolve(__dirname, '../../');
  const readmePath = path.join(rootPath, 'README.md');
  const packageJsonPath = path.join(rootPath, 'package.json');

  it('DOC-STRUCT-01: README.md must exist', () => {
    expect(fs.existsSync(readmePath)).toBe(true);
  });

  it('DOC-STRUCT-01: README.md must contain required H2 headers', () => {
    const readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
    
    // Check for exact headers
    expect(readmeContent).toMatch(/## Quick Start \/ Getting Started/);
    expect(readmeContent).toMatch(/## Architecture Overview/);
    expect(readmeContent).toMatch(/## Key Design Patterns/);
    expect(readmeContent).toMatch(/## Core Technologies/);
  });

  it('DOC-CONTENT-01: README.md must document operational commands', () => {
    const readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
    
    expect(readmeContent).toContain('npm install');
    expect(readmeContent).toContain('npm run dev');
    expect(readmeContent).toContain('npm run test');
    expect(readmeContent).toContain('npm run build');
    expect(readmeContent).toContain('npm run preview');
  });
  
  it('DOC-CONTENT-01: package.json must have the documented operational scripts', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    expect(pkg.scripts.dev).toBeDefined();
    expect(pkg.scripts.preview).toBeDefined();
    expect(pkg.scripts.test).toBeDefined();
    expect(pkg.scripts.build).toBeDefined();
  });

  it('DOC-CONTENT-02: README.md must contain pattern and tech keywords', () => {
    const readmeContent = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
    
    const requiredKeywords = [
      'Controller', 'Service', 'View', 'Routes', 'Constants', 'Mappers',
      'Vanilla JavaScript', 'Vitest', 'jsdom', 'BEM CSS', 'HttpClient',
      'MANUAL_FRONTEND.md'
    ];
    
    for (const keyword of requiredKeywords) {
      expect(readmeContent).toContain(keyword);
    }
  });
});
