/**
 * SCBE (Secure Context-Based Encryption) Envelope System - TypeScript Implementation
 * Version: 2.0
 * 
 * Provides deterministic context handling, verification pipeline,
 * and fail-to-noise security patterns for the orchestrator/gateway.
 */

import crypto from 'crypto';

export const SCBE_VERSION = 'scbe-2.0';

export interface Context {
  ts: number;              // seconds, not milliseconds
  device_id: string;
  threat_level: number;    // 1-5
  entropy: number;         // [0,1] clamped
  server_load: number;     // [0,1] clamped
  stability: number;       // [0,1] clamped
}

export interface Intent {
  primary: string;         // e.g., "sil'kor"
  modifier: string;        // e.g., "nav'een"
  harmonic: number;        // 1..7
  phase_deg: number;       // 0..359
}

export interface Trajectory {
  epoch: number;           // start of policy window
  period_s: number;        // phase period in seconds
  slot_id: string;         // policy schedule id
  waypoint: number;        // index in schedule
}

export interface AAD {
  route_hint: string;      // allowed provider
  run_id: string;
  step_no: number;
}

export interface Commit {
  ctx_sha256: string;
  intent_sha256: string;
  traj_sha256: string;
  aad_sha256: string;
}

export interface CryptoParams {
  kem: string;             // e.g., "ML-KEM-768"
  sig: string;             // e.g., "ML-DSA-65"
  h: {                     // chaos parameters
    d: number;
    R: number;
    H: number;
    n_iter: number;
  };
  salt_q_b64: string;      // per-query salt for chaos KDF
  cipher_b64: string;      // SCBE ciphertext
}

export interface Signatures {
  orchestrator_sig_b64: string | null;
  provider_sig_b64: string | null;
}

export interface SCBEEnvelopeData {
  ver: string;
  ctx: Context;
  intent: Intent;
  trajectory: Trajectory;
  aad: AAD;
  commit: Commit;
  crypto: CryptoParams;
  sig: Signatures;
}

export class SCBEEnvelope {
  ver: string = SCBE_VERSION;
  ctx?: Context;
  intent?: Intent;
  trajectory?: Trajectory;
  aad?: AAD;
  commit?: Commit;
  crypto?: CryptoParams;
  sig?: Signatures;

  /**
   * Clamp float values to [min, max]
   */
  static clamp(value: number, min: number = 0, max: number = 1): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Canonicalize object to deterministic JSON string.
   * Sorts keys alphabetically for consistent hashing.
   */
  static canonicalize<T>(obj: T): string {
    if (typeof obj !== 'object' || obj === null) {
      return JSON.stringify(obj);
    }

    const sorted: any = {};
    Object.keys(obj as any)
      .sort()
      .forEach(key => {
        sorted[key] = (obj as any)[key];
      });

    return JSON.stringify(sorted);
  }

  /**
   * Compute SHA256 hash and return as hex string
   */
  static sha256Hex(data: string): string {
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Create clamped context with current timestamp
   */
  static createContext(
    deviceId: string,
    threatLevel: number,
    entropy: number,
    serverLoad: number,
    stability: number
  ): Context {
    return {
      ts: Math.floor(Date.now() / 1000), // seconds, not milliseconds
      device_id: deviceId,
      threat_level: Math.max(1, Math.min(5, Math.floor(threatLevel))),
      entropy: this.clamp(entropy),
      server_load: this.clamp(serverLoad),
      stability: this.clamp(stability)
    };
  }

  /**
   * Create intent with validation
   */
  static createIntent(
    primary: string,
    modifier: string,
    harmonic: number,
    phaseDeg: number
  ): Intent {
    return {
      primary,
      modifier,
      harmonic: Math.max(1, Math.min(7, Math.floor(harmonic))),
      phase_deg: phaseDeg % 360
    };
  }

  /**
   * Create trajectory specification
   */
  static createTrajectory(
    epoch: number,
    periodS: number,
    slotId: string,
    waypoint: number
  ): Trajectory {
    return {
      epoch,
      period_s: periodS,
      slot_id: slotId,
      waypoint
    };
  }

  /**
   * Create additional authenticated data
   */
  static createAAD(routeHint: string, runId: string, stepNo: number): AAD {
    return {
      route_hint: routeHint,
      run_id: runId,
      step_no: stepNo
    };
  }

  /**
   * Compute cryptographic commitments for all components
   */
  computeCommits(): Commit {
    if (!this.ctx || !this.intent || !this.trajectory || !this.aad) {
      throw new Error('All envelope components must be set before computing commits');
    }

    return {
      ctx_sha256: SCBEEnvelope.sha256Hex(SCBEEnvelope.canonicalize(this.ctx)),
      intent_sha256: SCBEEnvelope.sha256Hex(SCBEEnvelope.canonicalize(this.intent)),
      traj_sha256: SCBEEnvelope.sha256Hex(SCBEEnvelope.canonicalize(this.trajectory)),
      aad_sha256: SCBEEnvelope.sha256Hex(SCBEEnvelope.canonicalize(this.aad))
    };
  }

  /**
   * Verify that all commit hashes match current state
   */
  verifyCommits(): boolean {
    if (!this.commit) {
      return false;
    }

    const expected = this.computeCommits();
    return (
      expected.ctx_sha256 === this.commit.ctx_sha256 &&
      expected.intent_sha256 === this.commit.intent_sha256 &&
      expected.traj_sha256 === this.commit.traj_sha256 &&
      expected.aad_sha256 === this.commit.aad_sha256
    );
  }

  /**
   * Convert envelope to plain object
   */
  toObject(): SCBEEnvelopeData {
    return {
      ver: this.ver,
      ctx: this.ctx!,
      intent: this.intent!,
      trajectory: this.trajectory!,
      aad: this.aad!,
      commit: this.commit!,
      crypto: this.crypto!,
      sig: this.sig || { orchestrator_sig_b64: null, provider_sig_b64: null }
    };
  }

  /**
   * Convert envelope to JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.toObject(), null, 2);
  }

  /**
   * Create envelope from plain object
   */
  static fromObject(data: SCBEEnvelopeData): SCBEEnvelope {
    const envelope = new SCBEEnvelope();
    envelope.ver = data.ver;
    envelope.ctx = data.ctx;
    envelope.intent = data.intent;
    envelope.trajectory = data.trajectory;
    envelope.aad = data.aad;
    envelope.commit = data.commit;
    envelope.crypto = data.crypto;
    envelope.sig = data.sig;
    return envelope;
  }

  /**
   * Parse envelope from JSON string
   */
  static fromJSON(json: string): SCBEEnvelope {
    const data = JSON.parse(json);
    return this.fromObject(data);
  }
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
  reason?: string;
}

export class SCBEVerifier {
  private allowedIntents: Map<string, string[]> = new Map();
  private trustScores: Map<string, number> = new Map();

