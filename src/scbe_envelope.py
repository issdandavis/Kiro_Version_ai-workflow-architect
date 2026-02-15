#!/usr/bin/env python3
"""
SCBE (Secure Context-Based Encryption) Envelope System
Version: 2.0

Implements the SCBE envelope structure with deterministic context handling,
verification pipeline, and fail-to-noise security patterns.
"""

import json
import hashlib
import time
import base64
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass, asdict


# Constants
SCBE_VERSION = "scbe-2.0"


@dataclass
class Context:
    """Deterministic context for SCBE envelope"""
    ts: int                    # seconds, not milliseconds
    device_id: str
    threat_level: int          # 1-5
    entropy: float             # [0,1] clamped
    server_load: float         # [0,1] clamped
    stability: float           # [0,1] clamped


@dataclass
class Intent:
    """Intent specification"""
    primary: str               # e.g., "sil'kor"
    modifier: str              # e.g., "nav'een"
    harmonic: int              # 1..7
    phase_deg: int             # 0..359


@dataclass
class Trajectory:
    """Temporal trajectory and scheduling"""
    epoch: int                 # start of policy window
    period_s: int              # phase period in seconds
    slot_id: str               # policy schedule id
    waypoint: int              # index in schedule


@dataclass
class AAD:
    """Additional Authenticated Data"""
    route_hint: str            # allowed provider
    run_id: str
    step_no: int


@dataclass
class Commit:
    """Cryptographic commitments to envelope components"""
    ctx_sha256: str
    intent_sha256: str
    traj_sha256: str
    aad_sha256: str


@dataclass
class CryptoParams:
    """Cryptographic parameters"""
    kem: str                   # e.g., "ML-KEM-768"
    sig: str                   # e.g., "ML-DSA-65"
    h: Dict[str, Any]          # chaos parameters: {d, R, H, n_iter}
    salt_q_b64: str            # per-query salt for chaos KDF
    cipher_b64: str            # SCBE ciphertext


@dataclass
class Signatures:
    """Digital signatures"""
    orchestrator_sig_b64: Optional[str] = None
    provider_sig_b64: Optional[str] = None


