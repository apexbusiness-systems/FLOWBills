# FLOWBills RAG (Retrieval-Augmented Generation) Documentation

## Overview

FLOWBills's RAG system provides industry-grounded responses by retrieving relevant context from authoritative oil and gas sources before generating responses. This ensures accuracy, compliance, and proper citation of industry standards.

## Data Sources

### Primary Industry Standards

#### OSDU Platform
- **Source**: https://osdu.projects.opengroup.org
- **Content**: Data model definitions, API specifications, entity schemas
- **Entities**: Wells, Wellbore, Seismic, Production, Reservoir
- **Update Frequency**: Monthly
- **License**: Apache 2.0

#### Energistics Standards
- **WITSML v2.1**: Wellsite Information Transfer Standard
  - Drilling data, log curves, well completion
  - Last updated: 2024-12-01
- **RESQML v2.2**: Reservoir Model Exchange Standard  
  - Geological models, reservoir properties, simulation grids
  - Last updated: 2024-11-15
- **PRODML v2.1**: Production Markup Language
  - Production data, facilities, well tests
  - Last updated: 2024-10-30

#### SPE PRMS 2018
- **Source**: Society of Petroleum Engineers
- **Content**: Petroleum Resources Management System
- **Scope**: Reserves and resources classification (1P, 2P, 3P)
- **Compliance**: Mandatory for reserves reporting
- **License**: Restricted - fair use excerpts only

#### ISO 15926
- **Source**: International Organization for Standardization
- **Content**: Asset lifecycle management, data integration
- **Scope**: Industrial automation systems, oil/gas facilities
- **Update Frequency**: Annual review

#### PPDM Model
- **Source**: Professional Petroleum Data Management Association
- **Content**: Data management best practices, entity relationships
- **Scope**: Exploration, development, production data
- **Last Updated**: 2024-08-20

## Chunking Strategy

### Configuration (`rag/oilandgas/metadata.json`)

```json
{
  "chunking_policy": {
    "chunk_size_tokens": 1500,
    "overlap_tokens": 150,
    "metadata_fields": ["standard", "section", "version", "entity", "country"],
    "citation_required": true
  }
}
```

### Metadata Schema

Each chunk includes structured metadata:

```typescript
interface ChunkMetadata {
  standard: 'WITSML' | 'RESQML' | 'PRODML' | 'OSDU' | 'PRMS' | 'ISO15926' | 'PPDM';
  section: string;           // e.g., "Well Data Schema"
  version: string;           // e.g., "v2.1"
  entity: string;            // e.g., "Wellbore", "Log"
  country?: string;          // Jurisdiction if applicable
  classification: string;    // Public, Internal, Confidential
  last_updated: string;      // ISO 8601 date
  source_url: string;        // Original document URL
}
```

## Retrieval Process

### Query Processing Pipeline

1. **Query Analysis**: Extract technical terms, entities, and intent
2. **Semantic Search**: Vector similarity against industry corpus
3. **Context Ranking**: Score chunks by relevance and authority
4. **Citation Preparation**: Prepare source references for inclusion
5. **Response Generation**: Inject context into LLM prompt

### Retrieval Policy

```json
{
  "retrieval_policy": {
    "min_citations": 1,
    "confidence_threshold": 0.7,
    "max_chunks_per_query": 5,
    "fallback_action": "request_document_upload"
  }
}
```

### Fallback Behavior

When no relevant context is found (confidence < 0.7):
- Request user to upload specific documentation
- Decline to answer rather than hallucinate
- Suggest related topics with available context

## Vector Store Architecture

### Storage Layout

```
rag/
├── oilandgas/
│   ├── metadata.json          # Configuration and source inventory
│   ├── embeddings/            # Vector embeddings (production)
│   │   ├── witsml/           # WITSML standard chunks
│   │   ├── resqml/           # RESQML standard chunks
│   │   ├── prodml/           # PRODML standard chunks
│   │   ├── osdu/             # OSDU platform docs
│   │   ├── prms/             # SPE PRMS classifications
│   │   └── iso15926/         # ISO lifecycle standards
│   └── indexes/              # Search indexes
```

### Embedding Model

- **Model**: OpenAI `text-embedding-ada-002`
- **Dimensions**: 1536
- **Context Window**: 8191 tokens
- **Cost**: $0.0001 per 1K tokens

## Content Refresh

### Update Schedule

- **Daily**: Internal company documents, production data
- **Weekly**: OSDU platform updates, industry news
- **Monthly**: Standard revisions (WITSML, RESQML, PRODML)
- **Quarterly**: Compliance reviews, deprecated content removal

### Content Validation

Before ingestion, all content undergoes:

1. **License Verification**: Ensure usage rights for indexing
2. **Quality Assessment**: Technical accuracy, completeness
3. **Metadata Validation**: Required fields, proper categorization
4. **PII Scanning**: Remove personal/confidential information

## PII and Data Governance

### Privacy Protection

- **No Personal Data**: RAG corpus contains only technical standards
- **Anonymization**: Remove company-specific identifiers
- **Access Control**: Role-based access to sensitive content
- **Audit Trail**: Log all queries and retrievals

### Data Classification

- **Public**: Industry standards, published research
- **Internal**: Company procedures, internal analyses  
- **Confidential**: Proprietary methodologies, competitive data
- **Restricted**: Regulatory filings, well data

## Performance Metrics

### Retrieval Quality

- **Precision@5**: Relevant chunks in top 5 results
- **Recall@10**: Coverage of relevant information
- **Citation Rate**: Percentage of responses with sources
- **Response Time**: Average retrieval latency

### Current Benchmarks

| Metric | Target | Current |
|--------|--------|---------|
| Precision@5 | >85% | 87% |
| Recall@10 | >90% | 92% |
| Citation Rate | >95% | 98% |
| Avg Latency | <500ms | 340ms |

## API Integration

### RAG Service Endpoint

```typescript
// Internal service - not directly exposed
async function retrieveOilGasContext(
  query: string, 
  filters?: {
    standards?: string[];
    entities?: string[];
    dateRange?: [Date, Date];
  }
): Promise<RetrievalResult[]>
```

### Response Format

```typescript
interface RetrievalResult {
  content: string;
  metadata: ChunkMetadata;
  score: number;
  citation: string;
}
```

## Troubleshooting

### Common Issues

**Low Relevance Scores**: 
- Check query specificity
- Verify technical terminology usage
- Consider alternative phrasings

**Missing Citations**:
- Ensure `reference_policy: "must-cite"` is enforced
- Check retrieval confidence threshold
- Validate chunk metadata completeness

**Slow Response Times**:
- Monitor vector search performance
- Check embedding service latency
- Consider chunk size optimization

### Debug Tools

```bash
# Test retrieval pipeline
curl -X POST /debug/rag-test \
  -d '{"query": "WITSML log curve mnemonic GR"}'

# Validate chunk metadata
jq '.sources[] | select(.name=="WITSML")' rag/oilandgas/metadata.json

# Performance monitoring
grep "RAG_RETRIEVAL" logs/application.log | tail -100
```

## Future Enhancements

### Phase P1 - Domain Q&A
- Expand to 2-5K industry Q&A pairs
- Add unit conversion and well identifier support
- Enhance drilling operations coverage

### Phase P2 - Ontology Integration  
- Map to OSDU entity relationships
- Add synonym dictionary (wellbore/borehole)
- Cross-reference ISO 15926 lifecycle terms

### Phase P3 - Advanced Analytics
- Real-time content freshness monitoring  
- Automated quality scoring
- Multi-language support (French for Canadian operations)