  /**
   * Register allowed intent-to-route mappings
   */
  registerIntent(primary: string, modifier: string, harmonic: number, allowedRoutes: string[]): void {
    const key = `${primary}:${modifier}:${harmonic}`;
    this.allowedIntents.set(key, allowedRoutes);
  }

  /**
   * Set trust score for a provider/agent
   */
  setTrust(provider: string, trust: number): void {
    this.trustScores.set(provider, trust);
  }

  /**
   * Update trust score with exponential moving average
   */
  updateTrust(provider: string, validity: number, alpha: number = 0.9): void {
    const currentTrust = this.trustScores.get(provider) || 0.5;
    const newTrust = alpha * currentTrust + (1 - alpha) * validity;
    this.trustScores.set(provider, newTrust);
  }

  /**
   * Step 1: Schema validation and commit verification
   */
  verifySchema(envelope: SCBEEnvelope): VerificationResult {
    if (!envelope.ctx || !envelope.intent || !envelope.trajectory || 
        !envelope.aad || !envelope.commit || !envelope.crypto) {
      return { valid: false, error: 'Missing required envelope components', reason: 'schema' };
    }

    // Verify commits
    if (!envelope.verifyCommits()) {
      return { valid: false, error: 'Commit hash mismatch - envelope tampering detected', reason: 'schema' };
    }

    // Verify clamping
    if (envelope.ctx.entropy < 0 || envelope.ctx.entropy > 1) {
      return { valid: false, error: 'Entropy out of bounds', reason: 'schema' };
    }
    if (envelope.ctx.server_load < 0 || envelope.ctx.server_load > 1) {
      return { valid: false, error: 'Server load out of bounds', reason: 'schema' };
    }
    if (envelope.ctx.stability < 0 || envelope.ctx.stability > 1) {
      return { valid: false, error: 'Stability out of bounds', reason: 'schema' };
    }

    return { valid: true };
  }

  /**
   * Step 3: Intent policy verification
   */
  verifyIntentPolicy(envelope: SCBEEnvelope): VerificationResult {
    const intentKey = `${envelope.intent!.primary}:${envelope.intent!.modifier}:${envelope.intent!.harmonic}`;
    const allowedRoutes = this.allowedIntents.get(intentKey) || [];

    if (!allowedRoutes.includes(envelope.aad!.route_hint)) {
      return {
        valid: false,
        error: `Intent ${intentKey} not allowed for route ${envelope.aad!.route_hint}`,
        reason: 'intent'
      };
    }

    return { valid: true };
  }

  /**
   * Step 4: Trajectory window and phase lock verification
   */
  verifyTrajectory(envelope: SCBEEnvelope): VerificationResult {
    const currentTime = Math.floor(Date.now() / 1000);

    // Check time window
    if (currentTime < envelope.trajectory!.epoch) {
      return { valid: false, error: 'Request before trajectory epoch', reason: 'trajectory' };
    }

    // Compute current phase
    const elapsed = currentTime - envelope.trajectory!.epoch;
    const currentPhaseDeg = (360 * (elapsed / envelope.trajectory!.period_s)) % 360;

    // Check phase lock (with tolerance)
    const phaseTolerance = 15; // degrees
    const phaseDiff = Math.abs(currentPhaseDeg - envelope.intent!.phase_deg);
    if (phaseDiff > phaseTolerance && (360 - phaseDiff) > phaseTolerance) {
      return {
        valid: false,
        error: `Phase mismatch: expected ~${envelope.intent!.phase_deg}°, got ${currentPhaseDeg.toFixed(1)}°`,
        reason: 'trajectory'
      };
    }

    return { valid: true };
  }