class SCBEEnvelope:
    """SCBE Envelope v2.0 implementation"""
    
    def __init__(self):
        self.version = SCBE_VERSION
        self.context: Optional[Context] = None
        self.intent: Optional[Intent] = None
        self.trajectory: Optional[Trajectory] = None
        self.aad: Optional[AAD] = None
        self.commit: Optional[Commit] = None
        self.crypto: Optional[CryptoParams] = None
        self.sig: Optional[Signatures] = None
    
    @staticmethod
    def clamp(value: float, min_val: float = 0.0, max_val: float = 1.0) -> float:
        """Clamp float values to [min_val, max_val]"""
        return max(min_val, min(max_val, value))
    
    @staticmethod
    def canonicalize(obj: Any) -> str:
        """
        Canonicalize object to deterministic JSON string.
        Sorts keys alphabetically for consistent hashing.
        """
        if isinstance(obj, dict):
            sorted_dict = {k: obj[k] for k in sorted(obj.keys())}
            return json.dumps(sorted_dict, sort_keys=True, separators=(',', ':'))
        return json.dumps(obj, sort_keys=True, separators=(',', ':'))
    
    @staticmethod
    def sha256_hex(data: str) -> str:
        """Compute SHA256 hash and return as hex string"""
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    
    def create_context(self, device_id: str, threat_level: int, 
                      entropy: float, server_load: float, stability: float) -> Context:
        """Create clamped context with current timestamp"""
        return Context(
            ts=int(time.time()),  # seconds, not milliseconds
            device_id=device_id,
            threat_level=max(1, min(5, threat_level)),
            entropy=self.clamp(entropy),
            server_load=self.clamp(server_load),
            stability=self.clamp(stability)
        )
    
    def create_intent(self, primary: str, modifier: str, 
                     harmonic: int, phase_deg: int) -> Intent:
        """Create intent with validation"""
        return Intent(
            primary=primary,
            modifier=modifier,
            harmonic=max(1, min(7, harmonic)),
            phase_deg=phase_deg % 360
        )
    
    def create_trajectory(self, epoch: int, period_s: int, 
                         slot_id: str, waypoint: int) -> Trajectory:
        """Create trajectory specification"""
        return Trajectory(
            epoch=epoch,
            period_s=period_s,
            slot_id=slot_id,
            waypoint=waypoint
        )
    
    def create_aad(self, route_hint: str, run_id: str, step_no: int) -> AAD:
        """Create additional authenticated data"""
        return AAD(
            route_hint=route_hint,
            run_id=run_id,
            step_no=step_no
        )
    
    def compute_commits(self) -> Commit:
        """Compute cryptographic commitments for all components"""
        if not all([self.context, self.intent, self.trajectory, self.aad]):
            raise ValueError("All envelope components must be set before computing commits")
        
        return Commit(
            ctx_sha256=self.sha256_hex(self.canonicalize(asdict(self.context))),
            intent_sha256=self.sha256_hex(self.canonicalize(asdict(self.intent))),
            traj_sha256=self.sha256_hex(self.canonicalize(asdict(self.trajectory))),
            aad_sha256=self.sha256_hex(self.canonicalize(asdict(self.aad)))
        )
    
    def verify_commits(self) -> bool:
        """Verify that all commit hashes match current state"""
        if not self.commit:
            return False
        
        expected = self.compute_commits()
        return (
            expected.ctx_sha256 == self.commit.ctx_sha256 and
            expected.intent_sha256 == self.commit.intent_sha256 and
            expected.traj_sha256 == self.commit.traj_sha256 and
            expected.aad_sha256 == self.commit.aad_sha256
        )
    
    def set_crypto_params(self, kem: str, sig: str, chaos_params: Dict[str, Any],
                         salt_b64: str, cipher_b64: str):
        """Set cryptographic parameters"""
        self.crypto = CryptoParams(
            kem=kem,
            sig=sig,
            h=chaos_params,
            salt_q_b64=salt_b64,
            cipher_b64=cipher_b64
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert envelope to dictionary"""
        envelope = {
            "ver": self.version,
            "ctx": asdict(self.context) if self.context else None,
            "intent": asdict(self.intent) if self.intent else None,
            "trajectory": asdict(self.trajectory) if self.trajectory else None,
            "aad": asdict(self.aad) if self.aad else None,
            "commit": asdict(self.commit) if self.commit else None,
            "crypto": asdict(self.crypto) if self.crypto else None,
            "sig": asdict(self.sig) if self.sig else {"orchestrator_sig_b64": None, "provider_sig_b64": None}
        }
        return envelope
    
    def to_json(self, indent: int = 2) -> str:
        """Convert envelope to JSON string"""
        return json.dumps(self.to_dict(), indent=indent)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SCBEEnvelope':
        """Create envelope from dictionary"""
        envelope = cls()
        
        if data.get("ctx"):
            envelope.context = Context(**data["ctx"])
        if data.get("intent"):
            envelope.intent = Intent(**data["intent"])
        if data.get("trajectory"):
            envelope.trajectory = Trajectory(**data["trajectory"])
        if data.get("aad"):
            envelope.aad = AAD(**data["aad"])
        if data.get("commit"):
            envelope.commit = Commit(**data["commit"])
        if data.get("crypto"):
            envelope.crypto = CryptoParams(**data["crypto"])
        if data.get("sig"):
            envelope.sig = Signatures(**data["sig"])
        
        return envelope
    
    @classmethod
    def from_json(cls, json_str: str) -> 'SCBEEnvelope':
        """Create envelope from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)


class SCBEVerifier:
    """Verification pipeline for SCBE envelopes"""
    
    def __init__(self):
        self.allowed_intents = {}  # Map of (primary, modifier, harmonic) -> allowed routes
        self.trust_scores = {}     # Map of provider/agent -> trust score
    
    def verify_schema(self, envelope: SCBEEnvelope) -> Tuple[bool, Optional[str]]:
        """Step 1: Schema validation and commit verification"""
        if not all([envelope.context, envelope.intent, envelope.trajectory, 
                   envelope.aad, envelope.commit, envelope.crypto]):
            return False, "Missing required envelope components"
        
        # Verify commits
        if not envelope.verify_commits():
            return False, "Commit hash mismatch - envelope tampering detected"
        
        # Verify clamping
        if not (0 <= envelope.context.entropy <= 1):
            return False, "Entropy out of bounds"
        if not (0 <= envelope.context.server_load <= 1):
            return False, "Server load out of bounds"
        if not (0 <= envelope.context.stability <= 1):
            return False, "Stability out of bounds"
        
        return True, None
    
    def verify_intent_policy(self, envelope: SCBEEnvelope) -> Tuple[bool, Optional[str]]:
        """Step 3: Intent policy verification"""
        intent_key = (
            envelope.intent.primary,
            envelope.intent.modifier,
            envelope.intent.harmonic
        )
        
        allowed_routes = self.allowed_intents.get(intent_key, [])
        if envelope.aad.route_hint not in allowed_routes:
            return False, f"Intent {intent_key} not allowed for route {envelope.aad.route_hint}"
        
        return True, None
    
    def verify_trajectory(self, envelope: SCBEEnvelope) -> Tuple[bool, Optional[str]]:
        """Step 4: Trajectory window and phase lock verification"""
        current_time = int(time.time())
        
        # Check time window (simplified - would check against slot policy)
        if current_time < envelope.trajectory.epoch:
            return False, "Request before trajectory epoch"
        
        # Compute current phase
        elapsed = current_time - envelope.trajectory.epoch
        current_phase_deg = (360 * (elapsed / envelope.trajectory.period_s)) % 360
        
        # Check phase lock (with tolerance)
        phase_tolerance = 15  # degrees
        phase_diff = abs(current_phase_deg - envelope.intent.phase_deg)
        if phase_diff > phase_tolerance and (360 - phase_diff) > phase_tolerance:
            return False, f"Phase mismatch: expected ~{envelope.intent.phase_deg}°, got {current_phase_deg:.1f}°"
        
        return True, None
    
    def verify_swarm_trust(self, provider: str, min_trust: float = 0.3) -> Tuple[bool, Optional[str]]:
        """Step 6: Swarm trust verification"""
        trust = self.trust_scores.get(provider, 0.0)
        if trust < min_trust:
            return False, f"Provider {provider} trust {trust:.2f} below minimum {min_trust}"
        
        return True, None
    
    def verify_full(self, envelope: SCBEEnvelope) -> Tuple[bool, Optional[str]]:
        """Run full verification pipeline"""
        
        # Step 1: Schema + clamp
        valid, error = self.verify_schema(envelope)
        if not valid:
            return False, f"schema: {error}"
        
        # Step 2: Fractal gate (placeholder - would implement julia set check)
        # This would be: julia(z0(ctx), c(intent)) <= N iters
        
        # Step 3: Intent policy
        valid, error = self.verify_intent_policy(envelope)
        if not valid:
            return False, f"intent: {error}"
        
        # Step 4: Trajectory window + phase lock
        valid, error = self.verify_trajectory(envelope)
        if not valid:
            return False, f"trajectory: {error}"
        
        # Step 5: Neural behavior energy (placeholder)
        # Would compute E(ctx_norm) and check threshold
        
        # Step 6: Swarm trust
        valid, error = self.verify_swarm_trust(envelope.aad.route_hint)
        if not valid:
            return False, f"swarm: {error}"
        
        # Step 7: Crypto (placeholder - would verify signature and decrypt)
        
        return True, None


