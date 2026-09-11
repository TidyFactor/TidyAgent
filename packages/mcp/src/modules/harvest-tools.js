/**
 * Tidy MCP — Knowledge Harvester Tools
 *
 * @module @tidy/mcp/modules/harvest-tools
 */

const core = require('@tidy/core');
const {
  scanKnowledgeSources,
  readHarvestItem,
  importBatchMemories
} = core;

const harvestTools = [
  {
    definition: {
      name: 'tidy_harvest_scan',
      description: 'Scan configured agent knowledge sources for candidate memories without writing to SQLite. Sources include Gemini/Antigravity, Cursor, Windsurf, and workspace agent files.',
      inputSchema: {
        type: 'object',
        properties: {
          custom_dirs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional additional directories to scan'
          },
          limit: { type: 'integer', minimum: 1, maximum: 1000, default: 250 },
          check_existing: { type: 'boolean', default: true, description: 'Mark candidates already present in SQLite' },
          include_content: { type: 'boolean', default: false, description: 'Include full document content in the response' }
        }
      }
    },
    handler: (args) => {
      const result = scanKnowledgeSources({
        customDirs: Array.isArray(args?.custom_dirs) ? args.custom_dirs : [],
        checkExisting: args?.check_existing !== false,
        limit: args?.limit || 250
      });
      if (args?.include_content !== true) {
        result.items = result.items.map(({ content, ...item }) => item);
      }
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_harvest_read',
      description: 'Read one candidate document in full after a tidy_harvest_scan result.',
      inputSchema: {
        type: 'object',
        properties: {
          source_path: { type: 'string', description: 'Candidate source_path returned by tidy_harvest_scan' }
        },
        required: ['source_path']
      }
    },
    handler: (args) => {
      const item = readHarvestItem(args?.source_path);
      return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
    }
  },
  {
    definition: {
      name: 'tidy_harvest_import',
      description: 'Import explicitly selected candidate memories into Tidy SQLite SSOT in one atomic batch. Existing scan-marked duplicates are skipped by default.',
      inputSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                summary: { type: 'string' },
                content: { type: 'string' },
                source: { type: 'string' },
                source_path: { type: 'string' },
                category: { type: 'string', enum: ['fact', 'decision', 'pattern', 'preference', 'task', 'rule'] },
                tier: { type: 'string', enum: ['core', 'project', 'session', 'ephemeral'] },
                importance: { type: 'integer', minimum: 1, maximum: 5 },
                alreadyImported: { type: 'boolean' }
              }
            },
            description: 'Candidates returned by tidy_harvest_scan or explicitly prepared memory objects'
          },
          context_id: { type: 'string', description: 'Optional Tidy context ID for imported memories' },
          skip_existing: { type: 'boolean', default: true, description: 'Skip candidates marked alreadyImported by the scanner' }
        },
        required: ['items']
      }
    },
    handler: (args) => {
      if (!Array.isArray(args?.items) || args.items.length === 0) {
        throw new Error('items must be a non-empty array.');
      }
      const skipExisting = args?.skip_existing !== false;
      const selected = skipExisting ? args.items.filter(item => item?.alreadyImported !== true) : args.items;
      const result = selected.length > 0
        ? importBatchMemories(selected.map(item => ({
          title: item.title,
          summary: item.summary,
          content: item.content,
          source: item.source || 'harvest',
          sourcePath: item.source_path || item.sourcePath,
          category: item.category || 'fact',
          tier: item.tier || 'project',
          importance: item.importance || 3
        })), {
          contextId: args?.context_id
        })
        : { importedCount: 0, skippedCount: args.items.length, imported: [] };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            totalSubmitted: args.items.length,
            importedCount: result.importedCount,
            skippedCount: (args.items.length - result.importedCount),
            imported: result.imported
          }, null, 2)
        }]
      };
    }
  }
];

module.exports = { harvestTools };