  /**
   * Step 6: Swarm trust verification
   */
  verifySwarmTrust(provider: string, minTrust: number = 0.3): VerificationResult {
    const trust = this.trustScores.get(provider) || 0.0;
    if (trust < minTrust) {
      return {
        valid: false,
        error: `Provider ${provider} trust ${trust.toFixed(2)} below minimum ${minTrust}`,
        reason: 'swarm'
      };
    }

    return { valid: true };
  }

  /**
   * Run full verification pipeline
   */
  verifyFull(envelope: SCBEEnvelope): VerificationResult {
    // Step 1: Schema + clamp
    let result = this.verifySchema(envelope);
    if (!result.valid) return result;

    // Step 2: Fractal gate (placeholder - would implement julia set check)
    // This would be: julia(z0(ctx), c(intent)) <= N iters

    // Step 3: Intent policy
    result = this.verifyIntentPolicy(envelope);
    if (!result.valid) return result;

    // Step 4: Trajectory window + phase lock
    result = this.verifyTrajectory(envelope);
    if (!result.valid) return result;

    // Step 5: Neural behavior energy (placeholder)
    // Would compute E(ctx_norm) and check threshold

    // Step 6: Swarm trust
    result = this.verifySwarmTrust(envelope.aad!.route_hint);
    if (!result.valid) return result;

    // Step 7: Crypto (placeholder - would verify signature and decrypt)

    return { valid: true };
  }
}

/**
 * Generate fail-to-noise response with deterministic random-looking data.
 * Response size is in 4-8KB band to hide rejection timing.
 */
export function generateNoiseResponse(envelope: SCBEEnvelope, seedData: string): SCBEEnvelopeData {
  const seed = crypto
    .createHash('sha256')
    .update(seedData + envelope.commit!.ctx_sha256)
    .digest();

  // Deterministic length in 4-8KB band
  const lengthSeed = seed.readUInt32BE(0);
  const noiseLength = 4096 + (lengthSeed % 4096);

  // Generate deterministic noise
  const noiseData = crypto.pbkdf2Sync(seed, Buffer.from('noise'), 1, noiseLength, 'sha256');
  const noiseB64 = noiseData.toString('base64');

  // Return envelope-shaped response with noise ciphertext
  const noiseEnvelope = envelope.toObject();
  noiseEnvelope.crypto.cipher_b64 = noiseB64;

  return noiseEnvelope;
}

/**
 * Example metrics that should be emitted
 */
export interface SCBEMetrics {
  'scbe.verify.reject_total': { reason: string };
  'scbe.phase.skew_deg_p50': number;
  'scbe.phase.skew_deg_p95': number;
  'swarm.trust.avg': number;
  'swarm.trust': { agent: string; trust: number };
  'gft.rightshift.score': number;
  'provider.coherence': { provider: string; coherence: number };
}

// Example usage
if (require.main === module) {
  // Create a sample envelope
  const envelope = new SCBEEnvelope();

  envelope.ctx = SCBEEnvelope.createContext(
    'user_device_5a2k9',
    3,
    0.72,
    0.45,
    0.89
  );

  envelope.intent = SCBEEnvelope.createIntent(
    "sil'kor",
    "nav'een",
    3,
    45
  );

  envelope.trajectory = SCBEEnvelope.createTrajectory(
    Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
    3600,
    'daily-08-12-16-20',
    1
  );

  envelope.aad = SCBEEnvelope.createAAD('openai', 'run_xxx', 7);

  // Compute commits
  envelope.commit = envelope.computeCommits();

  // Set crypto params (placeholder)
  envelope.crypto = {
    kem: 'ML-KEM-768',
    sig: 'ML-DSA-65',
    h: { d: 4, R: 1.5, H: Math.pow(1.5, 16), n_iter: 6500 },
    salt_q_b64: Buffer.from('sample_salt').toString('base64'),
    cipher_b64: Buffer.from('encrypted_payload').toString('base64')
  };

  envelope.sig = {
    orchestrator_sig_b64: 'placeholder_signature',
    provider_sig_b64: null
  };

  // Print envelope
  console.log('=== SCBE Envelope v2.0 ===');
  console.log(envelope.toJSON());

  // Verify
  console.log('\n=== Verification ===');
  const verifier = new SCBEVerifier();
  verifier.registerIntent("sil'kor", "nav'een", 3, ['openai', 'anthropic']);
  verifier.setTrust('openai', 0.85);

  const result = verifier.verifyFull(envelope);
  console.log(`Valid: ${result.valid}`);
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
}