def generate_noise_response(envelope: SCBEEnvelope, seed_data: str) -> Dict[str, Any]:
    """
    Generate fail-to-noise response with deterministic random-looking data.
    Response size is in 4-8KB band to hide rejection timing.
    """
    seed = hashlib.sha256(f"{seed_data}{envelope.commit.ctx_sha256}".encode()).digest()
    
    # Deterministic length in 4-8KB band
    length_seed = int.from_bytes(seed[:4], 'big')
    noise_length = 4096 + (length_seed % 4096)
    
    # Generate deterministic noise
    noise_data = hashlib.pbkdf2_hmac('sha256', seed, b'noise', 1, dklen=noise_length)
    noise_b64 = base64.b64encode(noise_data).decode('utf-8')
    
    # Return envelope-shaped response with noise ciphertext
    noise_envelope = envelope.to_dict()
    if noise_envelope.get("crypto"):
        noise_envelope["crypto"]["cipher_b64"] = noise_b64
    
    return noise_envelope


# Example usage and testing
if __name__ == "__main__":
    # Create a sample envelope
    envelope = SCBEEnvelope()
    
    # Set components
    envelope.context = envelope.create_context(
        device_id="user_device_5a2k9",
        threat_level=3,
        entropy=0.72,
        server_load=0.45,
        stability=0.89
    )
    
    envelope.intent = envelope.create_intent(
        primary="sil'kor",
        modifier="nav'een",
        harmonic=3,
        phase_deg=45
    )
    
    envelope.trajectory = envelope.create_trajectory(
        epoch=int(time.time()) - 3600,  # 1 hour ago
        period_s=3600,
        slot_id="daily-08-12-16-20",
        waypoint=1
    )
    
    envelope.aad = envelope.create_aad(
        route_hint="openai",
        run_id="run_xxx",
        step_no=7
    )
    
    # Compute commits
    envelope.commit = envelope.compute_commits()
    
    # Set crypto params (placeholder)
    envelope.set_crypto_params(
        kem="ML-KEM-768",
        sig="ML-DSA-65",
        chaos_params={"d": 4, "R": 1.5, "H": 1.5**16, "n_iter": 6500},
        salt_b64=base64.b64encode(b"sample_salt").decode(),
        cipher_b64=base64.b64encode(b"encrypted_payload").decode()
    )
    
    envelope.sig = Signatures(orchestrator_sig_b64="placeholder_signature")
    
    # Print envelope
    print("=== SCBE Envelope v2.0 ===")
    print(envelope.to_json())
    
    # Verify
    print("\n=== Verification ===")
    verifier = SCBEVerifier()
    verifier.allowed_intents[("sil'kor", "nav'een", 3)] = ["openai", "anthropic"]
    verifier.trust_scores["openai"] = 0.85
    
    valid, error = verifier.verify_full(envelope)
    print(f"Valid: {valid}")
    if error:
        print(f"Error: {error}")
