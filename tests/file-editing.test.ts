import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createToolRegistry } from '../src/tools/factory.js';
import { TodoManager } from '../src/planning/todoManager.js';

/**
 * Integration tests for File Editing Tools
 * 
 * Tests the actual file manipulation tools:
 * - write_file (overwrite entire file)
 * - create_file (create new file)
 * - edit_file (apply unified diff)
 * - read_file (read file content)
 */

const TEST_DIR = path.join(process.cwd(), 'tests', 'temp-files');

// Setup and cleanup
async function setupTestDir() {
  await fs.mkdir(TEST_DIR, { recursive: true });
}

async function cleanupTestDir() {
  try {
    await fs.rm(TEST_DIR, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

describe('File Editing Tools', () => {
  it('should write a file using write_file tool', async () => {
    await setupTestDir();
    
    const todoManager = new TodoManager();
    const registry = createToolRegistry(TEST_DIR, todoManager);
    
    const testFile = 'test.txt';
    const testContent = 'Hello, World!';
    
    // Get the write_file tool
    const writeTool = registry.getTool('write_file');
    assert.ok(writeTool, 'write_file tool should exist');
    
    // Execute the tool
    const result = await writeTool(path: testFile, content: testContent });
    
    // Verify result
    assert.ok(result.includes('written'), 'Should return success message');
    
    // Verify file was created
    const filePath = path.join(TEST_DIR, testFile);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    assert.strictEqual(fileContent, testContent);
    
    await cleanupTestDir();
  });

  it('should create a new file using create_file tool', async () => {
    await setupTestDir();
    
    const todoManager = new TodoManager();
    const registry = createToolRegistry(TEST_DIR, todoManager);
    
    const testFile = 'new-file.ts';
    const testContent = 'console.log("Hello from Moth!");';
    
    // Get the create_file tool
    const createTool = registry.getTool('create_file');
    assert.ok(createTool, 'create_file tool should exist');
    
    // Execute the tool
    const result = await createTool({ path: testFile, content: testContent });
    
    // Verify result
    assert.ok(result.includes('created'), 'Should return success message');
    
    // Verify file was created
    const filePath = path.join(TEST_DIR, testFile);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    assert.strictEqual(fileContent, testContent);
    
    await cleanupTestDir();
  });

  it('should read a file using read_file tool', async () => {
    await setupTestDir();
    
    const todoManager = new TodoManager();
    const registry = createToolRegistry(TEST_DIR, todoManager);
    
    const testFile = 'read-test.txt';
    const testContent = 'This is test content';
    
    // Create a file first
    const filePath = path.join(TEST_DIR, testFile);
    await fs.writeFile(filePath, testContent, 'utf-8');
    
    // Get the read_file tool
    const readTool = registry.getTool('read_file');
    assert.ok(readTool, 'read_file tool should exist');
    
    // Execute the tool
    const result = await readTool({ path: testFile });
    
    // Verify result
    assert.strictEqual(result, testContent);
    
    await cleanupTestDir();
  });

  it('should apply a diff using edit_file tool', async () => {
    await setupTestDir();
    
    const todoManager = new TodoManager();
    const registry = createToolRegistry(TEST_DIR, todoManager);
    
    const testFile = 'edit-test.ts';
    const originalContent = `function greet(name: string) {
  return "Hello, " + name;
}`;
    
    // Create original file
    const filePath = path.join(TEST_DIR, testFile);
    await fs.writeFile(filePath, originalContent, 'utf-8');
    
    // Create a unified diff to change the greeting
    const diff = `--- edit-test.ts
+++ edit-test.ts
@@ -1,3 +1,3 @@
 function greet(name: string) {
-  return "Hello, " + name;
+  return "Hi, " + name + "!";
 }`;
    
    // Get the edit_file tool
    const editTool = registry.getTool('edit_file');
    assert.ok(editTool, 'edit_file tool should exist');
    
    // Execute the tool
    const result = await editTool({ path: testFile, diff });
    
    // Verify result
    assert.ok(result.includes('success'), 'Should return success message');
    
    // Verify file was modified
    const modifiedContent = await fs.readFile(filePath, 'utf-8');
    assert.ok(modifiedContent.includes('Hi, '), 'Should contain modified greeting');
    assert.ok(modifiedContent.includes('!'), 'Should contain exclamation mark');
    
    await cleanupTestDir();
  });

  it('should fail when trying to create an existing file', async () => {
    await setupTestDir();
    
    const todoManager = new TodoManager();
    const registry = createToolRegistry(TEST_DIR, todoManager);
    
    const testFile = 'existing.txt';
    
    // Create file first
    const filePath = path.join(TEST_DIR, testFile);
    await fs.writeFile(filePath, 'existing content', 'utf-8');
    
    // Try to create it again
    const createTool = registry.getTool('create_file');
    const result = await createTool({ path: testFile, content: 'new content' });
    
    // Should fail with error message
    assert.ok(result.includes('Error') || result.includes('exists'), 'Should return error message');
    
    // Original content should be unchanged
    const content = await fs.readFile(filePath, 'utf-8');
    assert.strictEqual(content, 'existing content');
    
    await cleanupTestDir();
  });
});

console.log('✅ All file editing tool tests completed');
