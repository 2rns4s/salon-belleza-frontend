import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Documentacion Academica', () => {
  it('debe existir el archivo y contener todas las secciones requeridas', () => {
    const docPath = path.resolve(__dirname, '../../DOCUMENTACION_ACADEMICA.md');
    expect(fs.existsSync(docPath)).toBe(true);

    const content = fs.readFileSync(docPath, 'utf-8');
    
    // Check for 6 H2 headers
    expect(content).toContain('## 1. Arquitectura y Flujo de Datos');
    expect(content).toContain('## 2. Elementos de Pantalla por Funcionalidad');
    expect(content).toContain('## 3. Paleta de Colores y Estilos');
    expect(content).toContain('## 4. Análisis de Resultados Esperados');
    expect(content).toContain('## 5. Usabilidad y Calidad de Software');
    expect(content).toContain('## 6. Estándares y Tecnologías de Calidad');

    // Check diagrams
    expect(content).toContain('[Navegador URL #/ruta] ──(hashchange)──> [router.js] ──(match)──> [Controller]');
    expect(content).toContain('[Controller] ──> [View] ──(Render)──> [DOM]');
    expect(content).toContain('     │');
    expect(content).toContain('  (Llama)');
    expect(content).toContain('     ↓');
    expect(content).toContain(' [Service] ──> [HttpClient] ──> [Backend API (Java/Spring)]');

    // Check keywords
    expect(content).toContain('Hash routing');
    expect(content).toContain('CSS variables');
    expect(content).toContain('BEM CSS');
    expect(content).toContain('Vitest');
    expect(content).toContain('jsdom');
  });
});
