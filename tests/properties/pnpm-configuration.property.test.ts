// Property-based tests for pnpm package manager configuration
// **Feature: leafer-flow, Property 19: pnpm包管理器配置**

import * as fc from 'fast-check'
import * as fs from 'fs'
import * as path from 'path'

describe('Property-based tests for pnpm configuration', () => {
  const projectRoot = path.resolve(__dirname, '../..')

  /**
   * **Feature: leafer-flow, Property 19: pnpm包管理器配置**
   * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
   *
   * The project should be correctly configured to use pnpm as the package manager,
   * including appropriate configuration files, script commands, and documentation
   */
  it('should have complete pnpm configuration across all project files', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        // Requirement 9.1: Project should use pnpm as default package manager
        // Check for pnpm-lock.yaml existence
        const pnpmLockPath = path.join(projectRoot, 'pnpm-lock.yaml')
        expect(fs.existsSync(pnpmLockPath)).toBe(true)

        // Requirement 9.2: Dependencies should be managed through pnpm
        // Check package.json for pnpm-specific configurations
        const packageJsonPath = path.join(projectRoot, 'package.json')
        expect(fs.existsSync(packageJsonPath)).toBe(true)

        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

        // Should have preinstall script to enforce pnpm usage
        expect(packageJson.scripts).toBeDefined()
        expect(packageJson.scripts.preinstall).toBeDefined()
        expect(packageJson.scripts.preinstall).toContain('only-allow pnpm')

        // Requirement 9.3: Project should include pnpm configuration files
        // Check for .npmrc with pnpm-specific settings
        const npmrcPath = path.join(projectRoot, '.npmrc')
        expect(fs.existsSync(npmrcPath)).toBe(true)

        const npmrcContent = fs.readFileSync(npmrcPath, 'utf8')
        expect(npmrcContent).toContain('auto-install-peers')
        expect(npmrcContent).toContain('store-dir')

        // Check for pnpm-workspace.yaml
        const workspacePath = path.join(projectRoot, 'pnpm-workspace.yaml')
        expect(fs.existsSync(workspacePath)).toBe(true)

        // Requirement 9.4: Scripts should support pnpm execution
        // All npm scripts should use pnpm exec prefix for tools
        const scripts = packageJson.scripts
        const scriptKeys = Object.keys(scripts).filter(
          key => key !== 'preinstall'
        )

        scriptKeys.forEach(scriptKey => {
          const scriptValue = scripts[scriptKey]
          if (
            scriptValue.includes('tsc') ||
            scriptValue.includes('jest') ||
            scriptValue.includes('eslint') ||
            scriptValue.includes('rimraf')
          ) {
            expect(scriptValue).toContain('pnpm exec')
          }
        })

        // Requirement 9.5: Documentation should specify pnpm usage
        // Check README.md mentions pnpm (if it exists)
        const readmePath = path.join(projectRoot, 'README.md')
        if (fs.existsSync(readmePath)) {
          const readmeContent = fs.readFileSync(readmePath, 'utf8')
          expect(readmeContent.toLowerCase()).toMatch(/pnpm/)
        }

        // Verify only-allow dependency is present
        expect(packageJson.devDependencies).toBeDefined()
        expect(packageJson.devDependencies['only-allow']).toBeDefined()
      }),
      { numRuns: 1 } // Only need to run once since we're checking static configuration
    )
  })

  it('should have valid pnpm workspace configuration', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const workspacePath = path.join(projectRoot, 'pnpm-workspace.yaml')
        const workspaceContent = fs.readFileSync(workspacePath, 'utf8')

        // Should contain packages configuration
        expect(workspaceContent).toContain('packages:')

        // Should include current directory
        expect(workspaceContent).toContain('"."')
      }),
      { numRuns: 1 }
    )
  })

  it('should have valid .npmrc configuration for pnpm', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const npmrcPath = path.join(projectRoot, '.npmrc')
        const npmrcContent = fs.readFileSync(npmrcPath, 'utf8')

        // Should have pnpm-specific configurations
        expect(npmrcContent).toContain('auto-install-peers=true')
        expect(npmrcContent).toContain('store-dir=~/.pnpm-store')
        expect(npmrcContent).toContain('lockfile=true')

        // Should have registry configuration
        expect(npmrcContent).toContain('registry=https://registry.npmjs.org/')
      }),
      { numRuns: 1 }
    )
  })

  it('should enforce pnpm usage through preinstall script', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const packageJsonPath = path.join(projectRoot, 'package.json')
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

        // Should have preinstall script that enforces pnpm
        expect(packageJson.scripts.preinstall).toBe('npx only-allow pnpm')

        // Should have only-allow as a dev dependency
        expect(packageJson.devDependencies['only-allow']).toBeDefined()
      }),
      { numRuns: 1 }
    )
  })

  it('should use pnpm exec for all tool-based scripts', () => {
    fc.assert(
      fc.property(fc.constant(true), () => {
        const packageJsonPath = path.join(projectRoot, 'package.json')
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

        const scripts = packageJson.scripts
        const toolScripts = [
          'build',
          'dev',
          'test',
          'test:watch',
          'test:coverage',
          'lint',
          'clean',
        ]

        toolScripts.forEach(scriptName => {
          if (scripts[scriptName]) {
            expect(scripts[scriptName]).toContain('pnpm exec')
          }
        })
      }),
      { numRuns: 1 }
    )
  })
})
