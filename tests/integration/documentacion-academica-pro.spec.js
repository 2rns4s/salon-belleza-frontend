import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Documentacion Academica Profesional', () => {
  const docPath = path.resolve(process.cwd(), 'DOCUMENTACION_ACADEMICA.md');
  
  it('should exist', () => {
    expect(fs.existsSync(docPath)).toBe(true);
  });

  describe('Content Verification', () => {
    let content = '';
    
    if (fs.existsSync(docPath)) {
      content = fs.readFileSync(docPath, 'utf8');
    }

    it('should have exactly 6 H2 headings', () => {
      const headings = [
        '## 1. Arquitectura y Flujo de Datos',
        '## 2. Elementos de Pantalla por Funcionalidad',
        '## 3. Paleta de Colores y Estilos',
        '## 4. Análisis de Resultados Esperados',
        '## 5. Usabilidad y Calidad de Software',
        '## 6. Estándares y Tecnologías de Calidad'
      ];
      headings.forEach(heading => {
        expect(content).toContain(heading);
      });
      const h2Count = (content.match(/^## /gm) || []).length;
      expect(h2Count).toBe(6);
    });

    it('should include ASCII diagrams for Hash Routing and MVC Flow', () => {
      expect(content).toContain('[Navegador URL #/ruta] ──(hashchange)──> [router.js] ──(match)──> [Controller]');
      expect(content).toContain('[Controller] ──> [View] ──(Render)──> [DOM]');
      expect(content).toContain('[Service] ──> [HttpClient] ──> [Backend API]');
    });

    it('should document exact color hex values', () => {
      const colors = [
        '--color-fondo-principal: #f8f3f4',
        '--color-texto-principal: #2c1a1e',
        '--color-superficie: #ffffff',
        '--color-header-vinotinto-claro: #8a3f52',
        '--color-texto-inverso: #ffffff',
        '--color-vinotinto-hover: #72333e',
        '--color-vinotinto-soft: #f3e8eb',
        '--color-vinotinto-border: #eadde0',
        '--color-vinotinto-contrast: #5c3344',
        '--color-vinotinto-muted: #6b4a52',
        '--color-vinotinto-subtle: #9e7a85',
        '--color-vinotinto-gradient-start: #fff7f8',
        '--color-vinotinto-gradient-end: #fffcf7',
        '--color-surface-alt: #fff5f7',
        '--color-surface-hover: #fffaf8',
        '--color-texto-secundario: #4a4a4a',
        '--color-input-border: #d1b8be',
        '--color-feedback-error-bg: #fdecea',
        '--color-feedback-error-text: #b71c1c',
        '--color-feedback-error-border: #f5c6cb',
        '--color-feedback-success-bg: #e8f5e9',
        '--color-feedback-success-text: #1b5e20',
        '--color-feedback-success-border: #c8e6c9',
        '--color-role-owner: #7b1fa2',
        '--color-role-receptionist: #1976d2',
        '--color-status-active: #388e3c',
        '--color-status-inactive: #9e9e9e',
        '--color-action-danger: #c62828',
        '--color-action-danger-hover: #a31515',
        '--color-warning-text: #e65100'
      ];
      colors.forEach(color => {
        expect(content).toContain(color);
      });
    });

    it('should include all required keywords', () => {
      const keywords = ['Hash routing', 'CSS variables', 'BEM CSS', 'Vitest', 'jsdom'];
      keywords.forEach(keyword => {
        expect(content).toContain(keyword);
      });
    });

    it('should document Citas client-side validations mapping', () => {
      expect(content).toContain('Solapamiento');
      expect(content).toContain('Restricciones de empleados');
      expect(content).toContain('Límites de recursos');
    });
  });
});
