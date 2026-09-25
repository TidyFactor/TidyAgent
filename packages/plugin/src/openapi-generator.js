/**
 * Tidy Ecosystem — OpenAPI 3.1 & AI Plugin Specification Generator
 * Generates standards-compliant OpenAPI 3.1 specifications and ai-plugin.json manifests
 * for ChatGPT Actions, Custom GPTs, and OpenAPI-compatible agent gateways.
 *
 * @module @tidy/plugin/openapi-generator
 * @version 1.6.0
 * @license Apache-2.0
 */

'use strict';

/**
 * Generate OpenAPI 3.1.0 Specification
 * @param {object} options - Configuration options
 * @param {string} [options.serverUrl='https://tidyfactor.com'] - Base API server URL
 * @param {string} [options.title='TidyAgent Sovereign Control Plane API'] - API Title
 * @param {string} [options.version='1.6.0'] - API Version
 * @returns {object} OpenAPI 3.1.0 document
 */
function generateOpenApiSpec(options = {}) {
  const serverUrl = options.serverUrl || 'https://tidyfactor.com';
  const title = options.title || 'TidyAgent Sovereign Control Plane API';
  const version = options.version || '1.6.0';

  return {
    openapi: '3.1.0',
    info: {
      title,
      version,
      description: 'Sovereign Control Plane API providing 5-Tier Context Compilation, 8-Taxonomy Memory, Capability-First Intent Routing, and Hybrid Knowledge Search for AI Agents.',
      contact: {
        name: 'TidyFactor Team',
        url: 'https://tidyfactor.com',
        email: 'support@tidyfactor.com'
      },
      license: {
        name: 'Apache-2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html'
      }
    },
    servers: [
      {
        url: serverUrl,
        description: 'TidyFactor Cloud Sovereign Gateway'
      }
    ],
    paths: {
      '/api/v1/context/compile': {
        post: {
          operationId: 'tidyContextCompile',
          summary: 'Compile 5-Tier Context Package',
          description: 'Compiles a lean, budget-aware context package from 5 tiers (Global, Project, Task, Session, Working) for LLM prompts without token bloat.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    task: {
                      type: 'string',
                      description: 'Current task description or prompt to assemble context for'
                    },
                    domain: {
                      type: 'string',
                      enum: ['dev', 'marketing', 'devops', 'office', 'design', 'general'],
                      default: 'general',
                      description: 'Target operational domain for Contextual Firewall'
                    },
                    max_tokens: {
                      type: 'integer',
                      default: 2000,
                      minimum: 200,
                      maximum: 8000,
                      description: 'Maximum token budget ceiling'
                    },
                    format: {
                      type: 'string',
                      enum: ['markdown', 'system_prompt', 'json'],
                      default: 'markdown',
                      description: 'Desired output format'
                    },
                    bypass_firewall: {
                      type: 'boolean',
                      default: false,
                      description: 'Bypass domain firewall check'
                    }
                  },
                  required: ['task']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Context successfully compiled',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      compiled_text: { type: 'string' },
                      tokens_estimated: { type: 'integer' },
                      domain: { type: 'string' },
                      firewall_status: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/intent/route': {
        post: {
          operationId: 'tidyIntentRoute',
          summary: 'Route User Intent & Recommend Skills',
          description: 'Analyzes user query, decomposes intent, matches relevant domain, and recommends optimal skills strictly capped at 2-3 maximum.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    prompt: {
                      type: 'string',
                      description: 'User instruction or prompt to analyze and route'
                    }
                  },
                  required: ['prompt']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Intent routed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      domain: { type: 'string' },
                      intent_type: { type: 'string' },
                      recommended_skills: {
                        type: 'array',
                        items: { type: 'string' },
                        maxItems: 3
                      },
                      suggested_tools: {
                        type: 'array',
                        items: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/v1/taxonomy/classify': {
        post: {
          operationId: 'tidyTaxonomyClassify',
          summary: 'Classify Memory into 8 Taxonomies',
          description: 'Classifies text or memory into one of the 8 canonical memory taxonomies (facts, decisions, preferences, assets, references, previous_outputs, lessons, relationships).',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    text: {
                      type: 'string',
                      description: 'Text or memory content to classify'
                    },
                    tags: {
                      type: 'array',
                      items: { type: 'string' },
                      description: 'Optional tags or keywords'
                    }
                  },
                  required: ['text']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Memory classified successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      canonical_taxonomy: {
                        type: 'string',
                        enum: ['facts', 'decisions', 'preferences', 'assets', 'references', 'previous_outputs', 'lessons', 'relationships']
                      },
                      confidence: { type: 'number' },
                      rationale: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/mcp/sse': {
        get: {
          operationId: 'mcpSseStream',
          summary: 'Model Context Protocol (MCP) Server-Sent Events Uplink',
          description: 'Full-duplex SSE gateway connecting remote AI agent hosts to TidyFactor tools and dynamic resources.',
          parameters: [
            {
              name: 'token',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Sovereign Tenant Token for database-per-tenant isolation'
            }
          ],
          responses: {
            '200': {
              description: 'SSE stream established',
              content: {
                'text/event-stream': {
                  schema: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Sovereign tenant API token'
        }
      }
    },
    security: [
      { BearerAuth: [] }
    ]
  };
}

/**
 * Generate ChatGPT ai-plugin.json Manifest
 * @param {object} options
 * @param {string} [options.baseUrl='https://tidyfactor.com']
 * @returns {object}
 */
function generateAiPluginManifest(options = {}) {
  const baseUrl = options.baseUrl || 'https://tidyfactor.com';
  return {
    schema_version: 'v1',
    name_for_model: 'tidyagent',
    name_for_human: 'TidyAgent Control Plane',
    description_for_model: 'TidyAgent provides 5-Tier Context Compilation, Capability-First skill routing, and 8-Taxonomy memory. Use it before generating code or architecture to load sovereign rules and eliminate context bloat.',
    description_for_human: 'Sovereign intelligence, persistent SQLite memory, and skill orchestrator for AI.',
    auth: {
      type: 'user_http',
      authorization_type: 'bearer'
    },
    api: {
      type: 'openapi',
      url: `${baseUrl}/.well-known/openapi.json`,
      is_user_authenticated: true
    },
    logo_url: `${baseUrl}/favicon.ico`,
    contact_email: 'support@tidyfactor.com',
    legal_info_url: `${baseUrl}/manifesto`
  };
}

module.exports = {
  generateOpenApiSpec,
  generateAiPluginManifest
};
