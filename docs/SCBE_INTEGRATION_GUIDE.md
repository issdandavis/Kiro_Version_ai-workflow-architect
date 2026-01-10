# SCBE Integration Guide - Living Document System

## Overview

This guide shows how to integrate SCBE (Secure Context-Based Encryption) envelopes into the Living Document Review & Automation system for enhanced security.

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
# Python dependencies (already in requirements.txt)
pip install -r requirements.txt

# TypeScript dependencies (if using Node.js orchestrator)
npm install zod  # Optional schema validation
```

### 2. Test SCBE Implementation

```bash
# Run Python tests
python tests/test_scbe_envelope.py

# Test standalone SCBE envelope
python src/scbe_envelope.py

# Test TypeScript implementation (if Node.js available)
npx ts-node src/scbe-envelope.ts
```

### 3. Verify Installation

```bash
python -c "from src.scbe_envelope import SCBEEnvelope; print('✅ SCBE ready')"
```

## Integration Patterns

### Pattern 1: Metadata Augmentation (Minimal)

Add SCBE envelope to metadata without changing core flow:

```python
# In src/ingest.py

import sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from scbe_envelope import SCBEEnvelope
import time

def extract_metadata(url: str, content: bytes, content_type: str, raw_file: str) -> dict:
    """Extract metadata with SCBE envelope"""
    
    # ... existing metadata extraction ...
    meta = {
        "url": url,
        "fetched_at": datetime.utcnow().isoformat() + "Z",
        "content_type": content_type,
        "raw_file": raw_file,
        "title": "",
        "authors": [],
    }
    
    # Add SCBE envelope (optional, for audit trail)
    envelope = SCBEEnvelope()
    envelope.context = envelope.create_context(
        device_id="ingestion_worker_1",
        threat_level=2,  # Low threat for public URLs
        entropy=0.65,    # Moderate entropy
        server_load=0.30,  # Current load
        stability=0.95   # High stability
    )
    
    envelope.intent = envelope.create_intent(
        primary="fetch",
        modifier="catalog",
        harmonic=2,
        phase_deg=int((time.time() % 3600) / 3600 * 360)  # Current phase in hour
    )
    
    envelope.trajectory = envelope.create_trajectory(
        epoch=int(time.time()) - 1800,  # 30 min window
        period_s=3600,
        slot_id="hourly-ingestion",
        waypoint=0
    )
    
    envelope.aad = envelope.create_aad(
        route_hint="public-fetch",
        run_id=f"ingest_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
        step_no=1
    )
    
    envelope.commit = envelope.compute_commits()
    
    # Store envelope in metadata
    meta["scbe_envelope"] = envelope.to_dict()
    
    return meta
```

### Pattern 2: Gateway Verification (Recommended)

Add verification at the API gateway for protected endpoints:

```typescript
// In server/routes.ts

import { SCBEEnvelope, SCBEVerifier, generateNoiseResponse } from '../src/scbe-envelope';

// Initialize verifier (do this once at startup)
const scbeVerifier = new SCBEVerifier();

// Register allowed intents
scbeVerifier.registerIntent('fetch', 'catalog', 2, ['public-fetch', 'github-api']);
scbeVerifier.registerIntent('process', 'analyze', 3, ['openai', 'anthropic']);

// Set initial trust scores
scbeVerifier.setTrust('openai', 0.85);
scbeVerifier.setTrust('anthropic', 0.90);
scbeVerifier.setTrust('github-api', 0.95);

// Protected endpoint
app.post('/api/protected/ingest', async (req, res) => {
  try {
    // Extract envelope from request
    const envelopeData = req.body.envelope;
    if (!envelopeData) {
      return res.status(400).json({ error: 'Missing envelope' });
    }
    
    const envelope = SCBEEnvelope.fromObject(envelopeData);
    
    // Verify envelope
    const result = scbeVerifier.verifyFull(envelope);
    
    if (!result.valid) {
      // Fail-to-noise: return deterministic noise response
      const noise = generateNoiseResponse(envelope, 'gateway_seed_' + req.ip);
      
      // Log rejection (for monitoring)
      console.log(`SCBE rejection: ${result.reason} - ${result.error}`);
      
      // Emit metric
      // metrics.increment('scbe.verify.reject_total', { reason: result.reason });
      
      return res.json(noise);
    }
    
    // Valid request - process normally
    // ... existing ingestion logic ...
    
    res.json({ success: true, message: 'Ingestion started' });
    
  } catch (error) {
    console.error('SCBE verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Pattern 3: Full Integration with Trust Scoring

Implement continuous trust updates based on provider behavior:

```typescript
// In server/services/orchestrator.ts

import { SCBEVerifier } from '../src/scbe-envelope';

class OrchestratorService {
  private verifier: SCBEVerifier;
  
  constructor() {
    this.verifier = new SCBEVerifier();
    this.loadConfiguration();
  }
  
  private loadConfiguration() {
    // Load allowed intents from config
    const config = {
      intents: [
        { primary: 'fetch', modifier: 'catalog', harmonic: 2, routes: ['github-api'] },
        { primary: 'process', modifier: 'analyze', harmonic: 3, routes: ['openai', 'anthropic'] }
      ],
      providers: [
        { name: 'openai', initialTrust: 0.85 },
        { name: 'anthropic', initialTrust: 0.90 }
      ]
    };
    
    config.intents.forEach(intent => {
      this.verifier.registerIntent(
        intent.primary,
        intent.modifier,
        intent.harmonic,
        intent.routes
      );
    });
    
    config.providers.forEach(provider => {
      this.verifier.setTrust(provider.name, provider.initialTrust);
    });
  }
  
  async executeTask(envelope: any, task: any) {
    // Verify envelope
    const result = this.verifier.verifyFull(envelope);
    
    if (!result.valid) {
      return generateNoiseResponse(envelope, 'orchestrator_seed');
    }
    
    // Execute task
    const provider = envelope.aad.route_hint;
    let validity = 0;
    
    try {
      const response = await this.callProvider(provider, task);
      
      // Compute validity score (0-1)
      validity = this.computeValidity(response, task);
      
      // Update trust
      this.verifier.updateTrust(provider, validity);
      
      return response;
      
    } catch (error) {
      // Failed execution = 0 validity
      this.verifier.updateTrust(provider, 0);
      throw error;
    }
  }
  
  private computeValidity(response: any, task: any): number {
    // Implement validity scoring based on:
    // - Response coherence
    // - Neural energy check
    // - Historical comparison
    
    let score = 1.0;
    
    // Example: Check response length reasonableness
    if (response.length < 10) {
      score *= 0.5;
    }
    
    // Example: Check for expected patterns
    if (!response.includes(task.expectedKeyword)) {
      score *= 0.7;
    }
    
    return Math.max(0, Math.min(1, score));
  }
}
```

## Configuration

### Environment Variables

```bash
# SCBE Configuration
SCBE_ENABLED=true
SCBE_TRUST_THRESHOLD=0.3
SCBE_PHASE_TOLERANCE=15
SCBE_LOG_LEVEL=info

# Trust decay parameters
SCBE_TRUST_ALPHA=0.9
SCBE_AUTO_EXCLUDE_THRESHOLD=0.3
```

### Configuration File (config/scbe.json)

```json
{
  "enabled": true,
  "verification": {
    "trustThreshold": 0.3,
    "phaseTolerance": 15,
    "enableNeuralGate": false,
    "enableSwarmTrust": true
  },
  "intents": [
    {
      "primary": "fetch",
      "modifier": "catalog",
      "harmonic": 2,
      "allowedRoutes": ["public-fetch", "github-api"]
    },
    {
      "primary": "process",
      "modifier": "analyze",
      "harmonic": 3,
      "allowedRoutes": ["openai", "anthropic", "gemini"]
    }
  ],
  "providers": [
    {
      "name": "openai",
      "initialTrust": 0.85,
      "category": "llm"
    },
    {
      "name": "anthropic",
      "initialTrust": 0.90,
      "category": "llm"
    },
    {
      "name": "github-api",
      "initialTrust": 0.95,
      "category": "data"
    }
  ],
  "trustDecay": {
    "alpha": 0.9,
    "autoExcludeThreshold": 0.3,
    "decayWindow": 20
  }
}
```

## Monitoring & Observability

### Metrics to Track

```typescript
// In server/services/metrics.ts

export interface SCBEMetrics {
  // Rejection counters
  'scbe.verify.reject_total': { tags: { reason: string } };
  
  // Phase skew (clock drift detection)
  'scbe.phase.skew_deg': { value: number };
  
  // Swarm health
  'swarm.trust.avg': { value: number };
  'swarm.trust': { tags: { agent: string }, value: number };
  
  // Provider health
  'provider.coherence': { tags: { provider: string }, value: number };
}

// Example: Prometheus-style metrics
class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  
  increment(metric: string, tags?: Record<string, string>) {
    const key = this.makeKey(metric, tags);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }
  
  gauge(metric: string, value: number, tags?: Record<string, string>) {
    const key = this.makeKey(metric, tags);
    this.gauges.set(key, value);
  }
  
  private makeKey(metric: string, tags?: Record<string, string>): string {
    if (!tags) return metric;
    const tagStr = Object.entries(tags)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${metric}{${tagStr}}`;
  }
  
  export(): string {
    // Export in Prometheus format
    let output = '';
    
    this.counters.forEach((value, key) => {
      output += `${key} ${value}\n`;
    });
    
    this.gauges.forEach((value, key) => {
      output += `${key} ${value}\n`;
    });
    
    return output;
  }
}

export const metrics = new MetricsCollector();
```

### Logging

```typescript
// In server/services/audit-logger.ts

interface AuditLog {
  audit_id: string;
  trace_id: string;
  envelope: any;
  decision: 'accepted' | 'rejected';
  reason?: string;
  timestamp: string;
}

class AuditLogger {
  log(entry: AuditLog) {
    // Store to database or file
    console.log(JSON.stringify(entry));
    
    // In production: send to logging service (e.g., Winston, Bunyan)
    // logger.info('SCBE audit', entry);
  }
  
  logRejection(envelope: any, reason: string, error: string) {
    this.log({
      audit_id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trace_id: envelope.aad?.run_id || 'unknown',
      envelope: envelope,
      decision: 'rejected',
      reason: `${reason}: ${error}`,
      timestamp: new Date().toISOString()
    });
  }
  
  logAcceptance(envelope: any) {
    this.log({
      audit_id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trace_id: envelope.aad?.run_id || 'unknown',
      envelope: envelope,
      decision: 'accepted',
      timestamp: new Date().toISOString()
    });
  }
}

export const auditLogger = new AuditLogger();
```

## Testing

### Run Tests

```bash
# Python tests
python -m pytest tests/test_scbe_envelope.py -v

# Or with unittest
python tests/test_scbe_envelope.py

# TypeScript tests (if using Jest)
npm test -- --testMatch="**/test_scbe*.test.ts"
```

### Manual Testing

```python
# Test envelope creation
python << 'EOF'
from src.scbe_envelope import SCBEEnvelope, SCBEVerifier
import time

# Create envelope
envelope = SCBEEnvelope()
envelope.context = envelope.create_context("test_device", 3, 0.7, 0.5, 0.9)
envelope.intent = envelope.create_intent("fetch", "test", 3, 45)
envelope.trajectory = envelope.create_trajectory(
    int(time.time()) - 1800, 3600, "test_slot", 1
)
envelope.aad = envelope.create_aad("github-api", "test_run", 1)
envelope.commit = envelope.compute_commits()

# Verify
verifier = SCBEVerifier()
verifier.allowed_intents[("fetch", "test", 3)] = ["github-api"]
verifier.trust_scores["github-api"] = 0.9

valid, error = verifier.verify_full(envelope)
print(f"Valid: {valid}")
if error:
    print(f"Error: {error}")
else:
    print("✅ Verification passed!")
EOF
```

## Rollout Checklist

### Week 1: Foundation ✅
- [x] SCBE envelope implementation (Python + TypeScript)
- [x] Schema validation
- [x] Fail-to-noise pattern
- [ ] Wire into metadata (Pattern 1)

### Week 2: Verification
- [ ] Deploy intent/trajectory/phase checks
- [ ] Add observability metrics
- [ ] Test with permissive thresholds

### Week 3: Trust Scoring
- [ ] Implement trust decay
- [ ] Add validity scoring
- [ ] Deploy in shadow mode

### Week 4: Production
- [ ] Enable auto-exclusion
- [ ] Full gateway integration (Pattern 2)
- [ ] Monitor and tune thresholds

## Troubleshooting

### Issue: "Module not found: scbe_envelope"

```bash
# Fix Python path
export PYTHONPATH="${PYTHONPATH}:${PWD}/src"

# Or add to script
import sys
sys.path.insert(0, 'src')
```

### Issue: "Commit hash mismatch"

This usually means the envelope was modified after commits were computed. Recompute commits:

```python
envelope.commit = envelope.compute_commits()
```

### Issue: "Phase mismatch" errors

Adjust phase tolerance in verifier or check clock synchronization:

```python
# In verifier code, increase tolerance
phase_tolerance = 30  # degrees (was 15)
```

## FAQ

**Q: Do I need to integrate SCBE everywhere?**  
A: No. Start with Pattern 1 (metadata augmentation) for audit trail. Add Pattern 2 (gateway verification) only for sensitive endpoints.

**Q: What's the performance impact?**  
A: Minimal. Envelope creation ~1ms, verification ~5ms. Negligible compared to network latency.

**Q: Can I use SCBE without crypto?**  
A: Yes! The verification pipeline (steps 1-6) provides strong security without ML-KEM/DSA. Add crypto later.

**Q: How do I handle legacy clients?**  
A: Make SCBE optional initially. Check for `envelope` field in request. If missing, allow through with warning log.

## Next Steps

1. **Review** the [SCBE Envelope System docs](SCBE_ENVELOPE_SYSTEM.md)
2. **Test** the implementation with `python tests/test_scbe_envelope.py`
3. **Integrate** using Pattern 1 (metadata augmentation)
4. **Monitor** metrics and adjust thresholds
5. **Upgrade** to Pattern 2 (gateway verification) when ready

---

**Status**: Ready for Integration  
**Estimated Time**: 2-4 hours for Pattern 1, 1-2 days for Pattern 2  
**Support**: See docs/SCBE_ENVELOPE_SYSTEM.md for complete reference
